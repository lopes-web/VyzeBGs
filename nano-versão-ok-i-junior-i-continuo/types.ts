
export enum SubjectPosition {
  LEFT = 'LEFT',
  CENTER = 'CENTER',
  RIGHT = 'RIGHT',
}

export type FramingType = 'CLOSE_UP' | 'MEDIUM' | 'AMERICAN';

export interface LightingColors {
    ambient: string;
    rim: string;
    complementary: string; 
}

export interface ActiveColors {
    ambient: boolean;
    rim: boolean;
    complementary: boolean;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export interface HistoryItem {
    id: string;
    url: string;
    prompt: string;
    timestamp: number;
    configuration?: {
        niche: string;
        colors: LightingColors;
        activeColors?: ActiveColors;
        framing: FramingType;
        ambientOpacity?: number; 
        environment?: string; 
        environmentImages?: string[];
        subjectDescription?: string;
        useFloatingElements?: boolean; 
        floatingElementsPrompt?: string;
        attributes?: GenerationAttributes;
    }
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
