# Language, Theme and Display

## How do I change the language?

Use the EN, UR and AR buttons at the top of the dashboard. EN switches the app to English, UR to Urdu and AR to Arabic. The highlighted button shows the language that is currently active. The change takes effect immediately; you do not need to reload the page.

## Why does the layout flip when I choose Urdu or Arabic?

Urdu and Arabic are written from right to left, so WaqfApp switches the whole layout to right-to-left when you select either language. Menus, text and buttons are mirrored so that they read in the natural order for those languages. Switching back to English restores the left-to-right layout.

## Does the app remember my language choice?

Not yet. The language returns to English each time the page is loaded. Your theme choice, by contrast, is remembered by your browser. Remembering the language is a planned improvement.

## Why are some words still in English after I change language?

The app's own labels and guidance texts are translated, but some content comes from data that has not been translated: hotel, restaurant and airline names, flight routes, transaction descriptions, the FAQ answers quoted by the assistant, and some labels in the service forms. Proper names such as "Pearl Continental" are normally left in their original form in any case.

## How do I switch between light and dark mode?

Use the three theme buttons at the top of the dashboard: the monitor icon selects System, the sun icon selects Light and the moon icon selects Dark. The highlighted button shows the active theme. Dark is the default the first time you open the app.

## What does the System theme option do?

System makes WaqfApp follow your device's own appearance setting: if your phone or computer is set to dark mode, the app is dark; if it is set to light mode, the app is light. The app checks this setting when you choose System. If you later change your device's setting, reselect System or reload the page for the app to follow it.

## Is my theme choice saved?

Yes. Your theme choice is saved in your browser's local storage, so the app opens with the same theme next time you visit from the same browser. If you clear your browser's site data or use a different browser or device, the app returns to the default dark theme.

## What is the moving 3D background?

The animated background is a three-dimensional scene drawn with Three.js, a graphics library for the web. It reacts to the selected theme and gives the app its distinctive look. It does not affect any of the app's functions. On older or low-powered devices, the 3D background can make the app feel slower; closing other browser tabs or using a newer browser can help.

## Can I use WaqfApp on my phone?

Yes. WaqfApp works in mobile browsers. On smaller screens, the left-hand sidebar is hidden to make room for the content, and the dashboard sections stack vertically so that you can scroll through them. For the best experience, use an up-to-date version of Chrome, Safari or Edge.

## Is WaqfApp accessible for people with visual impairments?

WaqfApp supports a high-contrast dark theme and a light theme, and uses large controls for the main services. Some areas still need improvement for screen readers, for example icon-only buttons such as the cart, feedback and theme buttons do not yet have descriptive labels, and some text is very small. You can use your browser's zoom (Ctrl and + on a computer, or pinch to zoom on a phone) to enlarge the interface. Accessibility feedback is very welcome through the Feedback button.

# Feedback and Reviews

## How do I leave feedback about WaqfApp?

Press the speech-bubble icon at the top of the dashboard to open the Feedback window. Choose a rating from one to five stars, write your comments in the text box ("Share your thoughts on our services...") and press "Submit Review". Your review then appears in the "Community Voices" list below the form.

## Can I edit my review after submitting it?

Yes. In the Community Voices list, press the edit button beside your review. The form above is filled with your earlier rating and text; make your changes and press "Update Review". To abandon your changes, press "Cancel Edit".

## Who can see my review?

Everyone using the same copy of WaqfApp can see all reviews in the Community Voices list, together with the username of the account that wrote them. Because the demonstration account is shared, all reviews appear under the demonstration account's username. Do not include personal information in a review.

## Can I delete a review?

Not in the current version. Reviews can be edited but not deleted from within the app. In the demonstration version, all reviews are cleared when the server restarts. If you want to withdraw a review, you can edit it to remove its content.

## Does the team read the feedback?

Yes. Feedback is the main way the WaqfApp team learns which features to add next and which parts of the app are confusing. Suggestions for new features, questions that the Help Center assistant could not answer, and reports of problems are all especially useful.

## Where can I get help if the FAQ does not answer my question?

Start with the Help Center assistant, which searches this FAQ for you. If it cannot help, leave a review describing your question through the Feedback button. Developers can also open an issue on the project's GitHub repository.

# Troubleshooting

## The app shows only a dark screen. What should I do?

A dark screen usually means the app is still loading or could not start your session. Wait up to half a minute: the first load after the server starts can be slow while the app is prepared. Then reload the page. If the screen remains dark, check that the server is running and that you are using the correct address, and try a different browser to rule out a browser extension blocking scripts.

## Why is the first load so slow?

When the server starts in development mode, the app's code is prepared the first time a browser requests it, and the Help Center assistant builds its search index from this FAQ in the background. On the very first start, the assistant's embedding model is also downloaded once. These steps happen only once per start-up; later page loads are much faster.

## A form says "Please fill in every field with a valid amount". What is wrong?

This message appears when a required field is empty or the amount is not a positive number. Check that you entered the recipient, consumer number, mobile number or description, as appropriate, and that the amount is greater than zero and contains only digits (and optionally a decimal point). Remove commas and currency symbols from the amount.

## I see "Request could not be completed". What does this mean?

The server received your request but refused it, for example because your session token had expired or the server was restarted while the page was open. Reload the page to start a fresh session and try again. If the message keeps appearing, the server may have encountered an error; the server's console log will show the details.

## I see "System interruption". What does this mean?

"System interruption" means that your browser could not reach the server at all, usually because the server has stopped or your network connection has dropped. Check your connection and that the server is still running, then reload the page.

## My transactions disappeared. Where did they go?

In the demonstration version, all data, including transactions, reviews and your Portfolio, is held in the server's memory. When the server restarts, everything returns to its starting state: the demonstration balance and sample transactions come back and anything created since is lost. This is expected behaviour for a demonstration and not a fault.

## The balance chart shows a strange line. Why?

The first three points of the chart (January to March) are fixed sample values, while the last point is your current balance. If you have made large payments or taken several Quick Loans, the final point can be far above or below the earlier ones, making the line look steep. This is expected.

## The Help Center assistant says it is still loading. What should I do?

When the server starts, the assistant builds its index of this FAQ, which can take from a few seconds to a minute on slower computers, and longer on the very first start while the embedding model downloads. Wait a moment and ask again. If the message persists, check the server's console for errors.

## The assistant's replies are in English even though I chose Urdu. Why?

By default, the assistant quotes the FAQ, which is written in English. It understands Urdu and Arabic questions, but it does not translate the answers itself. Replies in Urdu or Arabic require the optional local language model to be installed on the server.

## The 3D background makes my device slow or hot. Can I turn it off?

There is no setting to turn the 3D background off in the current version. To reduce the load, close other tabs and applications, make sure your browser is up to date, and enable hardware acceleration in your browser's settings. Light mode does not reduce the load.

## The page looks broken or the layout is overlapping. What can I do?

Reload the page with a hard refresh (Ctrl+Shift+R on Windows, Cmd+Shift+R on a Mac) to make sure you have the latest version. Check that your browser is up to date; WaqfApp needs a modern browser. If you have zoomed the page, reset the zoom with Ctrl+0. If the problem continues, describe it in a review, including your device and browser.

## The QR scanner does not open my camera. Is it broken?

No. The QR scanner screen in the current version is a preview: it shows the scanning frame but does not activate the camera or read codes. Press "Terminate Scanner" to close it.

## The Send Money, Bills or Mobile Load form ignores what I typed. Why?

This was a bug in an earlier version, in which those forms submitted fixed example values instead of your entries. It has been fixed: the forms now submit exactly what you type and select. If you still see the old behaviour, do a hard refresh to load the latest version of the app.

## Flight bookings or "Initialize Settlement" did nothing. Why?

These were bugs in an earlier version: flight bookings were sent to a server route that did not exist, and the "Initialize Settlement" button in the Portfolio had no action. Both now work: confirmed flights are recorded as Travel transactions, and settling the Portfolio books every item and empties it. Do a hard refresh if you still see the old behaviour.

## How do I report a bug?

Use the Feedback button to describe what you were doing, what you expected to happen and what actually happened, together with your device and browser. Developers can open an issue on the project's GitHub repository with the same information and, ideally, any error messages from the browser console or the server log.
