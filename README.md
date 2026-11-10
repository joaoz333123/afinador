# 🪕 Afinador de Viola Caipira (10 Cordas)

> Plataforma online gratuita e responsiva para afinação de viola de 10 cordas (Viola Caipira) com captação direta pelo microfone via **Web Audio API**.

🌐 **Acesse online:** [https://afinador-ebon.vercel.app](https://afinador-ebon.vercel.app)

---

## 🎵 Características e Funcionalidades

- **Captação por Microfone em Tempo Real:** Detecção de frequência fundamental via **Autocorrelação com Interpolação Parabólica**, sem enviar áudio para servidores (100% no navegador, latência zero).
- **Distinção de Cordas Oitavadas:** Suporte completo para afinar individualmente as cordas dos pares oitavados (3º, 4º e 5º pares), diferenciando a **requinta** (corda fina/aguda) do **bordão** (corda grossa/grave).
- **Afinações Tradicionais Pré-Configuradas:**
  - **Cebolão em Mi** (`E4 E4`, `B3 B3`, `G#4 G#3`, `E4 E3`, `B3 B2`)
  - **Cebolão em Ré** (`D4 D4`, `A3 A3`, `F#4 F#3`, `D4 D3`, `A3 A2`)
  - **Rio Abaixo** (`D4 D4`, `B3 B3`, `G4 G3`, `D4 D3`, `G3 G2`)
  - **Boiadeira** (`D4 D4`, `A3 A3`, `F#4 F#3`, `D4 D3`, `G3 G2`)
  - **Natural / Maior** (`E4 E4`, `B3 B3`, `G#4 G#3`, `E4 E3`, `E3 E2`)
- **Mão da Viola Interativa (Cravelhal):** Ilustração vetorial SVG com as 10 cravelhas clicáveis para selecionar e travar na corda desejada.
- **Tons de Referência:** Gerador acústico sintetizado para afinar de ouvido.
- **Filtro de Ruído (Noise Gate) & Calibração A4:** Sensibilidade do microfone ajustável e calibração de frequência do Lá central (430 a 450 Hz, padrão 440 Hz).

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn

### Instalação e Execução
```bash
# Clone o repositório
git clone https://github.com/joaoz333123/afinador.git
cd afinador

# Instale as dependências
npm install

# Inicie o servidor local de desenvolvimento
npm run dev
```

Abra o navegador em `http://localhost:5173`.

### Build de Produção
```bash
npm run build
```
Os arquivos otimizados serão gerados na pasta `dist/`.

---

## 🛠️ Tecnologias Utilizadas

- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Web Audio API](https://developer.mozilla.org/pt-BR/docs/Web/API/Web_Audio_API)
- [Lucide Icons](https://lucide.dev/)
- [Canvas Confetti](https://www.kirilv.com/canvas-confetti/)
- [Vercel](https://vercel.com/) (Hospedagem com HTTPS)
