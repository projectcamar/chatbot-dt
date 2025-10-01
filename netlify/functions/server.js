const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || "*",
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
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving master data:', error);
        return false;
    }
}

// Load initial data
let masterData = loadMasterData();

// Routes
app.get('/.netlify/functions/server/api/master-data', (req, res) => {
    // Reload data from file setiap request
    masterData = loadMasterData();
    res.json(masterData);
});

app.post('/.netlify/functions/server/api/master-data', (req, res) => {
    const { content, updatedBy } = req.body;
    
    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    const newData = {
        content: content,
        lastUpdated: new Date().toISOString(),
        updatedBy: updatedBy || 'admin'
    };

    // Save to file
    if (saveMasterData(newData)) {
        masterData = newData;
        res.json({ 
            success: true, 
            message: 'Master data updated and saved successfully',
            data: masterData 
        });
    } else {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to save master data' 
        });
    }
});

// Chat with AI endpoint
app.post('/.netlify/functions/server/api/chat', async (req, res) => {
    const { message, conversationHistory } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        // Prepare context data
        let contextData = masterData.content || 'Tidak ada data tersimpan';
        
        // Prepare conversation history
        const messages = [
            {
                role: "system",
                content: `Anda adalah AI Assistant untuk Supply Chain Management. Gunakan data berikut sebagai referensi untuk menjawab pertanyaan:

${contextData}

Jawablah dengan bahasa Indonesia yang ramah dan profesional. Fokus pada aspek supply chain, distribusi, logistik, dan operasional. Gunakan data yang tersedia untuk memberikan jawaban yang spesifik dan akurat.`
            },
            ...conversationHistory,
            {
                role: "user",
                content: message
            }
        ];

        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: messages,
                max_tokens: 500,
                temperature: 0.7
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            const aiResponse = data.choices[0].message.content;
            res.json({ 
                success: true, 
                response: aiResponse 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: 'Failed to get response from AI' 
            });
        }

    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Health check
app.get('/.netlify/functions/server/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports.handler = serverless(app);
