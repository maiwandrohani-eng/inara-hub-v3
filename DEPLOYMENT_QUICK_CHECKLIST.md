# Quick Deployment Checklist

## ✅ Pre-Deployment (Complete These First)

### Services Setup
- [ ] Create Neon PostgreSQL database (https://neon.tech)
  - [ ] Copy connection string
  - [ ] Verify SSL mode is enabled (`?sslmode=require`)
- [ ] Create Cloudflare R2 bucket (https://dash.cloudflare.com)
  - [ ] Create bucket named `inara-uploads`
  - [ ] Create API token with Object Read & Write
  - [ ] Copy: Account ID, Access Key, Secret Key
  - [ ] Copy R2 endpoint URL
- [ ] Generate JWT Secret (32+ characters)
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### GitHub
- [x] Commit all fixes
- [x] Push to main branch

---

## 🚀 Deployment (Do These in Order)

### 1. Vercel Setup
- [ ] Go to https://vercel.com
- [ ] Click "Add New Project"
- [ ] Import `inara-hub-v3` repository
- [ ] Configure project:
  - [ ] Framework: "Other"
  - [ ] Build Command: `npm run install:all && npm run build`
  - [ ] Output Directory: `client/dist`
  - [ ] Root Directory: `./`

### 2. Environment Variables
Add these to Vercel (Project Settings → Environment Variables):

#### Required
- [ ] `DATABASE_URL` = your Neon connection string
- [ ] `JWT_SECRET` = your generated secret
- [ ] `CORS_ORIGIN` = https://your-app.vercel.app (update after seeing URL)
- [ ] `JWT_EXPIRES_IN` = 7d
- [ ] `NODE_ENV` = production
- [ ] `VERCEL` = true

#### R2 (Required for file uploads)
- [ ] `R2_ACCOUNT_ID` = your account ID
- [ ] `R2_ACCESS_KEY_ID` = your access key
- [ ] `R2_SECRET_ACCESS_KEY` = your secret key
- [ ] `R2_BUCKET_NAME` = inara-uploads
- [ ] `R2_ENDPOINT` = your R2 endpoint URL

#### Optional
- [ ] `R2_PUBLIC_URL` = your custom R2 domain (if set up)
- [ ] `AI_API_KEY` = if using AI features
- [ ] `AI_API_URL` = https://router.huggingface.co/v1/chat/completions
- [ ] `AI_MODEL` = mistralai/Mistral-7B-Instruct-v0.2

### 3. Deploy
- [ ] Click "Deploy" button
- [ ] Wait for build to complete (5-10 minutes)
- [ ] Note your Vercel URL: `https://your-app.vercel.app`
- [ ] Update `CORS_ORIGIN` in Vercel with your actual URL
- [ ] Redeploy to apply CORS changes

---

## 🗄️ Database Setup (After First Deploy)

Choose ONE option:

### Option A: Vercel CLI (Recommended)
```bash
npm install -g vercel
vercel login
vercel link
cd server
vercel env pull .env.local
npm install
npm run db:generate
npm run db:push
npm run db:seed
```
- [ ] Ran all commands successfully

### Option B: Local Setup
```bash
cd server
cp env.example .env
# Edit .env with your DATABASE_URL
nano .env
npm install
npm run db:generate
npm run db:push
npm run db:seed
```
- [ ] Seeded database successfully

---

## ✅ Verification (After Deploy & DB Setup)

### Health Check
- [ ] Visit `https://your-app.vercel.app/api/health`
- [ ] Should return JSON with `"status":"ok"`

### R2 Diagnostics
- [ ] Visit `https://your-app.vercel.app/api/test-r2`
- [ ] Should show R2 configuration status

### Login Test
- [ ] Visit `https://your-app.vercel.app`
- [ ] Login with `admin@inara.org` / `admin123`
- [ ] Successfully logged in
- [ ] Changed admin password immediately

### Dashboard Features
- [ ] Dashboard loads and shows statistics
- [ ] Work systems visible
- [ ] User profile accessible

---

## 🧪 Feature Testing

### Core Features
- [ ] Authentication (login/logout works)
- [ ] Dashboard loads
- [ ] Work Tab shows systems
- [ ] Training Tab shows courses
- [ ] Orientation Tab shows steps
- [ ] Policies Tab loads
- [ ] Library Tab searches
- [ ] Admin Panel accessible

### File Uploads
- [ ] Upload a policy document
- [ ] Upload a template
- [ ] File appears in R2 bucket
- [ ] File is downloadable

### Database Features
- [ ] User profile updates
- [ ] Can create new users (admin)
- [ ] Can add trainings (admin)
- [ ] Can add policies (admin)

---

## 🔐 Security Checklist

- [ ] Admin password changed from default
- [ ] No secrets visible in Git
- [ ] CORS_ORIGIN set correctly
- [ ] R2 API token has minimal permissions
- [ ] DATABASE_URL uses SSL
- [ ] Environment variables not in `.env.local` file (in .gitignore)

---

## 📞 If Something Goes Wrong

### Build Failed
1. Check Vercel Deployments → Build Logs
2. Look for error messages
3. Common issues:
   - Missing environment variable
   - npm install failed (run locally first)
   - Build command incorrect in vercel.json

### API Returns 500
1. Check Vercel Deployments → Function Logs
2. Verify all required env vars are set
3. Test `/api/health` for diagnostics

### Database Connection Error
1. Verify DATABASE_URL is correct
2. Check that `?sslmode=require` is included
3. Verify Neon database is running

### File Upload Fails
1. Visit `/api/test-r2` for details
2. Verify all R2_* variables are set
3. Check R2 bucket exists and is accessible

### CORS Error in Browser
1. Verify CORS_ORIGIN matches your domain exactly
2. Must include `https://`
3. Redeploy after changing CORS_ORIGIN

---

## 📋 Detailed Guides

See these files for more information:
- `FIXES_APPLIED.md` - All fixes that were made
- `VERCEL_SETUP.md` - Detailed deployment guide
- `DEPLOYMENT.md` - Additional deployment info
- `TROUBLESHOOTING.md` - Common issues and solutions

---

## Timeline

- [ ] Pre-deployment setup: 15-30 minutes
- [ ] Deploy to Vercel: 5-10 minutes
- [ ] Database migrations: 2-5 minutes
- [ ] Testing: 10-15 minutes

**Total: ~30-60 minutes**

---

## Status

**Current**: ✅ Code committed and pushed to GitHub
**Next**: Gather credentials and deploy to Vercel
