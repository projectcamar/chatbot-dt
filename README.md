# 🤖 Supply Chain AI Assistant

AI-powered chatbot untuk supply chain management dengan real-time data sync.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Server
```bash
npm start
```

### 3. Buka Browser
- **Admin**: http://localhost:3000 (unlock dengan code: ugi354)
- **Visitor**: http://localhost:3000 (langsung bisa chat)

## ✨ Fitur

### 🔓 Admin Panel
- Unlock code: `ugi354`
- Update master data via satu kolom besar
- Real-time sync ke semua visitor
- Preview data real-time

### 👥 Visitor Experience
- Chat langsung dengan AI
- Otomatis menggunakan master data terbaru
- Notifikasi saat data diupdate admin
- No login required

### 🔄 Real-time Sync
- Socket.io untuk instant sync
- Master data tersimpan di server
- Backup di localStorage
- Auto-reconnect jika koneksi putus

## 🛠️ Cara Penggunaan

### Untuk Admin:
1. Buka http://localhost:3000
2. Unlock admin dengan code: `ugi354`
3. Paste master data di kolom besar
4. Klik "Simpan Data"
5. Semua visitor otomatis dapat update

### Untuk Visitor:
1. Buka http://localhost:3000
2. Langsung chat dengan AI
3. AI akan menggunakan data terbaru dari admin

## 📁 Struktur File

```
├── server.js              # Backend server
├── index.html             # Frontend
├── netlify/
│   └── functions/
│       └── server.js      # Netlify Functions
├── package.json           # Dependencies
├── netlify.toml          # Netlify config
├── .gitignore            # Git ignore
├── env.example           # Environment template
├── README.md             # Documentation
└── DEPLOYMENT.md         # Deployment guide
```

## 🔧 Technical Details

- **Backend**: Node.js + Express + Socket.io
- **Frontend**: Vanilla HTML/CSS/JS
- **AI**: OpenAI GPT-3.5 Turbo
- **Storage**: In-memory (simple) + localStorage backup
- **Real-time**: WebSocket via Socket.io
- **Deployment**: Netlify + Netlify Functions

## 🚀 Production Deployment

Untuk production, bisa deploy ke:
- **Netlify** (recommended) - frontend + functions
- **Vercel** (frontend) + **Railway** (backend)
- **Heroku** (full stack)
- **DigitalOcean** (VPS)

## 📝 Notes

- Master data disimpan di memory server (restart = reset)
- Untuk production, ganti dengan database (PostgreSQL/MongoDB)
- API key OpenAI aman di environment variables
- Real-time sync bekerja antar browser/tab yang sama
