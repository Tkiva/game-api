
const express = require('express');
const swisseph = require('swisseph');
const path = require('path'); // Node.js built-in for path manipulation

const app = express();
const port = process.env.PORT || 3000; // Use port 3000 for local development, or environment variable for hosting

// IMPORTANT: Set the path to your ephemeris data files
// This assumes your 'ephe' folder is directly inside your project folder.
swisseph.swe_set_ephe_path(path.join(__dirname, 'ephe'));

app.use(express.json()); // To parse JSON request bodies

// A simple test endpoint to make sure the API is running
app.get('/', (req, res) => {
    res.send('Swiss Ephemeris API is running!');
});

// API endpoint to calculate Sun's position for a given date
app.post('/calculate-sun', (req, res) => {
    try {
        const { year, month, day, hour } = req.body; // Expects year, month, day, and optionally hour in the request body
        if (!year || !month || !day) {
            return res.status(400).json({ error: 'Missing required date parameters (year, month, day).' });
        }

        // Convert date to Julian Day (UT - Universal Time)
        const julday_ut = swisseph.swe_julday(year, month, day, hour || 0, swisseph.SE_GREG_CAL);

        // Calculate Sun's position
        // SEFLG_SPEED: include speed information
        // SEFLG_SWIEPH: use the Swiss Ephemeris data files
        const flag = swisseph.SEFLG_SPEED | swisseph.SEFLG_SWIEPH;
        const sunPosition = swisseph.swe_calc_ut(julday_ut, swisseph.SE_SUN, flag);

        if (sunPosition.error) {
            // swisseph.error property indicates an issue
            console.error("Swiss Ephemeris calculation error:", sunPosition.error);
            return res.status(500).json({ error: `Swiss Ephemeris calculation failed: ${sunPosition.error}` });
        }

        res.json({
            date: { year, month, day, hour: hour || 0 },
            sun: {
                longitude: sunPosition.lon,
                latitude: sunPosition.lat,
                speed: sunPosition.speed
            }
        });
    } catch (error) {
        console.error("API Endpoint Error:", error);
        res.status(500).json({ error: 'Internal server error during calculation. Check server logs.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Swiss Ephemeris API listening at http://localhost:${port}`);
});

