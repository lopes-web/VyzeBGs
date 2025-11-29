

export const MODEL_NAME = 'gemini-3-pro-image-preview'; 

export const DEFAULT_TREATMENT_PROMPT = 
  "Create an 8K ultra-realistic cinematic action portrait, perfectly replicating the subject's physical traits, facial expression, and overall look from the reference image.";

export const OBJECT_TREATMENT_PROMPT = 
  "Create an 8K ultra-realistic product photography shot. CRITICAL: Perfectly replicate the object's geometry, materials, textures, labels, and lighting response. The object should look tangible and integrated into the environment with ray-traced lighting quality.";

export const ENHANCE_TREATMENT_PROMPT = 
  "TASK: ENHANCE AND RICHEN THE ORIGINAL IMAGE. \nCRITICAL: \nGOAL: Redraw the image in 8K resolution, significantly improving texture quality, lighting realism, and color grading. Integrate any requested assets or style references seamlessly WITHOUT changing the underlying structure of the original image.";

export const INFOPRODUCT_TREATMENT_PROMPT = `

 Create an 8K ultra-realistic cinematic action portrait, perfectly replicating the subject's physical traits, facial expression, and overall look from the reference image

---
`;

export const DEFAULT_ASPECT_RATIO = "16:9";

export const POSITION_PROMPTS: Record<string, string> = {
  LEFT: "COMPOSITION RULE: Position the subject centered specifically between the left edge and the vertical center line (approx. at the 25% horizontal mark). The subject should NOT be touching the edge. \n\nNEGATIVE SPACE RULE: The entire RIGHT side (from center to right edge) must be kept open for text.",
  
  CENTER: "COMPOSITION RULE: Position the subject strictly in the geometric center of the image. Balance the negative space equally on both sides.",
  
  RIGHT: "COMPOSITION RULE: Position the subject centered specifically between the vertical center line and the right edge (approx. at the 75% horizontal mark). The subject should NOT be touching the edge. \n\nNEGATIVE SPACE RULE: The entire LEFT side (from left edge to center) must be kept open for text."
};

export const GRADIENT_PROMPT = 
  "BLENDING ATTRIBUTE: Apply a soft, seamless GRADIENT FADE on the negative space side. The gradient should use the DOMINANT BACKGROUND COLOR to fade out any complex details, ensuring maximum text readability.";

export const BLUR_PROMPT = 
  "DEPTH ATTRIBUTE (RACK FOCUS): First, render the entire image with full sharp details. THEN, overlay a subtle GRADIENT BLUR (Rack Focus effect) that is heaviest on the negative space edge and gradually fades to 0% blur towards the center/subject. The subject must remain 100% sharp. The blur acts as a background softening layer for text overlay.";