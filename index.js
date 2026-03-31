const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// REPLACE THIS WITH YOUR REAL KEY
const SCRAPINGBEE_KEY = 'CM2ZDRJJ74TQIGLC6AAGW7AQSB3STCRLVPYU7YG87PCDIYF96JXXGT3ZRTJPC6KL252NYJHT79YXSVNM'; 

app.get('/', (req, res) => res.send('GigRank is Live!'));

app.post('/api/scrape-fiverr', async (req, res) => {
    const { keyword } = req.body;
    if (!keyword) return res.status(400).json({ error: 'Keyword required' });

    try {
        console.log(`Starting scrape for: ${keyword}`);
        
        const response = await axios.get('https://app.scrapingbee.com/api/v1', {
            params: {
                'api_key': SCRAPINGBEE_KEY,
                'url': `https://www.fiverr.com/search/gigs?query=${encodeURIComponent(keyword)}`,
                'render_js': 'true',
                'premium_proxy': 'true',
                'wait_for': '.gig-card-layout'
            },
            timeout: 25000 // Safer limit for Render
        });

        const $ = cheerio.load(response.data);
        const gigs = [];

        // Selecting top 5 gigs
        $('.gig-card-layout, [data-testid="gig_card"]').each((i, el) => {
            if (i < 5) {
                const title = $(el).find('h3').text().trim();
                const priceText = $(el).find('.price-wrapper, .price').text().trim();
                if (title) {
                    gigs.push({ title, price: priceText || "$--"});
                }
            }
        });

        // Calculate average from prices found
        const prices = gigs.map(g => parseInt(g.price.replace(/[^0-9]/g, ''))).filter(p => !isNaN(p));
        const avg = prices.length ? (prices.reduce((a, b) => a + b) / prices.length).toFixed(0) : 50;

        res.json({ success: true, topGigs: gigs, avgPrice: avg });

    } catch (err) {
        console.error("Error:", err.message);
        res.status(500).json({ success: false, error: "Scrape timed out or failed. Try a simpler keyword!" });
    }
});

const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => console.log(`Server on port ${port}`));
