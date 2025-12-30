# Neon Database Setup Guide

You've connected Neon to GitHub. Now let's deploy the backend and connect it to Neon.

## Step 1: Get Your Neon Database URL

1. **Go to Neon Dashboard:** https://console.neon.tech
2. **Select your project**
3. **Go to Connection Details** or **Connection String**
4. **Copy the connection string** - it looks like:
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

## Step 2: Deploy Backend to Railway (Recommended)

### Option A: Railway Deployment

1. **Go to:** https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. **Select:** `inara-hub-v3`
4. **Configure Service:**
   - **Root Directory:** `server`
   - **Build Command:** `npm install && npm run build && npm run db:generate`
   - **Start Command:** `npm start`

5. **Add Environment Variables:**
   ```
   DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-min-32-characters
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=https://your-frontend.vercel.app
   ```
   ⚠️ **Important:** Paste your Neon connection string for `DATABASE_URL`

6. **Deploy** - Railway will automatically deploy

7. **After deployment, get your backend URL:**
   - Railway will show: `https://your-app.railway.app`
   - Copy this URL

### Option B: Render Deployment

1. **Go to:** https://render.com
2. **New** → **Web Service**
3. **Connect GitHub** → Select `inara-hub-v3`
4. **Configure:**
   - **Name:** `inara-backend`
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build && npm run db:generate`
   - **Start Command:** `npm start`

5. **Environment Variables:**
   ```
   DATABASE_URL=your-neon-connection-string
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=your-secret
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=https://your-frontend.vercel.app
   ```

6. **Deploy**

## Step 3: Run Database Migrations

After the backend is deployed, you need to run migrations to create tables:

### On Railway:
1. Go to your backend service
2. Click **Shell/Terminal**
3. Run:
   ```bash
   npm run db:push
   npm run db:seed
   ```

### On Render:
1. Go to your service
2. Click **Shell**
3. Run:
   ```bash
   npm run db:push
   npm run db:seed
   ```

### Or Locally (if you have Neon connection):
```bash
cd server
# Set DATABASE_URL in .env
npm run db:push
npm run db:seed
```

## Step 4: Verify Database Connection

1. **Check backend health:**
   - Visit: `https://your-backend.railway.app/api/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Check database:**
   - Go to Neon Dashboard
   - Check if tables are created
   - You should see tables like: `User`, `Policy`, `Training`, etc.

## Step 5: Connect Frontend to Backend

1. **Go to Vercel Dashboard**
2. **Your Project** → **Settings** → **Environment Variables**
3. **Add:**
   - **Name:** `VITE_API_URL`
   - **Value:** `https://your-backend.railway.app` (your Railway/Render URL)
4. **Redeploy** your Vercel frontend

## Step 6: Test Login

1. **Visit your Vercel frontend URL**
2. **Login with default admin:**
   - Email: `admin@inara.org`
   - Password: `admin123`
3. **Change password immediately after first login!**

---

## Troubleshooting

### "Database connection failed"

**Check:**
- ✅ Neon connection string is correct
- ✅ Connection string includes `?sslmode=require`
- ✅ Database is active in Neon dashboard
- ✅ IP allowlist in Neon (if enabled) includes Railway/Render IPs

### "Tables don't exist"

**Solution:**
```bash
# Run migrations
npm run db:push
```

### "Login invalid"

**Check:**
- ✅ Backend is deployed and running
- ✅ `VITE_API_URL` is set in Vercel
- ✅ Database is seeded (`npm run db:seed`)
- ✅ CORS_ORIGIN includes your Vercel domain

### Test Database Connection Locally

```bash
cd server
# Create .env file with:
# DATABASE_URL=your-neon-connection-string

npm run db:push
npm run db:seed
```

---

## Quick Checklist

- [ ] Neon database created and connection string copied
- [ ] Backend deployed to Railway/Render
- [ ] `DATABASE_URL` set to Neon connection string
- [ ] All environment variables configured
- [ ] Database migrations run (`npm run db:push`)
- [ ] Database seeded (`npm run db:seed`)
- [ ] Backend health check works (`/api/health`)
- [ ] `VITE_API_URL` set in Vercel
- [ ] Frontend redeployed
- [ ] Login tested successfully

---

## Neon Connection String Format

Your Neon connection string should look like:
```
postgresql://[user]:[password]@[hostname]/[dbname]?sslmode=require
```

Example:
```
postgresql://neondb_owner:abc123@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Important:** Always include `?sslmode=require` for secure connections.

---

## Next Steps After Setup

1. **Change default admin password**
2. **Create additional users** via Admin Panel
3. **Configure work systems** in Admin Panel
4. **Upload policies, trainings, etc.**

Your data is now safely stored in Neon! 🎉

