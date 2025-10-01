# 🚀 Full Stack Deployment - Supply Chain AI Assistant

## 🏗️ Arsitektur Production

```
Frontend (Netlify)     Backend (Railway/Render)
├── index.html         ├── server.js
├── _redirects         ├── package.json
└── static files       └── WebSocket support
```

## 🌐 Deployment Steps

### **1. Deploy Backend ke Railway**

1. **Go to Railway.app**
2. **Connect GitHub** repository
3. **Deploy** dengan settings:
   - **Root Directory**: `.` (root)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Port**: `3000`

4. **Environment Variables**:
   ```
   OPENAI_API_KEY=your-api-key-here
   ADMIN_UNLOCK_CODE=ugi354
   CORS_ORIGIN=https://your-netlify-domain.netlify.app
   NODE_ENV=production
   ```

5. **Get Backend URL**: `https://your-app.railway.app`

### **2. Deploy Frontend ke Netlify**

1. **Update Frontend** untuk connect ke backend:
   ```javascript
   // Ganti localhost dengan Railway URL
   const BACKEND_URL = 'https://your-app.railway.app';
   ```

2. **Deploy ke Netlify**:
   - Connect GitHub repository
   - Build command: `npm run build`
   - Publish directory: `public`

3. **Environment Variables**:
   ```
   REACT_APP_BACKEND_URL=https://your-app.railway.app
   ```

### **3. Update CORS**

1. **Railway Backend**: Update `CORS_ORIGIN` dengan Netlify URL
2. **Redeploy** backend
3. **Test** real-time sync

## ✅ **Keuntungan Full Stack:**

- ✅ **Real-time WebSocket** support
- ✅ **Instant sync** master data
- ✅ **Scalable** architecture
- ✅ **Production ready**

## 💰 **Biaya:**

- **Railway**: Free tier (500 hours/month)
- **Netlify**: Free tier (100GB bandwidth)
- **Total**: $0/month untuk development

## 🔧 **Commands untuk Setup:**

```bash
# 1. Update frontend untuk production
# Ganti localhost dengan Railway URL di index.html

# 2. Deploy backend ke Railway
# Connect GitHub → Deploy

# 3. Deploy frontend ke Netlify
# Connect GitHub → Deploy
```

## 🎯 **Result:**

- **Frontend**: `https://your-app.netlify.app`
- **Backend**: `https://your-app.railway.app`
- **Real-time sync**: ✅ Working
- **Admin panel**: ✅ Working
- **AI chat**: ✅ Working
