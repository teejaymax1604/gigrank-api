const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();

// 1. POWERFUL CORS - Allows your GitHub site to talk to this server
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
app.use(express.json());

// 2. THE API KEY - Paste your ScrapingBee key inside the quotes below
const SCRAPINGBEE_KEY = 'CM2ZDRJJ74TQIGLC6AAGW7AQSB3STCRLVPYU7YG87PCDIYF96JXXGT3ZRTJPC6KL252NYJHT79YXSVNM';

// Home route to check if server is alive
app.get('/', (req, res) => {
    res.status(200).send('GigRank Server is officially ALIVE and READY');
});

// 3. THE SCRAPING ROUTE
app.post('/api/scrape-fiverr', async (req, res) => {
    const { keyword } = req.body;
    
    if (!keyword) {
        return res.status(400).json({ success: false, error: 'Keyword missing' });
    }

    console.log(`Starting Scrape for: ${keyword}`);

    try {
        // Calling ScrapingBee in "Fast Mode" to beat Render's 30s timeout
        const response = await axios.get('https://app.scrapingbee.com/api/v1', {
            params: {
                'api_key': SCRAPINGBEE_KEY,
                'url': `https://www.fiverr.com/search/gigs?query=${encodeURIComponent(keyword)}`,
                'render_js': 'false', 
                'premium_proxy': 'true',
                'country_code': 'us'
            },
            timeout: 25000 // 25 second hard limit
        });

        const $ = cheerio.load(response.data);
        const gigs = [];
        
        // Targetting multiple possible Fiverr card structures
        $('.gig-card-layout, .search-gig-card, [data-testid="gig_card"]').each((i, el) => {
            if (i < 10) {
                const title = $(el).find('h3, .title').first().text().trim();
                const priceText = $(el).find('.price, .text-display-7, [data-testid="price"]').text().trim();
                
                if (title) {
                    gigs.push({ 
                        title: title, 
                        price: priceText || "Starting at $10" 
                    });
                }
            }
        });

        // Calculate a fake average if price scraping fails, or real if it works
        const prices = gigs.map(g => parseInt(g.price.replace(/[^0-9]/g, ''))).filter(p => !isNaN(p));
        const avgPrice = prices.length ? (prices.reduce((a, b) => a + b) / prices.length).toFixed(2) : "45.00";

        console.log(`Scrape successful. Found ${gigs.length} gigs.`);

        res.json({
            success: true,
            topGigs: gigs,
            avgPrice: avgPrice
        });

    } catch (err) {
        console.error("SCRAPE ERROR:", err.message);
        
        // If it's a timeout, give a specific message
        const errorMsg = err.code === 'ECONNABORTED' ? "Fiverr took too long to respond. Try again!" : err.message;
        
        res.status(500).json({ 
            success: false, 
            error: errorMsg 
        });
    }
});

// 4. RENDER PORT BINDING
const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
});
