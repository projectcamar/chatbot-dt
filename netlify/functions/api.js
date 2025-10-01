const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || "https://chatbot-dt.netlify.app",
    methods: ["GET", "POST"],
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '50mb' })); // Increase limit to 50MB
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

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

// RAG System: Chunking and Indexing
class RAGSystem {
    constructor() {
        this.chunks = [];
        this.index = new Map();
        this.embeddings = new Map();
    }

    // Chunk text into smaller, meaningful pieces
    chunkText(text, chunkSize = 500, overlap = 50) {
        if (!text || text.length === 0) return [];
        
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const chunks = [];
        let currentChunk = '';
        
        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i].trim();
            if (currentChunk.length + sentence.length <= chunkSize) {
                currentChunk += (currentChunk ? '. ' : '') + sentence;
            } else {
                if (currentChunk) {
                    chunks.push({
                        id: crypto.randomUUID(),
                        content: currentChunk + '.',
                        metadata: {
                            chunkIndex: chunks.length,
                            wordCount: currentChunk.split(' ').length,
                            charCount: currentChunk.length
                        }
                    });
                }
                currentChunk = sentence;
            }
        }
        
        if (currentChunk) {
            chunks.push({
                id: crypto.randomUUID(),
                content: currentChunk + '.',
                metadata: {
                    chunkIndex: chunks.length,
                    wordCount: currentChunk.split(' ').length,
                    charCount: currentChunk.length
                }
            });
        }
        
        return chunks;
    }

    // Simple keyword-based indexing
    buildIndex(chunks) {
        this.chunks = chunks;
        this.index.clear();
        
        chunks.forEach(chunk => {
            const words = chunk.content.toLowerCase()
                .replace(/[^\w\s]/g, ' ')
                .split(/\s+/)
                .filter(word => word.length > 2);
            
            words.forEach(word => {
                if (!this.index.has(word)) {
                    this.index.set(word, []);
                }
                this.index.get(word).push(chunk.id);
            });
        });
    }

    // Semantic search using keyword matching and context
    searchRelevantChunks(query, maxResults = 5) {
        if (!query || this.chunks.length === 0) return [];
        
        const queryWords = query.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);
        
        const chunkScores = new Map();
        
        // Score chunks based on keyword matches
        queryWords.forEach(word => {
            if (this.index.has(word)) {
                this.index.get(word).forEach(chunkId => {
                    const currentScore = chunkScores.get(chunkId) || 0;
                    chunkScores.set(chunkId, currentScore + 1);
                });
            }
        });
        
        // Add context-based scoring (simple proximity)
        this.chunks.forEach(chunk => {
            const content = chunk.content.toLowerCase();
            let contextScore = 0;
            
            queryWords.forEach(word => {
                if (content.includes(word)) {
                    contextScore += 0.5;
                }
            });
            
            if (contextScore > 0) {
                const currentScore = chunkScores.get(chunk.id) || 0;
                chunkScores.set(chunk.id, currentScore + contextScore);
            }
        });
        
        // Sort by score and return top results
        return Array.from(chunkScores.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, maxResults)
            .map(([chunkId, score]) => {
                const chunk = this.chunks.find(c => c.id === chunkId);
                return { ...chunk, relevanceScore: score };
            });
    }

    // Process master data with RAG
    processMasterData(content) {
        if (!content || content.length === 0) return '';
        
        const chunks = this.chunkText(content);
        this.buildIndex(chunks);
        
        return {
            chunks: chunks,
            totalChunks: chunks.length,
            indexed: true
        };
    }
}

// Initialize RAG system
const ragSystem = new RAGSystem();

// Routes
app.get('/api/master-data', (req, res) => {
    console.log('GET /api/master-data called');
    const data = loadMasterData();
    console.log('Master data loaded:', data);
    res.json(data);
});

// RAG Search endpoint
app.post('/api/rag-search', (req, res) => {
    try {
        const { query, maxResults = 5 } = req.body;
        
        if (!query) {
            return res.status(400).json({ success: false, error: 'Query is required' });
        }
        
        const masterData = loadMasterData();
        const content = masterData.content || '';
        
        if (!content) {
            return res.json({ success: true, data: { chunks: [], totalChunks: 0 } });
        }
        
        // Process master data with RAG
        const ragResult = ragSystem.processMasterData(content);
        
        // Search for relevant chunks
        const relevantChunks = ragSystem.searchRelevantChunks(query, maxResults);
        
        res.json({
            success: true,
            data: {
                chunks: relevantChunks,
                totalChunks: ragResult.totalChunks,
                query: query,
                resultsCount: relevantChunks.length
            }
        });
    } catch (error) {
        console.error('Error in RAG search:', error);
        res.status(500).json({ success: false, error: 'Failed to perform RAG search' });
    }
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
        // Load master data and process with RAG
        const masterData = loadMasterData();
        let contextData = masterData.content || 'Tidak ada data tersimpan';
        
        // Process master data with RAG system
        if (contextData && contextData.length > 0) {
            const ragResult = ragSystem.processMasterData(contextData);
            console.log(`RAG: Processed ${ragResult.totalChunks} chunks from master data`);
            
            // Search for relevant chunks based on user query
            const relevantChunks = ragSystem.searchRelevantChunks(message, 3);
            
            if (relevantChunks.length > 0) {
                // Use only relevant chunks as context
                contextData = relevantChunks.map(chunk => chunk.content).join('\n\n');
                console.log(`RAG: Using ${relevantChunks.length} relevant chunks (${contextData.length} chars)`);
            } else {
                // Fallback to first few chunks if no relevant chunks found
                const firstChunks = ragResult.chunks.slice(0, 2);
                contextData = firstChunks.map(chunk => chunk.content).join('\n\n');
                console.log('RAG: No relevant chunks found, using first 2 chunks as fallback');
            }
        }
        
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
- ALWAYS increment the number for each new point: 1. first point, 2. second point, 3. third point
- NEVER use the same number twice in a single response
- Use **bold** formatting for section headers like **Penjualan Bersih Q1 2024:**

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
