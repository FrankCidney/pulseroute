import type { TextGenerationPipeline } from '@huggingface/transformers';
import ortWasmUrl from '../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.asyncify.wasm?url';
import type { LlmWorkerRequest, LlmWorkerResponse } from '../types/aiSurgeon';

// Use SmolLM2-135M-Instruct (~95 MB q4) instead of 360M (~275 MB) so first-time
// browser download, WASM compilation, and CPU token generation stay fast and responsive.
const DEFAULT_MODEL_ID = 'HuggingFaceTB/SmolLM2-135M-Instruct';

let generatorInstance: TextGenerationPipeline | null = null;
let loadingPromise: Promise<TextGenerationPipeline> | null = null;
const activeDevice: 'webgpu' | 'wasm' = 'wasm';

function postWorkerMessage(msg: LlmWorkerResponse) {
  self.postMessage(msg);
}

// Surface any unexpected worker-level error or unhandled rejection immediately to the UI
self.addEventListener('error', (event) => {
  postWorkerMessage({
    type: 'WORKER_ERROR',
    errorMessage:
      event.message ||
      'Background AI worker encountered a runtime error. Rule-based replies remain active.',
  });
});

self.addEventListener('unhandledrejection', (event) => {
  const reason =
    event.reason instanceof Error
      ? event.reason.message
      : String(event.reason ?? 'Unhandled promise rejection in AI worker');
  postWorkerMessage({
    type: 'WORKER_ERROR',
    errorMessage: reason,
  });
});

async function ensureModelLoaded(
  modelId = DEFAULT_MODEL_ID
): Promise<TextGenerationPipeline> {
  if (generatorInstance) {
    return generatorInstance;
  }
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      postWorkerMessage({
        type: 'MODEL_PROGRESS',
        statusText: 'Loading local ONNX WebAssembly runtime...',
        progressPct: 10,
      });

      const { pipeline, env } = await import('@huggingface/transformers');

      // Allow browser Cache API storage so once model weights are downloaded,
      // subsequent sessions load from local cache with zero network requests.
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      env.useWasmCache = false;

      // Point ONNX Runtime directly to our local bundled .wasm binary and single-thread
      // mode so it never hangs fetching dev WASM files from cdn.jsdelivr.net or waiting
      // on Cross-Origin-Isolated SharedArrayBuffer threads.
      const onnxBackend = env.backends?.onnx as
        | {
            wasm?: {
              numThreads?: number;
              proxy?: boolean;
              wasmPaths?: { wasm?: string; mjs?: string } | string;
            };
          }
        | undefined;

      if (onnxBackend?.wasm) {
        onnxBackend.wasm.numThreads = 1;
        onnxBackend.wasm.proxy = false;
        onnxBackend.wasm.wasmPaths = {
          wasm: ortWasmUrl,
        };
      }

      postWorkerMessage({
        type: 'MODEL_PROGRESS',
        statusText: `Connecting to model cache for ${modelId}...`,
        progressPct: 14,
      });

      let highestPct = 14;

      const reportProgress = (pct: number, statusText: string) => {
        highestPct = Math.max(highestPct, Math.min(98, Math.round(pct)));
        postWorkerMessage({
          type: 'MODEL_PROGRESS',
          statusText,
          progressPct: highestPct,
        });
      };

      generatorInstance = await pipeline('text-generation', modelId, {
        dtype: 'q4',
        device: activeDevice,
        progress_callback: (info: {
          status?: string;
          progress?: number;
          loaded?: number;
          total?: number;
          file?: string;
        }) => {
          const fileName = info.file ?? 'model asset';
          const isOnnxWeights = fileName.endsWith('.onnx');

          if (info.status === 'initiate' || info.status === 'download') {
            reportProgress(
              isOnnxWeights ? 22 : 16,
              isOnnxWeights
                ? `Starting download of ${fileName}...`
                : `Fetching ${fileName}...`
            );
            return;
          }

          if (typeof info.progress === 'number') {
            if (isOnnxWeights) {
              // Map the main .onnx weights download smoothly across 22% -> 92%
              const mappedPct = 22 + (info.progress / 100) * 70;
              const sizeDetail =
                typeof info.loaded === 'number' && typeof info.total === 'number' && info.total > 0
                  ? `${(info.loaded / (1024 * 1024)).toFixed(1)} / ${(info.total / (1024 * 1024)).toFixed(1)} MB`
                  : `${Math.round(info.progress)}%`;
              reportProgress(
                mappedPct,
                `Caching ${fileName} (${sizeDetail})...`
              );
            } else {
              reportProgress(
                18 + (info.progress / 100) * 4,
                `Loaded ${fileName} (${Math.round(info.progress)}%)`
              );
            }
            return;
          }

          if (typeof info.loaded === 'number' && info.loaded > 0) {
            const mb = (info.loaded / (1024 * 1024)).toFixed(1);
            reportProgress(
              isOnnxWeights ? 55 : 20,
              `Downloading ${fileName} (${mb} MB received)...`
            );
            return;
          }

          if (info.status === 'done' && isOnnxWeights) {
            reportProgress(
              95,
              'Compiling ONNX model in browser WebAssembly runtime...'
            );
          }
        },
      });

      postWorkerMessage({
        type: 'MODEL_READY',
        modelId,
        deviceUsed: activeDevice,
      });

      return generatorInstance;
    } catch (err) {
      loadingPromise = null;
      throw err;
    }
  })();

  return loadingPromise;
}

self.addEventListener('message', async (event: MessageEvent<LlmWorkerRequest>) => {
  const payload = event.data;

  if (payload.type === 'LOAD_MODEL') {
    try {
      await ensureModelLoaded(payload.modelId || DEFAULT_MODEL_ID);
    } catch (err) {
      postWorkerMessage({
        type: 'WORKER_ERROR',
        errorMessage:
          err instanceof Error
            ? `Could not load on-device model (${err.message}). Rule-based replies remain active.`
            : 'Unable to initialize offline neural model; using rule-based replies.',
      });
    }
    return;
  }

  if (payload.type === 'GENERATE_RESPONSE') {
    try {
      const generator = await ensureModelLoaded(DEFAULT_MODEL_ID);

      const messages = [
        { role: 'system', content: payload.systemPrompt },
        { role: 'user', content: payload.userMessage },
      ];

      const output = await generator(messages, {
        max_new_tokens: 160,
        temperature: 0.2,
        do_sample: false,
        return_full_text: false,
      });

      const firstItem = Array.isArray(output) ? output[0] : output;
      const generated =
        typeof firstItem === 'object' &&
        firstItem !== null &&
        'generated_text' in firstItem
          ? (firstItem as { generated_text: unknown }).generated_text
          : '';

      let replyText = '';
      if (typeof generated === 'string') {
        replyText = generated.trim();
      } else if (Array.isArray(generated) && generated.length > 0) {
        const lastMsg = generated[generated.length - 1] as { content?: string };
        replyText = (lastMsg?.content ?? '').trim();
      }

      postWorkerMessage({
        type: 'GENERATION_COMPLETE',
        requestId: payload.requestId,
        replyText:
          replyText ||
          'Telemetry evaluated. Follow the verified NASA ExMC checklist steps displayed in the Flight Surgeon panel.',
      });
    } catch (err) {
      postWorkerMessage({
        type: 'WORKER_ERROR',
        requestId: payload.requestId,
        errorMessage:
          err instanceof Error
            ? err.message
            : 'Neural worker inference interrupted; falling back to rule-based explanation.',
      });
    }
  }
});
