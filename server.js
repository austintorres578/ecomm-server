// This is your test secret API key.
const stripe = require('stripe')('sk_test_51LmVvoJc865jwEq0aO3CUWVJmNwK4ICEWR3lnYov2N49HhnITABLMUV4EpXjrLFv13QX4DfHPl515AUB4ZbLxWUq00q3m8HHY4');
const express = require('express');
const app = express();
app.use(express.static('public'));

const YOUR_DOMAIN = 'http://localhost:3000';


app.post('/create-checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
        price: 'price_1QpHTFJc865jwEq0lm8Os3fc',
        quantity: 1,
      },
      {
        price:'price_1QpMQSJc865jwEq0o3rJn5Lp',
        quantity:1,
      }
    ],
    mode: 'payment',
    success_url: `${YOUR_DOMAIN}/success.html`,
    cancel_url: `${YOUR_DOMAIN}/cancel.html`,
    automatic_tax: {enabled: true},
});

  res.redirect(303, session.url);
});

app.listen(3000, () => console.log('Running on port 3000'));