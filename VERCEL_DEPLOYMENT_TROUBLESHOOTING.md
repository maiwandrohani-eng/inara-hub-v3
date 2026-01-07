# Vercel Deployment Troubleshooting

## Error: 404 DEPLOYMENT_NOT_FOUND

This error means the deployment URL you're using doesn't exist or the deployment failed.

## Steps to Fix:

### 1. Check Your Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your project: **inara-hub-v3**
3. Check the **Deployments** tab
4. Look for the latest deployment

### 2. Verify Deployment Status

- ✅ **Ready** = Deployment successful, URL should work
- ⏳ **Building** = Still deploying, wait for it to finish
- ❌ **Error** = Deployment failed, check build logs
- ⚠️ **Canceled** = Deployment was canceled, need to redeploy

### 3. Get Your Correct URL

1. In Vercel Dashboard → Your Project → **Deployments**
2. Click on the latest deployment (status should be "Ready")
3. You'll see your deployment URL, for example:
   - `https://inara-hub-v3-abc123.vercel.app` (preview)
   - `https://inara-hub-v3.vercel.app` (production, if domain is set)

### 4. Test the Correct URL

Once you have the correct URL, test:

```
https://YOUR-CORRECT-URL.vercel.app/api/health
```

Should return: `{"status":"ok","timestamp":"..."}`

Then test R2:
```
https://YOUR-CORRECT-URL.vercel.app/api/test-r2
```

### 5. If Deployment Failed

Check the build logs:
1. Vercel Dashboard → Your Project → **Deployments**
2. Click on the failed deployment
3. Check **Build Logs** for errors
4. Common issues:
   - TypeScript compilation errors
   - Missing environment variables
   - Build command failures

### 6. Redeploy if Needed

If the deployment is missing or failed:

**Option A: Automatic (via Git push)**
```bash
git commit --allow-empty -m "trigger: Redeploy to Vercel"
git push origin main
```

**Option B: Manual (via Vercel Dashboard)**
1. Go to Vercel Dashboard → Your Project
2. Click **Deployments** tab
3. Click **Redeploy** on the latest deployment
4. Or click **Deploy** → **Deploy Latest Commit**

### 7. Verify Environment Variables

Make sure all required environment variables are set:
1. Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Verify these are set:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`
   - `CORS_ORIGIN` (should be your Vercel URL)

### 8. Check Function Logs

1. Vercel Dashboard → Your Project → **Functions** tab
2. Look for `/api/index` function
3. Check for runtime errors

## Quick Checklist

- [ ] Deployment exists and is "Ready" in Vercel Dashboard
- [ ] Using the correct URL from Vercel Dashboard
- [ ] All environment variables are set
- [ ] Build completed successfully (check build logs)
- [ ] No TypeScript compilation errors
- [ ] API routes are accessible (test `/api/health` first)

## Still Having Issues?

1. Share your actual Vercel project URL
2. Share the deployment status from Vercel Dashboard
3. Share any error messages from build logs or function logs

