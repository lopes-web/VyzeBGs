# VyzeBG - Gerador de Assets com IA

VyzeBG é uma aplicação web moderna e intuitiva projetada para criar backgrounds, assets gráficos e designs utilizando o poder da Inteligência Artificial (Google Gemini). Focada em agilidade e qualidade visual, a ferramenta oferece fluxos de trabalho otimizados para Landing Pages, Infoprodutos e Design Gráfico.

## 🚀 Funcionalidades Principais

### 🏠 Home Hub (Novo)
- **Interface Prompt-First**: Digite sua ideia imediatamente na tela inicial.
- **Upload de Referência Rápido**: Adicione uma imagem de referência diretamente na barra de prompt.
- **Automação Inteligente**: Ao submeter um prompt do Hub, a geração inicia automaticamente no Workspace com todas as configurações aplicadas.
- **Seleção de Modos**: Escolha entre Landing Pages ou Designs e configure o modo do gerador (Pessoa, Objeto, etc.) antes mesmo de entrar no workspace.

### 🎨 Generator Workspace
- **Múltiplos Modos de Geração**:
  - **Pessoa (Human)**: Ideal para retratos e especialistas.
  - **Objeto (Object)**: Focado em produtos e cenas clean.
  - **Infoproduto**: Otimizado para capas de cursos e materiais educativos.
  - **Enhance**: Melhora e refina imagens existentes.
- **Controles Avançados**: Ajuste de dimensões, paleta de cores, posição do sujeito e atributos (Blur, Gradiente).
- **Upload de Elementos Secundários**: Adicione múltiplos assets para compor a cena.

### 🌗 Aparência e Usabilidade
- **Light/Dark Mode**: Tema totalmente adaptável para conforto visual em qualquer ambiente.
- **Histórico Local e Global**: Salve suas gerações e acesse o histórico de projetos anteriores.
- **Gestão de Projetos**: Organize suas criações em abas separadas.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, Vite
- **Estilização**: Tailwind CSS (com suporte a Dark Mode)
- **IA Generativa**: Google Gemini API (`@google/genai`)
- **Backend/Database**: Supabase (Autenticação e Banco de Dados)
- **Ícones**: FontAwesome

## ⚙️ Configuração e Instalação

1.  **Clone o repositório**
    ```bash
    git clone https://github.com/lopes-web/VyzeBGs.git
    cd VyzeBGs
    ```

2.  **Instale as dependências**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente**
    Crie um arquivo `.env` na raiz do projeto com as seguintes chaves:
    ```env
    VITE_SUPABASE_URL=sua_url_supabase
    VITE_SUPABASE_ANON_KEY=sua_chave_anonima_supabase
    ```
    *Nota: A API Key do Gemini é configurada pelo usuário diretamente na interface da aplicação.*

4.  **Inicie o servidor de desenvolvimento**
    ```bash
    npm run dev
    ```

## 📦 Deploy

O projeto está configurado para deploy na Vercel ou qualquer host estático.
Para gerar o build de produção:

```bash
npm run build
```

Os arquivos estáticos serão gerados na pasta `dist`.

## 📝 Como Usar

1.  **Login**: Acesse com suas credenciais (via Supabase Auth).
2.  **API Key**: Insira sua chave da API do Google Gemini (será salva localmente).
3.  **Home Hub**:
    - Digite o que deseja criar (ex: "Escritório minimalista com luz natural").
    - (Opcional) Selecione o modo (Landing Page ou Design).
    - (Opcional) Faça upload de uma imagem de referência.
    - Pressione **Enter**.
4.  **Workspace**: Acompanhe a geração automática e refine o resultado usando os controles laterais.

---

Desenvolvido por **Lopes Web**
