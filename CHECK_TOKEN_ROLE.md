# Check Your Token Role

## Quick Check in Browser Console

Open your browser console (F12) and run:

```javascript
// Check your stored auth data
const authData = JSON.parse(localStorage.getItem('inara-auth') || '{}');
console.log('📋 Your Stored Role:', authData?.state?.user?.role);
console.log('📧 Your Email:', authData?.state?.user?.email);
console.log('🔑 Token Exists:', !!authData?.state?.token);

// Decode JWT token to see what role is encoded
const token = authData?.state?.token;
if (token) {
  try {
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('🔍 Token Payload:', payload);
    console.log('👤 User ID in Token:', payload.userId);
    console.log('⏰ Token Expires:', new Date(payload.exp * 1000).toLocaleString());
    
    // Note: The role is NOT stored in the JWT token itself
    // The role is fetched from the database when the token is validated
    console.log('⚠️ Note: Role is fetched from database, not stored in token');
  } catch (e) {
    console.error('❌ Failed to decode token:', e);
  }
} else {
  console.log('❌ No token found! Please log in.');
}
```

## The Problem

**403 Forbidden** means:
- ✅ You ARE authenticated (your token is valid)
- ❌ You are NOT authorized (your token's user doesn't have ADMIN role)

## Why This Happens

JWT tokens are **stateless** - they don't automatically update when your role changes in the database. If your role was changed to ADMIN after you logged in, your old token still has the old role.

## The Solution

**You MUST log out and log back in** to get a fresh token with your updated role:

1. Click "Logout" in the app
2. Log back in with your credentials
3. Your new token will have the ADMIN role from the database

## Verify Your Database Role

If you want to verify your role in the database, you can check the `/api/admin/check-role` endpoint (but you need to be logged in first):

```javascript
// After logging in, check your role
fetch('/api/admin/check-role', {
  headers: {
    'Authorization': `Bearer ${JSON.parse(localStorage.getItem('inara-auth') || '{}')?.state?.token}`
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Database Role Check:', data);
  console.log('Your Role:', data.user?.role);
  console.log('Has Admin Access:', data.hasAdminAccess);
});
```
