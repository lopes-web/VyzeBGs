
import { GoogleGenAI } from "@google/genai";
import { MODEL_NAME, POSITION_PROMPTS, DEFAULT_TREATMENT_PROMPT } from "../constants";
import { SubjectPosition, ReferenceItem, GenerationAttributes, CreativeText, AspectRatio, TextAlignment, TypographyStyle } from "../types";

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

export const generateCreative = async (
  userImagesBase64: string[],
  visualReferences: ReferenceItem[],
  textReferences: ReferenceItem[],
  assetImagesBase64: string[],
  creativeText: CreativeText,
  userPrompt: string,
  position: SubjectPosition,
  attributes: GenerationAttributes,
  aspectRatio: AspectRatio
): Promise<{ image: string, finalPrompt: string }> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [];

  // 1. User Images (Subject)
  userImagesBase64.forEach((img) => {
    parts.push({
      inlineData: { data: img, mimeType: 'image/png' },
    });
  });

  // 2. Visual References (Background/Vibe)
  let visualRefPrompt = "";
  if (visualReferences.length > 0) {
      visualReferences.forEach((item, index) => {
          parts.push({ inlineData: { data: item.image, mimeType: 'image/png' } });
          const desc = item.description ? `(User Note: "${item.description}")` : "(User Note: Extract general style)";
          visualRefPrompt += `Visual Reference ${index + 1}: ${desc}.\n`;
      });
  }

  // 3. Text/Layout References (Only if text is enabled)
  let textRefPrompt = "";
  if (creativeText.includeText && textReferences.length > 0) {
      textReferences.forEach((item, index) => {
          parts.push({ inlineData: { data: item.image, mimeType: 'image/png' } });
          const desc = item.description ? `(User Note: "${item.description}")` : "(User Note: Use for font style and layout)";
          textRefPrompt += `Typography Reference ${index + 1}: ${desc}.\n`;
      });
  }

  // 4. Asset Images (Logos)
  assetImagesBase64.forEach((img) => {
    parts.push({ inlineData: { data: img, mimeType: 'image/png' } });
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
      finalPrompt += `INSTRUCTION: Synthesize the best elements (lighting, environment, color palette) of these visual references (80/20 rule). Merge them into a cohesive background composition.\n`;
  }
  
  // Optional Color Injection
  if (attributes.useMainColor && attributes.mainColor) {
      finalPrompt += `COLOR PALETTE INSTRUCTION: The primary/dominant color of the composition (background, accents, or lighting) MUST be based on this specific color: ${attributes.mainColor}. Ensure the text contrasts well against this color.\n`;
  }

  // C. TEXT RENDERING
  if (creativeText.includeText) {
    finalPrompt += `\nTEXT RENDERING INSTRUCTIONS:\n`;
    finalPrompt += `1. **MARGIN RULE (CRITICAL)**: The text area MUST preserve a minimum margin of **150px** from the TOP edge and **150px** from the BOTTOM edge of the canvas. Text should NOT touch the vertical limits.\n`;
    finalPrompt += `2. **ALIGNMENT**: Text must be **${creativeText.alignment}** aligned within its container.\n`;
    finalPrompt += `3. **STYLE**: Typography style should be: **${creativeText.style}**.\n`;
    finalPrompt += `4. **NEGATIVE PROMPT (EXTREMELY IMPORTANT)**: Do NOT write meta-labels like "Headline", "Subheadline", "Title", "CTA", "Call to Action" or "Button" on the image. ONLY render the actual text content provided inside the quotes below.\n`;
    
    finalPrompt += `\nTEXT CONTENT & COLOR SPECIFICATIONS (Only render the text inside quotes):\n`;
    if (creativeText.headline) {
        finalPrompt += ` - Text Line 1: "${creativeText.headline}". Color: ${creativeText.headlineColor || "High contrast against background"}.\n`;
    }
    if (creativeText.subheadline) {
        finalPrompt += ` - Text Line 2: "${creativeText.subheadline}". Color: ${creativeText.subheadlineColor || "Complementary to headline"}.\n`;
    }
    if (creativeText.cta) {
        finalPrompt += ` - Button/Final Text: "${creativeText.cta}". Color: ${creativeText.ctaColor || "Distinct accent color"}.\n`;
    }
    
    finalPrompt += `\nTYPOGRAPHY & LAYOUT STYLE:\n`;
    if (textReferences.length > 0) {
        finalPrompt += `Use the provided "Typography References" to determine the font family, weight, text effects (drop shadows, glow), and hierarchical layout.\n`;
        finalPrompt += `${textRefPrompt}\n`;
    } else {
        finalPrompt += `Use the requested style (${creativeText.style}). Ensure high readability against the background. Use hierarchical sizing (Headline > Subhead > CTA).\n`;
    }
    
    if (attributes.useGradient) {
        finalPrompt += `Enhance readability by adding a soft gradient or overlay behind the text area if necessary.\n`;
    }

    finalPrompt += `\nFINAL QUALITY CHECK: Ensure spelling is correct. Ensure text does not overlap the subject's face. Verify NO label names (e.g. "Headline") are written on the image, only the content.\n`;
  } else {
    // No Text Instructions
    finalPrompt += `\nNO TEXT INSTRUCTION: Do NOT generate any text, headlines, or buttons. Focus entirely on the high-end photographic composition, lighting, and integration of the subject into the background.\n`;
    finalPrompt += `Create ample negative space on the ${position === 'LEFT' ? 'RIGHT' : (position === 'RIGHT' ? 'LEFT' : 'SIDES')} for potential future text placement.\n`;
  }

  // D. ASSETS
  if (assetImagesBase64.length > 0) {
    finalPrompt += `Integrate the provided logos/assets naturally, typically in a corner or anchored position.\n`;
  }

  if (userPrompt.trim()) {
     finalPrompt += `\nAdditional Context/Scenario: ${userPrompt}\n`;
  }

  parts.push({ text: finalPrompt });

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
                return {
                    image: `data:image/png;base64,${part.inlineData.data}`,
                    finalPrompt: userPrompt || "Creative Gen" 
                };
            }
        }
    }
    
    throw new Error("No image data found in response.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate creative");
  }
};

export const refineImage = async (
    originalImageBase64: string,
    editInstructions: string,
    maskImageBase64?: string | null
  ): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const parts: any[] = [
      { inlineData: { data: originalImageBase64.split(',')[1], mimeType: 'image/png' } },
    ];

    let prompt = `Edit this image. Instructions: ${editInstructions}. Maintain original composition and text unless asked to change.`;

    if (maskImageBase64) {
        // Send mask as a second image part and instruct model to use it
        parts.push({ inlineData: { data: maskImageBase64, mimeType: 'image/png' } });
        prompt += ` \nIMPORTANT: A binary mask image has been provided (the second image). WHITE areas represent the region to edit. BLACK areas must remain unchanged. Only apply changes to the WHITE area.`;
    }

    parts.push({ text: prompt });

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: { parts },
        config: { imageConfig: { aspectRatio: "16:9", imageSize: "2K" } }, 
      });
      if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
          }
      }
      throw new Error("No image data found.");
    } catch (error: any) {
      throw new Error(error.message);
    }
  };
