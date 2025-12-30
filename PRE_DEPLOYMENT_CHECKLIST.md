# Pre-Deployment Checklist

Before redeploying on Vercel, ensure you have everything configured:

## ✅ Required Before Deployment

### 1. Neon Database
- [ ] Neon database created
- [ ] Connection string copied (includes `?sslmode=require`)
- [ ] Database is active and accessible

### 2. Environment Variables in Vercel
Go to your Vercel project → **Settings** → **Environment Variables** and add:

#### Required Variables:
- [ ] `DATABASE_URL` - Your Neon connection string
- [ ] `JWT_SECRET` - Strong random string (32+ characters)
- [ ] `JWT_EXPIRES_IN` - Set to `7d`
- [ ] `CORS_ORIGIN` - Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
- [ ] `VITE_API_URL` - Same as CORS_ORIGIN
- [ ] `NODE_ENV` - Set to `production`

#### R2 Variables (Already Provided):
- [x] `R2_ACCOUNT_ID` - `f672838a09e9e6a09d08ce61b5866002`
- [x] `R2_ACCESS_KEY_ID` - `f2232270caa9e6bf962cc60ee8d3c5e3`
- [x] `R2_SECRET_ACCESS_KEY` - `e10c35df6da6306b5bb207161aa6b36668b20f429c9c00279d915fc7630cb8d5`
- [x] `R2_BUCKET_NAME` - `inara-data`
- [x] `R2_ENDPOINT` - `https://f672838a09e9e6a09d08ce61b5866002.r2.cloudflarestorage.com`
- [x] `R2_PUBLIC_URL` - `https://hub.inara.ngo`

### 3. Cloudflare R2 Setup
- [ ] Bucket `inara-data` exists in Cloudflare
- [ ] Custom domain `hub.inara.ngo` is configured in R2 (if using public URLs)
- [ ] R2 API token has read/write permissions

### 4. Generate JWT Secret
If you haven't already, generate a secure JWT secret:

```bash
# On Mac/Linux:
openssl rand -base64 32

# Or use online generator:
# https://randomkeygen.com/
```

## 🚀 Ready to Deploy?

Once all checkboxes above are checked:

1. **Add all environment variables to Vercel**
2. **Redeploy** (or push a new commit to trigger deployment)
3. **After deployment:**
   - Run database migrations: `npm run db:push`
   - Seed database: `npm run db:seed`
   - Test login with: `admin@inara.org` / `admin123`

## ⚠️ Important Notes

- **Don't redeploy yet if:**
  - You haven't set `DATABASE_URL` (deployment will fail)
  - You haven't set `JWT_SECRET` (authentication won't work)
  - You haven't set `CORS_ORIGIN` (frontend can't connect to backend)

- **After first deployment:**
  - You MUST run `npm run db:push` to create database tables
  - You MUST run `npm run db:seed` to create admin user
  - Then you can login and test

## 📝 Quick Setup Commands

After deployment, connect to run migrations:

```bash
# Option 1: Using Vercel CLI
npm i -g vercel
vercel login
vercel link
cd server
vercel env pull .env.local
npm install
npm run db:generate
npm run db:push
npm run db:seed

# Option 2: Local connection (if you have Neon connection string)
cd server
cp env.example .env
# Edit .env with your DATABASE_URL
npm install
npm run db:generate
npm run db:push
npm run db:seed
```

---

**Status:** Check all boxes above, then you're ready to deploy! ✅

