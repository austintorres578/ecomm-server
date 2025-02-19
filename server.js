require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.json()); // Ensures JSON body parsing

const PORT = process.env.PORT || 3000;
console.log(`Starting server on port: ${PORT}`);

const YOUR_DOMAIN = process.env.YOUR_DOMAIN || `http://localhost:${PORT}`;

// ✅ Enable CORS
app.use(cors());
app.options('*', cors());

// 🔹 Map product titles to Stripe price IDs
const productPriceMap = {
    "Soylent complete meal - creamy chocolate": "price_1QpHTFJc865jwEq0lm8Os3fc",
    "Soylent complete meal - vanilla bliss": "price_1QpMQSJc865jwEq0o3rJn5Lp",
    "Soylent complete meal - cafe mocha": "price_1QpABCDc865jwEq0xyz123AB",
    // Add more products here
};

// Homepage
app.get('/', (req, res) => {
  res.send('Hi, your server is running!');
});

// ✅ Stripe Checkout Session (Look up price IDs)
app.post('/create-checkout-session', async (req, res) => {
  console.log("Received request to /create-checkout-session");

  try {
    const { cart } = req.body;
    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    console.log("Received cart data:", JSON.stringify(cart, null, 2));

    // 🔹 Convert cart items to Stripe line items
    const lineItems = cart.map(item => {
        const priceId = productPriceMap[item.title]; // Look up price ID
        if (!priceId) {
            console.error(`Error: No priceId found for ${item.title}`);
            return null;
        }
        return {
            price: priceId,
            quantity: item.quantity,
        };
    }).filter(item => item !== null); // Remove null items

    if (lineItems.length === 0) {
      return res.status(400).json({ error: "No valid items in cart" });
    }

    console.log("Formatted Stripe line items:", lineItems);

    // ✅ Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/success.html`,
      cancel_url: `${YOUR_DOMAIN}/cancel.html`,
      automatic_tax: { enabled: true },
    });

    console.log("Session created:", session.id);
    console.log("Returning session URL:", session.url);

    // ✅ Send checkout URL to frontend
    res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Catch-all for 404 errors
app.use((req, res) => {
  res.status(404).send("Route Not Found");
});

// Start the server
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
