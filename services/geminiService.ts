
import { GoogleGenAI } from "@google/genai";
import { MODEL_NAME, POSITION_PROMPTS, DEFAULT_TREATMENT_PROMPT, OBJECT_TREATMENT_PROMPT, ENHANCE_TREATMENT_PROMPT, INFOPRODUCT_TREATMENT_PROMPT, BLUR_PROMPT, GRADIENT_PROMPT } from "../constants";
import { SubjectPosition, ReferenceItem, GenerationAttributes, GeneratorMode, ChatMessage, AppSection, ColorPalette } from "../types";

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
  if (ratio > 1.5) return "16:9";
  if (ratio > 1.2) return "4:3";
  if (ratio > 0.9) return "1:1";
  if (ratio > 0.7) return "3:4";
  return "9:16";
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
  palette?: ColorPalette // Optional palette for Infoproducts
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
        data: img,
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
          data: item.image,
          mimeType: 'image/png',
        },
      });
      const desc = item.description ? `(User Requirement: "${item.description}")` : "(User Requirement: Extract general style)";
      refPromptAccumulator += `Reference Image ${index + 1} Context: ${desc}.\n`;
    });
  }

  // 3. Asset Images (Secondary Logos/Objects)
  assetImagesBase64.forEach((img) => {
    parts.push({
      inlineData: {
        data: img,
        mimeType: 'image/png',
      },
    });
  });

  // Construct the text prompt
  let finalPrompt = `Task: Generate a high-resolution horizontal image.\n`;
  finalPrompt += `Application Context: ${section === 'LANDING_PAGES' ? 'Web Landing Page Background' : 'Graphic Design / Marketing Asset'}.\n`;
  finalPrompt += `Target Resolution: ${targetWidth}x${targetHeight} pixels.\n\n`;

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
    finalPrompt += `STYLE SYNTHESIS TASK: You have been provided with ${referenceItems.length} style reference images. \n`;
    finalPrompt += `${refPromptAccumulator}\n`;
    finalPrompt += `INSTRUCTION: Synthesize the best elements of these references according to the user requirements above (the 80/20 rule). Merge them into a cohesive, single composition. IMPORTANT: DO NOT reproduce any text, letters, or specific logos found in the reference images.\n\n`;
  } else if (!userPrompt.trim()) {
    finalPrompt += `Scenario: Create a professional, high-end studio background suitable for a ${section === 'LANDING_PAGES' ? 'Landing Page' : 'Design Composition'}.\n`;
  }

  if (userPrompt.trim()) {
    finalPrompt += `User Scenario/Context Instructions: ${userPrompt}\n`;
  }

  // Color Palette Injection for InfoProducts
  if (mode === 'INFOPRODUCT' && palette) {
    finalPrompt += `COLOR PALETTE & LIGHTING RULES:\n`;
    finalPrompt += `1. Dominant Background Color: ${palette.primary || 'Dark High-End Neutral'}.\n`;
    finalPrompt += `2. Secondary Lighting Color (Rim Light/Depth): ${palette.secondary || 'Warm Gold/Cold Blue'}.\n`;
    finalPrompt += `3. Accent/Detail Color (Elements/Overlays): ${palette.accent || 'Complementary to Primary'}.\n`;
    finalPrompt += `Ensure the entire image is color graded to match this palette harmoniously.\n\n`;
  }

  if (assetImagesBase64.length > 0) {
    finalPrompt += `Asset Integration: Incorporate the logos or secondary elements from the asset images provided naturally into the composition. For InfoProducts, float them subtly in the background.\n`;
  }

  // Positioning
  if (mode !== 'ENHANCE') {
    finalPrompt += `Positioning Guidelines: ${POSITION_PROMPTS[position]}\n\n`;
  } else {
    finalPrompt += `Positioning: Respect the original composition of the base image primarily. If the user prompt requests a shift, only then apply changes.\n\n`;
  }

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

  // Specific Mode Guidelines
  if (mode === 'HUMAN') {
    finalPrompt += `Quality Guidelines: ${DEFAULT_TREATMENT_PROMPT}\n\n`;
  } else if (mode === 'OBJECT') {
    finalPrompt += `Quality Guidelines: ${OBJECT_TREATMENT_PROMPT}\n\n`;
  } else if (mode === 'ENHANCE') {
    finalPrompt += `Quality Guidelines: ${ENHANCE_TREATMENT_PROMPT}\n\n`;
  } else if (mode === 'INFOPRODUCT') {
    finalPrompt += `Quality Guidelines: ${INFOPRODUCT_TREATMENT_PROMPT}\n\n`;
  }

  parts.push({ text: finalPrompt });

  const aspectRatio = getClosestAspectRatio(targetWidth, targetHeight);

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
        data: originalImageBase64.split(',')[1],
        mimeType: 'image/png',
      },
    },
  ];

  if (refineReferenceImages && refineReferenceImages.length > 0) {
    refineReferenceImages.forEach(img => {
      parts.push({
        inlineData: {
          data: img,
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
        data: currentImageBase64.split(',')[1],
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
