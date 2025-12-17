
export const MODEL_NAME = 'gemini-3-pro-image-preview'; // Mapping for "Banana 2" / Pro Image

export const DEFAULT_TREATMENT_PROMPT = 
  "Create an 8K ultra-realistic cinematic action portrait, perfectly replicating the subject's physical traits, facial expression, and overall look from the reference image.";

// Calculated dynamically in service now, but we keep a default fall back
export const DEFAULT_ASPECT_RATIO = "16:9";

export const POSITION_PROMPTS: Record<string, string> = {
  LEFT: "COMPOSITION RULE: Position the subject centered specifically between the left edge and the vertical center line (approx. at the 25% horizontal mark). The subject should NOT be touching the edge. \n\nNEGATIVE SPACE RULE: The entire RIGHT side (from center to right edge) must be kept open for text.",
  
  CENTER: "COMPOSITION RULE: Position the subject strictly in the geometric center of the image. Balance the negative space equally on both sides.",
  
  RIGHT: "COMPOSITION RULE: Position the subject centered specifically between the vertical center line and the right edge (approx. at the 75% horizontal mark). The subject should NOT be touching the edge. \n\nNEGATIVE SPACE RULE: The entire LEFT side (from left edge to center) must be kept open for text."
};
