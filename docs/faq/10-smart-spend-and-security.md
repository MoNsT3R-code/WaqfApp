# Smart Spend & Save

## What is Smart Spend & Save?

Smart Spend & Save splits your salary, or any deposit, once a month into a spending budget and savings, and keeps the two apart for the whole month. Open it with the Savings button in the Services row. As you pay bills, send money, top up phones, order food or book travel, the app counts each payment against your spending budget, warns you as it runs low, and asks you what to do when it is used up. It never moves money from savings on its own.

## How do I start my month?

Press Savings in the Services row. Enter the amount you received (the app suggests your latest salary), choose how much of it to spend with the slider, decide whether your savings are protected or flexible, and optionally set a savings floor. The bar below the slider shows the split as you move it. Press "Start my month" and the plan begins: only payments made from that moment count towards this month's spending budget.

## What is the monthly split?

When salary or another deposit arrives, you choose how much goes to the spending budget and how much stays in savings. The default split is 60 percent for spending and 40 percent for savings, and any spending share from 10 to 90 percent can be chosen in steps of 5 percent. For example, PKR 250,000 at 60 percent gives a spending budget of PKR 150,000 and savings of PKR 100,000.

## When does the app warn me about my budget?

The app sends a notification when 75 percent, 90 percent and 100 percent of the spending budget has been used, so you can adjust before the budget runs out. For example, with a PKR 150,000 budget you are warned once spending passes PKR 112,500, again at PKR 135,000, and at PKR 150,000 the limit decision opens. Each warning is shown once per level.

## What happens when my spending budget is used up?

When the spending budget is used up, you can use savings, stay within budget, or review spending. Nothing changes until you choose, and you can decide later: the choice stays waiting on the Savings screen. The options come with the policy passages they are based on, retrieved from this FAQ by the decision pipeline.

## What does "Use savings" do?

Using savings moves money from savings into the spending budget. It is a budget change inside the same wallet, so your balance does not change. You enter an amount or drag the line into your savings, see the savings left and the new spending budget, and confirm with your PIN. The suggested amounts include one that covers exactly what you have overspent.

## What does "Stay within budget" do?

Staying within budget keeps savings untouched. Payments are not blocked, so any spending above the budget still comes from the same wallet and is shown as over budget, both on the home screen and in Savings.

## What does "Review spending" show?

Reviewing spending shows your totals by category, such as bills, transfers, food, travel and mobile load, largest first, so you can see where the money went before deciding. After reviewing, you return to the same choice.

## What is the difference between protected and flexible savings?

Protected savings cannot be moved into the spending budget until you switch savings to flexible in the Savings screen. Flexible savings can be moved, but only after you confirm each move with your PIN. If you switch to flexible while the limit decision is waiting, the "Use savings" option appears straight away.

## What is a savings floor?

A savings floor is an amount your savings should not fall below. The app warns you before any move that would take savings below the floor, and marks the floor on the savings bar, but the decision stays with you. Leave the floor empty if you do not want one.

## Why does WaqfApp never move my savings automatically?

The app never moves money from savings on its own. Every move needs your approval and your PIN, and is recorded in the audit log with the time and the amount. This is a deliberate rule: an automatic top-up would hide overspending and defeat the purpose of saving.

## What is the daily amount on the home screen?

Dividing what is left to spend by the days remaining in the month gives a daily amount to aim for, rounded down to the nearest PKR 100. Once you have spent something, the app also says when your budget would run out at your current pace. Postponing purchases that are not essential until next month keeps your savings protected.

## How do I check a purchase before I make it?

In Savings, type the item and its price into "Thinking of buying something?", for example "Shoes 7,000", "rs 2.5k" or "1 lakh", and press Check. The app tells you whether it fits your remaining budget, how much would be left per day afterwards, and whether covering it would need money from savings or take savings below your floor.

## Does Send Money or Bills show the budget impact?

Yes. When you have started your month, the Send Money and Bills forms show what the payment would do to your budget as you type the amount: whether it fits, what would be left, and how much of the budget would be used. Payments are never blocked, so the check is there to inform you, not to stop you.

## Can I start a new month?

Yes. In Savings, press "Start a new month" to split a new deposit. The previous month's plan is replaced, any waiting decision is closed, and payments count towards the new budget from that moment. Your transactions themselves are not changed.

# Security Policies and PIN

## Which actions need my PIN?

Your 4-digit PIN is needed for every action that moves money out of your budget or adds debt: moving money from savings, sending money, and taking a Quick Loan. Bills, mobile load, food orders and travel bookings ask you to confirm in the app instead. The demo account's PIN is 2580; a live service would have you set your own.

## What happens if I enter the wrong PIN?

After a wrong PIN the app tells you how many tries are left. After three wrong tries nothing is done, the attempt is recorded in the audit log, and PIN actions are paused for five minutes. The PIN is stored only as a salted scrypt hash on the server and compared in constant time, so it cannot be read back.

## My PIN doesn't work. Why?

Check that you are typing the 4 digits in the right order on the PIN pad, then try again. The app tells you how many tries are left after each wrong PIN. After three wrong tries PIN actions are paused for five minutes, and even the right PIN is refused until the pause ends, so wait and try again. In this demo the PIN is 2580 unless whoever runs the server set a different one.

## I forgot my PIN. What can I do?

In this demo the PIN is 2580, unless whoever runs the server set a different one with the WAQF_DEMO_PIN setting, so ask them. Nobody can read a PIN back, not even the server, because it is stored only as a scrambled (hashed) value. In a live service you would reset it yourself after proving who you are, for example with a one-time code sent to your registered mobile number. WaqfApp will never ask you to tell it your old PIN.

## How do I change my PIN?

The demo has one shared PIN, so it cannot be changed inside the app. Whoever runs the server can set a different one with the WAQF_DEMO_PIN setting and restart it. A live service would let you change your PIN in the app after entering the current one, and would ask you to choose 4 digits that are not easy to guess, such as 1111, 0000 or your birth year.

## I typed my PIN in a chat message by mistake. What now?

The assistant removes anything that looks like a PIN before searching or saving the conversation, and tells you it did. If the PIN was real, change it as soon as you can, and never send it in a message, email or call again: WaqfApp and its staff will never ask for it.

## What happens if I tap Confirm twice?

Each confirmation carries a one-time request number, so if the same confirmation reaches the server twice, from a double tap or a retried connection, the second one returns the first result instead of moving money again.

## What is the audit log?

Every money action, PIN failure, budget warning, savings move and change of settings is written to an audit log with its time and details. Each entry carries a keyed hash (HMAC) of the entry before it, so editing, deleting or reordering any entry breaks the chain. The Security Center shows your entries and whether the chain is intact. This design comes from BreachMirror AI.

## How does the assistant protect what I type?

Before the Help Center assistant searches anything, a guard step checks your message. Attempts to override its instructions are refused, and anything that looks like a PIN, one-time code, card number, CNIC number or password is removed and replaced with "[REDACTED]", in your new message and in the earlier turns of the conversation. The assistant then tells you what it removed and reminds you never to share such details.

## Will WaqfApp ever ask for my PIN or one-time code?

No. WaqfApp, its assistant and its staff will never ask for your PIN, one-time codes, card number or password, by message, call or email. You only ever type your PIN into the PIN pad that appears when you confirm a move, a transfer or a Quick Loan yourself. Anyone else who asks is attempting fraud.

## What should I do if I think someone knows my PIN?

Do not confirm any action you did not start. Check your Payment History and the audit log in the Security Center for activity you do not recognise, and report it through the Feedback button. In a live service you would also call the provider's helpline to block the account and set a new PIN. Report fraud involving real accounts to your bank and to the National Cyber Crime Investigation Agency.

## What is the Security Center?

The Security Center, opened from the shield icon in the sidebar, shows your audit log and whether its hash chain is intact, the security rules the app follows, and the live status of BreachMirror AI: whether it is running, its encryption and whether its own audit chain is intact.

# BreachMirror AI

## What is BreachMirror AI?

BreachMirror AI is a security-awareness and policy-training platform with a Policy Copilot (an agentic RAG pipeline built on LangGraph), an encrypted and tamper-evident data layer, and a Security Support desk. WaqfApp is connected to it in three ways: the assistant answers from BreachMirror's IT Security Policy and Code of Business Conduct, the assistant's guard step and WaqfApp's audit log follow BreachMirror's design, and the Security Center shows BreachMirror's live status.

## Can the assistant answer security policy questions?

Yes. The assistant's knowledge includes BreachMirror AI's Information Technology Security and Usage Policy and its Code of Business Conduct, clause by clause, imported with "npm run policies:import". Ask, for example, "How should confidential data be stored?", "What is the password policy?" or "How do I report a phishing email?", and the answer cites the policy section it comes from. Those policies are written for the staff of BreachMirror's example organisation, so they describe workplace rules rather than wallet features.

## What happens when the assistant cannot answer a security question?

If a security question is not covered by the FAQ or the imported policies, the assistant says so rather than guessing. When BreachMirror AI is running, it also offers a link to BreachMirror, where the Policy Copilot (press 6) can search its full policy library and Security Support (press 7) forwards the question to the Security Team.

## How do I connect WaqfApp to BreachMirror AI?

Run BreachMirror AI on its own port (it uses port 3000 by default) and set BREACHMIRROR_URL in WaqfApp's .env to its address, for example http://localhost:3000; run WaqfApp on another port, such as 3001. WaqfApp checks BreachMirror's public health endpoint every 15 seconds at most and shows the result in the Security Center. No BreachMirror password or key is stored in WaqfApp.
