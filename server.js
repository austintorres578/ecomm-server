require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const app = express();
app.use(express.static('public'));

const YOUR_DOMAIN = process.env.YOUR_DOMAIN || 'http://localhost:3000';

// Serve "Hi" on the homepage
app.get('/', (req, res) => {
  res.send('Hi');
});

app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: 'price_1QpHTFJc865jwEq0lm8Os3fc',
          quantity: 1,
        },
        {
          price: 'price_1QpMQSJc865jwEq0o3rJn5Lp',
          quantity: 1,
        }
      ],
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/success.html`,
      cancel_url: `${YOUR_DOMAIN}/cancel.html`,
      automatic_tax: { enabled: true },
    });

    res.redirect(303, session.url);
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000; // Make sure it's declared only once
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
