# How to Check the 403 Error Response

## Method 1: Browser Network Tab (Recommended)

1. Open DevTools (F12)
2. Go to **Network** tab
3. **Clear** the network log (trash icon)
4. Try the bulk import again
5. Find the failed request: `POST /api/admin/templates/bulk-import` (status 403, red)
6. **Click on the request**
7. Go to **Response** tab
8. **Copy the JSON response**

The response should look like:
```json
{
  "message": "Insufficient permissions",
  "requiredRoles": ["ADMIN"],
  "userRole": "...",
  "userRoleType": "string",
  "userId": "...",
  "userEmail": "...",
  "detail": "..."
}
```

## Method 2: Browser Console

After getting the 403 error, expand the error object in the console:
1. Find: `Z {message: 'Request failed with status code 403'...}`
2. Click to expand
3. Look for `response` → `data`
4. Expand `data` to see the server's response

## Method 3: Run This in Console

```javascript
// Add error interceptor
const api = window.axios || (() => {
  // Get axios instance from your app
  return null;
})();

// Or check the last error manually:
// After the error, run:
error.response?.data
```

## What to Look For

The response should tell us:
- `userRole`: What role the server sees
- `requiredRoles`: What roles are needed
- `detail`: Detailed error message

This will help us understand why the 403 is happening even though `/api/admin/check-role` shows you as ADMIN.
