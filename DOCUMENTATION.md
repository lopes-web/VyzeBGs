# Documentação Técnica - VyzeBG

## 📋 Visão Geral do Projeto

**VyzeBG** é uma aplicação web de geração e edição de imagens impulsionada por Inteligência Artificial. O projeto utiliza o modelo **Google Gemini** para geração de imagens e **Replicate** (presumivelmente, baseado no código de serviços) para funcionalidades específicas como remoção de fundo. A interface é construída com **React** e estilizada com **Tailwind CSS**, focando em uma experiência de usuário moderna, responsiva e com suporte a temas (Dark/Light).

## 🏗️ Arquitetura e Estrutura de Pastas

A estrutura do projeto segue um padrão modular típico de aplicações React com Vite:

```
VyzeBG/
├── src/                  # Código fonte principal (se houver, ou raiz)
├── components/           # Componentes React reutilizáveis e de página
│   ├── HomeHub.tsx       # Tela inicial com seleção de fluxo
│   ├── GeneratorWorkspace.tsx # Área principal de geração de imagens
│   ├── RemoveBgWorkspace.tsx  # Área dedicada à remoção de fundo
│   ├── ImageUpload.tsx   # Componente de upload com Drag & Drop
│   └── ...
├── services/             # Lógica de integração com APIs externas
│   ├── replicateService.ts # Serviço para interagir com a API Replicate/Gemini
│   └── ...
├── api/                  # Funções Serverless ou definições de API
├── lib/                  # Utilitários e configurações de bibliotecas (ex: Supabase)
├── public/               # Assets estáticos (imagens, ícones)
├── App.tsx               # Componente raiz e roteamento básico
├── main.tsx (ou index.tsx) # Ponto de entrada da aplicação
└── ...
```

## 🧩 Componentes Principais

### 1. `HomeHub.tsx`
*   **Função**: É a porta de entrada da aplicação.
*   **Features**:
    *   Apresenta 3 cards principais: Landing Pages, Designs e Remover Fundo.
    *   Permite input de prompt rápido ("Prompt-First").
    *   Gerencia a navegação para as diferentes seções da aplicação.
    *   Visual rico com gráficos CSS personalizados (Gauge, Tree, Network).

### 2. `GeneratorWorkspace.tsx`
*   **Função**: O "coração" da geração de imagens.
*   **Features**:
    *   Interface dividida em painéis (Controles à esquerda, Preview à direita).
    *   Suporta múltiplos modos: Human, Object, Infoproduto, Enhance.
    *   Permite upload de imagens de referência e elementos secundários.
    *   Integração direta com a API de geração.

### 3. `RemoveBgWorkspace.tsx`
*   **Função**: Ferramenta dedicada para remoção de fundo.
*   **Features**:
    *   Interface simplificada e focada.
    *   Visualização "Antes e Depois" ou lado a lado.
    *   Processamento instantâneo de imagens.

### 4. `ImageUpload.tsx`
*   **Função**: Componente utilitário para upload de arquivos.
*   **Features**:
    *   Suporte a Drag and Drop.
    *   Visualização de preview (thumbnail).
    *   Suporte a múltiplos arquivos.

## 🔌 Integrações e APIs

### Google Gemini API
*   Utilizada para a geração criativa de imagens a partir de prompts de texto.
*   A biblioteca `@google/genai` é usada para comunicação direta.

### Supabase
*   **Auth**: Gerenciamento de autenticação de usuários.
*   **Database**: Persistência de dados de usuários, histórico de gerações e projetos.

### Replicate (via `replicateService.ts`)
*   Utilizado para tarefas específicas de processamento de imagem, como remoção de fundo ou modelos de IA especializados não cobertos pelo Gemini.

## 🎨 Estilização e Design System

*   **Tailwind CSS**: Framework utilitário para todo o estilo.
*   **Temas**: Suporte nativo a Dark Mode (classe `dark` no HTML/Body).
*   **Glassmorphism**: Uso extensivo de fundos translúcidos (`bg-white/10`, `backdrop-blur`) para um visual moderno e "premium".
*   **Cores**:
    *   **Primary**: Lime (`#84cc16`) para ações de geração/sucesso.
    *   **Secondary**: Purple (`#a855f7`) para design/criatividade.
    *   **Accent**: Teal (`#00ca8c`) para remoção de fundo e ações rápidas.

## 🚀 Scripts Disponíveis

*   `npm run dev`: Inicia o servidor de desenvolvimento local (Vite).
*   `npm run build`: Compila a aplicação para produção na pasta `dist`.
*   `npm run preview`: Visualiza o build de produção localmente.

## 🔒 Variáveis de Ambiente

O projeto depende das seguintes variáveis no arquivo `.env`:

*   `VITE_SUPABASE_URL`: URL do projeto Supabase.
*   `VITE_SUPABASE_ANON_KEY`: Chave pública anônima do Supabase.
*   *(A API Key do Gemini é inserida pelo usuário na interface)*

---
*Documentação gerada automaticamente em 04/12/2025.*
