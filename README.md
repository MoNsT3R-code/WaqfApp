# WaqfApp

WaqfApp is a demo of a Pakistani mobile-wallet app: send money, pay bills, top up a phone, book Lahore restaurants, hotels and flights in PKR, and keep a monthly spending plan that protects your savings. A help assistant built with LangChain and LangGraph answers from the app's own FAQ and security policies. It needs no API key.

![React 19](https://img.shields.io/badge/Frontend-React%2019-blue?logo=react&logoColor=white)
![Vite 6](https://img.shields.io/badge/Build-Vite%206-646cff?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Backend-Express-black?logo=express&logoColor=white)
![LangGraph](https://img.shields.io/badge/Agents-LangChain%20%2B%20LangGraph-1c3c3c)
![Motion](https://img.shields.io/badge/UI-Motion-ff0055)
![Currency](https://img.shields.io/badge/Currency-PKR-brightgreen)

> **This is a demo.** The money is simulated, everything is kept in memory and is lost when the server restarts, and you sign in as a guest. Don't put real financial details into it.

---

## 📍 Quick Navigation

* [✨ Features](#-features)
* [📦 Architecture](#-architecture)
* [🚀 Getting Started](#-getting-started)
* [⚙️ Configuration](#️-configuration)
* [📜 Scripts](#-scripts)
* [🤖 Assistant and Knowledge Base](#-assistant-and-knowledge-base)
* [🛡️ Security Model](#️-security-model)
* [🔗 BreachMirror AI](#-breachmirror-ai)
* [🔌 API Reference](#-api-reference)
* [📁 Repository Structure](#-repository-structure)
* [🛠️ Tech Stack](#️-tech-stack)
* [⚠️ Limitations](#️-limitations)
* [📷 Photo Credits](#-photo-credits)

---

## ✨ Features

### 💸 Wallet
* **Send Money, Bills and Mobile Load.** Before you pay, each one shows what the payment does to this month's budget, for example "Over budget by PKR 5,000".
* **Quick Loan.** A fixed PKR 15,000 advance. The app suggests using your savings first.
* **Money History.** Charts of income and spending by category, built with Recharts.
* Payments that move money ask for a **4-digit PIN**.

### 🐷 Smart Spend & Save
This is based on the *Smart Spend & Save* prototype.
* **Monthly split.** At the start of a month you say what you earn and how much of it you can spend (60% by default). The rest is set aside as savings.
* **Budget warnings.** You see the daily pace you can spend at, a check before each purchase, and warnings at 75% and 100% of the budget.
* **Limit decision.** When a payment would go over the budget, a guided step lets you review what you spent, then either cover the overspend from savings or stop. It's built as a LangGraph flow that pauses for your answer, and moving savings needs your PIN.

### 🍽️ Lahore Marketplace
* **Food.** Five popular Lahore restaurants (Butt Karahi, Bundu Khan, Cosa Nostra, Johnny & Jugnu, Haveli) with full menus in the style of foodpanda, a basket, and checkout.
* **Travel.** Five hotels, five flights from Lahore (LHE to Karachi, Quetta, Dubai, Istanbul and Jeddah) and two packages (an Umrah trip and a Jeddah business stay), all priced in PKR.
* **Server-side prices.** The browser sends only item ids and quantities. The server works out every price and total.

### 🎞️ Interface
* Cover photos, cards that animate into the cart as you add items, a ripple loading indicator, and screen transitions, all with [Motion](https://motion.dev).
* An animated Three.js background.
* English, Urdu and Arabic, including right-to-left layout.
* Light and dark themes.

### 🛡️ Security Center
* Shows whether BreachMirror AI is running, your own audit log with a check that the log hasn't been altered, and the rules the app enforces.

---

## 📦 Architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│  React 19 · Tailwind v4 · Motion · Recharts · Three.js           │
│  Dashboard · Food · Travel · Savings · Money History · Security  │
└───────────────────────────────┬──────────────────────────────────┘
                                │  /api  (JWT guest session)
┌───────────────────────────────▼──────────────────────────────────┐
│  Express (server.ts) with Vite in middleware mode during dev     │
├──────────────┬───────────────┬────────────────┬──────────────────┤
│ Marketplace  │ Smart Spend & │ Security       │ Agents           │
│ shared/      │ Save          │ server/        │ server/agent/    │
│ marketplace  │ server/plan/  │ security/      │ LangGraph RAG    │
│ cart, orders,│ budget maths, │ PIN (scrypt),  │ over docs/faq    │
│ bookings     │ decision graph│ audit chain,   │ and docs/policies│
│              │               │ chat guard     │                  │
└──────────────┴───────────────┴────────┬───────┴──────────────────┘
                                        │ GET /local-api/health
                              ┌─────────▼──────────┐
                              │  BreachMirror AI   │  (optional, separate app)
                              └────────────────────┘
```

All state lives in memory in the server process: users, transactions, carts, plans and audit entries.

---

## 🚀 Getting Started

### Requirements
* **Node.js 22.** The project is tested on 22.14. Use 20 or later.
* About **500 MB of disk** for the local embedding model. It downloads the first time the server starts and is then cached.
* *Optional:* [Ollama](https://ollama.com) if you want answers written by a local language model.
* *Optional:* Python 3 with `reportlab`, to rebuild the FAQ PDF.

### Run it

```bash
git clone https://github.com/MoNsT3R-code/WaqfApp.git
cd WaqfApp
npm install
cp .env.example .env   # optional, every setting has a default
npm run dev
```

Open <http://localhost:3000>. You're signed in as a guest automatically. The demo PIN is **2580**, or whatever you set as `WAQF_DEMO_PIN`.

On the first start the server downloads the embedding model and indexes the FAQ. This takes up to a minute, and the assistant answers once it's ready.

> **Windows:** if the clone fails with "Filename too long", run `git config --global core.longpaths true` first. If the model fails to load from a deep folder, set `MODELS_CACHE_DIR` to a short path such as `C:\models`.

### Production

```bash
npm run build
NODE_ENV=production npx tsx server.ts
```

`npm run build` writes the frontend to `dist/`. With `NODE_ENV=production`, the server serves `dist/` instead of starting Vite.

---

## ⚙️ Configuration

Every variable is optional. They're read from the environment or from a `.env` file.

| Variable | Default | What it does |
| :--- | :--- | :--- |
| `PORT` | `3000` | HTTP port. Vite's hot-reload socket uses `PORT + 21678`. |
| `JWT_SECRET` | a built-in demo value | Key that signs session tokens. **Set this in any shared deployment.** |
| `WAQF_DEMO_PIN` | `2580` | PIN that confirms transfers, loans and moves from savings. |
| `AUDIT_KEY` | random on each start | HMAC key for the audit chain. Set it if you want signatures to stay the same across restarts. |
| `BREACHMIRROR_URL` | `http://localhost:3000` | Where BreachMirror AI is running. See [BreachMirror AI](#-breachmirror-ai). |
| `EMBEDDINGS_MODEL` | `Xenova/paraphrase-multilingual-MiniLM-L12-v2` | Embedding model used for FAQ search. It runs locally through Transformers.js. |
| `MODELS_CACHE_DIR` | `~/.cache/waqfapp/models` | Where downloaded models are stored. |
| `OLLAMA_MODEL` | *(none)* | For example `llama3.2:3b`. When set, Ollama writes the answers. Without it, the assistant quotes the FAQ. |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server address. |
| `DISABLE_HMR` | `false` | Set it to `true` to turn off hot reload. |
| `NODE_ENV` | *(none)* | Set it to `production` to serve the built `dist/`. |

---

## 📜 Scripts

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Starts the server and the frontend with hot reload (`tsx server.ts`). |
| `npm run build` | Builds the frontend into `dist/`. |
| `npm run preview` | Previews the built frontend with Vite. The frontend alone has no API. |
| `npm run lint` | Type-checks the project (`tsc --noEmit`). |
| `npm run clean` | Deletes `dist/`. |
| `npm run faq:pdf` | Rebuilds `docs/WaqfApp-FAQ.pdf` from `docs/faq/*.md`. |
| `npm run policies:import -- <path-to-BreachMirror-AI>` | Imports BreachMirror's IT security policy and code of conduct into `docs/policies/`. Instead of the path argument, you can set `BREACHMIRROR_DIR`. |

---

## 🤖 Assistant and Knowledge Base

The **Help Center assistant** and the **Money Helper** are LangGraph agents that run on the server, in `server/agent/`. They don't call any external AI API.

* **Knowledge base**
  * The FAQ is in `docs/faq/` (10 files, 280 questions).
  * The BreachMirror policies are in `docs/policies/` (57 entries).
  * The full FAQ is also published as a 63-page PDF, [`docs/WaqfApp-FAQ.pdf`](docs/WaqfApp-FAQ.pdf).
* **Search** combines multilingual embeddings with BM25 keyword matching, so a question in Urdu or Arabic can find an English answer.
* **Support graph:** `guard → refuse | contextualize → retrieve → grade → generate | fallback`.
  * The guard turns away prompt-injection attempts and removes PINs, card numbers and passwords from messages before anything else sees them.
  * When nothing relevant is found, the assistant offers an escalation link instead of guessing.
  * Answers list their sources.
* **Advisor graph:** `analyze → retrieve → advise`. It works from the signed-in account's own transactions.
* **Ollama (optional):** set `OLLAMA_MODEL`, and the local model writes the answer in the selected language, using only what was retrieved.

To change what the assistant knows, edit the Markdown in `docs/faq/` or `docs/policies/` and restart the server.

---

## 🛡️ Security Model

What the demo actually enforces:

* **PIN for moving money.**
  * Transfers, Quick Loan and moves from savings need the PIN, which is checked against an scrypt hash.
  * After three wrong tries, PIN actions are paused.
  * Each confirmed request can only be used once, so a repeated request can't be replayed.
* **Prices on the server.** Cart, food and booking totals come from the server's catalogue. Prices the client sends are ignored, and quantities are capped.
* **Audit log.** Payments, money in, budget warnings, decisions, wrong PINs and removed secrets are written to a log for each user. Each entry is signed with HMAC-SHA256 and linked to the previous one, so if anything is changed, the Security Center reports where the chain breaks.
* **Chat guard.** It refuses prompt injection and removes secrets from chat messages before retrieval or logging.
* **Sessions.** Guest JWTs. The author of a review always comes from the session, never from the request body.

---

## 🔗 BreachMirror AI

[BreachMirror AI](https://github.com/MoNsT3R-code/BreachMirror-AI) is a separate security-awareness app. WaqfApp works with it in two ways:

1. **Policies.** Its IT security policy and code of conduct are imported into `docs/policies/`, so the assistant can answer security questions and cite them.
2. **Live status.** The Security Center reads BreachMirror's public `/local-api/health` endpoint, which shows whether it's online and whether its audit chain is intact, and links to it. BreachMirror's policy API needs a BreachMirror session, so WaqfApp doesn't send questions to it.

Both apps use port 3000 by default, so run one of them on a different port. For example, start BreachMirror on 3000 and WaqfApp with:

```bash
PORT=3001 BREACHMIRROR_URL=http://localhost:3000 npm run dev
```

If BreachMirror isn't running, the Security Center says so and everything else keeps working.

---

## 🔌 API Reference

Every route except guest sign-in and reading reviews needs `Authorization: Bearer <token>`.

| Area | Routes |
| :--- | :--- |
| Session | `POST /api/auth/guest` · `GET /api/user/profile` · `DELETE /api/user/account` |
| Wallet | `GET /api/dashboard/summary` · `GET /api/transactions` · `POST /api/transactions/add` · `POST /api/transactions/transfer` 🔑 · `POST /api/bills/pay` · `POST /api/mobile/load` · `POST /api/loans/readycash` 🔑 |
| Marketplace | `GET /api/marketplace` · `GET /api/cart` · `POST /api/cart/add` · `PUT /api/cart/update` · `POST /api/cart/remove` · `POST /api/cart/checkout` · `POST /api/food/order` · `POST /api/bookings/hotel` · `POST /api/bookings/flight` · `POST /api/bookings/package` |
| Smart Spend & Save | `GET /api/plan` · `POST /api/plan/start` · `PUT /api/plan/settings` · `POST /api/plan/check` · `POST /api/plan/impact` · `POST /api/plan/preview-move` · `POST /api/plan/move` 🔑 · `POST /api/plan/respond` 🔑 (when confirming) |
| Security | `GET /api/security/audit` · `GET /api/security/breachmirror` |
| Agents | `GET /api/agent/status` · `POST /api/agent/chat` · `POST /api/agent/advisor` |
| Reviews | `GET /api/feedback` · `POST /api/feedback` · `PUT /api/feedback/:id` |

🔑 means the route needs the PIN. Payment routes also return the updated budget, so the interface can show the effect right away.

---

## 📁 Repository Structure

```text
server.ts                  Express app, routes, Vite middleware
server/
  agent/                   knowledge.ts (hybrid search) · supportGraph.ts · advisorGraph.ts · llm.ts · index.ts
  plan/                    budget.ts (budget maths) · decisionGraph.ts (LangGraph with interrupts) · service.ts
  security/                pin.ts · audit.ts · guard.ts
  integrations/            breachmirror.ts
shared/
  marketplace.ts           Lahore restaurants, menus, hotels, flights, packages, limits
  covers.ts                cover photos with captions and credits
src/
  App.tsx · main.tsx · translations.ts (en / ur / ar) · index.css (theme tokens)
  components/
    Dashboard.tsx          main screen, wallet actions, PIN flow
    ThreeBackground.tsx    animated background
    market/                FoodScreen · TravelScreen · parts · motionParts · helpers
    plan/                  SavingsScreen · LimitDecision · BudgetImpact · SplitBar · PinPad · MoneyHistory · SecurityCenter
docs/
  faq/                     the FAQ as Markdown (the assistant's knowledge)
  policies/                BreachMirror policies imported as Markdown
  WaqfApp-FAQ.pdf          the FAQ as a PDF
public/covers/             cover photos and credits.json
scripts/                   build_faq_pdf.py · import-breachmirror-policies.ts
```

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| Frontend | [React 19](https://react.dev/), [Vite 6](https://vite.dev/), [Tailwind CSS v4](https://tailwindcss.com/) |
| Motion and 3D | [Motion](https://motion.dev/) (`motion/react`), [Three.js](https://threejs.org/) via React Three Fiber |
| Charts | [Recharts](https://recharts.org/) |
| Server | [Express](https://expressjs.com/) run with `tsx` |
| Agents | [LangChain](https://js.langchain.com/) core, [LangGraph](https://langchain-ai.github.io/langgraphjs/) |
| Embeddings | [Transformers.js](https://huggingface.co/docs/transformers.js), running locally |
| Optional LLM | [Ollama](https://ollama.com/) through `@langchain/ollama` |
| Sessions | JSON Web Tokens |

---

## ⚠️ Limitations

* **In-memory data.** A restart clears accounts, balances, plans and the audit log.
* **Shared demo PIN.** There's one PIN for every guest. A real app would let each user set their own.
* **Default secrets.** `JWT_SECRET` and the session secret fall back to built-in values. Change them before you share a deployment.
* **Sample catalogue.** Restaurant, hotel and flight names are real Lahore places, but the menus, prices and schedules are samples. They aren't live data, and no booking or order is actually placed.
* **No real payments.** The app doesn't connect to any bank or payment provider.

---

## 📷 Photo Credits

The cover photos in `public/covers/` come from open collections. Each one's source, author and licence are listed in [`public/covers/credits.json`](public/covers/credits.json) and shown in the app.

---

📄 **License & Terms:** This project is maintained by WaqfApp Foundation. All implementation layouts, cryptographic logic, and asset systems are reserved.

© 2026 WaqfApp Foundation | Secured Philanthropy Network
