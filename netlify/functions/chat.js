const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const bodyParser = require('body-parser');

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

// In-memory storage (per function instance)
let masterData = {
    content: '',
    lastUpdated: null,
    updatedBy: ''
};

// Load master data
function loadMasterData() {
    return masterData;
}

// Chat with AI endpoint
app.post('/api/chat', async (req, res) => {
    console.log('POST /api/chat called');
    console.log('Request body:', req.body);
    
    const { message, conversationHistory, masterData: requestMasterData } = req.body;
    
    if (!message) {
        console.log('Error: Message is required');
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        // Use master data from request if available, otherwise use stored data
        const storedMasterData = loadMasterData();
        let contextData = requestMasterData || storedMasterData.content || 'Tidak ada data tersimpan';
        
        console.log('Master data from request:', requestMasterData ? 'Available' : 'Not available');
        console.log('Master data from storage:', storedMasterData.content ? 'Available' : 'Not available');
        console.log('Context data length:', contextData.length);
        
        // Prepare conversation history
        const messages = [
            {
                role: "system",
                content: `Anda adalah AI Assistant untuk DT Internal Masterdata di Unilever Indonesia. Gunakan data berikut sebagai referensi untuk menjawab pertanyaan:

${contextData}

Jawablah dengan bahasa Indonesia yang ramah dan profesional. Fokus pada data internal, master data, dan informasi yang tersimpan dalam sistem DT Internal. Gunakan data yang tersedia untuk memberikan jawaban yang spesifik dan akurat berdasarkan master data yang telah diset. Jika user bertanya tentang data apa saja yang tersedia, jelaskan berdasarkan master data yang ada di sistem.`
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
