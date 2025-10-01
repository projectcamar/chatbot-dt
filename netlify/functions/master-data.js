const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

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

// File path untuk persistent storage
const DATA_FILE = path.join(__dirname, 'master-data.json');

// Load master data from file
function loadMasterData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading master data:', error);
    }
    return {
        content: '',
        lastUpdated: null,
        updatedBy: ''
    };
}

// Save master data to file
function saveMasterData(data) {
    try {
        // Ensure directory exists
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        console.log('Master data saved successfully to:', DATA_FILE);
        return true;
    } catch (error) {
        console.error('Error saving master data:', error);
        console.error('DATA_FILE path:', DATA_FILE);
        return false;
    }
}

// Load initial data
let masterData = loadMasterData();

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
