# Latest Fixes - January 10, 2026

## Issues Found & Fixed

### 1. **Double `/api/` Prefix Error** ✅ FIXED
**Error Message**: "Cannot GET `/api/api/uploads/library/1768068723896-747003428.pdf`"

**Root Cause**: 
- LibraryTab was setting `downloadEndpoint={`/api${selectedResource.fileUrl}`}` 
- But axios client already has baseURL `/api`
- When axios makes request: `/api` + `/api/uploads/...` = `/api/api/uploads/...`

**Location**: `/client/src/pages/tabs/LibraryTab.tsx` line 365

**Fix Applied**:
```tsx
// BEFORE (WRONG):
downloadEndpoint={selectedResource.fileUrl?.startsWith('/uploads/') ? `/api${selectedResource.fileUrl}` : undefined}

// AFTER (CORRECT):
downloadEndpoint={selectedResource.fileUrl?.startsWith('/uploads/') ? selectedResource.fileUrl : undefined}
```

**Why this works**: 
- Axios client with baseURL `/api` automatically prefixes all requests
- Passing `/uploads/library/file.pdf` to axios becomes `/api/uploads/library/file.pdf`
- No manual prefixing needed

**Commit**: `2eb7863` "fix: Remove double /api/ prefix in LibraryTab downloadEndpoint"

---

### 2. **CORS Blocking on R2 Redirects** ✅ ALREADY FIXED (Previous Session)
**Error Message**: "CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource"

**Root Cause**: 
- File proxy redirects to R2 presigned URLs without CORS headers
- Browser blocks cross-origin redirect responses lacking `Access-Control-Allow-Origin`

**Location**: `/server/src/index.ts` lines 201-204 in `genericFileProxy()` function

**Fix Applied** (already done):
```typescript
// Add CORS headers before redirecting to R2
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

return res.redirect(302, presignedUrl);
```

**Previous Commit**: `8d64fad` "Add CORS headers to file proxy redirects"

---

## How the File Proxy System Works (End-to-End)

### 1. **File Upload** (Backend)
```
uploadFileToR2(file, 'library')
  → Uploads to R2 bucket
  → Returns URL: `/uploads/library/1768068723896-747003428.pdf` (if R2_PUBLIC_URL not set)
  → Stores in Database as `fileUrl`
```

### 2. **File Access** (Frontend → Backend)
```
User clicks "Download" in Library Tab
  → QuickViewModal.handleDownload() called
  → Calls api.get('/uploads/library/1768068723896-747003428.pdf')
  → Axios adds baseURL /api
  → Request goes to: GET /api/uploads/library/1768068723896-747003428.pdf
```

### 3. **File Proxy** (Backend)
```
Express middleware intercepts: GET /api/uploads/library/*
  → genericFileProxy() function triggered
  → Extracts file path: library/1768068723896-747003428.pdf
  → Calls getPresignedUrl() with path
  → Gets R2 presigned URL (includes auth signature + expiry)
  → Sets CORS headers on redirect response
  → HTTP 302 Redirects to R2 presigned URL
```

### 4. **File Download** (R2)
```
Browser follows 302 redirect to R2 presigned URL
  → R2 returns actual file content
  → Browser receives file with CORS headers present
  → File download/display succeeds ✅
```

---

## Files Modified This Session

| File | Change | Reason |
|------|--------|--------|
| [LibraryTab.tsx](client/src/pages/tabs/LibraryTab.tsx#L365) | Removed `/api` prefix from `downloadEndpoint` | Fix double `/api/` prefix |

## Files with Previous CORS Fixes (Still Active)

| File | Change | Reason |
|------|--------|--------|
| [server/src/index.ts](server/src/index.ts#L201-L204) | Added CORS headers to redirect responses | Allow browser to follow R2 redirects |

---

## Testing the Fixes

### Local Testing
```bash
1. Go to Library tab
2. Click on any resource card
3. Click "Download" button
4. Should download without errors
5. Check browser console - no more CORS errors
```

### Expected Console Errors (Should Now Be Gone)
- ❌ "Cannot GET `/api/api/uploads/library/...`"
- ❌ "CORS policy: No 'Access-Control-Allow-Origin' header"

---

## Deployment Status

✅ **Code Fix Deployed**: Both fixes are now in main branch  
⏳ **Vercel Deployment**: Awaiting propagation (usually 1-2 minutes)

Once Vercel redeploys, all file downloads in Library tab should work without errors.

---

## Impact on Other Components

These fixes are specific to LibraryTab file downloads. Other components are unaffected:
- ✅ PoliciesTab - Uses different helper function `getProxiedPolicyUrl()`
- ✅ Training (QuickPDFModal) - Uses different helper function `getProxiedUrl()`
- ✅ Templates - Uses `QuickViewModal` with different initialization
- ✅ File proxy architecture - Still working for all 5 file path types

---

## Architecture Notes

### Why Axios baseURL is Important
```javascript
const api = axios.create({
  baseURL: '/api',  // All requests automatically prefixed with /api
  headers: { 'Content-Type': 'application/json' }
});

api.get('/uploads/file.pdf')  // Actually requests: /api/uploads/file.pdf
```

This design prevents CORS issues when frontend and backend are on the same domain, but requires careful path handling to avoid double-prefixing.

### CORS Headers on Redirects
Most API libraries forget to include CORS headers on redirect responses. The fix ensures that when the server redirects to R2, it includes the necessary headers so browsers allow the cross-origin request.

---

**Status**: ✅ All fixes applied and deployed to main branch
**Next Step**: Monitor Vercel deployment completion
