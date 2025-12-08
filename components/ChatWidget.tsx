
import React, { useState, useRef, useEffect } from 'react';
import { Agent, ChatMessage } from '../types';
import { sendAgentChat } from '../services/geminiService';

const AGENTS: Agent[] = [
  {
    id: 'prompt_extractor',
    name: 'Prompt Extractor',
    role: 'Technical Analyst',
    icon: 'fa-file-code',
    description: 'Extrai prompts técnicos de referências visuais.',
    systemInstruction: `FOCO NO PERSONAGEM — /personagem
Geração de prompt baseada na referência visual enviada, extraindo:
[Pose]
[Roupa e textura do tecido]
[Iluminação da cena]
[Ângulo/tipo de câmera]

Atenção: nunca deve extrair características físicas do rosto ou corpo do personagem (ex: gênero, cor de pele, cabelo, rosto).

🎞️ MODELO DE PROMPT PARA PERSONAGEM
A estrutura abaixo deve ser usada para gerar prompts com base em referência de personagem, sempre respeitando os princípios de fotografia, iluminação e narrativa visual.
🔹 Estrutura do Prompt:
Tipo de imagem – enquadramento e estilo
Ex: close-up portrait, full body shot, bird’s-eye view, worm’s-eye view

Sujeito – foco da imagem (sem características físicas pessoais)
Ex: a man wearing a hoodie, a businesswoman in a long coat

Características do sujeito – roupa, pose, expressão, acessórios
Ex: wearing a long beige coat, hands in pockets, neutral expression

Relação com o fundo – como o sujeito está posicionado no espaço
Ex: standing in front of a large window, sitting beside a futuristic table

Descrição do fundo – ambiente geral
Ex: a minimalist office with warm tones, a neon-lit urban alley

Detalhes do fundo – elementos visuais, textura, composição
Ex: scattered light particles, metallic textures, reflective floor

Interações com luz e cor – luz principal, sombra, paleta dominante
Ex: warm rim light from left, soft shadows on the background

Created using – estilo técnico e artístico
Ex: Canon EOS R5, 85mm f/1.4 lens, shallow depth of field, cinematic lighting, low saturation, soft grain

Parâmetro de proporção MidJourney
Ex: --ar 2:3, --v 5, --style cinematic

🔸 Exemplo Final:
Close-up portrait of a man wearing a wool blazer, looking down with a reflective expression, standing in front of a dark slate wall with dim ambient lighting. Soft rim light grazes the left side of his face, creating subtle shadows and skin texture. Photographed with a Sony Alpha 7R IV, 85mm f/1.4 lens, cinematic tone, shallow depth of field, realistic lighting and textile detail, film grain. --ar 2:3 --v 5 --style cinematic

Sempre seguir a estrutura abaixo:
[Sujeito Principal] [Pose ou Ação do Sujeito Principal] [Cenário/Ambiente] [Ângulo ou Perspectiva da Imagem] [Estilo da Imagem] [Adjetivos e Detalhes Físicos da Cena] [Textura e Iluminação] [Cores Específicas] [Estilos Artísticos e Eras] [Comandos de Negação] [Códigos de Realismo] [Códigos de Textura] [Estilo de Câmera] [Direção de Luz] [Foco na Qualidade: 8K, DOF, cinematic, ultra-detailed]

Exemplo:
[A man sitting at a minimalist metal desk, head slightly tilted, wearing a fitted black blazer with subtle fabric sheen, surrounded by soft ambient shadows in a dark studio space. Shot at eye-level with a 50mm lens, cinematic depth, low-key lighting from the right side, visible texture on the jacket and skin. Realistic lighting diffusion, ultra-sharp details, film grain finish, --ar 2:3 --v 5 --style cinematic]

📏 REGRAS DO AGENTE

Sempre gere prompts com base na imagem de referência enviada.
Nunca inclua características físicas de rosto, cor de pele, idade ou etnia do personagem.
O prompt deve focar em pose, roupa, iluminação, composição e estilo da imagem.
Sempre inclua o nome da câmera e lente usada na descrição técnica.
Todos os prompts devem ser gerados em INGLÊS para melhor performance nos geradores.
Ao receber uma imagem, pergunte: “Deseja extrair o personagem, o background ou uma composição completa?”
Evite explicações, comentários ou descrições fora do prompt. Apenas o texto final.
Adicione sempre os comandos finais: --ar (aspect ratio), --v 5, --style cinematic.
Adicione textura de pele, iluminação direcional e profundidade cinematográfica em todos os casos.`
  },
  {
    id: 'creative_assistant',
    name: 'Creative Assistant',
    role: 'Design Partner',
    icon: 'fa-lightbulb',
    description: 'Ajuda a ter ideias para cenários e composições.',
    systemInstruction: 'You are a creative design assistant. Help the user brainstorm concepts for landing page backgrounds. Focus on aesthetics, color psychology, and composition rules for web design (negative space for text). Be concise and professional.'
  }
];

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAgent, setActiveAgent] = useState<Agent>(AGENTS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Olá! Eu sou o ${AGENTS[0].name}. ${AGENTS[0].description}`,
      timestamp: Date.now()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleAgentChange = (agent: Agent) => {
    setActiveAgent(agent);
    setMessages([{
      id: Date.now().toString(),
      role: 'model',
      text: `Olá! Eu sou o ${agent.name}. ${agent.description}`,
      timestamp: Date.now()
    }]);
    setIsOpen(true);
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !selectedImage) || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      image: selectedImage || undefined,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setSelectedImage(null);
    setIsTyping(true);

    try {
      // Filter history for context (exclude initial welcome msg if it's generic, but keep if it's convo)
      // We pass the full conversation history to the service
      const responseText = await sendAgentChat(
        messages.filter(m => m.id !== 'welcome'), // Simple filter, can be improved
        userMsg.text,
        userMsg.image,
        activeAgent.systemInstruction
      );

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Desculpe, tive um problema ao processar sua solicitação. Verifique sua conexão ou chave de API.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">

      {/* CHAT WINDOW */}
      <div
        className={`
          pointer-events-auto bg-app-dark-lighter/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl 
          w-[400px] max-h-[600px] flex flex-col mb-4 transition-all duration-300 origin-bottom-right overflow-hidden
          ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-10 pointer-events-none hidden'}
        `}
      >
        {/* Header */}
        <div className="bg-white/5 p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-lime-500/20 flex items-center justify-center text-lime-400">
              <i className={`fas ${activeAgent.icon}`}></i>
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                {activeAgent.name}
                <i className="fas fa-chevron-down text-xs text-gray-500 cursor-pointer hover:text-white" title="Mudar Agente"></i>
                <select
                  className="absolute opacity-0 w-32 cursor-pointer"
                  onChange={(e) => {
                    const agent = AGENTS.find(a => a.id === e.target.value);
                    if (agent) handleAgentChange(agent);
                  }}
                  value={activeAgent.id}
                >
                  {AGENTS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="text-xs text-gray-400">{activeAgent.role}</div>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 bg-app-dark/20">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`
                            max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed
                            ${msg.role === 'user'
                    ? 'bg-lime-600 text-white rounded-tr-none'
                    : 'bg-app-dark-lighter text-gray-200 rounded-tl-none border border-gray-700'
                  }
                        `}
              >
                {msg.image && (
                  <img src={msg.image} alt="Upload" className="rounded-lg mb-2 max-h-40 object-cover border border-white/10" />
                )}
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-app-dark-lighter rounded-2xl rounded-tl-none p-3 border border-gray-700">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white/5 border-t border-white/5">
          {selectedImage && (
            <div className="flex items-center gap-2 mb-2 bg-app-dark/30 p-2 rounded-lg">
              <img src={selectedImage} alt="Selected" className="h-10 w-10 object-cover rounded" />
              <span className="text-xs text-gray-400 flex-1 truncate">Imagem selecionada</span>
              <button onClick={() => setSelectedImage(null)} className="text-red-400 hover:text-red-300">
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-lime-400 p-2 transition-colors"
            >
              <i className="fas fa-paperclip"></i>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-app-dark/40 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white focus:border-lime-500 outline-none resize-none h-10 scrollbar-hide"
            />
            <button
              onClick={handleSendMessage}
              disabled={(!inputText.trim() && !selectedImage) || isTyping}
              className="bg-lime-500 text-black rounded-xl w-10 h-10 flex items-center justify-center hover:bg-lime-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>

      {/* TOGGLE BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
            pointer-events-auto w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300
            ${isOpen ? 'bg-app-dark-lighter text-white rotate-90' : 'bg-gradient-to-br from-lime-400 to-lime-600 text-black hover:scale-110'}
        `}
      >
        {isOpen ? <i className="fas fa-times text-xl"></i> : <i className="fas fa-comments text-2xl"></i>}
      </button>

    </div>
  );
};

export default ChatWidget;
