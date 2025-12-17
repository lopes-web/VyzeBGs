
export enum SubjectPosition {
  LEFT = 'LEFT',
  CENTER = 'CENTER',
  RIGHT = 'RIGHT',
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '4:5',
  STORY = '9:16',
}

export enum TextAlignment {
  LEFT = 'LEFT',
  CENTER = 'CENTER',
  RIGHT = 'RIGHT',
}

export enum TypographyStyle {
  MODERN = 'Modern Sans-Serif (Clean, Minimal)',
  BOLD = 'Bold Impact (Strong, Thick)',
  SERIF = 'Classic Serif (Elegant, Luxury)',
  HANDWRITTEN = 'Handwritten (Personal, Organic)',
  FUTURISTIC = 'Tech/Futuristic (Geometric, Sharp)'
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
}

export interface ReferenceItem {
  id: string;
  image: string; // Base64
  description: string;
}

export interface CreativeText {
  includeText: boolean; // New toggle
  headline: string;
  headlineColor?: string; // New
  subheadline: string;
  subheadlineColor?: string; // New
  cta: string;
  ctaColor?: string; // New
  alignment: TextAlignment;
  style: TypographyStyle;
}

export interface GenerationAttributes {
  useGradient: boolean;
  useBlur: boolean;
  useMainColor: boolean; // Toggle for the color
  mainColor?: string; // The hex color
}

export interface AppState {
  userImages: string[]; // Array of Base64 strings
  visualReferences: ReferenceItem[]; 
  textReferences: ReferenceItem[]; 
  assetImages: string[]; 
  creativeText: CreativeText; 
  userPrompt: string;
  position: SubjectPosition;
  aspectRatio: AspectRatio; 
  attributes: GenerationAttributes;
  isGenerating: boolean;
  generatedImage: GeneratedImage | null;
  error: string | null;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}
