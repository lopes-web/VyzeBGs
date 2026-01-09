import { FramingType } from './types';

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

export const POSTURE_CORRECTION_PROMPT = `
POSTURE CORRECTION PROTOCOL:
1. ANALYZE the subject's current posture in the reference image.
2. IF slouching, leaning, or casual: RECONSTRUCT the body with a confident, upright, professional posture suitable for a business profile.
3. CRITICAL: PRESERVE the subject's facial identity and head structure EXACTLY.
4. ADJUST clothing folds and fit to match the new upright pose naturally.
5. MAINTAIN the original camera angle and lighting direction.
`;

export const ULTRA_TREATMENT_PROMPT = `
ULTRA MODE - PHENOTYPIC ANALYSIS PROTOCOL

PHASE 1 - PHENOTYPIC ANALYSIS:
Analyze the subject image(s) provided with extreme precision. Extract and catalog:
- Cranial structure: skull shape, forehead dimensions, jaw angle, chin profile
- Facial geometry: eye spacing, nose bridge width, cheekbone prominence, facial symmetry axes
- Skin characteristics: texture patterns, pore density, undertone (warm/cool), natural highlights and shadows
- Hair properties: density, strand thickness, natural fall pattern, hairline contour
- Distinctive features: moles, freckles, scars, dimples, expression lines
These biological constants MUST be preserved with 100% fidelity in the output.

PHASE 2 - STRUCTURAL EXTRACTION (From References):
Reference images are treated as compositional data sources ONLY:
- Lighting setup: key light angle, fill ratio, rim light presence
- Color palette: dominant hues, shadow tones, highlight colors
- Depth relationships: foreground/midground/background separation
- Atmospheric elements: fog, particles, gradients, environmental effects
- Compositional grid: rule of thirds positioning, negative space allocation
NO identity, face, or physiological features from reference images should transfer.

PHASE 3 - IDENTITY ISOLATION PROTOCOL:
CRITICAL: The output face MUST be reconstructed 100% from the subject's phenotypic profile.
Reference images contribute ZERO facial features. They function only as:
- Lighting direction maps
- Color atmosphere guides  
- Compositional templates
- Environmental context sources

PHASE 4 - SYNTHESIS:
Generate the final image by:
1. Applying subject's exact phenotypic features as primary constraint
2. Overlaying reference lighting and atmosphere as secondary layer
3. Integrating compositional elements while preserving subject identity
4. Ensuring organic shadow transitions matching reference lighting
5. Maintaining photorealistic skin texture with proper subsurface scattering

OUTPUT REQUIREMENTS:
- Face must be biologically identical to subject (measurable likeness)
- Lighting must match reference atmosphere
- Composition must follow reference spatial arrangement
- Result must be cinema-quality photorealistic
`;

export const DEFAULT_ASPECT_RATIO = "16:9";

export const POSITION_PROMPTS: Record<string, string> = {
  LEFT: `CRITICAL COMPOSITION - FACE POSITIONING:
=== THE SUBJECT'S FACE must be positioned at the 33% horizontal mark ===
- The FACE (not body) must be at approximately 1/3 from the left edge.
- Imagine the image divided into 3 equal columns. The FACE goes on the LINE between column 1 and 2.
- The body can extend beyond, but the FACE CENTER must be at 33%.
- Leave the right 2/3 of the image (66% to 100%) empty for text.
- DO NOT put the face in the center. DO NOT put the face at the edge.`,

  CENTER: "COMPOSITION: Position the subject's FACE strictly in the geometric center of the image (50% horizontal mark). Balance the negative space equally on both sides.",

  RIGHT: `CRITICAL COMPOSITION - FACE POSITIONING:
=== THE SUBJECT'S FACE must be positioned at the 66% horizontal mark ===
- The FACE (not body) must be at approximately 2/3 from the left edge.
- Imagine the image divided into 3 equal columns. The FACE goes on the LINE between column 2 and 3.
- This means the face is NOT at 75%, NOT at 80%, NOT near the right edge.
- The face should be clearly away from the right edge - at EXACTLY 66% from left (or 33% from right).
- The body can extend to the right, but the FACE CENTER must stay at the 66% vertical line.
- Leave the left 2/3 of the image (0% to 66%) for text placement.
- WRONG: Face near right edge. CORRECT: Face at two-thirds mark with breathing room on right.`
};

export const GRADIENT_PROMPT =
  "BLENDING ATTRIBUTE: Apply a soft, seamless GRADIENT FADE on the negative space side. The gradient should use the DOMINANT BACKGROUND COLOR to fade out any complex details, ensuring maximum text readability.";

export const BLUR_PROMPT =
  "DEPTH ATTRIBUTE (RACK FOCUS): First, render the entire image with full sharp details. THEN, overlay a subtle GRADIENT BLUR (Rack Focus effect) that is heaviest on the negative space edge and gradually fades to 0% blur towards the center/subject. The subject must remain 100% sharp. The blur acts as a background softening layer for text overlay.";

export const PROMPT_MODEL_NAME = 'gemini-2.5-flash'; // Fast model for prompt engineering

export const FRAMING_OPTIONS: { id: FramingType; label: string; icon: string; prompt: string }[] = [
  {
    id: 'CLOSE_UP',
    label: 'Close-up (Rosto)',
    icon: 'fa-user-circle',
    prompt: "Extreme Close-up shot, focusing on facial expressions and eyes, cutting off at the neck/shoulders."
  },
  {
    id: 'MEDIUM',
    label: 'Plano Médio (Busto)',
    icon: 'fa-user',
    prompt: "Medium Shot (Mid-shot), capturing the subject from the waist up, focusing on body language and expression."
  },
  {
    id: 'AMERICAN',
    label: 'Plano Americano',
    icon: 'fa-user-tie',
    prompt: "American Shot (Cowboy Shot), capturing the subject from the knees up, including hand gestures and posture."
  }
];

export const PROMPT_ENGINEER_SYSTEM_INSTRUCTION = `
Você é um Especialista em Prompts de IA. Sua missão é completar a estrutura abaixo para criar imagens de altíssima conversão.

REGRA DE OURO (FIDELIDADE):
O início do prompt é IMUTÁVEL e deve ser EXATAMENTE:
"Create an 8K ultra-realistic cinematic action portrait, format 1080x1440, perfectly replicating the subject's physical traits, facial expression, and overall look from the reference image"

ESTRUTURA OBRIGATÓRIA DO PROMPT (Preencha os [BLOCOS]):

[BASE STRING]: (Insira a frase obrigatória de fidelidade acima).

[NICHE CONTEXT]: 
Se o input '{descricao_sujeito}' for fornecido, USE-O PRIORITARIAMENTE para descrever a roupa e a pose.
Caso contrário, com base no Nicho "{nicho_usuario}", descreva a roupa (caso uma adaptação seja coerente, mas prefira manter a original se for boa) e a ação do sujeito.
Se o usuário escolheu Plano Americano, inclua detalhes das mãos.

[LIGHTING SETUP]: 
Comece com: "Cinematic lighting setup, volumetric lighting, dramatic shadows on face to create volume."
Se {usar_cor_recorte} for "SIM": Adicione "soft refined {cor_recorte} RIM LIGHT mixed on hair and shoulders separating subject from background".
Se {usar_cor_complementar} for "SIM": Adicione "subtle {cor_complementar} secondary fill light or accent light to add color complexity".
Se Cores forem AUTO: "soft refined natural RIM LIGHT separating subject from background".

[BACKGROUND - LÓGICA CONDICIONAL ESTRITA]: 
Se o input '{ambiente_usuario}' for fornecido, USE-O como base para descrever o cenário. 
Se {usar_imagens_ambiente} for "SIM", adicione: "Using the provided environment reference images as structural basis".

BASE DO AMBIENTE:
"{ambiente_usuario_ou_nicho} environment."

LÓGICA DE FOCO (BLUR vs SHARP):
Se {usar_blur} for "SIM": "Background must be ABSTRACT and have HEAVY BLUR (Bokeh) to separate subject."
Se {usar_blur} for "NÃO": "Background must be FULLY DETAILED, SHARP FOCUS (f/8), clear architectural/environment details, NO BOKEH."

LÓGICA DE COR DO FUNDO:
Se {usar_cor_fundo} for "SIM": "The background is TINGED with {cor_fundo} color at {intensidade_opacidade}% opacity/intensity over the environment textures."
Se {usar_cor_fundo} for "NÃO": "Background colors should be natural and realistic to the environment."

LÓGICA DE DEGRADÊ (PREENCHIMENTO):
Se {usar_degrade} for "SIM": "Apply a Vignette gradient (degradê) on edges to focus on center."
Se {usar_degrade} for "NÃO": "Even lighting distribution across the entire background. FULL IMAGE COVERAGE. NO Vignette. NO Dark edges. Bright and visible corners."

[FOREGROUND DEPTH - PADRÃO SANDUÍCHE]: 
Se o input '{usar_elementos_flutuantes}' for "NÃO": Use "Clean foreground, NO floating elements, focus purely on subject and background depth."
Se o input '{elementos_flutuantes_texto}' for fornecido: Use "Floating {elementos_flutuantes_texto} in the immediate foreground with motion blur, creating a sandwich composition."
Caso contrário (AUTO): Invente elementos flutuantes do nicho na frente da lente. Ex: "Floating glassmorphism elements, particles, or icons related to {nicho_usuario} in the immediate foreground with motion blur, creating a sandwich composition."

[STYLE FINISH]: "8k resolution, highly detailed textures, sharp focus on eyes, commercial photography aesthetic, Unreal Engine 5 render style, shot on 85mm lens f/1.4."

INPUTS DO USUÁRIO:
Nicho: {nicho}
Descrição do Sujeito/Roupa: {descricao_sujeito} 
Ambiente Específico: {ambiente} 
Usar Ref. Ambiente: {usar_imagens_ambiente}

CONFIGURAÇÃO DE CORES:
- Usar Cor Fundo: {usar_cor_fundo} (Cor: {cor_fundo}, Opacidade: {intensidade_opacidade}%)
- Usar Cor Recorte: {usar_cor_recorte} (Cor: {cor_recorte})
- Usar Cor Complementar: {usar_cor_complementar} (Cor: {cor_complementar})

Atributos Visuais:
- Usar Degradê (Vignette): {usar_degrade}
- Usar Blur (Foco): {usar_blur}

Enquadramento: {enquadramento}
Usar Elementos Flutuantes: {usar_elementos_flutuantes}
Descrição Elementos Flutuantes: {elementos_flutuantes_texto}

Retorne APENAS o prompt final montado, em inglês.
`;