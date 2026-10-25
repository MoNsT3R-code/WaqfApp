# The Money Helper (Smart Advisor)

## What is the Money Helper?

The Money Helper, shown on the dashboard as the "Money Flow Assistant", gives you a short, practical suggestion about your money based on your recent activity. It looks at your balance and your transactions, works out where most of your money is going, and suggests one specific action, for example consolidating your utility payments early in the month, keeping Quick Loans for emergencies, or setting aside a fixed amount for a planned trip. Press "Refresh Advice" to get a new suggestion.

## How does the Money Helper decide what to suggest?

When you press "Refresh Advice", the app's advisor agent runs three steps on the server. First it analyses your transactions: total income, total spending, and spending by category, such as Bills, Food, Travel or Loan. Then it retrieves the most relevant guidance from this FAQ for your largest spending category or for any warning sign, such as a recent Quick Loan or a balance that has fallen below zero. Finally it writes a suggestion of no more than two sentences that names the category and the amounts involved.

## Is the Money Helper's advice professional financial advice?

No. The Money Helper gives general, automated suggestions to help you reflect on your spending. It is not personalised professional financial, investment, tax or religious advice, and it does not know about your circumstances beyond the transactions in the app. For important decisions such as borrowing, investing or calculating Zakat, speak to a qualified adviser or scholar.

## Why does the Money Helper say "Advisor report pending"?

"Advisor report pending" means that no suggestion has been generated yet in this session. Press "Refresh Advice" to run the advisor. If it still does not show a suggestion, the server may be busy loading its knowledge base for the first time; wait a few seconds and try again.

## What do the thumbs up and thumbs down buttons do?

After a suggestion appears, you can press thumbs up if it was useful or thumbs down if it was not. Your choice is highlighted, and it is reset each time you refresh the advice. In the current version the rating is shown on screen only; in future it can be used to improve which guidance the advisor chooses.

## Does the Money Helper send my data to an AI company?

No. The Money Helper runs entirely on the WaqfApp server. Your transactions are analysed by the app's own code, and the guidance comes from this FAQ. No API key is used and nothing is sent to an external AI service. If the person running the server has installed an optional local language model, that model also runs on the same machine.

# The Help Center Assistant

## What is the WaqfApp Assistant?

The WaqfApp Assistant is the chat assistant in the Help Center, which you can open from the footer of the dashboard. Type a question about the app, such as "How do I pay my gas bill?" or "What is Sadaqah Jariyah?", and press Enter or the arrow button. The assistant searches this FAQ for the most relevant answers and replies within a few seconds, telling you which FAQ entries it used.

## How does the assistant find its answers?

The assistant is a retrieval-augmented generation (RAG) agent built with LangChain and LangGraph. Every question and answer in this FAQ is stored as a separate entry in a searchable index. When you ask something, the agent first uses the earlier conversation to interpret short follow-up questions, then retrieves the entries whose meaning and keywords are closest to your question, checks that they are actually relevant, and finally composes a reply from them. If nothing relevant is found, it says so honestly instead of guessing.

## Does the assistant need an API key or an internet connection?

No API key is needed. The assistant uses a small embedding model that runs on the server to understand the meaning of questions. The first time the server starts, it downloads this model once from Hugging Face and stores it locally; after that it can work without an internet connection. If the model cannot be loaded, the assistant automatically switches to keyword search, so it keeps working.

## Can I ask the assistant questions in Urdu or Arabic?

Yes. The embedding model is multilingual, so questions written in Urdu or Arabic are matched with the relevant English FAQ entries. By default the reply quotes the FAQ in English. If the server is running an optional local language model, the assistant writes its reply in the language you have selected in the app.

## Why does the assistant say it could not find an answer?

The assistant answers only from this FAQ, and it will not make up an answer when none of the FAQ entries is relevant enough to your question. Try rephrasing with the name of the feature you are asking about, for example "Quick Loan limit" instead of "how much can I get". If your question is about something the FAQ does not cover, leave a review through the Feedback button so the team can add it.

## What are the sources listed under an answer?

Under each reply the assistant lists the FAQ questions it used, with the section each one belongs to. This lets you see where the answer came from and read the full entry in this document if you want more detail. Listing sources is an important feature of retrieval-based assistants, because it makes answers easy to check.

## Does the assistant remember our conversation?

Within a single Help Center session, yes: the assistant uses your recent messages to understand follow-up questions such as "and how long does it take?". The conversation is kept in your browser while the page is open and is sent to the server with each question. It is not stored on the server, and it is cleared when you reload the page.

## Can the assistant make payments or change my account?

No. The assistant can only answer questions. It cannot send money, pay bills, book travel or change any settings. If the assistant explains how to do something, you still carry out the action yourself using the app's buttons, so nothing happens without your direct action.

## What is the difference between the assistant and the Money Helper?

The Help Center assistant answers questions you ask about the app, its features and the ideas behind it, using this FAQ. The Money Helper looks at your own transactions and gives you one suggestion about your spending without you having to ask. Both are built with the same LangChain and LangGraph framework and run on the app's own server.

## Can the assistant use a full language model for more natural replies?

Yes, optionally. If the person running the server installs Ollama and sets the OLLAMA_MODEL setting (for example to llama3.2:3b), the assistant passes the retrieved FAQ entries to that local model, which writes a natural reply based only on them, in your selected language. If the model is not available or fails, the assistant falls back to quoting the FAQ directly, so it always gives an answer.

# The Private Safe (Vault)

## What is the Private Safe?

The Private Safe, labelled "Vault" in some places, is a demonstration of encrypted storage for sensitive notes such as emergency backup keys or important account references. When you open it, the contents are shown as an encrypted stream. Pressing the unlock control shows a sample decrypted note; pressing it again locks the Safe and hides the contents.

## Is the Private Safe really encrypted?

Not in the current version. The Private Safe shows how encrypted storage would look and behave, but the sample note is fixed text built into the app, the short delay when unlocking simulates decryption, and nothing you type is stored. Do not keep real passwords, PINs or recovery codes in the app. A live version would encrypt notes on your device with a key that only you hold, so that even the server could not read them.

## Where should I keep my real passwords and recovery codes?

Use a reputable password manager that encrypts your data with a master password only you know, and keep important recovery codes on paper in a safe place at home. Never share passwords, PINs or one-time codes with anyone, including people claiming to be from WaqfApp, a bank or a mobile wallet; genuine staff will never ask for them.

# Security and Privacy

## How does WaqfApp protect my information?

In the current demonstration version there is no personal information to protect: there is no registration, and the only account is the shared demonstration account. Every request is protected by a signed session token that expires after 24 hours. The app's assistants run on the server and do not send your questions or transactions to external AI services. The Privacy Policy, available from the footer, summarises the app's approach to protecting data.

## Is my data shared with anyone?

No. WaqfApp does not share data with advertisers or other third parties. In the demonstration version, data exists only in the server's memory and disappears when the server restarts. The only external download the server makes is the one-time download of the assistant's embedding model from Hugging Face, and your questions are not part of that download.

## Can other people see what I do in the app?

Yes, in the demonstration version, because everyone using the same copy of the app shares the demonstration account. Anyone using that copy can see the same balance, transactions, Portfolio and reviews. Do not enter anything private, such as your real phone number, consumer numbers or account numbers, unless you are running your own copy of the app.

## Is it safe to enter my real bill or phone numbers?

It is best not to. The demonstration version does not send them anywhere, but they are stored in the shared ledger and visible to other users of the same copy until the server restarts. Use made-up example numbers, such as those in the form placeholders, when you are trying out the app.

## How do I recognise phishing or scams?

Be suspicious of messages that create urgency ("your account will be blocked today"), ask for passwords, PINs or one-time codes, contain links to websites with slightly misspelled names, or promise prizes and refunds you did not expect. WaqfApp will never ask for your password or PIN. If in doubt, do not click links in the message; open the app directly, or contact the organisation using contact details you already trust.

## What should I do if I think my account has been misused?

In the demonstration version no real money can be lost, so there is no risk to your finances. In any live financial app, you should immediately change your password, contact the provider's official helpline to block the account, review recent transactions, and report fraudulent mobile wallet or bank activity to the provider. In Pakistan, cybercrime can be reported to the National Cyber Crime Investigation Agency.

## Does WaqfApp use cookies or track me?

The app stores a few small values in your browser's local storage: your session token, so that the server recognises your session, and your theme preference. It does not use advertising cookies or third-party trackers. You can clear these values at any time by clearing your browser's site data; the app will simply start a new session.

## Why was the login and registration screen removed?

The login, registration, verification and two-factor screens were removed so that the app opens directly to the dashboard. This makes the demonstration simpler to use and removes the need to create or remember passwords. It also removed a security risk: the earlier version contained a built-in administrator password in its source code, which has been deleted.
