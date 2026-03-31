const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const SCRAPINGBEE_API_KEY = 'YOUR_SCRAPINGBEE_KEY';

app.post('/api/scrape-fiverr', async (req, res) => {
    const { keyword } = req.body;
    const url = `https://www.fiverr.com/search/gigs?query=${encodeURIComponent(keyword)}`;

    try {
        const response = await axios.get('https://app.scrapingbee.com/api/v1', {
            params: {
                'api_key': SCRAPINGBEE_API_KEY,
                'url': url,
                'render_js': 'false', // Faster and cheaper
                'premium_proxy': 'true' // Recommended for Fiverr
            }
        });

        const $ = cheerio.load(response.data);
        const gigs = [];

        // Selecting the gig cards (selectors may need occasional updates)
        $('.gig-card-layout').each((i, el) => {
            if (i < 10) { // Get top 10
                gigs.push({
                    title: $(el).find('h3').text().trim(),
                    price: $(el).find('.price').text().trim(),
                    rating: $(el).find('.rating-score').text().trim(),
                    reviews: $(el).find('.rating-count').text().trim()
                });
            }
        });

        res.json({
            success: true,
            topGigs: gigs,
            avgPrice: calculateAvg(gigs)
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

function calculateAvg(gigs) {
    const prices = gigs.map(g => parseInt(g.price.replace(/[^0-9]/g, ''))).filter(p => !isNaN(p));
    return prices.length ? (prices.reduce((a, b) => a + b) / prices.length).toFixed(2) : 0;
}

app.listen(3000, () => console.log('Server running on port 3000'));
