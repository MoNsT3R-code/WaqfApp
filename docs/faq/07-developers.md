# For Developers: Running WaqfApp

## What do I need to run WaqfApp on my own computer?

You need Node.js version 18 or later (version 22 is recommended), npm, and Git to clone the repository. About 1 GB of free disk space is enough for the dependencies and the assistant's embedding model, and 4 GB of RAM is comfortable. Python 3 with the reportlab package is needed only if you want to rebuild the PDF version of this FAQ. No API keys are required.

## How do I install and start the app?

Clone the repository, change into its folder, run "npm install" to install the dependencies, and then run "npm run dev". The server starts on port 3000 by default and prints "[Waqf Server] Running on http://localhost:3000". Open that address in your browser. The first start takes longer because the app is prepared and the embedding model is downloaded.

## How do I run the server on a different port?

Set the PORT environment variable before starting the server. In a POSIX shell, run "PORT=3001 npm run dev"; in Windows PowerShell, run "$env:PORT=3001; npm run dev". If PORT is not set, the server uses port 3000. This is useful when another program is already using port 3000.

## Which environment variables does WaqfApp use?

All variables are optional. PORT sets the server port (default 3000). APP_URL sets the public base URL of the application. JWT_SECRET sets the key used to sign session tokens; set your own long random value in any shared deployment. OLLAMA_MODEL enables an optional local language model for the assistants, and OLLAMA_BASE_URL sets where Ollama is running (default http://localhost:11434). EMBEDDINGS_MODEL chooses a different Hugging Face embedding model for retrieval, and MODELS_CACHE_DIR sets where downloaded models are stored. Copy .env.example to .env to set them.

## Does WaqfApp still need a Gemini API key?

No. Earlier versions called the Google Gemini API directly from the browser, which required a GEMINI_API_KEY and exposed that key to anyone who opened the app. Both the Help Center assistant and the Money Helper have been replaced by a retrieval-augmented agent built with LangChain and LangGraph that runs on the WaqfApp server, and the Gemini dependency has been removed.

## How is the project organised?

server.ts is the Express server: it holds the in-memory data, defines the REST API and serves the React front end through Vite. The React application lives in src: App.tsx starts the session, components/Dashboard.tsx contains the dashboard and all service screens, and translations.ts holds the English, Urdu and Arabic labels. The Lahore marketplace (restaurants with their menus, hotels, flights and trip deals) is one data file, shared/marketplace.ts, which the server prices every order and booking from; the Food and Travel screens are in src/components/market. The agent lives in server/agent, and the FAQ that the agent reads lives in docs/faq as Markdown files, one per group of sections. scripts/build_faq_pdf.py builds docs/WaqfApp-FAQ.pdf from those files.

## Which API endpoints does the server provide?

POST /api/auth/guest starts a session on the demonstration account. With that session token you can call GET /api/dashboard/summary, GET /api/transactions, GET /api/marketplace and GET /api/user/profile; POST /api/transactions/add, /api/transactions/transfer, /api/bills/pay, /api/mobile/load, /api/loans/readycash, /api/bookings/hotel (hotel id, check-in, nights), /api/bookings/flight (flight id, passengers), /api/bookings/package, /api/food/order (restaurant id and dish ids with quantities) and /api/cart/checkout; GET /api/cart and the cart's add, update and remove routes; and the feedback routes. Booking and order routes take ids and quantities only and compute every amount on the server. The agent adds POST /api/agent/chat, POST /api/agent/advisor and GET /api/agent/status.

## How does the RAG agent work?

At start-up, server/agent/knowledge.ts reads every Markdown file in docs/faq, splits it into one LangChain Document per question and answer (with the section and question as metadata), embeds the documents with a local Hugging Face model through a LangChain Embeddings class backed by Transformers.js, and stores them in an in-memory LangChain vector store. A BM25 keyword index is built from the same documents. Retrieval is hybrid: each entry's semantic similarity gets a keyword bonus, so that rare names such as Kolachi, SNGPL or Ollama are still matched, and the BM25 index is used on its own if the embedding model cannot load. The support agent is a LangGraph StateGraph with the nodes contextualize, retrieve, grade, generate and fallback.

## What does each node of the support graph do?

contextualize recognises a short follow-up question ("and can I cancel it?") and passes the previous user question along as context. retrieve fetches the closest FAQ entries using hybrid scoring, blending the context in at a lower weight so the topic carries over. grade keeps only entries above a relevance threshold, which is slightly lower for Urdu and Arabic questions because cross-language similarity scores are naturally lower. A conditional edge then sends the state to generate when relevant entries remain, or to fallback when none do. generate either asks the optional local language model to answer using only those entries, or composes an extractive answer from the best entry and lists related questions. fallback explains that the FAQ has no answer and suggests what to try.

## How does the advisor graph work?

The advisor is a second LangGraph StateGraph with the nodes analyze, retrieve and advise. analyze totals the user's income and spending by category from the server's own transaction data, so the browser cannot tamper with the figures. retrieve searches the FAQ for guidance related to the largest spending category or to warning signs such as a recent Quick Loan or a negative balance. advise produces a two-sentence suggestion, either from rule-based templates that quote the real figures or, when a local model is configured, by asking that model to write the suggestion from the figures and the guidance.

## Which embedding model is used and where is it stored?

By default the agent uses Xenova/paraphrase-multilingual-MiniLM-L12-v2, a compact sentence-embedding model that understands more than 50 languages, including Urdu and Arabic. It runs on the CPU through Transformers.js and ONNX Runtime. It is downloaded from Hugging Face (about 135 MB) the first time the server starts and cached in the .cache/waqfapp/models folder in your home directory, so later starts work offline. Set MODELS_CACHE_DIR to use a different folder; on Windows, keep the full path short, because ONNX Runtime cannot open model files on paths longer than 260 characters. Set EMBEDDINGS_MODEL to use a different model, such as the smaller English-only Xenova/all-MiniLM-L6-v2.

## How do I enable a local language model with Ollama?

Install Ollama from ollama.com, pull a model such as "ollama pull llama3.2:3b", make sure Ollama is running, and start WaqfApp with OLLAMA_MODEL set to the model name. The agent then uses LangChain's ChatOllama for the generate and advise steps, grounded only in the retrieved FAQ entries. Smaller models need less memory; on a computer with 8 GB of RAM, models of around 1 to 3 billion parameters are a sensible choice. If Ollama is unreachable, the agent falls back to extractive answers.

## How do I add or change FAQ entries?

Edit the Markdown files in docs/faq. Each "#" heading starts a section and each "##" heading is a question; the text under a question, up to the next heading, is its answer. Restart the server so the agent rebuilds its index; there is no separate training step, which is one of the main advantages of retrieval-augmented generation. Run "npm run faq:pdf" to rebuild the PDF document.

## How do I check whether the agent is ready?

Call GET /api/agent/status. It reports whether the index is ready, how many FAQ entries were indexed, which retrieval mode is active (embeddings or keyword fallback), and whether a local language model is configured. The first request to the chat or advisor endpoints also waits for the index to finish building, so no question is lost while it loads.

## Why is all data lost when the server restarts?

The server keeps users, transactions, carts and reviews in JavaScript arrays in memory, which suits a demonstration but is not durable. To make data persist, replace those arrays with a database such as PostgreSQL or SQLite. The agent's vector index is rebuilt from the FAQ files at each start, so it does not need to be persisted, although for a much larger knowledge base you could switch the in-memory store to a persistent vector database.

## Is the current version ready for production use with real money?

No. It has no real accounts, no persistent storage and no payment provider integration. Before handling real money you would need proper user accounts with secure authentication, a database, integration with licensed payment partners, server-side validation of every amount, rate limiting, audit logs, and a security review. You would also need to set a strong JWT_SECRET instead of the built-in default.

## How do I build the app for production?

Run "npm run build" to build the front end into the dist folder, then start the server with NODE_ENV set to production, which makes it serve the built files instead of running Vite in development mode. The build warns that the main JavaScript bundle is larger than 500 kB, mainly because of the 3D graphics and chart libraries; splitting the code with dynamic imports would reduce the initial download.

## How do I run the type checker?

Run "npm run lint", which runs the TypeScript compiler in check-only mode across the project. It should finish without errors. Running it before every commit catches mistakes such as misspelled properties or wrong argument types early.

## How can I contribute to WaqfApp?

Fork the repository on GitHub, create a branch for your change, make the change with a clear commit message, check that "npm run lint" and "npm run build" succeed, and open a pull request explaining what the change does and why. Useful contributions include translations, accessibility improvements, new FAQ entries, persistent storage and real charity integrations.
