const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const SCRAPINGBEE_KEY = 'YOUR_KEY_HERE';

app.get('/', (req, res) => res.send('Server is Up!'));

app.post('/api/scrape-fiverr', async (req, res) => {
    try {
        const { keyword } = req.body;
        console.log(`Searching for: ${keyword}`);

        const response = await axios.get('https://app.scrapingbee.com/api/v1', {
            params: {
                'api_key': SCRAPINGBEE_KEY,
                'url': `https://www.fiverr.com/search/gigs?query=${encodeURIComponent(keyword)}`,
                'premium_proxy': 'true'
            },
            timeout: 15000 // 15 second limit
        });

        const $ = cheerio.load(response.data);
        const gigs = [];
        
        // This selector is the most common for Fiverr search results
        $('.gig-card-layout, [data-testid="gig_card"]').each((i, el) => {
            if (i < 5) {
                const title = $(el).find('h3').text().trim();
                const price = $(el).find('.price-wrapper, .price').text().trim();
                if (title) gigs.push({ title, price });
            }
        });

        res.json({ success: true, topGigs: gigs, avgPrice: 45 }); // Hardcoded 45 for testing

    } catch (err) {
        console.error("SCRAPE ERROR:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(process.env.PORT || 3000);
