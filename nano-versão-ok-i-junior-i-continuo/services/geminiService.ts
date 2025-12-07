
import { GoogleGenAI } from "@google/genai";
import { 
    MODEL_NAME, 
    PROMPT_MODEL_NAME,
    POSITION_PROMPTS, 
    BLUR_PROMPT, 
    GRADIENT_PROMPT,
    PROMPT_ENGINEER_SYSTEM_INSTRUCTION,
    FRAMING_OPTIONS
} from "../constants";
import { SubjectPosition, ReferenceItem, GenerationAttributes, ChatMessage, FramingType, LightingColors, ActiveColors } from "../types";

export const checkApiKey = async (): Promise<boolean> => {
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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

// 2. STEP TWO: IMAGE GENERATION
export const generateBackground = async (
  userImagesBase64: string[],
  referenceItems: ReferenceItem[],
  environmentImagesBase64: string[],
  assetImagesBase64: string[],
  
  // New Inputs
  niche: string,
  environment: string,
  subjectDescription: string,
  colors: LightingColors,
  activeColors: ActiveColors,
  ambientOpacity: number,
  framing: FramingType,
  useFloatingElements: boolean,
  floatingElementsPrompt: string,
  
  position: SubjectPosition,
  attributes: GenerationAttributes,
  targetHeight: number = 1080
): Promise<{ image: string, finalPrompt: string }> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const targetWidth = 1920;

  // A. Generate the Master Prompt first
  const masterPrompt = await generateEnhancedPrompt(
      niche,
      environment,
      environmentImagesBase64.length,
      subjectDescription,
      colors,
      activeColors,
      ambientOpacity, 
      framing, 
      useFloatingElements,
      floatingElementsPrompt,
      userImagesBase64.length, 
      referenceItems.length,
      attributes
  );

  console.log("MASTER PROMPT GENERATED:", masterPrompt);

  const parts: any[] = [];

  // 1. User Images (Subjects)
  userImagesBase64.forEach((img) => {
    parts.push({
      inlineData: {
        data: img,
        mimeType: 'image/png', 
      },
    });
  });

  // 2. Environment Images (New)
  environmentImagesBase64.forEach((img) => {
    parts.push({
        inlineData: {
            data: img,
            mimeType: 'image/png'
        }
    });
  });

  // 3. Reference Images (Style)
  if (referenceItems.length > 0) {
      referenceItems.forEach((item) => {
          parts.push({
              inlineData: {
                  data: item.image,
                  mimeType: 'image/png',
              },
          });
      });
  }

  // 4. Asset Images
  assetImagesBase64.forEach((img) => {
    parts.push({
        inlineData: {
          data: img,
          mimeType: 'image/png', 
        },
      });
  });

  // 5. Construct Final Payload Prompt
  // We append specific technical constraints to the Master Prompt
  let finalPayload = `${masterPrompt}\n\n`;
  
  // Reference Handling
  if (referenceItems.length > 0) {
      finalPayload += `STYLE INSTRUCTION: Use the provided reference images to extract texture quality and lighting style, blending it with the requested ${niche} theme.\n`;
  }

  // Environment Handling
  if (environmentImagesBase64.length > 0) {
      finalPayload += `ENVIRONMENT INSTRUCTION: Use the provided environment images to understand the architectural style/texture of the background, but render it according to the requested blur/sharpness settings.\n`;
  }
  
  // Assets
  if (assetImagesBase64.length > 0) {
    finalPayload += `COMPOSITION: Integrate the provided asset logos/icons naturally into the floating foreground elements.\n`;
  }

  // Positioning (Critical)
  finalPayload += `\n${POSITION_PROMPTS[position]}\n`;

  // Attributes
  if (attributes.useGradient) {
      finalPayload += `${GRADIENT_PROMPT}\n`;
  }
  if (attributes.useBlur) {
      finalPayload += `${BLUR_PROMPT}\n`;
  }

  parts.push({ text: finalPayload });

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
                    finalPrompt: masterPrompt
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
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
      model: PROMPT_MODEL_NAME, 
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
