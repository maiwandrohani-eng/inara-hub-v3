# Fix R2 Access Denied Error

## Current Status

✅ R2 credentials are configured in Vercel  
✅ R2 endpoint is accessible  
❌ R2 API token lacks **write permissions**

## Error Message

```
R2 Access Denied: Check that your R2 credentials have write permissions for bucket "inara-data"
```

## Solution: Update R2 API Token Permissions

### Step 1: Go to Cloudflare Dashboard

1. Visit: https://dash.cloudflare.com/
2. Navigate to **R2** → **Manage R2 API Tokens**

### Step 2: Find Your Token

Your Access Key ID starts with: `aa2f5149...` or `f2232270...`

### Step 3: Check Token Permissions

The token needs:
- ✅ **Object Read & Write** permissions (not just Read)
- ✅ Access to bucket **"inara-data"** (or "All buckets")

### Step 4: Create New Token (if needed)

If your current token doesn't have write permissions:

1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API Token**
3. Configure:
   - **Token Name**: `inara-hub-write-access`
   - **Permissions**: 
     - ✅ **Object Read & Write**
   - **TTL**: Optional (or leave blank for no expiration)
   - **Bucket Access**: 
     - Select **"inara-data"** bucket
     - OR select **"All buckets"** if you have multiple buckets
4. Click **Create API Token**
5. **Copy the credentials immediately** (you won't see them again):
   - Access Key ID
   - Secret Access Key

### Step 5: Update Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Update these variables:
   - `R2_ACCESS_KEY_ID` = Your new Access Key ID
   - `R2_SECRET_ACCESS_KEY` = Your new Secret Access Key
3. **Important**: Make sure these are set for **Production**, **Preview**, and **Development** environments

### Step 6: Redeploy

After updating environment variables, redeploy:

**Option A: Automatic (via Git)**
```bash
git commit --allow-empty -m "trigger: Redeploy with updated R2 credentials"
git push origin main
```

**Option B: Manual (via Vercel Dashboard)**
1. Go to **Deployments** tab
2. Click **⋯** (three dots) on latest deployment
3. Click **Redeploy**

### Step 7: Test Again

After redeployment, test the R2 connection:

```
https://hub.inara.ngo/api/test-r2
```

You should see:
```json
{
  "status": "success",
  "message": "R2 connection successful",
  ...
}
```

## Verify Token Permissions

To verify your token has the correct permissions:

1. Go to Cloudflare Dashboard → R2 → Manage R2 API Tokens
2. Find your token
3. Check the **Permissions** column:
   - Should show: **Object Read & Write**
4. Check the **Buckets** column:
   - Should show: **inara-data** (or **All buckets**)

## Troubleshooting

### Still Getting "Access Denied"?

1. **Double-check token permissions**:
   - Must be "Object Read & Write" (not just "Read")
   - Must have access to "inara-data" bucket

2. **Verify environment variables in Vercel**:
   - Go to Settings → Environment Variables
   - Check that `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` are correct
   - Make sure they're set for the correct environment (Production/Preview)

3. **Wait for deployment to complete**:
   - Environment variables are only picked up on new deployments
   - Check Vercel deployment logs to confirm variables are loaded

4. **Check R2 bucket name**:
   - Verify `R2_BUCKET_NAME=inara-data` matches your actual bucket name
   - Bucket names are case-sensitive

### Token Not Showing in List?

- If you created a token but can't find it, check if it was created under a different account
- Make sure you're logged into the correct Cloudflare account
- Tokens are account-specific, not organization-specific

## Next Steps

Once R2 is working:
1. Test file uploads in the app (Admin Panel → Orientation Management)
2. Verify PDFs upload successfully
3. Check that uploaded files are accessible via presigned URLs

