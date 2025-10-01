# 🚀 Simple Deployment - Supply Chain AI Assistant

## 🎯 **Arsitektur Simple**

```
Frontend (Netlify)     Backend (Netlify Functions)
├── index.html         ├── server.js (API)
├── _redirects         ├── master-data.json (storage)
└── static files       └── persistent storage
```

## ✨ **Cara Kerja:**

1. **Admin update master data** → Save ke `master-data.json`
2. **User refresh page** → Load data terbaru dari file
3. **No real-time needed** → Simple dan reliable

## 🌐 **Deploy ke Netlify:**

### **1. Push ke GitHub**
```bash
git add .
git commit -m "Add persistent storage for master data"
git push origin main
```

### **2. Deploy ke Netlify**
1. Connect GitHub repository
2. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `public`
   - **Functions directory**: `netlify/functions`

### **3. Environment Variables**
```
OPENAI_API_KEY=your-api-key-here
ADMIN_UNLOCK_CODE=ugi354
CORS_ORIGIN=https://your-app.netlify.app
```

## ✅ **Keuntungan:**

- ✅ **Simple architecture** - No complex real-time
- ✅ **Persistent storage** - Data tidak hilang
- ✅ **Free hosting** - Netlify gratis
- ✅ **Reliable** - File-based storage
- ✅ **Easy maintenance** - Satu platform

## 🔧 **Testing:**

1. **Admin**: Unlock dengan `ugi354`, update master data
2. **User**: Refresh page, data terbaru muncul
3. **AI Chat**: Menggunakan data terbaru

## 📁 **File Structure:**

```
chatbot-dt/
├── public/                    # Static files
│   ├── index.html
│   └── _redirects
├── netlify/functions/
│   ├── server.js              # API endpoints
│   └── master-data.json       # Persistent storage
├── build.js                   # Build script
└── netlify.toml              # Netlify config
```

## 🎉 **Result:**

- **URL**: `https://your-app.netlify.app`
- **Admin**: Unlock dengan `ugi354`
- **Storage**: Persistent file-based
- **Sync**: Refresh page untuk data terbaru
