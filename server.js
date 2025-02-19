require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Import CORS package
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.json()); // Ensures JSON body parsing

const PORT = process.env.PORT || 3000; // Render assigns PORT dynamically
console.log(`Starting server on port: ${PORT}`); // Debug log

const YOUR_DOMAIN = process.env.YOUR_DOMAIN || `http://localhost:${PORT}`;

// ✅ Enable CORS for all origins
app.use(cors());

// ✅ Handle preflight requests (important for certain HTTP methods like POST)
app.options('*', cors());

// Debug incoming requests
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`);
  next();
});

// Homepage
app.get('/', (req, res) => {
  res.send('Hi, your server is running!');
});

// Stripe Checkout Session
app.post('/create-checkout-session', async (req, res) => {
  console.log("Received request to /create-checkout-session");

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        { price: 'price_1QpHTFJc865jwEq0lm8Os3fc', quantity: 1 },
        { price: 'price_1QpMQSJc865jwEq0o3rJn5Lp', quantity: 1 }
      ],
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/success.html`,
      cancel_url: `${YOUR_DOMAIN}/cancel.html`,
      automatic_tax: { enabled: true },
    });

    console.log("Session created:", session.id);
    console.log("Redirecting to:", session.url);

    // ✅ Send JSON response with the session URL (better for frontend handling)
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
