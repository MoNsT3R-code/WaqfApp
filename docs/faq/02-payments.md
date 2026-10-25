# Sending Money

## How do I send money to someone?

Press "Send Money" in the Services row on the dashboard. In the form that opens, enter the recipient's account or mobile number (for example 03450000000), choose where the money should go from the "Select Destination" list, type the amount in PKR, and press "Confirm Transfer". If every field is filled in and the amount is greater than zero, the transfer is recorded, the form closes, your balance goes down by the amount you sent, and a "Transfer to ..." entry appears at the top of your Payment History with the category "Transfer".

## Where can I send money to?

The Send Money form offers three destinations: JazzCash, Easypaisa and Bank Account (IBFT). JazzCash and Easypaisa are popular mobile wallets in Pakistan, so for these you would normally enter the recipient's mobile wallet number. IBFT (Inter Bank Funds Transfer) is the system Pakistani banks use to move money between accounts at different banks, so for this option you would normally enter the recipient's account number or IBAN. The destination you choose is shown in brackets next to the recipient in your Payment History.

## What format should the recipient number be in?

For JazzCash and Easypaisa, use the recipient's 11-digit mobile number starting with 03, for example 03001234567, without spaces or dashes. For bank transfers, use the full account number or the 24-character IBAN that starts with PK. In the current demonstration version the app accepts any non-empty value, so it is up to you to type it carefully. In a live service the number would be checked against the provider before the transfer is accepted, and you would see the account holder's name to confirm.

## Is there a minimum or maximum amount I can send?

The amount must be greater than zero; the form will not accept an empty, zero or negative amount and will show the message "Please fill in every field with a valid amount". There is no upper limit in the demonstration version, and the app does not stop you from sending more than your balance, so your balance can become negative. A live service would apply daily and monthly limits set by the payment provider and by regulation, and would refuse a transfer that exceeds your available balance.

## How long does a transfer take?

In the demonstration version a transfer is recorded instantly: as soon as you press "Confirm Transfer" your balance and history update. With real providers, transfers to JazzCash and Easypaisa and IBFT transfers between Pakistani banks are usually completed within seconds, although occasional delays can occur during system maintenance or at busy times.

## Are there any fees for sending money?

No. The demonstration version does not charge any fees. In a live service, some transfer types, particularly IBFT transfers above a certain amount, can carry a small fee charged by the bank or wallet provider. Any such fee would be shown on the confirmation screen before you approve the transfer.

## Can I cancel a transfer after I have sent it?

No. Once a transfer is confirmed it cannot be cancelled or reversed from within the app, which is how real instant payments work. Always check the recipient's number and the amount before pressing "Confirm Transfer". If you sent money to the wrong person in a live service, you would need to contact the recipient or your provider's helpline to request a return.

## I pressed Confirm Transfer but nothing happened. Why?

If a field is empty or the amount is not a positive number, the form stays open and a red message asks you to fill in every field with a valid amount. Check that you entered a recipient and an amount. If the fields are correct and you see "Request could not be completed", the server rejected the request; reload the page and try again. If the button shows "Transmitting..." for a long time, your connection to the server may have dropped.

## Can I save recipients for next time?

Not yet. The Send Money form does not currently store a list of saved recipients, so you need to type the number each time. You can find previous recipients by looking at the "Transfer to ..." entries in your Payment History. Saved beneficiaries are a planned improvement.

## Can I send money abroad, for example to Saudi Arabia?

No. Send Money supports only domestic destinations in Pakistan: JazzCash, Easypaisa and Pakistani bank accounts through IBFT. International remittances involve currency conversion and additional regulatory checks, and are not part of the current version. Travel bookings in Saudi Arabia are paid in PKR through the marketplace instead.

# Paying Bills

## How do I pay a utility bill?

Press "Bills" in the Services row. Choose the service provider from the list, enter the consumer number printed on your bill, type the amount in PKR and press "Pay Bill". When the payment is recorded, the form closes and an entry such as "KESC Bill - 0400012345678" appears in your Payment History with the category "Bills", and your balance goes down by the amount paid.

## Which bill providers are supported?

The Bills form currently supports four providers: KESC (electricity, now known as K-Electric, serving Karachi), SNGPL (Sui Northern Gas Pipelines Limited, natural gas in Punjab and Khyber Pakhtunkhwa), WASA (Water and Sanitation Agency, water supply) and PTCL (Pakistan Telecommunication Company Limited, landline and internet). Other providers, such as the regional electricity companies LESCO, IESCO and MEPCO or SSGC for gas in Sindh and Balochistan, are not yet listed.

## Where do I find my consumer number?

Your consumer number, sometimes called a reference number, customer ID or account ID, is printed on your paper or electronic bill, usually near the top beside your name and address. For K-Electric it is the account number; for SNGPL it is the consumer number; for PTCL it is your phone number or account ID. Type it exactly as shown. In a live service the app would fetch the bill amount automatically from the consumer number; in the demonstration version you type the amount yourself.

## How much should I enter as the amount?

Enter the amount due shown on your bill. If you are paying before the due date, use the "payable within due date" amount; if you are paying late, use the "payable after due date" amount, which normally includes a late payment surcharge. The demonstration version does not check the amount against the provider, so make sure you type it correctly.

## When should I pay my bills to avoid late fees?

Pay before the due date printed on the bill. Pakistani utilities usually add a late payment surcharge after the due date, and repeated non-payment can lead to disconnection. A good habit, which the Money Helper may also suggest, is to pay all your utility bills together during the first week after they arrive so that none are missed. In a live service, payments made near the deadline can take a few hours to show at the utility company.

## Will I get a receipt for my bill payment?

In the demonstration version, the record of your payment is the entry in your Payment History, which shows the provider, the consumer number, the date and the amount. A live service would also generate a downloadable receipt with a transaction ID that you could show to the utility company if there were ever a dispute.

## Can I pay a bill for someone else?

Yes. A bill is identified only by the consumer number, so you can pay a bill for a parent, relative or neighbour by entering their consumer number. This can itself be a form of charity: paying the utility bill of a family in difficulty is a practical way of helping. Double-check the consumer number before paying, as payments to the wrong number cannot easily be reversed.

## Can I set up automatic bill payments?

Not in the current version. Each bill must be paid manually through the Bills form. Scheduled and recurring payments are a possible future feature.

## I paid the wrong amount or the wrong consumer number. What can I do?

In the demonstration version no real payment is made, so there is nothing to recover; you can add a manual "Income" entry for the same amount if you want your ledger to reflect the correction. In a live service, contact the utility company with the transaction details: overpayments are normally carried forward as a credit on your next bill, and payments to the wrong consumer number may be traced and refunded.

# Mobile Load (Top-up)

## How do I top up a mobile number?

Press "Mobile Load" in the Services row. Choose the network operator, enter the 11-digit mobile number starting with 03, type the top-up amount in PKR and press "Purchase Bundle". The top-up is recorded immediately, your balance goes down, and an entry such as "Jazz Load - 03001234567" appears in your Payment History with the category "Mobile Load".

## Which mobile networks are supported?

You can top up numbers on all four major Pakistani mobile networks: Jazz, Telenor, Zong and Ufone. Make sure you choose the operator the number actually belongs to. Because of mobile number portability, a number's prefix does not always show its current network, so if in doubt ask the person which network they use.

## Can I top up someone else's number?

Yes. Enter any valid mobile number on any supported network. Sending mobile load to family members, students or workers who need to stay in touch is a simple and appreciated way to help.

## What is the minimum and maximum top-up amount?

In the demonstration version, any amount greater than zero is accepted. Real operators set their own limits; typically the minimum top-up is around PKR 100 and there are maximum limits per transaction and per day. Note that government taxes are usually deducted from mobile top-ups in Pakistan, so the credit that arrives on the phone can be lower than the amount paid.

## Does "Purchase Bundle" buy a data or minutes package?

In the current version, "Purchase Bundle" sends the amount as balance (load) to the number. It does not subscribe the number to a specific internet, call or SMS package. After receiving the load, the phone's owner can subscribe to a bundle of their choice through the operator's own app or dialling code.

## The top-up did not arrive on the phone. Why?

In the demonstration version no real top-up is sent, so nothing will arrive on the phone; only the entry in your Payment History is created. In a live service, check that the number and operator were correct, then wait a few minutes, since top-ups are sometimes delayed. If it still has not arrived, contact support with the date, number and amount.

# Adding Cash and Manual Entries

## What does "Add Cash" do?

"Add Cash" opens a form to append an entry to your ledger by hand. Enter a short description in "Descriptor" (for example "Local Grocery" or "Gift from family"), the amount in PKR in "Volume", choose a category in "Classification" and press "Append to Ledger". This is useful for keeping track of cash income and spending that did not go through the app, so that your balance, chart and the Money Helper's advice reflect your real situation.

## How do I record income versus spending?

Choose "Income" as the classification to record money coming in: the amount is added to your balance. Choose any other classification (General, Shopping, Food or Bills) to record spending: the amount is subtracted from your balance. Always type the amount as a positive number; the app works out the direction from the category you choose.

## Does Add Cash put real money into my account?

No. Add Cash records an entry in your ledger only. It does not take money from a card or bank account and does not create real funds. In a live service, adding real money would be done through a deposit from a bank account or a wallet, with its own confirmation screen.

## Which categories can I choose for a manual entry?

The Classification list offers five categories: General, Shopping, Food, Bills and Income. Use General for anything that does not fit the others. Choosing an accurate category makes your Payment History easier to scan and helps the Money Helper notice patterns, such as a high share of spending on food.

# Quick Loan (ReadyCash)

## What is Quick Loan (ReadyCash)?

Quick Loan, also called ReadyCash, is a demonstration of an instant small credit facility. Pressing "Quick Loan" in the Services row shows your pre-approved limit and a short description of the terms. Pressing "Disburse Now" adds the full limit to your balance immediately, and a "ReadyCash Credit Line" entry with the category "Loan" appears in your Payment History.

## How much can I borrow?

The pre-approved limit shown in the app is PKR 15,000, and pressing "Disburse Now" disburses the whole amount at once. You cannot currently choose a smaller amount. Each time you press the button, another PKR 15,000 is added, because the demonstration does not track outstanding loans.

## What are the repayment terms?

The Quick Loan screen states that repayment terms of 15 to 30 days apply with standard markup. In the demonstration version this is descriptive text only: no repayment date is tracked, no markup is calculated, and nothing is ever deducted from your balance. A live credit product would show you the exact repayment date, the total amount to repay and any charges, and would ask you to accept the terms, before any money was disbursed.

## Is Quick Loan compliant with Islamic finance principles?

Islamic finance prohibits riba (interest), so a loan that charges a fixed percentage on the amount borrowed is generally considered impermissible. The phrase "standard markup" in the app is descriptive text in a demonstration; no markup is charged. Shariah-compliant alternatives include Qard al-Hasan (a benevolent loan repaid without any increase), and sale-based structures such as Murabaha, where a bank buys an item and sells it at a disclosed profit. If you are considering any real credit product, ask the provider which structure it uses and consult a qualified scholar.

## Does taking a Quick Loan affect my credit score?

No. The credit score of 785 shown in the dashboard summary is a fixed demonstration value and does not change when you take a Quick Loan. In real life, borrowing and repaying on time can affect your credit record with the State Bank of Pakistan's credit information bureau and with private credit bureaus.

## When should I use a Quick Loan?

A short-term loan is best kept for genuine, temporary emergencies, such as an urgent medical expense a few days before payday, and only when you are confident you can repay it on time. It is not a good way to fund regular spending. Before borrowing, consider whether you can delay the expense, use savings, or ask family for an interest-free Qard al-Hasan. The Money Helper may also suggest using ReadyCash wisely.
