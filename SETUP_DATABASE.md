# Database Setup for Vercel Deployment

## Quick Fix: Initialize Your Neon Database

Your database needs to be migrated and seeded before you can log in. Here's how to do it:

### Step 1: Set up local environment

1. Make sure you have the latest code:
   ```bash
   git pull origin main
   ```

2. Navigate to the server directory:
   ```bash
   cd server
   ```

3. Create/update `.env` file with your Neon database URL:
   ```bash
   DATABASE_URL=postgresql://neondb_owner:npg_0O3HvkmbwBFP@ep-misty-boat-agvim722-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   JWT_SECRET=e7a41f9d2b9f0f4a6c8de9b4a8f6d1e2c7f1a0b9d4e8c6f2a5b3e9c0d7f1a6
   ```

### Step 2: Run database migrations

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to Neon database
npm run db:push

# Seed initial data (creates admin users, work systems, etc.)
npm run db:seed
```

### Step 3: Verify

After seeding, you should be able to log in with:
- **Email:** `admin@inara.org`
- **Password:** `admin123`

Or:
- **Email:** `maiwand@inara.org`
- **Password:** `Come*1234`

---

## Option 2: Use Setup API Endpoint (Alternative)

If you can't run migrations locally, you can use the setup endpoint:

1. Add `SETUP_SECRET` to your Vercel environment variables (use a strong random string)

2. Call the setup endpoint once:
   ```bash
   curl -X POST https://inara-hub-v3.vercel.app/api/setup \
     -H "Content-Type: application/json" \
     -d '{"secret":"your-setup-secret"}'
   ```

3. Check health:
   ```bash
   curl https://inara-hub-v3.vercel.app/api/setup/health
   ```

**Note:** The setup endpoint runs migrations via API, which may have limitations. Option 1 (local) is more reliable.

---

## Troubleshooting

### "Invalid credentials" error
- Make sure you ran `npm run db:seed` to create users
- Check that `isActive: true` is set for users (seed script sets this)

### Database connection errors
- Verify your `DATABASE_URL` is correct
- Check that Neon database is accessible (not paused)
- Ensure SSL is enabled (`?sslmode=require`)

### Migration errors
- Make sure Prisma Client is generated: `npm run db:generate`
- Try `npm run db:push -- --force-reset` (⚠️ This will delete all data!)

