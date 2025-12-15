
export enum SubjectPosition {
  LEFT = 'LEFT',
  CENTER = 'CENTER',
  RIGHT = 'RIGHT',
}

export type DesignCategory = 'MOCKUPS' | 'ICONS' | 'PRODUCTS' | 'LOGOS';

export type GeneratorMode = 'HUMAN' | 'OBJECT' | 'ENHANCE' | 'INFOPRODUCT' | 'REMOVE_BG';

export type AppSection = 'LANDING_PAGES' | 'DESIGNS' | 'REMOVE_BG' | 'WEBP_CONVERTER';

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export interface ColorPalette {
  primary: string;   // Background Dominant
  secondary: string; // Lighting/Depth
  accent: string;    // Details/Overlays
}

export interface HistoryItem {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  mode: GeneratorMode;
  section: AppSection;
  projectId?: string;
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

export interface ProjectContext {
  floatingElements3D: boolean;
  floatingElementsDescription?: string;
  backgroundEffects: boolean;
  backgroundEffectsDescription?: string;
  niche?: string;
  environment?: string;
  subjectDescription?: string;
  colors?: LightingColors;
  activeColors?: ActiveColors;
  ambientOpacity?: number;
  framing?: FramingType;
  useEnvironmentImages?: boolean;
  environmentImages?: string[];
}

export interface ProjectTab {
  id: string;
  title: string;
  mode: GeneratorMode;
  section: AppSection;
  createdAt: number;
  isOptimistic?: boolean;
  initialData?: {
    prompt?: string;
    referenceImage?: File | null;
    styleReferenceImage?: File | null;
    secondaryElements?: File[];
    shouldAutoGenerate?: boolean;
    generatorMode?: GeneratorMode;
    designCategory?: string;
  };
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