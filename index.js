const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const SB_KEY = 'CM2ZDRJJ74TQIGLC6AAGW7AQSB3STCRLVPYU7YG87PCDIYF96JXXGT3ZRTJPC6KL252NYJHT79YXSVNM'; // <--- KEEP YOUR KEY HERE

app.post('/api/scrape-fiverr', async (req, res) => {
    const { keyword } = req.body;
    try {
        const response = await axios.get('https://app.scrapingbee.com/api/v1', {
            params: {
                'api_key': SB_KEY,
                'url': `https://www.fiverr.com/search/gigs?query=${encodeURIComponent(keyword)}&source=pagination`,
                'premium_proxy': 'true',
                'render_js': 'false'
            },
            timeout: 20000
        });

        const $ = cheerio.load(response.data);
        const topTitles = [];
        const prices = [];

        $('.gig-card-layout, .search-gig-card').each((i, el) => {
            if (i < 15) { // Pull top 15 competitors
                const title = $(el).find('h3, .title').text().trim();
                const priceText = $(el).find('.price, .text-display-7').text().trim();
                const priceNum = parseInt(priceText.replace(/[^0-9]/g, ''));
                
                if (title) topTitles.push(title);
                if (!isNaN(priceNum)) prices.push(priceNum);
            }
        });

        const avgPrice = prices.length ? (prices.reduce((a, b) => a + b) / prices.length).toFixed(0) : "45";

        res.json({ 
            success: true, 
            avgPrice, 
            topTitles, // This is the "Insider Info" for the AI
            competitorCount: topTitles.length 
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(process.env.PORT || 10000);
