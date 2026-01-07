# Check Authentication Status

## Your localStorage is Empty!

This means you're **not currently logged in**. You need to log in first.

## Step 1: Check All localStorage Keys

Run this to see what's actually stored:

```javascript
// Check all localStorage keys
console.log('All localStorage keys:', Object.keys(localStorage));

// Check each key
Object.keys(localStorage).forEach(key => {
  try {
    const value = localStorage.getItem(key);
    console.log(`${key}:`, value ? JSON.parse(value) : value);
  } catch (e) {
    console.log(`${key}:`, localStorage.getItem(key));
  }
});
```

## Step 2: Log In

1. Go to: `https://hub.inara.ngo/login`
2. Enter your credentials:
   - Email: `maiwand@inara.org`
   - Password: (your password)
3. Click "Sign In"

## Step 3: After Logging In, Check Again

After logging in, run this:

```javascript
// Check auth data
const authData = JSON.parse(localStorage.getItem('inara-auth') || '{}');
console.log('Auth data:', authData);

// Get token
const token = authData?.state?.token;
console.log('Token:', token ? 'Found' : 'Not found');
console.log('User:', authData?.state?.user);
console.log('Role:', authData?.state?.user?.role);
```

## Step 4: Test Role Check

After logging in, test the role check:

```javascript
const authData = JSON.parse(localStorage.getItem('inara-auth') || '{}');
const token = authData?.state?.token;

if (token) {
  fetch('/api/admin/check-role', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(r => r.json())
  .then(data => {
    console.log('Role check:', data);
    console.log('Has admin access:', data.hasAdminAccess);
  })
  .catch(err => console.error('Error:', err));
} else {
  console.error('No token - please log in first!');
}
```

## Why This Happened

Your localStorage was cleared, which means:
- You logged out
- Browser storage was cleared
- Session expired
- You're in a private/incognito window

## Solution

**Simply log in again!** Once you log in, your token will be stored and you'll have access to admin features.

