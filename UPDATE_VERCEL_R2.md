# Update Vercel R2 Credentials

## Your R2 Credentials

```
R2_ACCOUNT_ID = f672838a09e9e6a09d08ce61b5866002
R2_ACCESS_KEY_ID = f2232270caa9e6bf962cc60ee8d3c5e3
R2_SECRET_ACCESS_KEY = 8976336e7e7a64f625fc342fb603473c71a3a92b466691ed18ca5f74a2edb42e
R2_BUCKET_NAME = inara-data
R2_ENDPOINT = https://f672838a09e9e6a09d08ce61b5866002.r2.cloudflarestorage.com
```

## Step-by-Step: Update Vercel Environment Variables

### 1. Go to Vercel Dashboard

1. Visit: https://vercel.com/dashboard
2. Select your project: **inara-hub-v3**
3. Go to **Settings** → **Environment Variables**

### 2. Update/Create These Variables

**Important:** Make sure the variable names are exactly as shown below (case-sensitive).

#### Required Variables:

1. **R2_ACCOUNT_ID**
   - Value: `f672838a09e9e6a09d08ce61b5866002`
   - Environment: Production, Preview, Development

2. **R2_ACCESS_KEY_ID**
   - Value: `f2232270caa9e6bf962cc60ee8d3c5e3`
   - Environment: Production, Preview, Development

3. **R2_SECRET_ACCESS_KEY**
   - Value: `8976336e7e7a64f625fc342fb603473c71a3a92b466691ed18ca5f74a2edb42e`
   - Environment: Production, Preview, Development
   - ⚠️ **Mark as "Encrypted"** (Vercel should do this automatically for secret values)

4. **R2_BUCKET_NAME**
   - Value: `inara-data`
   - Environment: Production, Preview, Development
   - ⚠️ **Note:** Variable name is `R2_BUCKET_NAME` (not `R2_BUCKET`)

#### Optional (but recommended):

5. **R2_ENDPOINT**
   - Value: `https://f672838a09e9e6a09d08ce61b5866002.r2.cloudflarestorage.com`
   - Environment: Production, Preview, Development

### 3. Verify All Variables

After adding/updating, verify you have:

✅ `R2_ACCOUNT_ID`  
✅ `R2_ACCESS_KEY_ID`  
✅ `R2_SECRET_ACCESS_KEY`  
✅ `R2_BUCKET_NAME` (not `R2_BUCKET`)  
✅ `R2_ENDPOINT` (optional but recommended)

### 4. Redeploy

**Option A: Automatic (via Git)**
```bash
git commit --allow-empty -m "trigger: Redeploy with updated R2 credentials"
git push origin main
```

**Option B: Manual (via Vercel Dashboard)**
1. Go to **Deployments** tab
2. Click **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Or click **Deploy** → **Redeploy Latest Commit**

### 5. Test R2 Connection

After redeployment completes (usually 1-2 minutes):

Visit:
```
https://hub.inara.ngo/api/test-r2
```

**Expected Success Response:**
```json
{
  "status": "success",
  "message": "R2 connection successful",
  "testKey": "test/1234567890-test.txt",
  "uploadedUrl": "https://...",
  "config": {
    "hasAccountId": true,
    "hasAccessKey": true,
    "hasSecretKey": true,
    "hasBucket": true,
    "bucketName": "inara-data",
    "endpoint": "https://f672838a09e9e6a09d08ce61b5866002.r2.cloudflarestorage.com"
  }
}
```

**If you still get "Access Denied":**
1. Double-check that the token in Cloudflare has "Object Read & Write" permissions
2. Verify the Access Key ID matches one of your tokens
3. Make sure you copied the Secret Access Key correctly (no extra spaces)
4. Wait a few minutes for the deployment to fully propagate

### 6. Test File Upload

Once the R2 test passes:

1. Log in to your app at `https://hub.inara.ngo`
2. Go to **Admin Panel** → **Orientation Management**
3. Create a new orientation step with a PDF file
4. The PDF should upload successfully to R2

## Troubleshooting

### Variable Name Mismatch

If you see errors about `R2_BUCKET`:
- The code expects `R2_BUCKET_NAME` (not `R2_BUCKET`)
- Make sure you use the correct variable name in Vercel

### Still Getting "Access Denied"

1. **Verify token permissions in Cloudflare:**
   - Go to Cloudflare Dashboard → R2 → Manage R2 API Tokens
   - Find the token with Access Key ID: `f2232270...`
   - Verify it has "Object Read & Write" permissions
   - Verify it has access to "inara-data" bucket (or "All buckets")

2. **Check Vercel deployment logs:**
   - Go to Vercel Dashboard → Deployments → Latest deployment
   - Click on the deployment to see logs
   - Look for any R2-related errors

3. **Verify environment variables are loaded:**
   - Check the deployment logs for environment variable loading
   - Make sure variables are set for the correct environment (Production/Preview)

### Token Not Found

If the Access Key ID `f2232270...` doesn't match any of your tokens:
- Check which token you're actually using
- The Access Key ID should match one of the tokens in your Cloudflare dashboard
- If it doesn't match, you may need to create a new token or use a different one

