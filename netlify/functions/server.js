const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const bodyParser = require('body-parser');

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

// In-memory storage untuk master data
let masterData = {
    content: '',
    lastUpdated: null,
    updatedBy: ''
};

// Routes
app.get('/.netlify/functions/server/api/master-data', (req, res) => {
    res.json(masterData);
});

app.post('/.netlify/functions/server/api/master-data', (req, res) => {
    const { content, updatedBy } = req.body;
    
    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    masterData = {
        content: content,
        lastUpdated: new Date().toISOString(),
        updatedBy: updatedBy || 'admin'
    };

    res.json({ 
        success: true, 
        message: 'Master data updated successfully',
        data: masterData 
    });
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
