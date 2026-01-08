# How to Verify the New Deployment

## Step 1: Check Browser Console

After the new deployment (`49bb06c`) completes, open your browser console (F12) and look for:

```
📋 TemplateManagement component loaded - Version: d6ed84a-v2 (with upload mode selector)
```

If you see this message, the new code is loaded.

## Step 2: Check the Upload Form

1. Go to **Template Management** in Admin Panel
2. Click **"+ Upload Template"** button
3. You should see:
   - A **yellow-bordered box** with "📤 UPLOAD MODE" title
   - Two radio buttons: "📄 Single File" and "📚 Multiple Files"
   - File input fields (not folder selection)

## Step 3: If You Don't See Changes

### Option A: Hard Refresh
- **Mac**: Cmd + Shift + R
- **Windows/Linux**: Ctrl + Shift + R
- Or: Open DevTools → Right-click refresh button → "Empty Cache and Hard Reload"

### Option B: Check Vercel Build Logs
1. Go to Vercel Dashboard
2. Find the deployment for commit `49bb06c`
3. Check the build logs to see if:
   - Client build completed successfully
   - No errors during build
   - `client/dist` folder was created

### Option C: Check Network Tab
1. Open DevTools → Network tab
2. Hard refresh the page
3. Look for JavaScript files (`.js` files)
4. Check the file names - they should have new hashes if rebuilt
5. Click on `index-*.js` and check the Response tab
6. Search for "TemplateManagement" - you should see the new code

### Option D: Check if Build Actually Ran
The build command is: `npm run install:all && npm run build`

This should:
1. Install dependencies
2. Build server (`npm run build:server`)
3. Build client (`npm run build:client`)

If the client build didn't run or failed, the changes won't be in the deployment.

## Step 4: Verify in Source Code

If you have access to the Vercel deployment files, check:
- `client/dist/index.html` should have the version comment
- `client/dist/assets/index-*.js` should contain the TemplateManagement component with upload mode selector

## Common Issues

1. **Vercel cached the build** - The new commit should force a rebuild
2. **Browser cached the JavaScript** - Hard refresh should fix this
3. **Service Worker cached** - The index.html already unregisters service workers
4. **Build didn't run** - Check Vercel logs to see if build completed

## Quick Test

After deployment, run this in browser console:
```javascript
// Check if TemplateManagement has upload mode
const templateComponent = document.querySelector('[class*="TemplateManagement"]');
console.log('TemplateManagement found:', !!templateComponent);

// Or check the React component tree
// Look for "uploadMode" or "UPLOAD MODE" in the page source
```
