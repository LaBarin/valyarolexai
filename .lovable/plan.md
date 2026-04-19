
The user sees a pink/magenta label behind the navbar at the top of the page. Looking at App.tsx, `<PaymentTestModeBanner />` renders above the AuthProvider/Routes. That's almost certainly the pink banner — it shows when Paddle is in test/sandbox mode.

Let me confirm by viewing it.
