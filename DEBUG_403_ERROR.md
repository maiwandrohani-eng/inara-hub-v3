# Debug 403 Error

## Quick Debug Script

Run this in your browser console after getting a 403 error:

```javascript
// This will show the full error response from the server
// Run this AFTER you get the 403 error, then try the bulk import again

// First, let's set up error logging
const originalError = console.error;
console.error = function(...args) {
  if (args[0]?.response?.status === 403) {
    console.log('=== 403 ERROR DETAILS ===');
    console.log('Status:', args[0].response.status);
    console.log('Response Data:', args[0].response.data);
    console.log('Full Error:', args[0]);
  }
  originalError.apply(console, args);
};

// Or, manually check the last error:
// After getting the error, run:
// error.response.data
```

## Better Method: Check Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Try the bulk import again
4. Find the failed request (red, status 403)
5. Click on it
6. Go to **Response** tab
7. Copy the JSON response

This will show you exactly what the server returned, including:
- `userRole` - What role the server sees
- `requiredRoles` - What roles are required
- `detail` - Detailed error message
