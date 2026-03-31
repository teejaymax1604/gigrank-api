const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();

// Absolute simplest CORS setup
app.use(cors());
app.use(express.json());

const SCRAPINGBEE_KEY = 'CM2ZDRJJ74TQIGLC6AAGW7AQSB3STCRLVPYU7YG87PCDIYF96JXXGT3ZRTJPC6KL252NYJHT79YXSVNM';

app.get('/', (req, res) => {
    res.status(200).send('GigRank Server is officially ALIVE');
});

app.post('/api/scrape-fiverr', async (req, res) => {
    const { keyword } = req.body;
    if (!keyword) return res.status(400).json({ error: 'Keyword missing' });

    try {
        const response = await axios.get('https://app.scrapingbee.com/api/v1', {
            params: {
                'api_key': SCRAPINGBEE_KEY,
                'url': `https://www.fiverr.com/search/gigs?query=${encodeURIComponent(keyword)}`,
                'premium_proxy': 'true'
            }
        });

        const $ = cheerio.load(response.data);
        const gigs = [];
        
        $('.gig-card-layout, .search-gig-card').each((i, el) => {
            if (i < 5) {
                const title = $(el).find('h3').text().trim();
                if (title) gigs.push({ title });
            }
        });

        res.json({ success: true, topGigs: gigs, avgPrice: 50 });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Render needs this specific port setup to stay alive
const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
});
