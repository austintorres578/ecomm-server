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

// ✅ Serve static files (including success.html)
app.use(express.static('public'));

// 🔹 Map product titles & purchase types to Stripe price IDs
const productPriceMap = {
    "Soylent complete meal - creamy chocolate": {
        "subscribe": "price_1Qvij1Jc865jwEq0kRwYHaXY",
        "one-time": "price_1QuMQgJc865jwEq0SEME1ENQ",
        "prepaid": "price_1QvijkJc865jwEq0CdVFsYpQ"
    },
    "Soylent complete meal - original": {
        "subscribe": "price_1Qvil6Jc865jwEq0VkcK3ZTM",
        "one-time": "price_1QuMRGJc865jwEq0LkWloA5s",
        "prepaid":"price_1QvilxJc865jwEq0SM5194Me"
    },
    "Soylent complete meal - mint chocolate": {
        "subscribe": "price_1QvinuJc865jwEq0rXqlaFFT",
        "one-time": "price_1QuMRmJc865jwEq0usArREQK",
        "prepaid":"price_1QviodJc865jwEq0v4E1FD6V"
    },
    "Soylent complete meal - Vanilla": {
        "subscribe": "price_1QvipEJc865jwEq0aVD85Lsd",
        "one-time": "price_1QuMSFJc865jwEq0kontY3tj",
        "prepaid":"price_1Qviq3Jc865jwEq0vJk89Yre"
    },
    "Soylent complete meal - Banana": {
        "subscribe": "price_1QviqVJc865jwEq0MR4NBrDk",
        "one-time": "price_1QuMSiJc865jwEq0JByvW7ny",
        "prepaid":"price_1QviqzJc865jwEq0tJIeg71t"
    },
    "Soylent complete meal - Strawberry": {
        "subscribe": "price_1QvirwJc865jwEq0qI7UUxiA",
        "one-time": "price_1QuMT8Jc865jwEq09J7KUUXS",
        "prepaid":"price_1QvirVJc865jwEq0GBw9l6qo"
    }
};

// ✅ Homepage
app.get('/', (req, res) => {
    res.send('Hi, your server is running!');
});

// ✅ Stripe Checkout Session (Look up price IDs using title & purchaseType)
app.post('/create-checkout-session', async (req, res) => {
    console.log("Received request to /create-checkout-session");

    let paymentType = "payment";

    try {
        const { cart } = req.body;
        if (!cart || cart.length === 0) {
            return res.status(400).json({ error: "Cart is empty" });
        }

        console.log("Received cart data:", JSON.stringify(cart, null, 2));

        // Get the referring page (where the request was made from)
        const referringPage = req.headers.referer || `${YOUR_DOMAIN}/shop`; // Default to shop page

        // 🔹 Convert cart items to Stripe line items
        const lineItems = cart.map(item => {
            const product = productPriceMap[item.title]; // Get product by title
            if (!product) {
                console.error(`Error: No product found for title: ${item.title}`);
                return null;
            }

            const priceId = product[item.purchaseType]; // Get price based on purchaseType
            if (!priceId) {
                console.error(`Error: No priceId found for title: ${item.title} with purchaseType: ${item.purchaseType}`);
                return null;
            }

            if (item.purchaseType !== 'one-time') {
                paymentType = "subscription";
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
        console.log("Returning to:", referringPage); // Log where it will return to

        // ✅ Create Stripe Checkout session
        const session = await stripe.checkout.sessions.create({
            line_items: lineItems,
            mode: paymentType,
            success_url: `${YOUR_DOMAIN}/success.html`,
            cancel_url: referringPage, // ✅ Go back to where checkout was initiated
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

// ✅ Catch-all for 404 errors
app.use((req, res) => {
    res.status(404).send("Route Not Found");
});

// ✅ Start the server
app.listen(PORT, () => console.log(`Running on port ${PORT}`));

