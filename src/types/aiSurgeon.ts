// --- Layer 2 Offline Lightweight LLM & Plain-English Flight Surgeon Contracts ---

export type AiSurgeonEngineMode = 'INSTANT_NARRATOR' | 'NEURAL_WEB_LLM';

export type QuickPromptIntent =
  | 'EXPLAIN_ALL_CARDS'
  | 'WHY_THIS_DIAGNOSIS'
  | 'CAN_CREW_WAIT'
  | 'EXPLAIN_DNA_AND_MEDS'
  | 'EXPLAIN_SANS_AND_EYES';

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  timestampLabel: string;
  engineSource: 'DETERMINISTIC_NARRATOR' | 'SMOLLM2_360M_ON_DEVICE';
  title?: string;
  content: string;
  symptomAlerts?: readonly string[];
}

export type LlmWorkerRequest =
  | {
      type: 'LOAD_MODEL';
      modelId: string;
    }
  | {
      type: 'GENERATE_RESPONSE';
      requestId: string;
      systemPrompt: string;
      userMessage: string;
    };

export type LlmWorkerResponse =
  | {
      type: 'MODEL_PROGRESS';
      statusText: string;
      progressPct: number;
    }
  | {
      type: 'MODEL_READY';
      modelId: string;
      deviceUsed: 'webgpu' | 'wasm';
    }
  | {
      type: 'GENERATION_STREAM';
      requestId: string;
      partialText: string;
    }
  | {
      type: 'GENERATION_COMPLETE';
      requestId: string;
      replyText: string;
    }
  | {
      type: 'WORKER_ERROR';
      requestId?: string;
      errorMessage: string;
    };
