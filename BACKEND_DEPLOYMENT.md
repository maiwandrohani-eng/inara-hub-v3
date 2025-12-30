# Backend Deployment Guide

Your frontend is deployed on Vercel, but you need to deploy the backend separately. Here are the options:

## Option 1: Railway (Recommended - Easiest)

1. **Go to:** https://railway.app
2. **Sign up/Login** with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Select your repository:** `inara-hub-v3`
5. **Configure:**
   - **Root Directory:** `server`
   - **Build Command:** `npm install && npm run build && npm run db:generate`
   - **Start Command:** `npm start`
6. **Add PostgreSQL:**
   - Click **+ New** → **Database** → **PostgreSQL**
   - Railway will automatically set `DATABASE_URL`
7. **Add Environment Variables:**
   ```
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-min-32-characters
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=https://your-frontend.vercel.app
   ```
8. **Deploy:**
   - Railway will automatically deploy
   - Copy the generated URL (e.g., `https://your-app.railway.app`)

9. **Run Database Migrations:**
   - Go to your Railway project
   - Click on the backend service
   - Open **Shell/Terminal**
   - Run:
     ```bash
     npm run db:push
     npm run db:seed
     ```

10. **Update Vercel:**
    - Go to Vercel project settings
    - **Environment Variables**
    - Add: `VITE_API_URL` = `https://your-app.railway.app`

---

## Option 2: Render

1. **Go to:** https://render.com
2. **New** → **Web Service**
3. **Connect GitHub** and select your repo
4. **Configure:**
   - **Name:** `inara-backend`
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build && npm run db:generate`
   - **Start Command:** `npm start`
5. **Add PostgreSQL:**
   - **New** → **PostgreSQL**
   - Render will set `DATABASE_URL` automatically
6. **Environment Variables:**
   ```
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=your-secret-here
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=https://your-frontend.vercel.app
   ```
7. **Deploy and get URL**

---

## Option 3: Fly.io

1. **Install Fly CLI:** `curl -L https://fly.io/install.sh | sh`
2. **Login:** `fly auth login`
3. **In server directory:**
   ```bash
   cd server
   fly launch
   ```
4. **Add PostgreSQL:**
   ```bash
   fly postgres create
   fly postgres attach <db-name> -a <app-name>
   ```
5. **Set secrets:**
   ```bash
   fly secrets set JWT_SECRET=your-secret
   fly secrets set CORS_ORIGIN=https://your-frontend.vercel.app
   ```
6. **Deploy:** `fly deploy`

---

## After Backend is Deployed

### 1. Update Vercel Environment Variables

Go to your Vercel project:
- **Settings** → **Environment Variables**
- Add: `VITE_API_URL` = `https://your-backend-url.com`
- **Redeploy** the frontend

### 2. Update Backend CORS

In your backend environment variables:
```
CORS_ORIGIN=https://your-frontend.vercel.app
```

### 3. Seed the Database

Connect to your backend (via Railway shell, Render shell, etc.):

```bash
cd server
npm run db:push      # Create tables
npm run db:seed      # Create admin user
```

**Default admin credentials (change after first login):**
- Email: `admin@inara.org`
- Password: `admin123`

### 4. Test the Connection

1. Open your Vercel frontend URL
2. Try to login with the admin credentials
3. Check browser console for API errors
4. Check backend logs for requests

---

## Troubleshooting

### "Login Invalid" Error

**Possible causes:**
1. ✅ Backend not deployed → Deploy backend first
2. ✅ `VITE_API_URL` not set → Add in Vercel environment variables
3. ✅ CORS not configured → Set `CORS_ORIGIN` in backend
4. ✅ Database not seeded → Run `npm run db:seed`
5. ✅ Wrong credentials → Use default admin credentials

### Check Backend Health

Visit: `https://your-backend-url.com/api/health`

Should return: `{"status":"ok","timestamp":"..."}`

### Check API Connection

Open browser console on your Vercel site:
- Look for network errors
- Check if API calls are going to the right URL
- Verify `VITE_API_URL` is being used

---

## Quick Checklist

- [ ] Backend deployed (Railway/Render/Fly.io)
- [ ] PostgreSQL database created and connected
- [ ] Environment variables set in backend
- [ ] Database migrations run (`npm run db:push`)
- [ ] Database seeded (`npm run db:seed`)
- [ ] `VITE_API_URL` set in Vercel
- [ ] `CORS_ORIGIN` set in backend
- [ ] Frontend redeployed on Vercel
- [ ] Test login with admin credentials

---

**Your user data is safe!** It's in the database. You just need to connect the frontend to the backend.

