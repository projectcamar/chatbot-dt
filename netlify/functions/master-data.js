const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const bodyParser = require('body-parser');
const { getMasterData, setMasterData } = require('./shared-storage');

const app = express();

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || "https://chatbot-dt.netlify.app",
    methods: ["GET", "POST"],
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Load master data from shared storage
function loadMasterData() {
    return getMasterData();
}

// Save master data to shared storage
function saveMasterData(data) {
    try {
        setMasterData(data);
        console.log('Master data saved to shared storage:', data);
        return true;
    } catch (error) {
        console.error('Error saving master data:', error);
        return false;
    }
}

// Routes
app.get('/api/master-data', (req, res) => {
    console.log('GET /api/master-data called');
    // Reload data from file setiap request
    masterData = loadMasterData();
    console.log('Master data loaded:', masterData);
    res.json(masterData);
});

app.post('/api/master-data', (req, res) => {
    console.log('POST /api/master-data called');
    console.log('Request body:', req.body);
    
    const { content, updatedBy } = req.body;
    
    if (!content) {
        console.log('Error: Content is required');
        return res.status(400).json({ error: 'Content is required' });
    }

    const newData = {
        content: content,
        lastUpdated: new Date().toISOString(),
        updatedBy: updatedBy || 'admin'
    };

    console.log('Saving new data:', newData);

    // Save to file
    if (saveMasterData(newData)) {
        masterData = newData;
        console.log('Master data saved successfully');
        res.json({ 
            success: true, 
            message: 'Master data updated and saved successfully',
            data: masterData 
        });
    } else {
        console.log('Failed to save master data');
        res.status(500).json({ 
            success: false, 
            error: 'Failed to save master data' 
        });
    }
});

module.exports.handler = serverless(app);
