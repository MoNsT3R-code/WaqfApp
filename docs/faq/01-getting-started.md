# About WaqfApp

## What is WaqfApp?

WaqfApp is a digital wallet and philanthropy application built around the Islamic idea of Waqf, a charitable endowment whose benefit continues over time. In one place it brings together everyday money tasks (sending money, paying utility bills, topping up a mobile number, ordering food and booking travel) and tools that help you think about giving, saving and spending responsibly. The app shows your balances in Pakistani Rupees (PKR), offers a local Lahore marketplace of restaurants, hotels and flights, and can be used in English, Urdu or Arabic. It also includes a Money Helper that gives short suggestions about your spending, a Help Center assistant that answers questions about the app, and a Private Safe that demonstrates how sensitive notes can be kept encrypted.

## Who is WaqfApp designed for?

WaqfApp is designed for individuals and families in Pakistan, particularly in Lahore, who want a single, simple place to manage day-to-day payments while keeping charitable giving close at hand. It is particularly suited to people in Lahore who order food, book hotels or plan Umrah and business travel from the city, to households that pay several utility bills each month, and to anyone who wants gentle guidance on budgeting. The interface uses plain language, large controls and a choice of three languages so that it can be used comfortably by people with different levels of experience with technology.

## What does the name "Waqf" mean?

Waqf (plural awqaf) is an Arabic term for an endowment in Islamic law. A person sets aside an asset, such as land, a building, a well or a sum of money, so that its benefit is dedicated permanently to a charitable or religious purpose while the asset itself is preserved. Famous historical examples include endowed mosques, schools, hospitals and water fountains whose income or service continued for centuries. WaqfApp takes its name from this tradition: the goal is to make continuous, beneficial giving (Sadaqah Jariyah) feel like a natural part of everyday financial life.

## Is WaqfApp a bank?

No. WaqfApp is not a bank and does not hold a banking licence. In its current form it is a demonstration application: the balance, transactions, bookings and loans you see are simulated so that you can explore how such a service would work. No real money moves when you press a button in the app. If WaqfApp is later connected to licensed payment partners, those partners would hold funds and process transactions under their own regulation, and the app would clearly tell you which partner is involved before you confirm any payment.

## Is any real money involved when I use the app?

Not in the current version. Every action, whether a bill payment, a transfer, a mobile top-up, a hotel booking, a food order or a Quick Loan, creates a simulated transaction in the app's own in-memory ledger. Your displayed balance goes up or down accordingly so that you can see the effect of each action, but nothing is charged to a card, bank account or mobile wallet, and nothing is sent to a merchant. This makes the app safe to explore. Because the data is held in memory, it is also reset whenever the server restarts.

## What can I do with WaqfApp?

From the home screen you can: see your total balance and a chart of how it has changed; read your recent payment history; send money to a mobile wallet or bank account; pay electricity, gas, water and internet bills; top up a mobile number on Jazz, Telenor, Zong or Ufone; add a manual entry to your ledger; take a small Quick Loan; browse hotels, flights and trip packages; order food from partner restaurants; collect travel items in your Waqf Portfolio; open the Private Safe; get a suggestion from the Money Helper; ask the Help Center assistant a question; leave a review; and change the language or colour theme.

## Which countries and currencies does WaqfApp support?

All balances, prices and transactions in WaqfApp are shown in Pakistani Rupees (PKR). The marketplace is local to Lahore: five Lahore restaurants with full menus, five Lahore hotels, five flights from Lahore to Karachi, Quetta, Dubai, Jeddah and Istanbul, and trip deals for Umrah and Jeddah that start from Lahore. Fares for international flights are also shown in PKR so that you can compare them directly with your balance. The app does not currently perform currency conversion or hold balances in Saudi Riyals (SAR).

## Which languages is WaqfApp available in?

WaqfApp is available in English, Urdu and Arabic. You can switch at any time using the EN, UR and AR buttons at the top of the dashboard. When you choose Urdu or Arabic, the layout switches to right-to-left so that text reads naturally. Menu labels, button names and the guidance texts change language immediately. Some content that comes from partners, such as hotel and restaurant names, stays in its original form.

## Do I need to install anything to use WaqfApp?

No installation is needed to use WaqfApp as a customer. It is a web application that runs in a modern browser such as Chrome, Edge, Firefox or Safari, on a desktop computer, a laptop, a tablet or a phone. You simply open the address you have been given. If you are a developer who wants to run your own copy, you will need Node.js and the project's dependencies; the developer section of this FAQ explains how.

## Is WaqfApp free to use?

Yes. The current demonstration version of WaqfApp is free to use and there are no subscription fees. Because no real money moves, there are also no transaction charges. The Quick Loan screen mentions that repayment terms apply; in this version that text is illustrative and no repayment is ever collected. If paid features or partner fees are introduced in future, they would be shown clearly before you confirm anything.

## What makes WaqfApp different from other wallet apps?

Three things set WaqfApp apart. First, it is built around Islamic values: the home screen opens with the Bismillah, verses and hadith about continuous charity, and the app treats giving as a core feature rather than an afterthought. Second, it combines daily payments with a local Lahore marketplace for food, hotels and flights, including flights and packages for Umrah travellers. Third, it includes a built-in assistant that answers questions from this FAQ using a retrieval-based agent that runs on the app's own server, so it works without sending your questions to an external AI service.

## Who develops and maintains WaqfApp?

WaqfApp is maintained by the WaqfApp Foundation project team. The source code is hosted on GitHub, where developers can review the code, report issues and suggest improvements. If you have a question that is not answered in this FAQ, use the Help Center assistant or leave a review through the Feedback button so the team can see it.

# Your Account and Session

## Do I need to register or log in to use WaqfApp?

No. The login and registration screens have been removed. When you open WaqfApp, the app automatically starts a session for you and takes you straight to the dashboard. There is no username or password to remember and no verification code to wait for. This makes the app quicker to try and removes the risk of reusing a password from another service.

## Which account am I using when I open the app?

You are signed in to the shared demonstration account, which appears at the top of the dashboard as "Waqf Demo User" with the label "Level 2 Account". This account has a starting balance and a short history of sample transactions so that the dashboard has realistic content from the first moment. Everyone who opens the same copy of the app uses this same demonstration account, so you may see transactions that someone else created.

## What happens when I press Log Out?

Pressing Log Out (the exit icon at the bottom of the left-hand sidebar) ends your current session and immediately starts a fresh one on the same demonstration account. You will see the dashboard reload. Logging out does not erase transactions you created during the session, because those are stored on the server rather than in your browser. They are cleared only when the server restarts.

## How long does my session last?

Each session token is valid for 24 hours. The token is kept in your browser's local storage and sent with every request to the server so that the app knows which account the request belongs to. If the token expires, simply reload the page: the app starts a new session automatically. You will not be asked for any credentials.

## Can I change my name, email or phone number?

Not in the current version. The demonstration account's name, email address and phone number are fixed. Profile editing is a natural feature for a future version that has personal accounts. For now, the "My Profile" area simply shows who you are signed in as.

## Can I delete my account?

Yes, the app offers an option to permanently delete your account. You will be asked to confirm, because in a real service this action cannot be undone. In the demonstration version, deleting the account removes it from the server and starts a new session, and the app recreates a fresh demonstration account so that it can keep working. Transactions already recorded on the server are not removed by this action and disappear only when the server restarts.

## Why can I see transactions I did not make?

Because the demonstration account is shared, any transaction created by anyone using the same copy of the app appears in the same history. For example, if a colleague paid a bill while testing, you will see that bill payment too. If you are running your own copy of WaqfApp on your own computer, only your own actions will appear, together with the sample transactions included at start-up.

## Is two-factor authentication available?

Two-factor authentication belonged to the login flow, which has been removed along with the login and registration panels. Because there are no passwords and no personal accounts in the current version, there is nothing for a second factor to protect. If personal accounts are reintroduced, two-factor authentication would be an important feature to add back.

## Can several people use WaqfApp at the same time?

Yes. Many people can open the app at once. Each person gets their own session token, but all sessions point at the same demonstration account, so everyone sees the same balance and transaction history and their actions affect each other's view. Refresh the page to see the latest state after someone else has made changes.

# The Dashboard and Your Balance

## What is shown on the home screen?

At the top you will see the Bismillah, the WaqfApp logo, and buttons for your Portfolio (cart), Feedback, theme, language and the QR scanner, together with your name. Below that are a Quranic verse and a hadith about continuous charity. The main area shows your Total Balance, the Money Flow Assistant (Money Helper), a row of Services buttons, a Money History Chart, and your Payment History. The left sidebar has shortcuts to Home, Travel, Order Food, your Payment history and the Help Center, with Log Out at the bottom, and the footer links to the Privacy Policy and the Help Center.

## How is my total balance calculated?

Your total balance is your account's opening balance plus the sum of all transactions recorded against it. Money coming in, such as a Quick Loan disbursement or a positive manual entry, adds to the balance; payments such as bills, transfers, mobile top-ups, bookings and food orders subtract from it. The demonstration account starts with PKR 1,250,500 and includes a few sample transactions (for example a salary credit and a rent payment), which is why the balance you first see is lower than the opening amount.

## What do the inflow and outflow figures under my balance mean?

Inflow is the total of all the money that has come in, such as your salary, Quick Loans and positive manual entries, and outflow is the total of all your payments, such as bills, transfers, bookings and food orders. Both are added up from the entries in your Payment History, so they always match it.

## Why did my balance change even though I did nothing?

The demonstration account is shared, so another person using the same copy of the app may have made a payment or taken a loan. The server also resets to its starting state whenever it restarts, which can make the balance jump back to its original value. Check the Payment History to see which transactions are currently recorded.

## What is the Money History Chart?

The Money History Chart shows how your balance has moved over recent months. The earlier points are sample figures for January, February and March, and the final point is your current balance, so the line updates immediately when you make a payment or receive money. Hover over or tap a point to see the exact value for that month.

## What do the monthly income, expenses and savings rate figures mean?

These figures describe the demonstration profile: a monthly income of PKR 350,000 and monthly expenses of PKR 180,000, which leaves PKR 170,000 a month, a savings rate of 48.6 percent. Press Savings in the Services row to see this breakdown. Income and expenses are illustrative values for the profile and are not calculated from your transactions in the current version; the savings rate is always computed from them, so the figures agree. A credit score and an investment value are also included for the same purpose.

## Where can I see my full transaction history?

Your recent transactions are listed in the Payment History section of the dashboard, newest first. Each entry shows the merchant or description (for example "KESC Bill - 9PKR-8822" or "Order from Butt Karahi (3 items)"), the category, when it happened (the time for today, "Yesterday", or the date before that) and the amount, with money going out shown with a minus sign. The section shows the six most recent entries; press "See all history" to show every entry and "Show less" to fold the list again. The Payment history icon in the sidebar jumps straight to it.

## What do the transaction categories mean?

Each transaction has a category that describes what it was for. Categories you will see include Income, Housing, Shopping, Technology, Food & Drink, Food, Travel, Bills, Mobile Load, Transfer, Loan and General. Categories are assigned automatically when you use a service (for example, a bill payment is always "Bills") and can be chosen when you add a manual entry. They make it easier to see where your money goes and they are used by the Money Helper when it gives suggestions.

## Can I edit or delete a transaction?

No. Transactions in WaqfApp cannot be edited or deleted once they are recorded, which mirrors how real financial ledgers work: a mistake is corrected with a new, opposite entry rather than by changing history. If you added an incorrect manual entry, add another manual entry for the opposite amount. In the demonstration version, all transactions are cleared when the server restarts.

## Why are the amounts shown with decimals?

Amounts are shown to two decimal places, in line with how currency is normally displayed, even though Pakistani Rupee prices rarely include paisa in practice. Some sample transactions, such as a café purchase of PKR 4,500.50, deliberately include decimals to show that the ledger handles them correctly.

## What is the QR scanner button for?

The square scanner icon near the top of the dashboard opens a QR payment screen. It shows a scanning frame with the message to align a QR code for payment. In the current version this is a preview of the feature: the camera is not activated and no payment is made. Press "Terminate Scanner" to close it.

## The dashboard looks empty or will not load. What should I do?

The dashboard appears only after the app has started your session and loaded your balance. If the screen stays dark, wait a few seconds; the first load after the server starts can take longer while the app is prepared. Then reload the page. If it still does not appear, the server may not be running, or your browser may be blocking scripts. The Troubleshooting section of this FAQ has more detailed steps.
