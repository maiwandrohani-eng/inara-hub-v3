# Vercel Deployment Setup Guide

## ✅ Step 1: GitHub Push (COMPLETED ✓)
Your changes have been committed and pushed to GitHub.

---

## 📋 Step 2: Set Up Required Services

### 2A. Neon PostgreSQL Setup
1. Go to https://neon.tech
2. Sign up or log in
3. Create a new project
4. Copy the connection string (looks like: `postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`)
5. **Keep this string safe** - you'll need it for Vercel

### 2B. Cloudflare R2 Setup (for file uploads)
1. Go to https://dash.cloudflare.com
2. Go to **R2** (left sidebar)
3. Click **Create bucket**
   - Name: `inara-uploads`
   - Location: Choose closest to your users
4. Click **Manage R2 API Tokens**
5. Click **Create API Token**
   - Permissions: **Object Read & Write**
6. Copy and save:
   - Account ID
   - Access Key ID
   - Secret Access Key
7. Note your R2 endpoint: `https://[account-id].r2.cloudflarestorage.com`

**Optional:** Set up a custom domain for public access
1. In R2 bucket settings → Custom Domain
2. Add your domain
3. Use this as `R2_PUBLIC_URL`

### 2C. Generate JWT Secret
Run this to generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output - this is your `JWT_SECRET`.

---

## 🚀 Step 3: Deploy to Vercel

### Option A: Using GitHub Integration (Recommended)

1. Go to https://vercel.com
2. Click **Add New Project**
3. Click **Import Git Repository**
4. Select `inara-hub-v3` from the list
5. Click **Import**
6. **Configure Project:**
   - Framework Preset: **Other**
   - Root Directory: `./` (leave as is)
   - Build Command: `npm run install:all && npm run build`
   - Output Directory: `client/dist`
   - Install Command: `npm install && cd server && npm install && cd ../client && npm install`

7. **Click "Environment Variables"** and add all of these:

#### Database (Required)
```
DATABASE_URL=postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

#### Authentication (Required)
```
JWT_SECRET=your-generated-32-character-secret
JWT_EXPIRES_IN=7d
```

#### CORS (Required)
```
CORS_ORIGIN=https://your-app.vercel.app
```
*(Vercel will show you the domain during setup)*

#### Cloudflare R2 (Required for file uploads)
```
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=inara-uploads
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
```

#### Optional R2 Custom Domain
```
R2_PUBLIC_URL=https://your-custom-domain.com
```

#### Optional AI Integration
```
AI_API_KEY=your-api-key (if using AI features)
AI_API_URL=https://router.huggingface.co/v1/chat/completions
AI_MODEL=mistralai/Mistral-7B-Instruct-v0.2
```

#### Production Flag
```
NODE_ENV=production
VERCEL=true
```

8. Click **Deploy**
9. Wait for build to complete (5-10 minutes)
10. You'll see your Vercel URL: `https://your-app.vercel.app`

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link to project
cd /Users/maiwand/inara-hub-v3
vercel link

# Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add JWT_EXPIRES_IN
vercel env add CORS_ORIGIN
vercel env add R2_ACCOUNT_ID
vercel env add R2_ACCESS_KEY_ID
vercel env add R2_SECRET_ACCESS_KEY
vercel env add R2_BUCKET_NAME
vercel env add R2_ENDPOINT
vercel env add NODE_ENV
vercel env add VERCEL

# Deploy
vercel --prod
```

---

## 🗄️ Step 4: Initialize Database

After your first deployment, run database migrations:

### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI if you haven't
npm install -g vercel

# Login and link (if not done already)
vercel login
vercel link

# Pull environment variables
cd server
vercel env pull .env.local

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data (admin user, etc.)
npm run db:seed
```

### Option B: Local Setup

```bash
cd server

# Copy environment file
cp env.example .env

# Edit .env with your Neon connection string
nano .env  # or open in editor

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to Neon
npm run db:push

# Seed initial data
npm run db:seed
```

### What gets seeded:
- Admin user: `admin@inara.org` / `admin123`
- Staff user: `staff@inara.org` / `staff123`
- 8 Work Systems with sample data
- Initial policies and trainings
- System configurations

---

## ✅ Step 5: Verify Deployment

### 5.1 Health Check
Visit: `https://your-app.vercel.app/api/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-07T10:30:00.000Z"
}
```

### 5.2 Test Login
1. Visit: `https://your-app.vercel.app`
2. Login with credentials:
   - Email: `admin@inara.org`
   - Password: `admin123`
3. **CHANGE YOUR PASSWORD IMMEDIATELY!**

### 5.3 Test File Upload
1. Login as admin
2. Go to Admin Panel → Policies (or Templates, Training, etc.)
3. Upload a file (PDF, document, etc.)
4. Verify file appears in Cloudflare R2 bucket

### 5.4 Test R2 Diagnostics
Visit: `https://your-app.vercel.app/api/test-r2`

Expected response (if R2 configured):
```json
{
  "status": "success",
  "message": "R2 connection successful",
  "config": {
    "hasAccountId": true,
    "hasAccessKey": true,
    "hasSecretKey": true,
    "hasBucket": true,
    "bucketName": "inara-uploads"
  }
}
```

If R2 not configured:
```json
{
  "status": "error",
  "message": "R2 upload failed",
  "config": {
    "hasAccountId": false,
    "hasAccessKey": false,
    "hasSecretKey": false
  }
}
```

---

## 🧪 Step 6: Full Feature Testing

### Core Features to Test

#### 1. Authentication
- ✓ Login with admin@inara.org / admin123
- ✓ Login with staff@inara.org / staff123
- ✓ Change password
- ✓ Logout

#### 2. Dashboard
- ✓ View user statistics
- ✓ See work systems available
- ✓ View pending trainings/policies

#### 3. Work Tab
- ✓ View 8 work systems
- ✓ Check access requirements
- ✓ See training/policy prerequisites

#### 4. Training Tab
- ✓ List of available trainings
- ✓ Start a training
- ✓ Complete training with quiz
- ✓ Download certificate

#### 5. Orientation Tab
- ✓ View orientation steps
- ✓ Complete each step
- ✓ Answer questions
- ✓ Mark as complete

#### 6. Policies Tab
- ✓ View policies
- ✓ Read and Certify a policy
- ✓ Acknowledge mandatory policies
- ✓ View policy history/versions

#### 7. Library Tab
- ✓ Search resources
- ✓ Filter by category
- ✓ Download files
- ✓ View access tracking

#### 8. Admin Panel
- ✓ User management (create, edit, delete users)
- ✓ Add training courses
- ✓ Add policies
- ✓ Upload templates
- ✓ Configure work systems

#### 9. File Uploads
- ✓ Upload policy documents
- ✓ Upload training materials
- ✓ Upload templates
- ✓ Verify files in R2 bucket

#### 10. API Endpoints
- ✓ `/api/health` - Health check
- ✓ `/api/test-r2` - R2 diagnostics
- ✓ `/api/auth/login` - Authentication
- ✓ `/api/users/profile` - User profile

---

## 🐛 Troubleshooting

### Build Fails
1. Check Vercel build logs (Deployments → Build Logs)
2. Ensure all environment variables are set
3. Check that `vercel.json` is correct
4. Run `npm run build` locally to test

### API Returns 500 Error
1. Check Vercel function logs (Deployments → Function Logs)
2. Verify DATABASE_URL is set and correct
3. Verify JWT_SECRET is set (32+ characters)
4. Check `/api/health` endpoint for details

### Database Connection Fails
1. Verify DATABASE_URL includes `?sslmode=require`
2. Check that Neon project is running
3. Ensure IP allowlist allows Vercel (usually automatic)
4. Test locally with same connection string

### File Upload Fails
1. Visit `/api/test-r2` to check R2 configuration
2. Verify all R2_* environment variables are set
3. Check Cloudflare dashboard for R2 errors
4. Verify API token has correct permissions

### CORS Errors in Browser
1. Verify CORS_ORIGIN is set correctly
2. Must include protocol: `https://your-app.vercel.app`
3. Redeploy after changing CORS_ORIGIN
4. Check browser console for exact error

### Frontend Doesn't Load
1. Check that `client/dist` was built
2. Verify `VITE_API_URL` if frontend is separate
3. Check Vercel deployment logs
4. Test `/index.html` loads correctly

---

## 📊 Monitoring

### Vercel Dashboard
- **Deployments**: Track all versions
- **Analytics**: View performance metrics
- **Function Logs**: Debug API errors
- **Environment Variables**: Manage secrets

### Neon Dashboard
- **Databases**: Monitor database health
- **Connections**: View active connections
- **Backups**: Check automatic backups
- **Metrics**: Monitor performance

### Cloudflare Dashboard
- **R2**: Monitor storage usage
- **Usage**: Check API requests
- **Analytics**: View access patterns

---

## 🔐 Security Checklist

- [ ] Changed admin password from default
- [ ] JWT_SECRET is unique (32+ characters)
- [ ] R2 API token permissions are read/write only
- [ ] CORS_ORIGIN is set to your domain only
- [ ] DATABASE_URL uses SSL (`?sslmode=require`)
- [ ] Environment variables are not in code
- [ ] No secrets in Git history
- [ ] Vercel project is private (if applicable)

---

## 📞 Quick Reference

| Service | URL | Dashboard |
|---------|-----|-----------|
| Vercel | https://vercel.com | https://vercel.com/dashboard |
| Neon | https://neon.tech | https://console.neon.tech |
| Cloudflare | https://cloudflare.com | https://dash.cloudflare.com |
| Your App | https://your-app.vercel.app | - |

---

## Next Steps

1. ✅ Commit & push to GitHub (DONE)
2. 📋 Gather all credentials (Neon, R2, secrets)
3. 🚀 Deploy to Vercel with environment variables
4. 🗄️ Run database migrations
5. ✅ Test all features
6. 🔐 Secure and monitor

**Status**: Ready to deploy! Follow the steps above in order.
