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

// File path untuk master data
const DATA_FILE = path.join(__dirname, '..', 'master-data', 'master-data.json');

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

// Chat with AI endpoint
app.post('/api/chat', async (req, res) => {
    console.log('POST /api/chat called');
    console.log('Request body:', req.body);
    
    const { message, conversationHistory } = req.body;
    
    if (!message) {
        console.log('Error: Message is required');
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        // Load master data
        const masterData = loadMasterData();
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

        console.log('Calling OpenAI API...');
        console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
        console.log('Messages:', messages);
        
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
        
        console.log('OpenAI response status:', response.status);

        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            const aiResponse = data.choices[0].message.content;
            console.log('AI response generated successfully');
            res.json({ 
                success: true, 
                response: aiResponse 
            });
        } else {
            console.log('Failed to get response from AI');
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

module.exports.handler = serverless(app);
