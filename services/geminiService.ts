
import { GoogleGenAI } from "@google/genai";
import {
  MODEL_NAME,
  PROMPT_MODEL_NAME,
  POSITION_PROMPTS,
  DEFAULT_TREATMENT_PROMPT,
  OBJECT_TREATMENT_PROMPT,
  ENHANCE_TREATMENT_PROMPT,
  INFOPRODUCT_TREATMENT_PROMPT,
  BLUR_PROMPT,
  GRADIENT_PROMPT,
  PROMPT_ENGINEER_SYSTEM_INSTRUCTION,
  FRAMING_OPTIONS
} from "../constants";
import { SubjectPosition, ReferenceItem, GenerationAttributes, GeneratorMode, ChatMessage, AppSection, ColorPalette, ProjectContext, FramingType, LightingColors, ActiveColors, CreativeText, TextAlignment, TypographyStyle, AspectRatioCreative } from "../types";

const LOCAL_STORAGE_KEY = 'gemini_api_key';

export const saveApiKey = (key: string) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, key);
};

export const getApiKey = (): string | null => {
  return localStorage.getItem(LOCAL_STORAGE_KEY) || process.env.API_KEY || null;
};

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey?: () => Promise<boolean>;
      openSelectKey?: () => Promise<void>;
    };
  }
}

export const checkApiKey = async (): Promise<boolean> => {
  if (getApiKey()) return true;

  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    return await window.aistudio.hasSelectedApiKey();
  }
  return false;
};

export const promptApiKeySelection = async (): Promise<void> => {
  if (window.aistudio && window.aistudio.openSelectKey) {
    await window.aistudio.openSelectKey();
  }
};

const getClosestAspectRatio = (width: number, height: number): string => {
  const ratio = width / height;

  // Ultra Wide
  if (ratio > 2.0) return "21:9";

  // Standard Landscape
  if (ratio > 1.6) return "16:9";
  if (ratio > 1.4) return "3:2";
  if (ratio > 1.2) return "4:3";

  // Square-ish
  if (ratio >= 0.9 && ratio <= 1.1) return "1:1";

  // Portrait
  if (ratio > 0.7) return "3:4";
  if (ratio > 0.6) return "2:3";

  // Tall
  return "9:16";
};

const cleanBase64 = (data: string) => {
  return data.replace(/^data:image\/\w+;base64,/, "");
};

// Helper to convert URL to base64
const urlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper to ensure image is in base64 format
const ensureBase64 = async (imageData: string): Promise<string> => {
  // If it's a URL (starts with http), fetch and convert
  if (imageData.startsWith('http')) {
    return await urlToBase64(imageData);
  }
  // Already base64
  return imageData;
};

// Helper to parse image tags (@img1, @ref1, @asset1) and replace with descriptive instructions
const parseImageTags = (
  prompt: string,
  subjectImageCount: number,
  referenceCount: number,
  assetCount: number
): string => {
  let result = prompt;

  // Replace @img1, @img2, etc. with descriptive text
  for (let i = 1; i <= subjectImageCount; i++) {
    const tag = `@img${i}`;
    const replacement = subjectImageCount === 1
      ? 'the subject image provided'
      : `subject image #${i}`;
    result = result.replace(new RegExp(tag, 'gi'), replacement);
  }

  // Replace @ref1, @ref2, etc.
  for (let i = 1; i <= referenceCount; i++) {
    const tag = `@ref${i}`;
    const replacement = referenceCount === 1
      ? 'the style reference image'
      : `style reference image #${i}`;
    result = result.replace(new RegExp(tag, 'gi'), replacement);
  }

  // Replace @asset1, @asset2, etc.
  for (let i = 1; i <= assetCount; i++) {
    const tag = `@asset${i}`;
    const replacement = assetCount === 1
      ? 'the asset/logo image'
      : `asset image #${i}`;
    result = result.replace(new RegExp(tag, 'gi'), replacement);
  }

  return result;
};

// 1. STEP ONE: TEXT PROMPT ENGINEERING
export const generateEnhancedPrompt = async (
  niche: string,
  environment: string,
  environmentImagesCount: number,
  subjectDescription: string,
  colors: LightingColors,
  activeColors: ActiveColors,
  ambientOpacity: number,
  framing: FramingType,
  useFloatingElements: boolean,
  floatingElementsPrompt: string,
  userImagesCount: number,
  referenceItemsCount: number,
  attributes: GenerationAttributes
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "";
  const ai = new GoogleGenAI({ apiKey });

  // Convert Framing ID to Description
  const framingDesc = FRAMING_OPTIONS.find(f => f.id === framing)?.prompt || "Standard portrait framing";

  const userMessage = `
    INPUTS DO USUÁRIO:
    - Nicho: ${niche}
    - Descrição do Sujeito: ${subjectDescription || "Não especificado (Usar referência visual ou nicho)"}
    - Ambiente Específico: ${environment || "Não especificado (Inventar baseado no nicho)"}
    - Usar Ref. Ambiente: ${environmentImagesCount > 0 ? "SIM" : "NÃO"}
    
    CONFIGURAÇÃO DE CORES:
    - Usar Cor Fundo: ${activeColors.ambient ? "SIM" : "NÃO"} (Cor: ${colors.ambient}, Opacidade: ${ambientOpacity}%)
    - Usar Cor Recorte: ${activeColors.rim ? "SIM" : "NÃO"} (Cor: ${colors.rim})
    - Usar Cor Complementar: ${activeColors.complementary ? "SIM" : "NÃO"} (Cor: ${colors.complementary})
    
    ATRIBUTOS VISUAIS:
    - Usar Degradê (Vignette): ${attributes.useGradient ? "SIM" : "NÃO"}
    - Usar Blur (Foco): ${attributes.useBlur ? "SIM" : "NÃO"}
    
    - Enquadramento: ${framingDesc}
    - Usar Elementos Flutuantes: ${useFloatingElements ? "SIM" : "NÃO"}
    - Descrição Elementos Flutuantes: ${floatingElementsPrompt || "Não especificado (Inventar se SIM)"}
    - Imagens do Sujeito fornecidas: ${userImagesCount}
    - Referências de estilo fornecidas: ${referenceItemsCount}
    
    Gere o prompt final seguindo estritamente o template.
    `;

  try {
    const response = await ai.models.generateContent({
      model: PROMPT_MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      config: {
        systemInstruction: PROMPT_ENGINEER_SYSTEM_INSTRUCTION
      }
    });

    return response.text || "";
  } catch (e) {
    console.error("Prompt Engineering Error:", e);
    // Fallback prompt if LLM fails
    return `Create an 8K ultra-realistic cinematic action portrait, format 1080x1440. Subject: Professional ${niche} ${subjectDescription ? `(${subjectDescription})` : ''}. Setting: ${environment || "Abstract Professional background"}. Lighting: Cinematic lighting. Background: ${attributes.useBlur ? "Abstract textured background" : "Detailed realistic background"}.`;
  }
};

export const generateBackground = async (
  section: AppSection,
  mode: GeneratorMode,
  userImagesBase64: string[],
  referenceItems: ReferenceItem[],
  assetImagesBase64: string[],
  userPrompt: string,
  position: SubjectPosition,
  attributes: GenerationAttributes,
  targetHeight: number = 1080,
  palette?: ColorPalette,
  projectContext?: ProjectContext
): Promise<{ image: string, finalPrompt: string }> => {

  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key not found");
  const ai = new GoogleGenAI({ apiKey });
  const targetWidth = 1920;

  const parts: any[] = [];

  // 1. User Images (Subjects, Objects, or Base Canvas)
  userImagesBase64.forEach((img) => {
    parts.push({
      inlineData: {
        data: cleanBase64(img),
        mimeType: 'image/png',
      },
    });
  });

  // 2. Reference Images (Style) with Context
  let refPromptAccumulator = "";
  if (referenceItems.length > 0) {
    referenceItems.forEach((item, index) => {
      parts.push({
        inlineData: {
          data: cleanBase64(item.image),
          mimeType: 'image/png',
        },
      });
      const desc = item.description ? `(User Requirement: "${item.description}")` : "(User Requirement: Extract general style)";
      refPromptAccumulator += `Reference Image ${index + 1} Context: ${desc}.\n`;
    });
  }

  // 3. Asset Images (Secondary Elements)
  if (assetImagesBase64.length > 0) {
    assetImagesBase64.forEach((img) => {
      parts.push({
        inlineData: {
          data: cleanBase64(img),
          mimeType: 'image/png',
        },
      });
    });
  }

  // Construct the text prompt - SIMPLIFIED DIRECT APPROACH
  const aspectRatio = getClosestAspectRatio(targetWidth, targetHeight);
  let finalPrompt = `Task: Generate a high-resolution horizontal image.\n`;
  finalPrompt += `Target Resolution: ${targetWidth}x${targetHeight} pixels.\n\n`;

  // Subject Handling
  if (userImagesBase64.length > 0) {
    if (mode === 'HUMAN') {
      finalPrompt += `Subject: Use the person(s) in the first ${userImagesBase64.length} images provided as the main subject. Maintain their facial features, physiognomy, and identity with 100% fidelity.\n`;
    } else if (mode === 'INFOPRODUCT') {
      finalPrompt += `Subject (The Expert): Use the person provided. Analyze their face and identity. Keep the face 100% identical. However, YOU HAVE PERMISSION to upgrade their pose, body language, and clothing to appear more authoritative and professional if the original is too casual.\n`;
    } else if (mode === 'OBJECT') {
      finalPrompt += `Subject: Use the object/product in the first ${userImagesBase64.length} images provided as the main focal point. Maintain its geometry, brand details, labels, and material properties with 100% fidelity. Do not distort the product.\n`;
    } else if (mode === 'ENHANCE') {
      finalPrompt += `BASE IMAGE: The first ${userImagesBase64.length} images provided are the BASE CANVAS. Do not create a new composition from scratch. You must keep the layout of this image.\n`;
    }
  }

  // Logic for References
  if (referenceItems.length > 0) {
    finalPrompt += `STYLE SYNTHESIS TASK: You have been provided with ${referenceItems.length} style reference images.\n`;
    finalPrompt += `${refPromptAccumulator}\n`;
    finalPrompt += `INSTRUCTION: Synthesize the best elements of these references according to the user requirements above (the 80/20 rule). Merge them into a cohesive, single composition. IMPORTANT: DO NOT reproduce any text, letters, or specific logos found in the reference images.\n\n`;
  } else if (!userPrompt.trim()) {
    finalPrompt += `Scenario: Create a professional, high-end studio background suitable for a landing page.\n`;
  }

  // User prompt - parse image tags (@img1, @ref1, @asset1)
  if (userPrompt.trim()) {
    const parsedPrompt = parseImageTags(
      userPrompt,
      userImagesBase64.length,
      referenceItems.length,
      assetImagesBase64.length
    );
    finalPrompt += `User Scenario/Context Instructions: ${parsedPrompt}\n`;
  }

  // Asset Integration
  if (assetImagesBase64.length > 0) {
    finalPrompt += `Asset Integration: Incorporate the logos or secondary elements from the asset images provided naturally into the composition.\n`;
  }

  // Positioning - ALWAYS apply for non-ENHANCE modes
  if (mode !== 'ENHANCE') {
    finalPrompt += `Positioning Guidelines: ${POSITION_PROMPTS[position]}\n\n`;
  } else {
    finalPrompt += `Positioning: Respect the original composition of the base image primarily. If the user prompt requests a shift, only then apply changes.\n\n`;
  }

  // LIGHTING SETUP - New logic: toggle OFF = let AI decide (but still have great lighting)
  finalPrompt += `LIGHTING SETUP:\n`;

  const colors = projectContext?.colors || { ambient: '#0f172a', rim: '#a3e635', complementary: '#6366f1' };
  const activeColors = projectContext?.activeColors || { ambient: false, rim: false, complementary: false };

  // Ambient/Background color
  if (activeColors.ambient) {
    const opacity = projectContext?.ambientOpacity || 50;
    finalPrompt += `- Background Ambient: Tint the background with ${colors.ambient} at ${opacity}% intensity.\n`;
  } else {
    finalPrompt += `- Background Ambient: Use professional, cinematic background colors that complement the subject and create depth.\n`;
  }

  // Rim Light
  if (activeColors.rim) {
    finalPrompt += `- Rim Light: Apply a ${colors.rim} rim light on the subject's hair and shoulders to separate them from the background.\n`;
  } else {
    finalPrompt += `- Rim Light: Apply professional rim lighting to elegantly separate the subject from the background. Choose a color that creates dramatic contrast.\n`;
  }

  // Complementary Light
  if (activeColors.complementary) {
    finalPrompt += `- Fill Light: Add a subtle ${colors.complementary} fill light for color complexity and depth.\n`;
  } else {
    finalPrompt += `- Fill Light: Add subtle secondary lighting to create color complexity and professional depth.\n`;
  }

  finalPrompt += `- Volumetric Lighting: Add volumetric rays, god rays, or atmospheric haze where appropriate for cinematic depth.\n\n`;

  // Attributes (Gradient / Blur)
  if (attributes.useGradient) {
    finalPrompt += `${GRADIENT_PROMPT}\n`;
  }
  if (attributes.useBlur) {
    finalPrompt += `${BLUR_PROMPT}\n`;
  }
  if (!attributes.useGradient && !attributes.useBlur && mode !== 'ENHANCE') {
    finalPrompt += `CLARITY ATTRIBUTE: Keep the background relatively detailed and sharp across the frame, using only natural optical depth of field.\n`;
  }

  // 3D Elements - toggle ON = add, toggle OFF = AI decides
  if (projectContext?.floatingElements3D) {
    const elementDesc = projectContext.floatingElementsDescription || "abstract 3D floating elements (spheres, cubes, or shapes related to the context)";
    finalPrompt += `3D DEPTH ENHANCEMENT: Add ${elementDesc} in the background. They should have depth of field (bokeh) to create a sense of immersion and high-end 3D design.\n`;
  }
  // If OFF, don't mention it - let AI decide naturally

  // Background Effects - toggle ON = add, toggle OFF = AI decides
  if (projectContext?.backgroundEffects) {
    const effectsDesc = projectContext.backgroundEffectsDescription || "dynamic visual background effects such as: energy trails and lightning bolts, glowing light particles and sparkles, neon geometric lines and light beams";
    finalPrompt += `CREATIVE BACKGROUND EFFECTS: Add ${effectsDesc}. These effects should complement the subject and harmonize with the dominant lighting colors.\n`;
  }
  // If OFF, don't mention it - let AI decide naturally

  // Specific Mode Quality Guidelines
  if (mode === 'HUMAN') {
    finalPrompt += `\nQuality Guidelines: ${DEFAULT_TREATMENT_PROMPT}\n`;
  } else if (mode === 'OBJECT') {
    finalPrompt += `\nQuality Guidelines: ${OBJECT_TREATMENT_PROMPT}\n`;
  } else if (mode === 'ENHANCE') {
    finalPrompt += `\nQuality Guidelines: ${ENHANCE_TREATMENT_PROMPT}\n`;
  } else if (mode === 'INFOPRODUCT') {
    finalPrompt += `\nQuality Guidelines: ${INFOPRODUCT_TREATMENT_PROMPT}\n`;
  }

  parts.push({ text: finalPrompt });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: "2K"
        }
      },
    });

    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return {
            image: `data:image/png;base64,${part.inlineData.data}`,
            finalPrompt: userPrompt || "Auto-generated from references"
          };
        }
      }
    }

    throw new Error("No image data found in response.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate image");
  }
};

export const refineImage = async (
  originalImageBase64: string,
  editInstructions: string,
  refineReferenceImages: string[] = []
): Promise<string> => {

  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key not found");
  const ai = new GoogleGenAI({ apiKey });

  const parts: any[] = [
    {
      inlineData: {
        data: cleanBase64(originalImageBase64),
        mimeType: 'image/png',
      },
    },
  ];

  if (refineReferenceImages && refineReferenceImages.length > 0) {
    refineReferenceImages.forEach(img => {
      parts.push({
        inlineData: {
          data: cleanBase64(img),
          mimeType: 'image/png'
        }
      });
    });
  }

  parts.push({
    text: `Edit the provided image (first image). Instructions: ${editInstructions}. 
               ${refineReferenceImages.length > 0 ? 'Use the additional images provided as context/content for the edit.' : ''}
               CRITICAL: Maintain the exact context, lighting, and composition of the original image. Only apply the specific adjustment requested. Do not change the subject's face or position unless explicitly asked.`
  });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "2K"
        }
      },
    });

    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image data found in response.");
  } catch (error: any) {
    console.error("Gemini Edit Error:", error);
    throw new Error(error.message || "Failed to refine image");
  }
};

export const reframeImageForTextLayout = async (
  currentImageBase64: string,
  targetHeight: number = 1920,
  verticalPrompt: string = ""
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key not found");
  const ai = new GoogleGenAI({ apiKey });
  const targetWidth = 1080;

  const parts = [
    {
      inlineData: {
        data: cleanBase64(currentImageBase64),
        mimeType: 'image/png',
      },
    },
    {
      text: `Recreate this image as a ${targetWidth}x${targetHeight} (Vertical) background. 
               
               LAYOUT RULES:
               1. Align the subject's EYE-LINE (or top focal point) to the VERTICAL CENTER of the canvas.
               2. The subject should occupy the upper portion of the image.
               3. Extend the bottom part of the image naturally using textures from the environment (clothing, background elements) but keep it low contrast for text overlay.
               
               TRANSITION FIX:
               If the original image was a crop, DO NOT leave a hard cut at the bottom. Add a subtle gradient overlay, fog, or blend the torso/clothing downwards to mask the transition seamlessly into the background texture.

               USER CUSTOM INSTRUCTIONS FOR VERTICAL VERSION:
               ${verticalPrompt ? verticalPrompt : "None. Follow standard vertical formatting."}
               `,
    },
  ];

  const aspectRatio = getClosestAspectRatio(targetWidth, targetHeight);

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: "2K"
        }
      },
    });

    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image data found in response.");
  } catch (error: any) {
    console.error("Gemini Layout Error:", error);
    throw new Error(error.message || "Failed to reformat image");
  }
};

export const sendAgentChat = async (
  history: ChatMessage[],
  newMessage: string,
  image?: string,
  systemInstruction: string = "You are a helpful assistant."
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key not found");
  const ai = new GoogleGenAI({ apiKey });

  const contents = history.map(msg => {
    const parts: any[] = [];
    if (msg.image) {
      parts.push({
        inlineData: {
          data: msg.image.split(',')[1],
          mimeType: 'image/png'
        }
      });
    }
    if (msg.text) {
      parts.push({ text: msg.text });
    }
    return {
      role: msg.role,
      parts: parts
    };
  });

  const newParts: any[] = [];
  if (image) {
    newParts.push({
      inlineData: {
        data: image.split(',')[1],
        mimeType: 'image/png'
      }
    });
  }
  newParts.push({ text: newMessage });

  contents.push({
    role: 'user',
    parts: newParts
  });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: {
        systemInstruction: systemInstruction
      }
    });

    return response.text || "Sem resposta.";
  } catch (error: any) {
    console.error("Agent Chat Error:", error);
    throw new Error(error.message || "Failed to get response from agent");
  }
};

export const inpaintImage = async (
  originalImageBase64: string,
  maskImageBase64: string,
  prompt: string
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key not found");
  const ai = new GoogleGenAI({ apiKey });

  // Create a black and white mask from the red overlay if needed, 
  // but Gemini is smart enough to understand "edit the area covered by the second image mask".
  // Ideally, we should send a B&W mask where white = edit, black = keep.
  // For now, we will send the mask as is and instruct the model.

  const parts: any[] = [
    {
      inlineData: {
        data: cleanBase64(originalImageBase64),
        mimeType: 'image/png',
      },
    },
    {
      inlineData: {
        data: cleanBase64(maskImageBase64),
        mimeType: 'image/png',
      },
    },
    {
      text: `INPAINTING TASK:
             The first image is the ORIGINAL IMAGE.
             The second image is the MASK (the red/colored areas indicate what to edit).
             
             INSTRUCTION:
             Edit the ORIGINAL IMAGE only in the areas highlighted by the MASK.
             ${prompt ? `User Request: ${prompt}` : 'Remove the masked object and fill the background naturally (Inpainting/Removal).'}
             
             CRITICAL:
             1. Do NOT change anything outside the masked area.
             2. Blend the edges seamlessly.
             3. Maintain the original resolution and style.`
    }
  ];

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "16:9", // Or match original
          imageSize: "2K"
        }
      },
    });

    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image data found in response.");
  } catch (error: any) {
    console.error("Inpainting Error:", error);
    throw new Error(error.message || "Failed to inpaint image");
  }
};

// Design Asset Generation
export const generateDesignAsset = async (
  category: 'MOCKUPS' | 'ICONS' | 'PRODUCTS' | 'LOGOS' | 'PROFILE',
  inputs: any
): Promise<{ image: string, finalPrompt: string }> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key not found");
  const ai = new GoogleGenAI({ apiKey });

  let prompt = "";

  switch (category) {
    case 'MOCKUPS':
      prompt = `Generate a photorealistic ${inputs.deviceType} mockup in a professional studio setting.
Angle: ${inputs.angle} view. The device should appear premium and high-end.
${inputs.screenImage ? 'The screen should display the provided image.' : 'The screen should be white/blank or show a placeholder UI.'}
Background: Solid/gradient color ${inputs.bgColor}. 
Lighting: Soft studio light with subtle shadows. 8K quality, commercial advertising aesthetic.`;
      break;

    case 'ICONS':
      const bgDesc = inputs.bgColor === 'transparent' ? 'a completely transparent background (alpha channel)' : `a solid ${inputs.bgColor} background`;

      // Build style instructions based on available inputs
      let styleInstructions = '';

      if (inputs.iconStyleReference) {
        styleInstructions = `STYLE REFERENCE: A style reference image has been provided. Analyze this reference and apply its visual style, effects, lighting, and aesthetic to the icon. Capture the essence of the reference's look and feel.`;
      } else if (inputs.iconStyle) {
        styleInstructions = `TRANSFORMATION STYLE: ${inputs.iconStyle}
${inputs.iconStyle === 'Glassmorphism' ? '- Apply a frosted glass effect with transparency, blur, and subtle reflections. Add glass-like depth and light refraction.' : ''}
${inputs.iconStyle === 'Neon' ? '- Transform into a glowing neon sign effect with bright edges, inner glow, and light emission. Add subtle light bloom and reflection.' : ''}
${inputs.iconStyle === 'Clay 3D' ? '- Transform into a soft, clay/plasticine 3D render with rounded edges, matte finish, and soft shadows. Add depth and volumetric feel.' : ''}
${inputs.iconStyle === 'Gradiente' ? '- Apply a vibrant gradient fill with smooth color transitions. Add depth with gradient shadows and highlights.' : ''}`;
      } else {
        styleInstructions = `STYLE: High-end 3D icon style - glossy, volumetric, soft shadows, premium advertising aesthetic.`;
      }

      // Build color instructions
      const colorInstructions = inputs.iconColor
        ? `COLOR SCHEME: Apply ${inputs.iconColor} as the primary/dominant color.`
        : `COLOR SCHEME: Use contextually appropriate colors. If a reference image is provided, extract and use its color palette. Otherwise, use vibrant, professional colors suitable for the icon concept.`;

      if (inputs.iconReferenceImage) {
        // Transform existing icon/logo
        prompt = `ICON TRANSFORMATION TASK:
The provided image contains an icon or logo that needs to be transformed.
CRITICAL: Maintain the EXACT shape, form, and recognizable features of the original icon/logo. Do NOT create a new icon.

${styleInstructions}

${colorInstructions}
Background: ${bgDesc}. The background must be completely clean with no other elements.
Format: Square composition (1024x1024), icon centered and filling about 70% of the frame.
Quality: 8K ultra-detailed, perfect for app icons or social media.
CRITICAL: Generate ONLY ONE transformed icon. NO patterns, NO tiles, NO multiple copies.`;
      } else {
        // Text-based icon generation
        prompt = `Create a single, isolated 3D icon of a ${inputs.iconDescription}.
CRITICAL: Generate ONLY ONE icon centered in the frame. DO NOT create patterns, tiles, or multiple copies of the icon. The background must be clean and simple - NO reflections, NO repeated elements, NO other objects.

${styleInstructions}

${colorInstructions}
Background: ${bgDesc}. The background must be completely clean with no other elements.
Format: Square composition (1024x1024), icon centered and filling about 70% of the frame.
Quality: 8K ultra-detailed, perfect for app icons or social media.`;
      }
      break;

    case 'PRODUCTS':
      prompt = `Generate a photorealistic product shot of a premium ${inputs.productType} for ${inputs.brandName || 'a luxury brand'} in the ${inputs.niche || 'lifestyle'} industry.
The packaging should feature colors: ${inputs.productColors.join(', ')}.
${inputs.logoImage ? 'Apply the provided logo on the product.' : 'The product should have elegant, minimal branding.'}
Background: Clean studio gradient. Floating composition with soft shadows.
Lighting: Professional product photography, ray-traced quality. 8K resolution.`;
      break;

    case 'LOGOS':
      prompt = `Design a ${inputs.logoStyle} logo for "${inputs.logoName}" in the ${inputs.logoNiche} industry.
${inputs.includeIcon ? 'The logo should include a relevant icon/symbol alongside the text.' : 'The logo should be text-only (wordmark).'}
Colors: ${inputs.logoColors.join(' and ')}.
Style: Clean, professional, memorable, vector-style appearance.
Background: Pure white. The logo should be centered and clearly visible.
Generate a single, polished logo design.`;
      break;

    case 'PROFILE':
      const bgInstruction = inputs.bgType === 'gradient'
        ? `a professional gradient background based on ${inputs.bgColor}`
        : `a solid ${inputs.bgColor} background`;
      const postureInstruction = inputs.fixPosture ? 'Subtly correct the posture to be more professional and confident.' : '';

      prompt = `PROFESSIONAL PROFILE PHOTO GENERATION:
Format: Square 1:1 (1024x1024 pixels).
CRITICAL: Use the provided photo as reference. Keep the face 100% identical - same facial features, skin tone, and recognizable characteristics.

Style: ${inputs.style}
${inputs.style === 'Corporativo' ? '- Clean, professional corporate look. Neutral background, soft studio lighting, trustworthy appearance suitable for LinkedIn.' : ''}
${inputs.style === 'Criativo' ? '- Vibrant, artistic. Bold colors, creative lighting effects, modern aesthetic.' : ''}
${inputs.style === 'Minimalista' ? '- Ultra clean, minimal distractions. Simple solid background, focus on face.' : ''}
${inputs.style === 'Elegante' ? '- Sophisticated, refined look. Cinematic lighting, subtle shadows, premium feel.' : ''}

Background: ${bgInstruction}
Framing: ${inputs.framing} shot - ${inputs.framing === 'Close-up' ? 'face fills most of the frame' : inputs.framing === 'Meio-busto' ? 'from chest up' : 'head and shoulders visible'}
Lighting: ${inputs.lighting} lighting
${postureInstruction}
${inputs.additionalPrompt ? `Additional instructions: ${inputs.additionalPrompt}` : ''}

Quality: Sharp, high-resolution, professional headshot quality. Suitable for LinkedIn, social media profiles, or professional websites.`;
      break;
  }

  const parts: any[] = [];

  // Add uploaded images if any
  if (inputs.screenImage) {
    parts.push({
      inlineData: {
        data: inputs.screenImage.replace(/^data:image\/\w+;base64,/, ""),
        mimeType: 'image/png',
      },
    });
  }

  if (inputs.logoImage) {
    parts.push({
      inlineData: {
        data: inputs.logoImage.replace(/^data:image\/\w+;base64,/, ""),
        mimeType: 'image/png',
      },
    });
  }

  // Add icon reference image for transformation
  if (inputs.iconReferenceImage) {
    parts.push({
      inlineData: {
        data: inputs.iconReferenceImage.replace(/^data:image\/\w+;base64,/, ""),
        mimeType: 'image/png',
      },
    });
  }

  // Add icon style reference image
  if (inputs.iconStyleReference) {
    parts.push({
      inlineData: {
        data: inputs.iconStyleReference.replace(/^data:image\/\w+;base64,/, ""),
        mimeType: 'image/png',
      },
    });
  }

  // Add profile image
  if (inputs.profileImage) {
    parts.push({
      inlineData: {
        data: inputs.profileImage.replace(/^data:image\/\w+;base64,/, ""),
        mimeType: 'image/png',
      },
    });
  }

  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts }],
      config: {
        responseModalities: ['image', 'text'],
        imageConfig: {
          aspectRatio: (category === 'LOGOS' || category === 'ICONS' || category === 'PROFILE') ? "1:1" : "16:9",
          imageSize: "2K"
        }
      },
    });

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return {
            image: `data:image/png;base64,${part.inlineData.data}`,
            finalPrompt: prompt
          };
        }
      }
    }
    throw new Error("No image data found in response.");
  } catch (error: any) {
    console.error("Design Asset Generation Error:", error);
    throw new Error(error.message || "Failed to generate design asset");
  }
};

// Creative Generation with Text
export const generateCreative = async (
  userImagesBase64: string[],
  visualReferences: ReferenceItem[],
  textReferences: ReferenceItem[],
  assetImagesBase64: string[],
  creativeText: CreativeText,
  userPrompt: string,
  position: SubjectPosition,
  attributes: GenerationAttributes & { useMainColor?: boolean; mainColor?: string },
  aspectRatio: AspectRatioCreative
): Promise<{ image: string, finalPrompt: string }> => {

  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key not configured");

  const ai = new GoogleGenAI({ apiKey });
  const parts: any[] = [];

  // 1. User Images (Subject)
  userImagesBase64.forEach((img) => {
    parts.push({
      inlineData: { data: cleanBase64(img), mimeType: 'image/png' },
    });
  });

  // 2. Visual References (Background/Vibe)
  let visualRefPrompt = "";
  if (visualReferences.length > 0) {
    visualReferences.forEach((item, index) => {
      parts.push({ inlineData: { data: cleanBase64(item.image), mimeType: 'image/png' } });
      const desc = item.description ? `(Note: "${item.description}")` : "(Note: Extract style)";
      visualRefPrompt += `Visual Reference ${index + 1}: ${desc}.\n`;
    });
  }

  // 3. Text/Layout References
  let textRefPrompt = "";
  if (creativeText.includeText && textReferences.length > 0) {
    textReferences.forEach((item, index) => {
      parts.push({ inlineData: { data: cleanBase64(item.image), mimeType: 'image/png' } });
      const desc = item.description ? `(Note: "${item.description}")` : "(Note: Use for font style)";
      textRefPrompt += `Typography Reference ${index + 1}: ${desc}.\n`;
    });
  }

  // 4. Asset Images (Logos)
  assetImagesBase64.forEach((img) => {
    parts.push({ inlineData: { data: cleanBase64(img), mimeType: 'image/png' } });
  });

  // --- PROMPT CONSTRUCTION ---
  let finalPrompt = `Task: Create a finished High-End Advertising Creative${creativeText.includeText ? ' (Image + Text)' : ' (Background Image Only)'}. \n`;
  finalPrompt += `Aspect Ratio: ${aspectRatio}. \n\n`;

  // A. SUBJECT
  if (userImagesBase64.length > 0) {
    finalPrompt += `SUBJECT INSTRUCTIONS: Use the person(s) or object(s) in the first ${userImagesBase64.length} images provided. Maintain 100% facial and physical fidelity. \n`;
    finalPrompt += `Positioning: ${POSITION_PROMPTS[position]}\n\n`;
  }

  // B. VISUAL STYLE
  if (visualReferences.length > 0) {
    finalPrompt += `VISUAL STYLE SYNTHESIS: You have been provided with ${visualReferences.length} visual reference images. \n`;
    finalPrompt += `${visualRefPrompt}\n`;
    finalPrompt += `INSTRUCTION: Synthesize the best elements (lighting, environment, color palette) of these visual references. Merge them into a cohesive background composition.\n`;
  }

  // Optional Color Injection
  if (attributes.useMainColor && attributes.mainColor) {
    finalPrompt += `COLOR PALETTE INSTRUCTION: The primary/dominant color MUST be based on this specific color: ${attributes.mainColor}. Ensure the text contrasts well.\n`;
  }

  // C. TEXT RENDERING
  if (creativeText.includeText) {
    finalPrompt += `\nTEXT RENDERING INSTRUCTIONS:\n`;
    finalPrompt += `1. **MARGIN RULE (CRITICAL)**: Preserve minimum margin of **150px** from TOP and BOTTOM edges.\n`;
    finalPrompt += `2. **ALIGNMENT**: Text must be **${creativeText.alignment}** aligned.\n`;
    finalPrompt += `3. **STYLE**: Typography style: **${creativeText.style}**.\n`;
    finalPrompt += `4. **NEGATIVE PROMPT**: Do NOT write labels like "Headline", "CTA". ONLY render the actual text content.\n`;

    finalPrompt += `\nTEXT CONTENT & COLORS:\n`;
    if (creativeText.headline) {
      finalPrompt += ` - Headline: "${creativeText.headline}". Color: ${creativeText.headlineColor}.\n`;
    }
    if (creativeText.subheadline) {
      finalPrompt += ` - Subheadline: "${creativeText.subheadline}". Color: ${creativeText.subheadlineColor}.\n`;
    }
    if (creativeText.cta) {
      finalPrompt += ` - CTA Button: "${creativeText.cta}". Color: ${creativeText.ctaColor}.\n`;
    }

    if (textReferences.length > 0) {
      finalPrompt += `\nUse the Typography References for font family and effects.\n${textRefPrompt}\n`;
    }

    if (attributes.useGradient) {
      finalPrompt += `Add a soft gradient or overlay behind text area for readability.\n`;
    }

    finalPrompt += `\nFINAL CHECK: Ensure spelling is correct. Text must not overlap the subject's face.\n`;
  } else {
    finalPrompt += `\nNO TEXT INSTRUCTION: Do NOT generate any text. Focus on photographic composition.\n`;
    finalPrompt += `Create ample negative space on the ${position === 'LEFT' ? 'RIGHT' : (position === 'RIGHT' ? 'LEFT' : 'SIDES')} for future text placement.\n`;
  }

  // D. ASSETS
  if (assetImagesBase64.length > 0) {
    finalPrompt += `Integrate the provided logos/assets naturally in a corner or anchored position.\n`;
  }

  if (userPrompt.trim()) {
    finalPrompt += `\nAdditional Context: ${userPrompt}\n`;
  }

  parts.push({ text: finalPrompt });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return {
            image: `data:image/png;base64,${part.inlineData.data}`,
            finalPrompt: finalPrompt
          };
        }
      }
    }

    throw new Error("No image data found in response.");

  } catch (error: any) {
    console.error("Creative Generation Error:", error);
    throw new Error(error.message || "Failed to generate creative");
  }
};

// Refine Creative with Mask
export const refineCreative = async (
  originalImage: string,
  editInstructions: string,
  maskImageBase64?: string | null
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key not configured");

  const ai = new GoogleGenAI({ apiKey });

  // Convert URL to base64 if needed
  const imageBase64 = await ensureBase64(originalImage);

  const parts: any[] = [
    { inlineData: { data: cleanBase64(imageBase64), mimeType: 'image/png' } },
  ];

  let prompt = `Edit this image. Instructions: ${editInstructions}. Maintain original composition and text unless asked to change.`;

  if (maskImageBase64) {
    parts.push({ inlineData: { data: cleanBase64(maskImageBase64), mimeType: 'image/png' } });
    prompt += ` \nIMPORTANT: A binary mask image has been provided (the second image). WHITE areas represent the region to edit. BLACK areas must remain unchanged.`;
  }

  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found.");
  } catch (error: any) {
    throw new Error(error.message || "Failed to refine creative");
  }
};
