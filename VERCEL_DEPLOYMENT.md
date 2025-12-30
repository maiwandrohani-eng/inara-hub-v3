# Vercel Deployment Guide
## Frontend + Backend on Vercel → Neon PostgreSQL → Cloudflare R2

This guide covers deploying the entire INARA Platform on Vercel with Neon for the database and Cloudflare R2 for file storage.

---

## Architecture Overview

```
┌─────────────────┐
│   Vercel        │
│  ┌───────────┐  │
│  │ Frontend   │  │ (Static files from client/dist)
│  └───────────┘  │
│  ┌───────────┐  │
│  │ Backend   │  │ (Serverless functions from server/)
│  └───────────┘  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│ Neon  │ │Cloudflare│
│  DB   │ │   R2    │
└───────┘ └─────────┘
```

---

## Prerequisites

1. **Vercel Account** - https://vercel.com
2. **Neon Account** - https://neon.tech (PostgreSQL database)
3. **Cloudflare Account** - https://cloudflare.com (R2 storage)
4. **GitHub Repository** - Your code pushed to GitHub

---

## Step 1: Set Up Neon PostgreSQL

### 1.1 Create Neon Database

1. Go to https://console.neon.tech
2. **Create Project** or select existing
3. **Copy Connection String** - looks like:
   ```
   postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 1.2 Note Your Connection Details

- **Host:** `ep-xxx-xxx.us-east-2.aws.neon.tech`
- **Database:** `neondb` (or your database name)
- **User:** Your Neon username
- **Password:** Your Neon password
- **SSL:** Required (`?sslmode=require`)

---

## Step 2: Set Up Cloudflare R2

### 2.1 Create R2 Bucket

1. Go to https://dash.cloudflare.com
2. Select your account
3. **R2** → **Create bucket**
4. **Bucket name:** `inara-uploads` (or your preferred name)
5. **Location:** Choose closest to your users

### 2.2 Create API Token

1. **R2** → **Manage R2 API Tokens**
2. **Create API Token**
3. **Permissions:** Object Read & Write
4. **Save:**
   - **Account ID**
   - **Access Key ID**
   - **Secret Access Key**

### 2.3 (Optional) Set Up Public Access

1. **R2** → Your bucket → **Settings**
2. **Public Access** → Enable
3. **Custom Domain** (optional) - Set up a custom domain for public URLs
4. **Note the public URL** if using custom domain

---

## Step 3: Deploy to Vercel

### 3.1 Import Project

1. Go to https://vercel.com
2. **Add New Project**
3. **Import Git Repository** → Select `inara-hub-v3`
4. **Configure Project:**
   - **Framework Preset:** Other
   - **Root Directory:** `./` (root)
   - **Build Command:** `npm run build:client && npm run build:server`
   - **Output Directory:** `client/dist`
   - **Install Command:** `npm run install:all`

### 3.2 Configure Environment Variables

In Vercel project settings → **Environment Variables**, add:

#### Database (Neon)
```
DATABASE_URL=postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

#### Authentication
```
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=7d
```

#### CORS
```
CORS_ORIGIN=https://your-app.vercel.app
```

#### Cloudflare R2
```
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=inara-uploads
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://your-custom-domain.com
```
*(R2_PUBLIC_URL is optional - only if you set up a custom domain)*

#### Frontend
```
VITE_API_URL=https://your-app.vercel.app
```

#### Optional: AI Integration
```
AI_API_KEY=your-ai-api-key
AI_API_URL=https://router.huggingface.co/v1/chat/completions
AI_MODEL=mistralai/Mistral-7B-Instruct-v0.2
```

### 3.3 Deploy

1. Click **Deploy**
2. Wait for build to complete
3. Note your deployment URL: `https://your-app.vercel.app`

---

## Step 4: Set Up Database

### 4.1 Run Migrations

After first deployment, you need to run database migrations:

**Option A: Using Vercel CLI (Recommended)**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Run migrations
cd server
vercel env pull .env.local
npm install
npm run db:generate
npm run db:push
npm run db:seed
```

**Option B: Using Neon Console**

1. Go to Neon Dashboard
2. **SQL Editor**
3. Run Prisma migrations manually (or use Prisma Studio)

**Option C: Local Connection**

```bash
# Set DATABASE_URL in your local .env
cd server
cp env.example .env
# Edit .env with your Neon connection string

npm install
npm run db:generate
npm run db:push
npm run db:seed
```

### 4.2 Verify Database

- Default admin user should be created:
  - **Email:** `admin@inara.org`
  - **Password:** `admin123`
- Check tables in Neon Dashboard

---

## Step 5: Configure File Storage

### 5.1 Update Server Code (If Needed)

The server code should automatically use R2 when environment variables are set. Verify:

- `server/src/utils/r2Storage.ts` exists
- File upload routes use R2 functions
- Static file serving uses R2 URLs

### 5.2 Test File Upload

1. Login to your app
2. Go to Admin Panel
3. Upload a file (policy, template, etc.)
4. Verify file appears in R2 bucket

---

## Step 6: Verify Deployment

### 6.1 Health Check

Visit: `https://your-app.vercel.app/api/health`

Should return: `{"status":"ok","timestamp":"..."}`

### 6.2 Test Login

1. Visit: `https://your-app.vercel.app`
2. Login with:
   - **Email:** `admin@inara.org`
   - **Password:** `admin123`
3. Change password immediately!

### 6.3 Test File Upload

1. Upload a document in Admin Panel
2. Verify it's accessible
3. Check R2 bucket for the file

---

## Step 7: Custom Domain (Optional)

### 7.1 Add Domain in Vercel

1. **Project Settings** → **Domains**
2. **Add Domain**
3. Follow DNS configuration instructions

### 7.2 Update Environment Variables

After adding custom domain:
- Update `CORS_ORIGIN` to include your custom domain
- Update `VITE_API_URL` if needed
- Redeploy

---

## Troubleshooting

### Build Fails

**Error:** "vite: command not found"
- **Solution:** Ensure `installCommand` includes `cd client && npm install`

**Error:** "Cannot find module"
- **Solution:** Check that all dependencies are in `package.json`

### Database Connection Fails

**Error:** "Connection refused" or "SSL required"
- **Solution:** 
  - Ensure `DATABASE_URL` includes `?sslmode=require`
  - Check Neon dashboard for connection string
  - Verify IP allowlist in Neon (if enabled)

### File Upload Fails

**Error:** "R2 configuration missing"
- **Solution:** 
  - Verify all R2 environment variables are set
  - Check R2 bucket name matches
  - Verify API token permissions

**Error:** "File not found" when accessing uploads
- **Solution:**
  - Check R2 bucket for uploaded files
  - Verify `R2_PUBLIC_URL` is set correctly
  - Check file key/path in database

### API Routes Not Working

**Error:** 404 on `/api/*` routes
- **Solution:**
  - Verify `vercel.json` routes configuration
  - Check serverless function is deployed
  - Review Vercel function logs

### CORS Errors

**Error:** "CORS policy blocked"
- **Solution:**
  - Set `CORS_ORIGIN` to your Vercel domain
  - Include protocol: `https://your-app.vercel.app`
  - Redeploy backend

---

## Environment Variables Checklist

- [ ] `DATABASE_URL` - Neon connection string
- [ ] `JWT_SECRET` - Strong secret (32+ chars)
- [ ] `JWT_EXPIRES_IN` - Token expiry (e.g., "7d")
- [ ] `CORS_ORIGIN` - Your Vercel domain
- [ ] `R2_ACCOUNT_ID` - Cloudflare account ID
- [ ] `R2_ACCESS_KEY_ID` - R2 access key
- [ ] `R2_SECRET_ACCESS_KEY` - R2 secret key
- [ ] `R2_BUCKET_NAME` - R2 bucket name
- [ ] `R2_ENDPOINT` - R2 endpoint URL
- [ ] `R2_PUBLIC_URL` - (Optional) Public R2 URL
- [ ] `VITE_API_URL` - Your Vercel domain
- [ ] `NODE_ENV=production`

---

## Cost Estimates

### Vercel
- **Hobby:** Free (suitable for small teams)
- **Pro:** $20/month (recommended for production)
- **Enterprise:** Custom pricing

### Neon
- **Free Tier:** 0.5GB storage, shared CPU
- **Launch:** $19/month (2GB, dedicated CPU)
- **Scale:** $69/month (10GB, better performance)

### Cloudflare R2
- **Free:** 10GB storage, 1M Class A operations/month
- **Paid:** $0.015/GB storage, $4.50 per million Class A operations

**Estimated Monthly Cost (Small Team):**
- Vercel Pro: $20
- Neon Launch: $19
- R2 (10GB): ~$0.15
- **Total: ~$39/month**

---

## Maintenance

### Regular Tasks

1. **Database Backups:** Neon handles automatic backups
2. **Monitor Usage:** Check Vercel, Neon, and R2 dashboards
3. **Update Dependencies:** Regularly update npm packages
4. **Review Logs:** Check Vercel function logs for errors

### Scaling

- **Vercel:** Automatically scales serverless functions
- **Neon:** Upgrade plan for more storage/performance
- **R2:** Pay-as-you-go, scales automatically

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Neon Docs:** https://neon.tech/docs
- **Cloudflare R2 Docs:** https://developers.cloudflare.com/r2

---

**Your platform is now fully deployed with predictable costs and full data ownership! 🎉**
