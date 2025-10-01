const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
    credentials: true
};

const io = socketIo(server, {
    cors: corsOptions
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '50mb' })); // Increase limit to 50MB
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

// In-memory storage untuk master data (simple solution)
let masterData = {
    content: '',
    lastUpdated: null,
    updatedBy: ''
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Get current master data
app.get('/api/master-data', (req, res) => {
    res.json(masterData);
});

// Update master data (admin only)
app.post('/api/master-data', (req, res) => {
    const { content, updatedBy } = req.body;
    
    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    masterData = {
        content: content,
        lastUpdated: new Date().toISOString(),
        updatedBy: updatedBy || 'admin'
    };

    // Broadcast update to all connected clients
    io.emit('masterDataUpdated', masterData);

    res.json({ 
        success: true, 
        message: 'Master data updated successfully',
        data: masterData 
    });
});

// Chat with AI endpoint
app.post('/api/chat', async (req, res) => {
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

Jawablah dengan bahasa Indonesia yang ramah dan profesional. Fokus pada aspek supply chain, distribusi, logistik, dan operasional. Gunakan data yang tersedia untuk memberikan jawaban yang spesifik dan akurat.

PENTING: Ketika menyajikan beberapa poin, gunakan daftar bernomor yang benar: 1. 2. 3. 4. dst. JANGAN mengulang nomor yang sama untuk poin yang berbeda. SELALU increment nomor untuk setiap poin baru: 1. poin pertama, 2. poin kedua, 3. poin ketiga. JANGAN PERNAH menggunakan nomor yang sama dua kali dalam satu respons. Gunakan format **tebal** untuk header bagian seperti **Penjualan Bersih Q1 2024:**`
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

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Send current master data to newly connected client
    socket.emit('masterDataUpdated', masterData);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Master data endpoint: http://localhost:${PORT}/api/master-data`);
});
