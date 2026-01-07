# Test Role Check - Step by Step

## Step 1: Get Your Token Correctly

Run this in the browser console to get your token:

```javascript
// Method 1: Using authStore (if available)
const authData = JSON.parse(localStorage.getItem('inara-auth') || '{}');
console.log('Full auth data:', authData);

// The token is nested in the state
const token = authData?.state?.token || authData?.token;
console.log('Your token:', token ? token.substring(0, 50) + '...' : 'NOT FOUND');

// If token is not found, try alternative paths
if (!token) {
  console.log('Trying alternative paths...');
  console.log('authData.state:', authData.state);
  console.log('authData.token:', authData.token);
  console.log('All keys:', Object.keys(authData));
}
```

## Step 2: Test the Role Check Endpoint

Once you have the token, test it:

```javascript
// Get token
const authData = JSON.parse(localStorage.getItem('inara-auth') || '{}');
const token = authData?.state?.token || authData?.token;

if (!token) {
  console.error('❌ No token found! Please log in again.');
} else {
  console.log('✅ Token found, testing role check...');
  
  fetch('/api/admin/check-role', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(async (r) => {
    console.log('Response status:', r.status);
    if (!r.ok) {
      const text = await r.text();
      console.error('Error response:', text);
      throw new Error(`HTTP ${r.status}: ${text}`);
    }
    return r.json();
  })
  .then(data => {
    console.log('=== Role Check Results ===');
    console.log('User from DB:', data.user);
    console.log('Has admin access:', data.hasAdminAccess);
    console.log('Role comparison:', data.roleComparison);
    console.log('Required role:', data.requiredRole);
    
    if (data.roleComparison) {
      console.log('\n=== Detailed Role Analysis ===');
      console.log('Your role:', data.roleComparison.userRole);
      console.log('Role type:', data.roleComparison.userRoleType);
      console.log('Required:', data.roleComparison.requiredRole);
      console.log('Required type:', data.roleComparison.requiredRoleType);
      console.log('Matches:', data.roleComparison.matches);
    }
  })
  .catch(err => {
    console.error('❌ Error:', err);
    console.error('Error message:', err.message);
  });
}
```

## Step 3: Alternative - Use the API Client

If the fetch doesn't work, try using the app's API client:

```javascript
// This uses the same axios instance the app uses
import api from './api/client';

// But we can't import in console, so use this instead:
// Check what the app sees
const authData = JSON.parse(localStorage.getItem('inara-auth') || '{}');
console.log('Stored user:', authData?.state?.user);
console.log('Stored role:', authData?.state?.user?.role);
```

## Step 4: Check Server Logs

If you have access to Vercel logs, check for:
- `[Authorization] Role check:` - Shows what the server sees
- `[Authorization] Access denied:` - Shows why access was denied

## Common Issues

### Token Not Found
- **Solution**: Log out and log back in
- Clear localStorage: `localStorage.removeItem('inara-auth')`

### 401 Unauthorized
- Token might be expired
- Token format might be wrong
- **Solution**: Log out and log back in to get a fresh token

### 403 Forbidden
- Role doesn't match
- Check the `roleComparison` in the response to see why

