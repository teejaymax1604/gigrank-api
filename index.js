const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();

// --- FIXED CORS SECTION ---
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
// --------------------------

app.use(express.json());

const SCRAPINGBEE_API_KEY = 'YOUR_SCRAPINGBEE_KEY_HERE'; // <-- MAKE SURE YOUR KEY IS HERE

app.get('/', (req, res) => {
    res.send('GigRank Server is Running!');
});

app.post('/api/scrape-fiverr', async (req, res) => {
    const { keyword } = req.body;
    if (!keyword) return res.status(400).json({ error: 'Keyword is required' });

    const fiverrUrl = `https://www.fiverr.com/search/gigs?query=${encodeURIComponent(keyword)}`;

    try {
        const response = await axios.get('https://app.scrapingbee.com/api/v1', {
            params: {
                'api_key': SCRAPINGBEE_API_KEY,
                'url': fiverrUrl,
                'render_js': 'false',
                'premium_proxy': 'true'
            }
        });

        const $ = cheerio.load(response.data);
        const gigs = [];

        // Updated selector for Fiverr's current layout
        $('.gig-card-layout, .search-gig-card').each((i, el) => {
            if (i < 10) {
                const title = $(el).find('h3, .title').text().trim();
                const price = $(el).find('.price, .text-display-7').text().trim();
                if (title) {
                    gigs.push({ title, price });
                }
            }
        });

        const prices = gigs.map(g => parseInt(g.price.replace(/[^0-9]/g, ''))).filter(p => !isNaN(p));
        const avgPrice = prices.length ? (prices.reduce((a, b) => a + b) / prices.length).toFixed(2) : 0;

        res.json({
            success: true,
            topGigs: gigs,
            avgPrice: avgPrice
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
