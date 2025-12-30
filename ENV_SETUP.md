# Environment Variables Setup

## Quick Reference for Vercel Deployment

Copy these environment variables into your Vercel project settings:

### Database (Neon PostgreSQL)
```
DATABASE_URL=postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```
*Replace with your actual Neon connection string*

### Authentication
```
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=7d
```
*Generate a strong random string for JWT_SECRET (32+ characters)*

### CORS
```
CORS_ORIGIN=https://your-app.vercel.app
```
*Replace with your actual Vercel deployment URL*

### Cloudflare R2 (Already Configured)
```
R2_ACCOUNT_ID=f672838a09e9e6a09d08ce61b5866002
R2_ACCESS_KEY_ID=f2232270caa9e6bf962cc60ee8d3c5e3
R2_SECRET_ACCESS_KEY=e10c35df6da6306b5bb207161aa6b36668b20f429c9c00279d915fc7630cb8d5
R2_BUCKET_NAME=inara-data
R2_ENDPOINT=https://f672838a09e9e6a09d08ce61b5866002.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://hub.inara.ngo
```

### Frontend API URL
```
VITE_API_URL=https://your-app.vercel.app
```
*Replace with your actual Vercel deployment URL (same as CORS_ORIGIN)*

### Optional: AI Integration
```
AI_API_KEY=your-ai-api-key
AI_API_URL=https://router.huggingface.co/v1/chat/completions
AI_MODEL=mistralai/Mistral-7B-Instruct-v0.2
```

### Server Configuration
```
NODE_ENV=production
PORT=5000
```

---

## Setup Steps

1. **Get Neon Connection String:**
   - Go to https://console.neon.tech
   - Copy your connection string
   - Paste as `DATABASE_URL`

2. **Generate JWT Secret:**
   ```bash
   # On Mac/Linux:
   openssl rand -base64 32
   
   # Or use an online generator:
   # https://randomkeygen.com/
   ```

3. **Add All Variables to Vercel:**
   - Project Settings → Environment Variables
   - Add each variable above
   - **Important:** Add for all environments (Production, Preview, Development)

4. **Redeploy:**
   - After adding variables, trigger a new deployment
   - Vercel will automatically use the new variables

---

## Security Notes

⚠️ **Never commit these values to Git!**
- R2 credentials are sensitive
- JWT_SECRET must be kept secret
- Database URL contains credentials

✅ **Best Practices:**
- Use Vercel's environment variable encryption
- Rotate secrets regularly
- Use different values for production/preview
- Never share credentials in chat/email

---

## Verification

After deployment, verify:

1. **Health Check:**
   ```
   https://your-app.vercel.app/api/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **File Upload:**
   - Login to admin panel
   - Upload a test file
   - Verify it's accessible at: `https://hub.inara.ngo/uploads/...`

3. **Database Connection:**
   - Check Vercel function logs
   - Should see no database connection errors

---

## Troubleshooting

### "R2 configuration missing"
- Verify all R2_* variables are set
- Check for typos in variable names
- Ensure values are copied correctly (no extra spaces)

### "Database connection failed"
- Verify DATABASE_URL includes `?sslmode=require`
- Check Neon dashboard for active connection
- Verify credentials are correct

### Files not accessible
- Check R2_PUBLIC_URL is set correctly
- Verify custom domain is configured in Cloudflare
- Check R2 bucket permissions

