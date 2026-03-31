const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const SB_KEY = 'CM2ZDRJJ74TQIGLC6AAGW7AQSB3STCRLVPYU7YG87PCDIYF96JXXGT3ZRTJPC6KL252NYJHT79YXSVNM'; // <--- KEEP YOUR KEY HERE

app.get('/', (req, res) => res.send('GigRank Visual Intelligence Active'));

app.post('/api/scrape-fiverr', async (req, res) => {
    try {
        const { keyword } = req.body;
        
        const response = await axios.get('https://app.scrapingbee.com/api/v1', {
            params: {
                'api_key': SB_KEY,
                'url': `https://www.fiverr.com/search/gigs?query=${encodeURIComponent(keyword)}&filter=rating`,
                'premium_proxy': 'true',
                'render_js': 'false'
            },
            timeout: 25000 
        });

        const $ = cheerio.load(response.data);
        const titles = [];
        const prices = [];

        $('.gig-card-layout').each((i, el) => {
            const isAd = $(el).find('.ad-indicator').length > 0;
            if (!isAd && i < 20) {
                const title = $(el).find('h3').text().trim();
                const priceText = $(el).find('.price').text().replace(/[^0-9]/g, '');
                const priceNum = parseInt(priceText);
                if (title) titles.push(title);
                if (!isNaN(priceNum) && priceNum > 30) prices.push(priceNum);
            }
        });

        // Intelligence Logic
        const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b) / prices.length) : 120;
        
        // --- NEW VISUAL STRATEGY LOGIC ---
        // Selecting high-impact keywords for the thumbnail
        const primaryKeyword = keyword.split(' ')[0].toUpperCase();
        const visualKeywords = keyword.split(' ').slice(0, 3).map(w => w.toUpperCase());
        // ------------------------------------

        res.json({
            success: true,
            avgPrice: avgPrice < 80 ? 85 : avgPrice,
            competitorCount: titles.length,
            topTitles: titles,
            suggestedTags: [primaryKeyword, "Dropshipping", "Store Design", "Ecommerce"],
            
            // Send visual data to the frontend
            visualStrategy: {
                heroText: primaryKeyword,
                subTexts: visualKeywords
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(process.env.PORT || 10000, '0.0.0.0');
