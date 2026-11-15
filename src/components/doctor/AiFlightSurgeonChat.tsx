import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  HelpCircle,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import type { CrewMember } from '../../types/crew';
import type { BiometricVitals } from '../../types/telemetry';
import type { ClinicalDiagnosisVerdict } from '../../types/diagnosis';
import type {
  EclssEnvironment,
  MolecularCountermeasureAssessment,
} from '../../types/environment';
import type {
  AiChatMessage,
  AiSurgeonEngineMode,
  LlmWorkerRequest,
  LlmWorkerResponse,
  QuickPromptIntent,
} from '../../types/aiSurgeon';
import {
  answerQuickPromptInPlainEnglish,
  buildGroundTruthSystemPrompt,
  interpretFreeTextSymptomOrQuestion,
  type NarratorContext,
} from '../../engine/flightSurgeonNarrator';

export interface AiFlightSurgeonChatProps {
  crew: CrewMember;
  vitals: BiometricVitals;
  environment: EclssEnvironment;
  verdict: ClinicalDiagnosisVerdict;
  molecular: MolecularCountermeasureAssessment;
}

const QUICK_EXPLAINER_BUTTONS: readonly {
  intent: QuickPromptIntent;
  label: string;
}[] = [
  { intent: 'EXPLAIN_ALL_CARDS', label: 'Summarize this screen' },
  { intent: 'WHY_THIS_DIAGNOSIS', label: 'What led to this alert?' },
  { intent: 'CAN_CREW_WAIT', label: 'Why might this need attention?' },
  { intent: 'EXPLAIN_DNA_AND_MEDS', label: 'Explain radiation estimates' },
  { intent: 'EXPLAIN_SANS_AND_EYES', label: 'Explain fluid-shift indicators' },
];

export function AiFlightSurgeonChat({
  crew,
  vitals,
  environment,
  verdict,
  molecular,
}: AiFlightSurgeonChatProps) {
  const [engineMode, setEngineMode] =
    useState<AiSurgeonEngineMode>('INSTANT_NARRATOR');
  const [neuralModelStatus, setNeuralModelStatus] = useState<
    'UNLOADED' | 'LOADING' | 'READY' | 'ERROR'
  >('UNLOADED');
  const [neuralProgressPct, setNeuralProgressPct] = useState(0);
  const [neuralStatusText, setNeuralStatusText] = useState(
    'Optional experimental text helper'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputText, setInputText] = useState('');

  const narratorCtx: NarratorContext = {
    crew,
    vitals,
    environment,
    verdict,
    molecular,
  };

  const [messages, setMessages] = useState<readonly AiChatMessage[]>(() => {
    const initial = answerQuickPromptInPlainEnglish('EXPLAIN_ALL_CARDS', {
      crew,
      vitals,
      environment,
      verdict,
      molecular,
    });
    return [
      {
        id: 'init-welcome',
        role: 'assistant',
        timestampLabel: 'LIVE BRIEFING',
        engineSource: 'DETERMINISTIC_NARRATOR',
        title: initial.title,
        content: initial.content,
        symptomAlerts: initial.symptomAlerts,
      },
    ];
  });

  const workerRef = useRef<Worker | null>(null);
  const pendingFallbacksRef = useRef<
    Map<
      string,
      {
        title: string;
        content: string;
        symptomAlerts?: readonly string[];
      }
    >
  >(new Map());
  const latestCtxRef = useRef<NarratorContext>(narratorCtx);
  latestCtxRef.current = narratorCtx;

  // Refresh the top pinned live briefing whenever the user switches crew or scenario
  useEffect(() => {
    const updated = answerQuickPromptInPlainEnglish(
      'EXPLAIN_ALL_CARDS',
      latestCtxRef.current
    );
    setMessages((prev) => {
      const rest = prev.filter((m) => m.id !== 'init-welcome');
      return [
        {
          id: 'init-welcome',
          role: 'assistant',
          timestampLabel: 'LIVE BRIEFING',
          engineSource: 'DETERMINISTIC_NARRATOR',
          title: updated.title,
          content: updated.content,
          symptomAlerts: updated.symptomAlerts,
        },
        ...rest,
      ];
    });
  }, [crew.id, verdict.primaryConditionId]);

  // Clean up Web Worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const ensureWorkerInitialized = useCallback(() => {
    if (workerRef.current) return workerRef.current;

    const worker = new Worker(
      new URL('../../workers/llmSurgeonWorker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (event: MessageEvent<LlmWorkerResponse>) => {
      const msg = event.data;
      if (msg.type === 'MODEL_PROGRESS') {
        setNeuralModelStatus('LOADING');
        setNeuralProgressPct(msg.progressPct);
        setNeuralStatusText(msg.statusText);
      } else if (msg.type === 'MODEL_READY') {
        setNeuralModelStatus('READY');
        setNeuralProgressPct(100);
        setNeuralStatusText(
          `Experimental on-device model ready (${msg.deviceUsed.toUpperCase()})`
        );
        setEngineMode('NEURAL_WEB_LLM');
      } else if (msg.type === 'GENERATION_COMPLETE') {
        setIsGenerating(false);
        const fallback = pendingFallbacksRef.current.get(msg.requestId);
        pendingFallbacksRef.current.delete(msg.requestId);
        setMessages((prev) => [
          ...prev,
          {
            id: `llm-${msg.requestId}`,
            role: 'assistant',
            timestampLabel: new Date().toLocaleTimeString(),
            engineSource: 'SMOLLM2_360M_ON_DEVICE',
            title: `Experimental text helper (${latestCtxRef.current.crew.name})`,
            content: msg.replyText,
            symptomAlerts: fallback?.symptomAlerts,
          },
        ]);
      } else if (msg.type === 'WORKER_ERROR') {
        setIsGenerating(false);
        setNeuralModelStatus('ERROR');
        setEngineMode('INSTANT_NARRATOR');
        setNeuralStatusText(msg.errorMessage);
        if (msg.requestId) {
          const fallback = pendingFallbacksRef.current.get(msg.requestId);
          pendingFallbacksRef.current.delete(msg.requestId);
          if (fallback) {
            setMessages((prev) => [
              ...prev,
              {
                id: `a-fallback-${msg.requestId}`,
                role: 'assistant',
                timestampLabel: new Date().toLocaleTimeString(),
                engineSource: 'DETERMINISTIC_NARRATOR',
                title: fallback.title,
                content: fallback.content,
                symptomAlerts: fallback.symptomAlerts,
              },
            ]);
          }
        }
      }
    };

    worker.onerror = (errEvent) => {
      errEvent.preventDefault();
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      setIsGenerating(false);
      setNeuralModelStatus('ERROR');
      setEngineMode('INSTANT_NARRATOR');
      setNeuralStatusText(
        errEvent.message ||
          'Background AI worker failed to initialize. Rule-based replies remain active.'
      );
    };

    worker.onmessageerror = () => {
      setIsGenerating(false);
      setNeuralModelStatus('ERROR');
      setEngineMode('INSTANT_NARRATOR');
      setNeuralStatusText(
        'Worker communication error. Rule-based replies remain active.'
      );
    };

    workerRef.current = worker;
    return worker;
  }, []);

  const handleCancelNeuralLoad = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsGenerating(false);
    setNeuralModelStatus('UNLOADED');
    setNeuralProgressPct(0);
    setEngineMode('INSTANT_NARRATOR');
    setNeuralStatusText('Optional experimental text helper');
  };

  const handleActivateNeuralLlm = () => {
    if (neuralModelStatus === 'READY') {
      setEngineMode((m) =>
        m === 'NEURAL_WEB_LLM' ? 'INSTANT_NARRATOR' : 'NEURAL_WEB_LLM'
      );
      return;
    }
    if (neuralModelStatus === 'ERROR' && workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    const worker = ensureWorkerInitialized();
    setNeuralModelStatus('LOADING');
    setNeuralProgressPct(5);
    setNeuralStatusText('Starting background AI worker...');
    const req: LlmWorkerRequest = {
      type: 'LOAD_MODEL',
      modelId: 'HuggingFaceTB/SmolLM2-135M-Instruct',
    };
    worker.postMessage(req);
  };

  const handleQuickPrompt = (intent: QuickPromptIntent, label: string) => {
    const userMsg: AiChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      timestampLabel: new Date().toLocaleTimeString(),
      engineSource: 'DETERMINISTIC_NARRATOR',
      content: label,
    };

    const answer = answerQuickPromptInPlainEnglish(intent, narratorCtx);

    if (engineMode === 'NEURAL_WEB_LLM' && neuralModelStatus === 'READY' && workerRef.current) {
      const requestId = String(Date.now());
      pendingFallbacksRef.current.set(requestId, answer);
      setMessages((prev) => [...prev, userMsg]);
      setIsGenerating(true);
      const req: LlmWorkerRequest = {
        type: 'GENERATE_RESPONSE',
        requestId,
        systemPrompt: buildGroundTruthSystemPrompt(narratorCtx),
        userMessage: label,
      };
      workerRef.current.postMessage(req);
      return;
    }

    const replyMsg: AiChatMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      timestampLabel: new Date().toLocaleTimeString(),
      engineSource: 'DETERMINISTIC_NARRATOR',
      title: answer.title,
      content: answer.content,
      symptomAlerts: answer.symptomAlerts,
    };
    setMessages((prev) => [...prev, userMsg, replyMsg]);
  };

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    setInputText('');

    const userMsg: AiChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      timestampLabel: new Date().toLocaleTimeString(),
      engineSource: 'DETERMINISTIC_NARRATOR',
      content: trimmed,
    };

    // Always run deterministic symptom detection first so clinical alerts are never missed
    const deterministicResult = interpretFreeTextSymptomOrQuestion(
      trimmed,
      narratorCtx
    );

    if (engineMode === 'NEURAL_WEB_LLM' && neuralModelStatus === 'READY' && workerRef.current) {
      const requestId = String(Date.now());
      pendingFallbacksRef.current.set(requestId, deterministicResult);
      setMessages((prev) => [...prev, userMsg]);
      setIsGenerating(true);
      const req: LlmWorkerRequest = {
        type: 'GENERATE_RESPONSE',
        requestId,
        systemPrompt: buildGroundTruthSystemPrompt(narratorCtx),
        userMessage: trimmed,
      };
      workerRef.current.postMessage(req);
      return;
    }

    const replyMsg: AiChatMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      timestampLabel: new Date().toLocaleTimeString(),
      engineSource: 'DETERMINISTIC_NARRATOR',
      title: deterministicResult.title,
      content: deterministicResult.content,
      symptomAlerts: deterministicResult.symptomAlerts,
    };
    setMessages((prev) => [...prev, userMsg, replyMsg]);
  };

  return (
    <section
      className="bg-space-hull border border-accent-cyan/40 rounded-xl p-4 flex flex-col gap-3"
      aria-label="Plain-language explanation and optional experimental text helper"
    >
      {/* Header and optional text helper */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-space-border pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-accent-cyan/15 border border-accent-cyan/40 flex items-center justify-center text-accent-cyan">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-cockpit-primary">
              AI health assistant
            </h2>
            <p className="text-[11px] font-mono text-cockpit-muted">
              Explains simulated readings and responds to crew-reported symptoms; it does not diagnose or recommend treatment.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-status-nominal/15 text-status-nominal border border-status-nominal/30 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {engineMode === 'NEURAL_WEB_LLM'
              ? 'EXPERIMENTAL ON-DEVICE AI'
              : 'RULE-BASED REPLIES'}
          </span>

          <button
            type="button"
            onClick={handleActivateNeuralLlm}
            disabled={neuralModelStatus === 'LOADING'}
            className="min-h-[38px] px-3 py-1 rounded-lg bg-space-elevated hover:bg-space-border border border-accent-cyan/40 text-[11px] font-mono font-semibold text-accent-cyan flex items-center gap-1.5 transition-colors disabled:opacity-60"
            title="Load an optional experimental on-device AI model. Replies may be inaccurate and do not determine the demo alerts."
          >
            {neuralModelStatus === 'LOADING' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <HelpCircle className="h-3.5 w-3.5" />
            )}
            <span>
              {neuralModelStatus === 'READY'
                ? engineMode === 'NEURAL_WEB_LLM'
                  ? 'USE RULE-BASED REPLIES'
                  : 'TRY OPTIONAL ON-DEVICE AI'
                : neuralModelStatus === 'LOADING'
                  ? `PREPARING AI MODEL (${neuralProgressPct}%)`
                  : neuralModelStatus === 'ERROR'
                    ? 'RETRY ON-DEVICE AI'
                    : 'TRY OPTIONAL ON-DEVICE AI'}
            </span>
          </button>
        </div>
      </div>

      {/* Neural Model Download/Cache Progress Bar (when loading) */}
      {neuralModelStatus === 'LOADING' ? (
        <div className="bg-space-void border border-accent-cyan/30 rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
            <span className="text-accent-cyan truncate">{neuralStatusText}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-cockpit-primary font-bold">{neuralProgressPct}%</span>
              <button
                type="button"
                onClick={handleCancelNeuralLoad}
                className="px-2 py-0.5 rounded bg-space-elevated hover:bg-space-border border border-space-border text-[10px] text-cockpit-muted hover:text-cockpit-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
          <div className="w-full h-2 bg-space-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-cyan transition-all duration-300"
              style={{ width: `${neuralProgressPct}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Error Banner if On-Device Model Load Fails */}
      {neuralModelStatus === 'ERROR' ? (
        <div className="bg-status-warning/10 border border-status-warning/40 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-status-warning">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{neuralStatusText}</span>
          </div>
          <button
            type="button"
            onClick={handleCancelNeuralLoad}
            className="px-2 py-1 rounded bg-space-void hover:bg-space-elevated border border-space-border text-[10px] font-mono text-cockpit-muted shrink-0"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {/* One-Click Plain-English Explainer Chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-cockpit-muted flex items-center gap-1 mr-1">
          <HelpCircle className="h-3.5 w-3.5 text-accent-cyan" />
          SUGGESTED QUESTIONS:
        </span>
        {QUICK_EXPLAINER_BUTTONS.map((btn) => (
          <button
            key={btn.intent}
            type="button"
            onClick={() => handleQuickPrompt(btn.intent, btn.label)}
            className="px-2.5 py-1.5 rounded-md bg-space-void hover:bg-space-elevated border border-space-border hover:border-accent-cyan/50 text-xs font-mono text-cockpit-primary flex items-center gap-1.5 transition-colors"
          >
            <span>{btn.label}</span>
          </button>
        ))}
      </div>

      <p className="rounded-md border border-status-warning/40 bg-status-warning/5 px-3 py-2 text-xs text-cockpit-muted">
        Prototype only: readings are simulated, and assistant responses may be inaccurate. Do not use this assistant for diagnosis, treatment, or operational decisions.
      </p>

      {/* Conversation & Plain-English Explanation Feed */}
      <div className="bg-space-void/90 border border-space-border rounded-lg p-3 max-h-72 overflow-y-auto space-y-2.5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg border text-xs space-y-1.5 ${
              msg.role === 'user'
                ? 'bg-accent-cyan/10 border-accent-cyan/30 ml-8'
                : 'bg-space-elevated/90 border-space-border'
            }`}
          >
            <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-cockpit-muted">
              <span className="font-bold text-accent-cyan">
                {msg.role === 'user'
                  ? `CREW QUERY (${crew.callsign})`
                  : msg.title ?? 'AURA explanation'}
              </span>
              <span>
                {msg.engineSource === 'SMOLLM2_360M_ON_DEVICE'
                  ? 'Experimental text helper'
                  : 'Rule-based explanation'}{' '}
                • {msg.timestampLabel}
              </span>
            </div>

            {msg.symptomAlerts && msg.symptomAlerts.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {msg.symptomAlerts.map((alertText, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-status-warning/20 border border-status-warning/40 text-status-warning text-[10px] font-mono font-bold"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {alertText}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="text-cockpit-primary whitespace-pre-line leading-relaxed">
              {msg.content}
            </div>
          </div>
        ))}

        {isGenerating ? (
          <div className="p-3 rounded-lg bg-space-elevated border border-accent-cyan/30 text-xs font-mono text-accent-cyan flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Preparing the optional text helper…</span>
          </div>
        ) : null}
      </div>

      {/* Symptom & Free-Text Question Input Form */}
      <form onSubmit={handleSubmitQuestion} className="flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder='Describe symptoms (e.g. "My head is pounding and vision is blurry") or ask "What does HRV or ROS mean?"...'
          className="flex-1 min-h-[44px] bg-space-void border border-space-border focus:border-accent-cyan rounded-lg px-3.5 py-2 text-xs text-cockpit-primary placeholder:text-cockpit-muted outline-none font-sans"
        />
        <button
          type="submit"
          className="min-h-[44px] px-4 py-2 rounded-lg bg-accent-cyan hover:bg-accent-cyan/90 text-space-void font-mono font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Ask a question</span>
        </button>
      </form>
    </section>
  );
}
