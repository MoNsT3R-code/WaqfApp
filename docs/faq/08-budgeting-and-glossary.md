# Budgeting and Money Habits

## How can WaqfApp help me budget?

WaqfApp shows your balance, a chart of how it changes, and a categorised history of everything you spend, so you can see where your money goes. Recording cash spending with Add Cash makes the picture complete. The Money Helper then points out your largest spending category and suggests one action at a time. A simple routine is to look at your Payment History once a week, compare it with what you planned, and adjust the following week.

## What is a simple budgeting method I can follow?

A widely used starting point is to divide your take-home income into three parts: about half for needs (rent, utilities, food, transport, school fees), up to a third for wants (eating out, shopping, entertainment), and at least a fifth for saving and giving. Many Muslim families adapt this by setting aside their giving first, as soon as income arrives, so that charity is a priority rather than whatever is left over. Adjust the proportions to your circumstances; the important thing is to decide them in advance.

## How do I reduce spending on bills?

Pay all your bills together in the first week after they arrive so you never pay late-payment surcharges, which can be significant on Pakistani utility bills. Check each bill for errors such as estimated meter readings. Reduce electricity use during peak hours, when tariffs are higher, switch off appliances on standby, and use energy-efficient lights and fans. For gas, check for leaks and use lids when cooking. Review your internet package to make sure you are not paying for more speed than you use.

## How do I reduce spending on food?

Food often becomes the largest flexible expense. Plan the week's meals, buy staples such as flour, rice, lentils and oil in larger quantities when prices are good, and cook at home more often. Treat food delivery as an occasional treat rather than a habit: a single delivery order costs as much as several home-cooked meals. In WaqfApp you can see the effect in your Payment History by looking at the entries with the Food category.

## How should I save for Umrah or another big trip?

Decide the total you need, including flights, hotels, visa, local transport, food and gifts, and the date you plan to travel. Divide the total by the number of months remaining to get a monthly saving target, and set that amount aside as soon as your income arrives. Compare packages with separate flight and hotel bookings, and travel outside Ramadan and school holidays if you can, when prices are usually much lower. The Waqf Portfolio lets you add hotels and flights to see their combined cost before you commit.

## How large should my emergency fund be?

A common guideline is to keep three to six months of essential expenses in an easily accessible savings account or wallet that you do not use for everyday spending. Start with a smaller goal, such as one month's expenses, and build up from there. An emergency fund means you can cope with sudden costs, such as a medical bill or a broken appliance, without needing a loan.

## When is borrowing a reasonable choice?

Borrowing can be reasonable for a genuine emergency or for something that increases your long-term wellbeing, such as education, when you have a realistic plan to repay. It is rarely a good idea for everyday spending or for things you could save for. Before borrowing, ask yourself whether the need is urgent, whether you can repay from your next income without hardship, and whether an interest-free option such as a Qard al-Hasan from family is available.

## How can I make giving a regular habit?

Choose a fixed amount or a fixed percentage of every income you receive, and give it as soon as the income arrives. Pick one or two causes you care about, for example a local school, a clinic or a water project, so that your giving builds up into something lasting. Small regular amounts are easier to sustain than occasional large ones, and the hadith teaches that the most beloved deeds are those done consistently, even if small.

## What warning signs in my spending should I watch for?

Watch for a balance that falls lower each month even though your income has not changed; regular use of short-term loans; late-payment surcharges on bills; spending in one flexible category, such as food or shopping, that grows month after month; and many small payments that you cannot remember making. The Money Helper highlights some of these signs, such as a recent Quick Loan or a negative balance.

## How often should I review my finances?

A quick weekly look at your Payment History takes only a few minutes and helps you notice problems early. Once a month, compare your total income and spending, check that all bills were paid on time, and move any surplus into savings or giving. Once a year, review your larger goals, such as saving for travel or education, and calculate whether Zakat is due on your savings.

# Glossary of Terms

## What does PKR mean?

PKR is the international currency code for the Pakistani Rupee, the currency of Pakistan. All balances, prices and transactions in WaqfApp are shown in PKR. One rupee is divided into one hundred paisa, although paisa are rarely used in everyday prices.

## What does SAR mean?

SAR is the currency code for the Saudi Riyal, the currency of Saudi Arabia. WaqfApp lists flights from Lahore to Jeddah and Umrah trip deals but shows their prices in PKR. Travellers to Saudi Arabia will need riyals, or a card that can be used there, for spending during their trip.

## What is IBFT?

IBFT stands for Inter Bank Funds Transfer, a service through which customers of one Pakistani bank can send money instantly to an account at another bank, using the recipient's account number or IBAN. "Bank Account (IBFT)" is one of the destinations in WaqfApp's Send Money form.

## What is an IBAN?

An IBAN (International Bank Account Number) is a standard format for identifying a bank account. In Pakistan, IBANs have 24 characters: the letters PK, two check digits, a four-letter bank code and a 16-digit account number. Using an IBAN reduces the chance of sending money to the wrong account.

## What are JazzCash and Easypaisa?

JazzCash and Easypaisa are the two largest mobile wallet services in Pakistan, operated in association with Jazz and Telenor respectively. They let people send and receive money, pay bills and top up phones using a mobile number as the account identifier. Both are available as destinations in WaqfApp's Send Money form.

## What is a consumer number?

A consumer number is the unique reference that a utility company gives to each customer connection, printed on every bill. You need it to pay a bill through WaqfApp's Bills form. Different companies call it by different names, such as account number, reference number or customer ID.

## What is mobile load?

Mobile load, or top-up, is prepaid credit added to a mobile phone number so that it can be used for calls, SMS and internet. In WaqfApp, you can send load to numbers on Jazz, Telenor, Zong and Ufone through the Mobile Load service.

## What is a ledger?

A ledger is a complete, ordered record of financial transactions. WaqfApp's Payment History is your ledger: every payment, transfer, booking, loan and manual entry is added to it as a new line, and entries are never edited or deleted. Your balance is calculated from your opening balance and all the entries in the ledger.

## What is a session token?

A session token is a long, signed string that the WaqfApp server gives your browser when your session starts. The browser sends it with every request so that the server knows which account the request belongs to. WaqfApp's tokens are JSON Web Tokens (JWTs) that expire after 24 hours.

## What is end-to-end encryption?

End-to-end encryption (E2EE) means that data is encrypted on the sender's device and can only be decrypted on the intended recipient's device, so that no one in between, not even the service provider, can read it. WaqfApp's Private Safe demonstrates the idea; in the current version it does not yet perform real encryption.

## What is RAG?

RAG stands for retrieval-augmented generation. Instead of relying only on what a language model memorised during training, a RAG system first retrieves relevant passages from a trusted knowledge base, in WaqfApp's case this FAQ, and then uses those passages to produce the answer. This makes answers more accurate, easier to check through their sources, and easy to update by editing the knowledge base.

## What are LangChain and LangGraph?

LangChain is an open-source framework for building applications with language models; it provides standard building blocks such as document loaders, embeddings, vector stores, retrievers and chat model interfaces. LangGraph, from the same team, is a library for building agents as graphs of steps (nodes) connected by edges, with shared state and conditional branching. WaqfApp's assistants use LangChain's building blocks and organise them into LangGraph graphs.

## What is an embedding?

An embedding is a list of numbers that represents the meaning of a piece of text, produced by an embedding model. Texts with similar meanings have embeddings that are close together, which lets a computer find FAQ entries that mean the same as your question even if they use different words. WaqfApp computes embeddings on its own server.

## What is a vector store?

A vector store is a database that holds embeddings and can quickly find the ones closest to a given query embedding. WaqfApp uses LangChain's in-memory vector store, which is rebuilt from the FAQ each time the server starts.

## What is BM25?

BM25 is a classic keyword-based ranking method used by search engines. It scores documents by how often they contain the words in your query, giving more weight to rare words and less to very common ones. WaqfApp's assistant uses BM25 as a fallback if its embedding model cannot be loaded.

## What is Ollama?

Ollama is free software that downloads and runs open language models, such as Llama, Qwen or Gemma, on your own computer, with no cloud service or API key. WaqfApp can optionally use a model running in Ollama to write more natural answers from the retrieved FAQ entries.

## What is Qard al-Hasan?

Qard al-Hasan, literally "a goodly loan", is an interest-free loan given out of kindness, repaid at the original amount with no increase. The Quran praises lending to Allah a goodly loan. It is often offered by families, mosques and some Islamic microfinance institutions to people in need.

## What is Murabaha?

Murabaha is an Islamic finance contract of sale at a disclosed cost plus profit. The financier buys an asset and sells it to the customer at an agreed higher price, which the customer usually pays in instalments. Because it is a sale rather than a loan, the profit is permissible in the view of most scholars, provided the conditions of the contract are met.

## What is a mutawalli?

A mutawalli is the trustee or manager of a Waqf, responsible for preserving the endowed asset, collecting its income and spending it according to the founder's conditions. A mutawalli acts as a trustee and is accountable for the Waqf's proper management.

## What is nisab?

Nisab is the minimum amount of wealth a Muslim must own, held for a lunar year, before Zakat becomes obligatory. It is traditionally defined as 87.48 grams of gold or 612.36 grams of silver, and its value in rupees changes with the price of these metals.

## What is Umrah?

Umrah is the lesser pilgrimage to Makkah, which, unlike Hajj, can be performed at any time of year. Its rites include entering the state of ihram, performing tawaf around the Kaaba, walking between Safa and Marwah (sa'i), and shaving or trimming the hair. Many pilgrims also visit Madina to pray at the Prophet's Mosque. WaqfApp's "Umrah Luxury Plus" Trip Deal covers both Makkah and Madina.
