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
app.options('*', cors()); // Handle preflight requests

// Debug incoming requests
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`);
  next();
});

// Homepage
app.get('/', (req, res) => {
  res.send('Hi, your server is running!');
});

// Stripe Checkout Session (Receives Cart Data)
app.post('/create-checkout-session', async (req, res) => {
  console.log("Received request to /create-checkout-session");

  try {
    const { cart } = req.body; // ✅ Get cart data from frontend
    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    console.log("Received cart data:", cart);

    // 🔹 Convert cart items into Stripe line items
    const lineItems = cart.map(item => ({
      price: item.priceId, // Make sure your frontend stores the correct price ID
      quantity: item.quantity,
    }));

    console.log("Formatted Stripe line items:", lineItems);

    // Create Stripe Checkout session
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
