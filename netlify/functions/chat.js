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
        
        // If no master data available, provide a helpful message
        if (!contextData || contextData.trim() === '' || contextData === 'Tidak ada data tersimpan') {
            contextData = 'Belum ada master data yang tersimpan. Silakan admin mengisi master data terlebih dahulu.';
        }
        
        console.log('Master data from request:', requestMasterData ? 'Available' : 'Not available');
        console.log('Master data from storage:', storedMasterData.content ? 'Available' : 'Not available');
        console.log('Context data length:', contextData.length);
        console.log('Context data preview:', contextData.substring(0, 200) + '...');
        
        // Prepare conversation history
        const messages = [
            {
                role: "system",
                content: `Anda adalah AI Assistant untuk DT Internal Masterdata di Unilever Indonesia. 

MASTER DATA YANG TERSEDIA:
${contextData}

INSTRUKSI PENTING:
1. SELALU gunakan master data di atas sebagai referensi utama untuk menjawab pertanyaan
2. Jika user bertanya "ada data apa saja di master data?" atau "data apa saja yang tersedia?", jelaskan secara spesifik berdasarkan master data yang ada di atas
3. JANGAN memberikan jawaban generic tentang data produk, pelanggan, supplier, dll. jika tidak ada di master data
4. Fokus pada data yang benar-benar ada di master data seperti M1, Monthly Review, ULIP CF-GT, dll.
5. Jika ada data spesifik di master data, sebutkan dengan detail
6. Gunakan bahasa Indonesia yang ramah dan profesional
7. Jika tidak ada data yang relevan di master data, katakan "Data tersebut tidak tersedia dalam master data saat ini"
8. PENTING: Analisis master data di atas dan sebutkan data yang benar-benar ada, bukan data generic
9. Jika master data berisi "M1: Monthly Review", sebutkan itu sebagai data yang tersedia
10. Jika master data berisi "ULIP CF-GT", sebutkan itu sebagai data yang tersedia

CONTOH JAWABAN YANG BENAR:
- Jika user tanya "data apa saja?", jawab berdasarkan data yang ada di master data (M1, Monthly Review, dll.)
- Jika user tanya "data M1", jelaskan detail M1 yang ada di master data
- JANGAN jawab dengan data generic yang tidak ada di master data`
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
                model: 'gpt-4o-mini',
                messages: messages,
                max_tokens: 300,
                temperature: 0,
                top_p: 1,
                presence_penalty: 0,
                frequency_penalty: 0
                stream:true
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
