# How to Check and Fix User Role Issues

## Problem: 403 Forbidden Error

If you're getting a 403 error when trying to use admin features, it means your user account doesn't have the ADMIN role.

## Quick Check: Your Current Role

### Method 1: Browser Console

1. Open your browser console (F12)
2. Run this command:
   ```javascript
   // Get your auth data
   const authData = JSON.parse(localStorage.getItem('inara-auth') || '{}');
   console.log('Your user:', authData.state?.user);
   console.log('Your role:', authData.state?.user?.role);
   ```

### Method 2: Check User Profile

1. Go to your profile page in the app
2. Your role should be displayed there

### Method 3: Use Diagnostic Endpoint

After deployment, visit:
```
https://hub.inara.ngo/api/admin/check-role
```

This will show:
- Your user ID
- Your email
- Your current role
- Whether you have admin access

## Fix: Update Your Role to ADMIN

### Option 1: Database Query (if you have database access)

```sql
-- Find your user
SELECT id, email, role, "isActive" 
FROM "User" 
WHERE email = 'your-email@inara.org';

-- Update your role to ADMIN
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'your-email@inara.org';
```

### Option 2: Have Another Admin Update You

1. Ask an existing admin to:
   - Log in to the platform
   - Go to **Admin Panel** → **User Management**
   - Find your user account (by email)
   - Click **Edit**
   - Change **Role** to **ADMIN**
   - Save

### Option 3: Use Prisma Studio (if you have local access)

```bash
cd server
npx prisma studio
```

Then:
1. Open the User table
2. Find your user
3. Edit the `role` field to `ADMIN`
4. Save

## After Updating Your Role

1. **Log out** of the application
2. **Log back in** (this refreshes your JWT token with the new role)
3. Try the admin feature again

## Verify It Worked

After logging back in, check your role again:
```javascript
const authData = JSON.parse(localStorage.getItem('inara-auth') || '{}');
console.log('Your role:', authData.state?.user?.role);
```

It should show `"ADMIN"` instead of `"STAFF"` or another role.

## Common Roles

- **ADMIN**: Full access to all admin features
- **STAFF**: Regular user, no admin access
- **COUNTRY_DIRECTOR**: Country-level admin access
- **DEPARTMENT_HEAD**: Department-level admin access

## Still Having Issues?

1. Check the browser console for detailed error messages
2. Verify your user is `isActive: true` in the database
3. Make sure you logged out and back in after role change
4. Check that the JWT token was refreshed (clear localStorage if needed)

