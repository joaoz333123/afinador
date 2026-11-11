# 🪕 Afinador de Viola Caipira Online

> Afinador cromático online para **Viola Caipira de 10 cordas**, com captação direta via Web Audio API e mecânica de ponteiro inspirada no *Google Guitar Tuner*.

🌐 **App Online:** [afinador-ebon.vercel.app](https://afinador-ebon.vercel.app)

---

## ⚡ Principais Recursos

* **Relógio Cromático 360°:** Mostrador circular com as 12 notas da escala e destaque para o acorde da afinação ativa da viola.
* **Movimentação Suave (Google Damping):** Amortecimento contínuo pelo caminho angular mais curto, sem tremores ou saltos bruscos do ponteiro.
* **Detecção por Ataque (*Onset-Gated*):** Seleção inteligente da corda no impacto da palhetada com trava firme durante a sustentação (elimina a oscilação entre harmônicos).
* **Suporte Completo a Cordas Oitavadas:** Afinação individual e precisa de **Bordão** (grave) e **Requinta** (aguda) nos pares 3, 4 e 5.
* **Cravelhal Interativo (Mão da Viola):** Cabeçote com as 10 cravelhas clicáveis para seleção direta e feedback visual de afinação.
* **Tons de Referência:** Síntese de áudio limpa para afinação de ouvido.
* **Ajustes Avançados:** Calibração do $A4$ ($430\text{--}450\text{ Hz}$) e controle de sensibilidade (*Noise Gate*).

---

## 🎶 Afinações Disponíveis

| Afinação | Notas dos 5 Pares (1º ao 5º) | Acorde |
| :--- | :--- | :--- |
| **Cebolão em Mi** | `E4/E4` • `B3/B3` • `G#4/G#3` • `E4/E3` • `B3/B2` | Mi Maior ($E$) |
| **Cebolão em Ré** | `D4/D4` • `A3/A3` • `F#4/F#3` • `D4/D3` • `A3/A2` | Ré Maior ($D$) |
| **Rio Abaixo** | `D4/D4` • `B3/B3` • `G4/G3` • `D4/D3` • `G3/G2` | Sol Maior ($G$) |
| **Boiadeira** | `D4/D4` • `A3/A3` • `F#4/F#3` • `D4/D3` • `G3/G2` | Sol Maior modal |
| **Natural / Maior** | `E4/E4` • `B3/B3` • `G#4/G#3` • `E4/E3` • `E3/E2` | Mi Maior |

---

## 🚀 Como Executar Localmente

```bash
# 1. Clonar o projeto
git clone https://github.com/joaoz333123/afinador.git
cd afinador

# 2. Instalar dependências
npm install

# 3. Rodar localmente
npm run dev
```

Acesse em seu navegador: `http://localhost:5173`

Para gerar a versão de produção otimizada:
```bash
npm run build
```

---

## 🛠️ Tecnologias

* **Frontend:** React 18, TypeScript, Tailwind CSS, Vite.
* **Processamento de Áudio:** Web Audio API, McLeod Pitch Method (NSDF) com interpolação parabólica.
* **Design & Animação:** SVG Dinâmico, Lucide Icons, Canvas Confetti.
* **Deploy:** Vercel (HTTPS obrigatório para acesso ao microfone).
