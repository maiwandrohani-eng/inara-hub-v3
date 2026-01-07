# Force Token Refresh - Fix 403 Error

## Quick Fix: Force Logout and Re-login

If you've updated your role to ADMIN in the database but still getting 403 errors, your JWT token needs to be refreshed.

### Method 1: Browser Console (Recommended)

1. Open browser console (F12)
2. Run these commands:

```javascript
// Step 1: Check your current stored role
const authData = JSON.parse(localStorage.getItem('inara-auth') || '{}');
console.log('Current stored role:', authData.state?.user?.role);
console.log('Current user:', authData.state?.user);

// Step 2: Clear auth data
localStorage.removeItem('inara-auth');
sessionStorage.clear();

// Step 3: Redirect to login
window.location.href = '/login';
```

3. Log in again with your credentials
4. After login, verify your role:
```javascript
const newAuthData = JSON.parse(localStorage.getItem('inara-auth') || '{}');
console.log('New role:', newAuthData.state?.user?.role); // Should be "ADMIN"
```

### Method 2: Manual Logout

1. Click the logout button in the app (if available)
2. Or go to: `https://hub.inara.ngo/login`
3. Log in again

### Method 3: Check Error Response Details

When you get the 403 error, check the browser console for:

```javascript
🚫 403 Forbidden Error: {
  message: "Insufficient permissions",
  detail: "This action requires one of the following roles: ADMIN. Your current role is: [YOUR_ROLE]",
  requiredRoles: ["ADMIN"],
  userRole: "[YOUR_ROLE]",
  userEmail: "maiwand@inara.org",
  userId: "72c8ee2b-5fa5-4ce7-abc0-e7db6c62f84a"
}
```

This will show you what role the server sees vs what's in your token.

## Verify Token Contains Correct Role

After logging back in, decode your token to verify:

```javascript
// Get your token
const authData = JSON.parse(localStorage.getItem('inara-auth') || '{}');
const token = authData.state?.token;

if (token) {
  // Decode JWT (base64)
  const parts = token.split('.');
  const payload = JSON.parse(atob(parts[1]));
  console.log('Token payload:', payload);
  console.log('Token user ID:', payload.userId);
  
  // Note: The role is NOT in the JWT token itself
  // The role is fetched from the database when the token is verified
  // So if your role is ADMIN in DB, the server should see it
}
```

## Still Getting 403?

If you've:
1. ✅ Updated role to ADMIN in database
2. ✅ Logged out and back in
3. ✅ Cleared localStorage

And still getting 403, check:

1. **Is the user active?**
   ```sql
   SELECT id, email, role, "isActive" 
   FROM "User" 
   WHERE id = '72c8ee2b-5fa5-4ce7-abc0-e7db6c62f84a';
   ```
   `isActive` should be `true`

2. **Check server logs** - The server should log the authorization check with your role

3. **Verify the endpoint** - Make sure you're hitting the right endpoint:
   - `/api/admin/library/bulk-import` (requires ADMIN)
   - Not `/api/library/bulk-import` (if that exists)

4. **Check for multiple users** - Make sure you're logged in as the right user:
   ```javascript
   const authData = JSON.parse(localStorage.getItem('inara-auth') || '{}');
   console.log('Logged in as:', authData.state?.user?.email);
   ```

## Test After Refresh

After logging back in, test the role check endpoint:

```javascript
fetch('/api/admin/check-role', {
  headers: {
    'Authorization': 'Bearer ' + JSON.parse(localStorage.getItem('inara-auth') || '{}').state?.token
  }
})
.then(r => r.json())
.then(data => {
  console.log('Role check result:', data);
  console.log('Has admin access:', data.hasAdminAccess);
});
```

This should return:
```json
{
  "user": {
    "id": "72c8ee2b-5fa5-4ce7-abc0-e7db6c62f84a",
    "email": "maiwand@inara.org",
    "role": "ADMIN",
    "isActive": true
  },
  "hasAdminAccess": true,
  "requiredRole": "ADMIN"
}
```

