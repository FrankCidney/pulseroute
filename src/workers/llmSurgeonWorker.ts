import {
  pipeline,
  env,
  type TextGenerationPipeline,
  // @ts-expect-error - @huggingface/transformers lacks bundled types
} from '@huggingface/transformers';
import type { LlmWorkerRequest, LlmWorkerResponse } from '../types/aiSurgeon';

// Allow browser Cache API / IndexedDB caching so once weights are downloaded,
// the model executes 100% offline with zero network calls.
env.allowLocalModels = false;
env.useBrowserCache = true;

const DEFAULT_MODEL_ID = 'HuggingFaceTB/SmolLM2-360M-Instruct';

let generatorInstance: TextGenerationPipeline | null = null;
let activeDevice: 'webgpu' | 'wasm' = 'wasm';

function postWorkerMessage(msg: LlmWorkerResponse) {
  self.postMessage(msg);
}

async function detectWebGpuSupport(): Promise<boolean> {
  try {
    const nav = self.navigator as Navigator & {
      gpu?: { requestAdapter: () => Promise<unknown> };
    };
    if (!nav.gpu) return false;
    const adapter = await nav.gpu.requestAdapter();
    return Boolean(adapter);
  } catch {
    return false;
  }
}

async function ensureModelLoaded(modelId = DEFAULT_MODEL_ID): Promise<TextGenerationPipeline> {
  if (generatorInstance) {
    return generatorInstance;
  }

  const hasWebGpu = await detectWebGpuSupport();
  activeDevice = hasWebGpu ? 'webgpu' : 'wasm';

  postWorkerMessage({
    type: 'MODEL_PROGRESS',
    statusText: `Initializing ${modelId} (${activeDevice.toUpperCase()})...`,
    progressPct: 8,
  });

  generatorInstance = await pipeline('text-generation', modelId, {
    dtype: 'q4',
    device: activeDevice,
    progress_callback: (info: { status?: string; progress?: number; file?: string }) => {
      if (typeof info.progress === 'number') {
        postWorkerMessage({
          type: 'MODEL_PROGRESS',
          statusText: `Caching ${info.file ?? 'weights'} to offline storage (${Math.round(info.progress)}%)`,
          progressPct: Math.min(99, Math.max(10, Math.round(info.progress))),
        });
      }
    },
  });

  postWorkerMessage({
    type: 'MODEL_READY',
    modelId,
    deviceUsed: activeDevice,
  });

  return generatorInstance;
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
            ? err.message
            : 'Unable to initialize offline neural model; using Instant Clinical Narrator.',
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
        max_new_tokens: 180,
        temperature: 0.25,
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
            : 'Neural worker inference interrupted; falling back to Instant Clinical Narrator.',
      });
    }
  }
});
