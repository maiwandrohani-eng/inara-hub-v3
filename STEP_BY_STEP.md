# Step-by-Step Deployment Instructions

## Status: ✅ GitHub Push Complete

Your code is now on GitHub. The next steps require external services and credentials.

---

## Step 1: Prepare Your Credentials (Do This First)

### 1A. Get Neon PostgreSQL Connection String
```
1. Go to https://neon.tech
2. Login or sign up
3. Create new project
4. Go to Connection Details
5. Copy the connection string (should include ?sslmode=require)
6. Example: postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

**Save this as**: `DATABASE_URL`

### 1B. Get Cloudflare R2 Credentials
```
1. Go to https://dash.cloudflare.com
2. Left sidebar → R2
3. Click "Create bucket"
4. Name: inara-uploads
5. After creation, go to "Settings"
6. Copy your Account ID (shown at top)
7. Go to "Manage R2 API Tokens"
8. Create API Token:
   - Permissions: Object Read & Write
   - Save the token (only shown once)
```

**Save these as**:
- `R2_ACCOUNT_ID` = your account ID
- `R2_ACCESS_KEY_ID` = the access key from token
- `R2_SECRET_ACCESS_KEY` = the secret from token
- `R2_BUCKET_NAME` = inara-uploads
- `R2_ENDPOINT` = https://[account-id].r2.cloudflarestorage.com

### 1C. Generate JWT Secret
```bash
# Run this command in terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy the output (long hex string)
```

**Save this as**: `JWT_SECRET`

---

## Step 2: Deploy to Vercel

### 2A. Connect Repository to Vercel
```
1. Go to https://vercel.com
2. Click "Add New Project"
3. Click "Import Git Repository"
4. Select "inara-hub-v3" from the list
5. Click "Import"
```

### 2B. Configure Build Settings
When Vercel shows the config screen:
```
Framework: Other
Root Directory: ./
Build Command: npm run install:all && npm run build
Install Command: npm install && cd server && npm install && cd ../client && npm install
Output Directory: client/dist
```

### 2C. Add Environment Variables
On the same page, click "Environment Variables" and add:

**Copy-paste these exactly** (replace the values):

```
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
JWT_SECRET=your-generated-hex-string-from-step-1c
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-app.vercel.app
NODE_ENV=production
VERCEL=true
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=inara-uploads
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
```

### 2D. Deploy
```
1. Click "Deploy" button
2. Wait 5-10 minutes for build
3. When done, Vercel shows your URL: https://xxx.vercel.app
4. Copy that URL
5. Go back to Environment Variables
6. Update CORS_ORIGIN to your actual URL
7. Wait for redeployment to complete
```

**Your app is now LIVE!**

---

## Step 3: Initialize Database (Important!)

Without this, login won't work.

### Option A: Using Vercel CLI (Recommended for macOS)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login
# Opens browser, login with your Vercel account

# 3. Go to project directory
cd /Users/maiwand/inara-hub-v3

# 4. Link to your Vercel project
vercel link
# Select your project from list

# 5. Go to server directory
cd server

# 6. Pull environment variables
vercel env pull .env.local

# 7. Install dependencies
npm install

# 8. Generate Prisma Client
npm run db:generate

# 9. Create database schema
npm run db:push

# 10. Seed initial data (creates admin/staff users)
npm run db:seed
```

When you see:
```
✓ Database has been seeded
```

You're done! The database is ready.

### Option B: Manual Setup (if CLI doesn't work)

```bash
# 1. Go to server directory
cd /Users/maiwand/inara-hub-v3/server

# 2. Create .env file
cp env.example .env

# 3. Edit .env
# Open the file in your editor and replace:
# - DATABASE_URL with your Neon connection string
# - JWT_SECRET with your generated secret
# - CORS_ORIGIN with your Vercel URL
# - R2_* with your Cloudflare credentials

# 4. Install dependencies
npm install

# 5. Generate Prisma Client
npm run db:generate

# 6. Create database schema
npm run db:push

# 7. Seed initial data
npm run db:seed
```

---

## Step 4: Test Your Deployment

### Test 1: Health Check
```
1. Open browser
2. Go to: https://your-app.vercel.app/api/health
3. You should see: {"status":"ok","timestamp":"..."}
```

### Test 2: Login
```
1. Go to: https://your-app.vercel.app
2. Click "Login"
3. Email: admin@inara.org
4. Password: admin123
5. Login should work
6. CHANGE YOUR PASSWORD IMMEDIATELY
```

### Test 3: R2 File Storage
```
1. Go to: https://your-app.vercel.app/api/test-r2
2. If R2 is configured:
   {"status":"success","message":"R2 connection successful",...}
3. If R2 not configured:
   {"status":"error",...,"hasAccountId":false,...}
```

### Test 4: Upload a File
```
1. Login as admin (admin@inara.org)
2. Go to Admin Panel
3. Go to Policies (or Templates, Training)
4. Try to upload a file
5. File should appear in Cloudflare R2 bucket
```

---

## Step 5: Complete Feature Testing

After everything works, test these features:

### Basic Features
- [ ] Can login/logout
- [ ] Dashboard shows statistics
- [ ] Can change password
- [ ] Profile page works

### Platform Features
- [ ] Work Tab - shows 8 systems
- [ ] Training Tab - shows courses
- [ ] Orientation - shows steps
- [ ] Policies - can read and certify
- [ ] Library - can search
- [ ] Admin Panel - can manage content

### File Operations
- [ ] Upload policy documents
- [ ] Upload training materials
- [ ] Upload templates
- [ ] Download files
- [ ] Verify files in R2

### Admin Functions
- [ ] Create new user
- [ ] Add training course
- [ ] Add policy
- [ ] Upload template
- [ ] Configure work systems

---

## What You Should See

### After Step 2 (Deploy):
✅ Build successful
✅ URL assigned (https://your-app.vercel.app)
✅ Frontend loads
❌ API calls might fail (database not ready yet)
❌ Login won't work (database not ready yet)

### After Step 3 (Database Setup):
✅ API health check works
✅ Can login with admin@inara.org
✅ Dashboard loads
✅ File uploads work to R2

### After Step 4 (Testing):
✅ All tests pass
✅ App is fully functional
✅ Ready for production use

---

## Troubleshooting

### "Build failed" on Vercel
1. Go to Vercel dashboard
2. Click your project
3. Go to "Deployments"
4. Click the failed deployment
5. Scroll to "Build Logs" and read the error
6. Common issues:
   - Missing environment variable (check Step 2C)
   - Wrong build command (check Step 2B)
   - npm dependencies issue (try again)

### "Cannot login" / "API 500 error"
1. Database not initialized yet (do Step 3)
2. DATABASE_URL not set or wrong (check Step 2C)
3. JWT_SECRET not set (check Step 2C)

### "File upload fails" / "R2 error"
1. R2 credentials not set (check Step 2C)
2. R2 bucket doesn't exist (create at cloudflare.com)
3. API token permissions wrong (needs Object Read & Write)

### "CORS error in browser"
1. CORS_ORIGIN not set correctly (check Step 2D)
2. Must include full URL: `https://your-app.vercel.app`
3. After fixing, redeploy the app

---

## Time Estimate

- Step 1: 15 minutes (gather credentials)
- Step 2: 10 minutes (deploy to Vercel)
- Step 3: 5 minutes (database setup)
- Step 4: 5 minutes (testing)

**Total: ~35 minutes**

---

## You're All Set! 🎉

Once you complete all 4 steps:
1. Your app is live on Vercel
2. Database is initialized
3. All features are working
4. File uploads work with R2

### Next (Optional):
- Set up custom domain in Vercel
- Set up monitoring/alerts
- Configure backups (Neon handles automatically)
- Monitor R2 storage usage

---

## Quick Links

- Your app: https://your-app.vercel.app
- Vercel dashboard: https://vercel.com/dashboard
- Neon console: https://console.neon.tech
- Cloudflare R2: https://dash.cloudflare.com
- GitHub repo: https://github.com/maiwandrohani-eng/inara-hub-v3

---

## Need Help?

See these files:
- `FIXES_APPLIED.md` - What was fixed and why
- `VERCEL_SETUP.md` - Detailed guide
- `TROUBLESHOOTING.md` - Common issues
- `DEPLOYMENT_QUICK_CHECKLIST.md` - Quick reference
