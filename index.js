const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const SB_KEY = 'CM2ZDRJJ74TQIGLC6AAGW7AQSB3STCRLVPYU7YG87PCDIYF96JXXGT3ZRTJPC6KL252NYJHT79YXSVNM'; // <--- MAKE SURE YOUR KEY IS HERE

app.get('/', (req, res) => res.send('GigRank Engine is Online'));

app.post('/api/scrape-fiverr', async (req, res) => {
    const { keyword } = req.body;
    try {
        const response = await axios.get('https://app.scrapingbee.com/api/v1', {
            params: {
                'api_key': SB_KEY,
                'url': `https://www.fiverr.com/search/gigs?query=${encodeURIComponent(keyword)}`,
                'premium_proxy': 'true',
                'render_js': 'false'
            },
            timeout: 22000
        });

        const $ = cheerio.load(response.data);
        const prices = [];
        const titles = [];

        $('.gig-card-layout, .search-gig-card').each((i, el) => {
            if (i < 15) {
                const title = $(el).find('h3, .title').text().trim();
                const priceText = $(el).find('.price, .text-display-7').text().trim();
                const priceNum = parseInt(priceText.replace(/[^0-9]/g, ''));
                
                if (title) titles.push(title);
                if (!isNaN(priceNum)) prices.push(priceNum);
            }
        });

        const avgPrice = prices.length ? (prices.reduce((a, b) => a + b) / prices.length).toFixed(0) : "45";

        res.json({ 
            success: true, 
            avgPrice, 
            competitorCount: titles.length,
            topTitles: titles 
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(process.env.PORT || 10000);
