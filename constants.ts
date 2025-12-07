

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