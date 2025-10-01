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

// In-memory storage (shared dalam satu function)
let masterData = {
    content: '',
    lastUpdated: null,
    updatedBy: ''
};

// Load master data
function loadMasterData() {
    return masterData;
}

// Save master data
function saveMasterData(data) {
    try {
        masterData = data;
        console.log('Master data saved:', masterData);
        return true;
    } catch (error) {
        console.error('Error saving master data:', error);
        return false;
    }
}

// Routes
app.get('/api/master-data', (req, res) => {
    console.log('GET /api/master-data called');
    const data = loadMasterData();
    console.log('Master data loaded:', data);
    res.json(data);
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

    // Save to memory
    if (saveMasterData(newData)) {
        console.log('Master data saved successfully');
        res.json({ 
            success: true, 
            message: 'Master data updated and saved successfully',
            data: newData 
        });
    } else {
        console.log('Failed to save master data');
        res.status(500).json({ 
            success: false, 
            error: 'Failed to save master data' 
        });
    }
});

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
                content: `You are an AI Assistant for DT Internal Masterdata. You help team members access and understand internal data and master data information.

MASTER DATA REFERENCE:
${contextData}

INSTRUCTIONS:
- Answer in the same language as the user's question (Indonesian/English)
- Be detailed and specific, always reference the master data when available
- Focus on data accuracy and completeness
- If data is not available in master data, clearly state this
- Provide exact information from the data, not general answers
- Be professional and helpful for internal team use
- Always cite specific data points when answering questions
- When presenting multiple points, use proper numbered lists: 1. 2. 3. 4. etc.
- DO NOT repeat the same number for different points
- Structure your responses with clear numbered sections when appropriate

Remember: You are a data assistant, not a general chatbot. Your primary role is to help users find and understand specific information from the master data.`
            },
            ...conversationHistory,
            {
                role: "user",
                content: message
            }
        ];

        console.log('Calling OpenAI API...');
        console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
        console.log('Context data:', contextData);
        
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
