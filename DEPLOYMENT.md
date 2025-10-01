# 🚀 Deployment Guide - Supply Chain AI Assistant

## 📋 Prerequisites

1. **GitHub Account** - untuk repository
2. **Netlify Account** - untuk hosting
3. **OpenAI API Key** - untuk AI functionality

## 🔧 Setup Environment Variables

### 1. Buat `.env` file di root project:
```bash
# OpenAI API Configuration
OPENAI_API_KEY=your-code-here

# Server Configuration
PORT=3000
NODE_ENV=production

# Admin Unlock Code (internal use only)
ADMIN_UNLOCK_CODE=ugi354

# CORS Configuration (akan diupdate setelah deploy)
CORS_ORIGIN=https://your-app-name.netlify.app
```

## 🐙 GitHub Setup

### 1. Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial commit: Supply Chain AI Assistant"
```

### 2. Create GitHub Repository
1. Go to GitHub.com
2. Create new repository: `supply-chain-chatbot`
3. Copy repository URL

### 3. Push to GitHub
```bash
git remote add origin https://github.com/yourusername/supply-chain-chatbot.git
git branch -M main
git push -u origin main
```

## 🌐 Netlify Deployment

### Method 1: Connect GitHub Repository (Recommended)

1. **Login to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Login with GitHub

2. **New Site from Git**
   - Click "New site from Git"
   - Choose "GitHub"
   - Select your repository: `supply-chain-chatbot`

3. **Build Settings** (IMPORTANT: Set manually in Netlify UI)
   - **Build command**: (leave EMPTY)
   - **Publish directory**: `.` (root directory)
   - **Functions directory**: `netlify/functions`
   
   ⚠️ **CRITICAL**: Netlify UI might override netlify.toml. 
   Go to Site Settings → Build & Deploy → Build Settings
   and manually set:
   - Build command: (empty)
   - Publish directory: .
   - Functions directory: netlify/functions

4. **Environment Variables**
   - Go to Site settings → Environment variables
   - Add these variables:
     ```
     OPENAI_API_KEY = your-code-here
     ADMIN_UNLOCK_CODE = ugi354
     CORS_ORIGIN = https://your-app-name.netlify.app
     ```

5. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete
   - Your app will be available at: `https://your-app-name.netlify.app`

### Method 2: Manual Deploy

1. **Build Locally**
   ```bash
   npm install
   npm run build
   ```

2. **Deploy to Netlify**
   - Drag and drop `public` folder to Netlify dashboard
   - Or use Netlify CLI: `netlify deploy --prod --dir=public`

## 🔄 Update CORS Origin

Setelah deploy, update CORS origin di Netlify:

1. Go to Site settings → Environment variables
2. Update `CORS_ORIGIN` dengan URL Netlify yang sebenarnya
3. Redeploy site

## 🧪 Testing Deployment

### 1. Test Admin Panel
- Buka: `https://your-app-name.netlify.app`
- Unlock admin dengan code: `ugi354`
- Update master data
- Test save functionality

### 2. Test Visitor Chat
- Buka tab baru (incognito mode)
- Buka: `https://your-app-name.netlify.app`
- Test chat dengan AI
- Verify data sync dari admin

### 3. Test Real-time Sync
- Buka 2 browser/tab
- Tab 1: Unlock admin dengan `ugi354`, update data
- Tab 2: Sebagai visitor, lihat notifikasi update
- Test chat dengan data terbaru

## 🚨 Troubleshooting

### Common Issues:

1. **API Key Error**
   - Pastikan `OPENAI_API_KEY` sudah di-set di Netlify
   - Check API key masih valid

2. **CORS Error**
   - Update `CORS_ORIGIN` dengan URL Netlify yang benar
   - Redeploy setelah update

3. **Build Error**
   - Check `package.json` dependencies
   - Verify build command: `npm run build`

4. **Function Error**
   - Check Netlify Functions logs
   - Verify `netlify/functions/server.js` syntax

### Debug Commands:
```bash
# Test locally
npm run dev

# Test build
npm run build

# Check Netlify logs
netlify logs
```

## 📱 Production Checklist

- [ ] Environment variables configured
- [ ] CORS origin updated
- [ ] Admin unlock code secure
- [ ] API key valid
- [ ] Real-time sync working
- [ ] Mobile responsive
- [ ] Error handling working

## 🔐 Security Notes

- API key sekarang aman di server-side
- Admin unlock code bisa diubah di environment variables
- CORS properly configured
- No sensitive data di frontend

## 📊 Monitoring

- Monitor Netlify Functions usage
- Check OpenAI API usage/billing
- Monitor site performance
- Set up error tracking (optional)

---

**🎉 Your Supply Chain AI Assistant is now live!**

URL: `https://your-app-name.netlify.app`
Admin Unlock Code: `ugi354`
