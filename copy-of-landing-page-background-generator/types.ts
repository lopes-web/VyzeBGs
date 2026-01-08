
export enum SubjectPosition {
  LEFT = 'LEFT',
  CENTER = 'CENTER',
  RIGHT = 'RIGHT',
}

export type GeneratorMode = 'HUMAN' | 'OBJECT' | 'ENHANCE';

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export interface HistoryItem {
    id: string;
    url: string;
    prompt: string;
    timestamp: number;
    mode: GeneratorMode; 
}

export interface ReferenceItem {
  id: string;
  image: string; // Base64
  description: string;
}

export interface GenerationAttributes {
  useGradient: boolean;
  useBlur: boolean;
}

export interface ProjectTab {
  id: string;
  title: string;
  mode: GeneratorMode;
  createdAt: number;
}

export interface AppState {
  userImages: string[]; 
  referenceItems: ReferenceItem[]; 
  assetImages: string[]; 
  userPrompt: string;
  position: SubjectPosition;
  attributes: GenerationAttributes;
  isGenerating: boolean;
  generatedImage: GeneratedImage | null;
  error: string | null;
}

// Chat / Agent Types
export interface Agent {
  id: string;
  name: string;
  role: string;
  icon: string;
  systemInstruction: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 optional
  timestamp: number;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}
