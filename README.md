# 🚀 Leitor de Inventário 2.0 (React + Vite + Multi-Inventário)

Aplicativo profissional de inventário e leitura de códigos (QR Code, EAN-13, Code 128, Code 39) com arquitetura **React**, suporte nativo a **Multi-Inventário** (Aparelhos e Máquinas vs. Materiais e Insumos) e sincronização bidirecional em tempo real com **Google Sheets**.

---

## 🌟 Principais Funcionalidades

### 1. 📦 Modo Multi-Inventário no Mesmo App
* **Modo Aparelhos & Máquinas:**
  * Leitura e preenchimento de **Patrimônio**, **Modelo**, **Nº Série** e **EAN**.
  * Verificação em tempo real de **Divergência Cadastral** (compara Patrimônio $\leftrightarrow$ Série cadastrada no ERP).
  * Prevenção de duplicidade sonora e visual.
* **Modo Materiais & Insumos:**
  * Foco em **Código / EAN**, **Descrição do Material**, **Unidade de Medida** (`UN`, `MT`, `KG`, `CX`, `PC`, `RL`) e **Localização / Prateleira**.
  * Botões de contagem rápida para incremento instantâneo: `+1`, `+5`, `+10`, `+50`, `+100`.

### 2. ⚡ Câmera e Scanner Otimizados
* Seleção prioritária de câmera traseira (1x) evitando lentes ultrawide/desfocadas.
* Controle de lanterna (Flash nativo do celular).
* Cooldown e debounce inteligente anti-leituras duplicadas na câmera.
* Sintetizador de áudio via Web Audio API (bipe de confirmação e buzina de alerta de duplicidade).

### 3. ☁️ Sincronização em Nuvem (Google Sheets)
* Salva automaticamente na aba correta da planilha via Webhook.
* **Modo Offline Resiliente:** Se a internet oscilar no galpão, os itens ficam salvos no celular e sincronizam automaticamente ao voltar a conexão.
* **Atualização sem duplicidade:** Edições no app alteram a linha existente na planilha via timestamp.

---

## 🛠️ Como Rodar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev
```

---

## 🚀 Como Publicar na Vercel

1. Suba este projeto para um repositório no seu **GitHub** (ex: `leitor-inventario-2.0`).
2. Acesse a [Vercel](https://vercel.com) e clique em **Add New Project**.
3. Selecione o repositório do GitHub.
4. A Vercel detectará automaticamente o **Vite** e configurará o build (`npm run build`).
5. Clique em **Deploy** e seu app estará no ar com link HTTPS em menos de 1 minuto!

---

## 📄 Estrutura de Documentos

* **[ARCHITECTURE.md](./ARCHITECTURE.md):** Arquitetura de componentes e fluxo de dados do React.
* **[GOOGLE_APPS_SCRIPT.md](./GOOGLE_APPS_SCRIPT.md):** Código do Webhook para o Google Sheets com suporte a Aparelhos e Materiais.
