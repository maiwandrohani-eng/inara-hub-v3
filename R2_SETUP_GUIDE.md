# Cloudflare R2 Setup Guide for Vercel

## Step 1: Verify R2 API Token Permissions

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** → **Manage R2 API Tokens**
3. Find your API token (the one with Access Key ID: `aa2f5149273a984337bedfef71d9fb2a`)
4. **Verify the token has these permissions:**
   - ✅ **Object Read & Write** (required for uploads)
   - ✅ **Bucket: inara-data** (or "All buckets")
   - ✅ **Account: f672838a09e9e6a09d08ce61b5866002**

If the token doesn't have "Object Read & Write" permissions, you need to:
- Create a new API token with the correct permissions
- Update the credentials in Vercel (see Step 2)

## Step 2: Set Environment Variables in Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **inara-hub-v3**
3. Go to **Settings** → **Environment Variables**
4. Add or update these variables:

### Required R2 Variables:

```
R2_ACCOUNT_ID = f672838a09e9e6a09d08ce61b5866002
R2_ACCESS_KEY_ID = aa2f5149273a984337bedfef71d9fb2a
R2_SECRET_ACCESS_KEY = 0a6b7f62c40904dbef1aea0b3a3146594057b0f912b8d26c9e73d1401bd94a66
R2_BUCKET_NAME = inara-data
```

### Optional (but recommended):

```
R2_ENDPOINT = https://f672838a09e9e6a09d08ce61b5866002.r2.cloudflarestorage.com
```

**Important:**
- Set these for **Production**, **Preview**, and **Development** environments
- After adding/updating, **redeploy** your application

## Step 3: Verify Bucket Exists

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** → **Buckets**
3. Verify the bucket **inara-data** exists
4. If it doesn't exist, create it

## Step 4: Test R2 Connection

After setting the environment variables and redeploying:

1. Visit: `https://your-app.vercel.app/api/test-r2`
2. You should see a success message with R2 configuration details
3. If you see an error, check the error message for specific issues

## Step 5: Common Issues

### "Access Denied" Error

**Cause:** R2 API token doesn't have write permissions

**Solution:**
1. Create a new R2 API token in Cloudflare Dashboard
2. Select **"Object Read & Write"** permissions
3. Select bucket **"inara-data"** (or "All buckets")
4. Update `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` in Vercel
5. Redeploy

### "Bucket not found" Error

**Cause:** Bucket name is incorrect or doesn't exist

**Solution:**
1. Verify bucket name in Cloudflare Dashboard
2. Update `R2_BUCKET_NAME` in Vercel if needed
3. Ensure bucket name matches exactly (case-sensitive)

### "Invalid credentials" Error

**Cause:** Access Key ID or Secret Access Key is incorrect

**Solution:**
1. Double-check credentials in Cloudflare Dashboard
2. Ensure no extra spaces or characters in Vercel environment variables
3. Copy-paste credentials directly (don't type them)

## Step 6: Verify Setup

After completing all steps:

1. Try uploading a file (e.g., creating an orientation step with a PDF)
2. Check Vercel function logs for any R2-related errors
3. Visit `/api/test-r2` to verify connection

## Your Current Configuration

Based on your credentials:
- **Account ID:** `f672838a09e9e6a09d08ce61b5866002`
- **Bucket:** `inara-data`
- **Endpoint:** `https://f672838a09e9e6a09d08ce61b5866002.r2.cloudflarestorage.com`

Make sure all these values are set correctly in Vercel environment variables.

