# Vercel Deployment Guide

## Frontend-Only Deployment (Recommended for Vercel)

Vercel is optimized for frontend deployments. For the INARA Platform, you have two options:

### Option 1: Deploy Frontend to Vercel (Recommended)

1. **In Vercel Dashboard:**
   - Go to your project settings
   - Set **Root Directory** to `client`
   - Set **Build Command** to `npm run build`
   - Set **Output Directory** to `dist`
   - Set **Install Command** to `npm install`

2. **Environment Variables:**
   - Add `VITE_API_URL` pointing to your backend API
   - Example: `https://api.yourdomain.com` or `https://your-backend.railway.app`

3. **Deploy:**
   - Vercel will automatically detect the Vite project
   - Build will run from the `client` directory

### Option 2: Deploy from Root (Current Setup)

The `vercel.json` is configured to:
- Install dependencies in the `client` directory
- Build the frontend
- Serve from `client/dist`

**Note:** You'll need to configure the API proxy in `vercel.json` to point to your backend URL.

## Backend Deployment

The backend should be deployed separately to:
- **Railway** (recommended)
- **Render**
- **Fly.io**
- **AWS/Google Cloud/Azure**
- **Your own VPS**

### Backend Environment Variables

Set these in your backend hosting platform:

```env
DATABASE_URL="postgresql://..."
PORT=5000
NODE_ENV=production
JWT_SECRET="your-secret"
CORS_ORIGIN="https://your-frontend.vercel.app"
```

## Quick Setup

### 1. Deploy Backend First

```bash
# On Railway/Render/etc.
# Set environment variables
# Deploy from server/ directory or root
```

### 2. Deploy Frontend to Vercel

1. Import GitHub repository
2. Configure:
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add environment variable:
   - `VITE_API_URL` = your backend URL
4. Deploy

### 3. Update CORS

In your backend `.env`:
```env
CORS_ORIGIN="https://your-app.vercel.app"
```

## Troubleshooting

### Build Fails: "vite: command not found"

**Solution:** Make sure Vercel is installing dependencies in the `client` directory:
- Set Root Directory to `client`, OR
- Use the `vercel.json` configuration provided

### API Calls Fail

**Solution:** 
1. Set `VITE_API_URL` environment variable in Vercel
2. Update backend `CORS_ORIGIN` to include your Vercel domain
3. Check that backend is accessible from the internet

### 404 on Routes

**Solution:** The `vercel.json` includes rewrites for SPA routing. If deploying from root, ensure rewrites are configured.

## Alternative: Monorepo Setup

If you want to deploy both frontend and backend from Vercel:

1. Create two Vercel projects:
   - One for frontend (root: `client`)
   - One for backend (root: `server`)

2. Or use Vercel's monorepo support with separate configurations.

---

**Recommended Architecture:**
- **Frontend:** Vercel (automatic HTTPS, CDN, edge functions)
- **Backend:** Railway/Render (PostgreSQL + Node.js)
- **Database:** Managed PostgreSQL (Railway, Supabase, Neon)

