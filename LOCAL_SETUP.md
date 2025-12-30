# Local Development Setup

## Quick Setup for Running Database Commands Locally

### Step 1: Create `.env` file in `server/` directory

```bash
cd server
cp env.example .env
```

### Step 2: Add Your Neon Database URL

Edit `server/.env` and add:

```env
DATABASE_URL=postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Get your connection string from:** https://console.neon.tech

### Step 3: Add Other Required Variables

```env
# Database (from Neon)
DATABASE_URL=postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# Authentication
JWT_SECRET=your-local-jwt-secret-for-development
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# CORS (for local development)
CORS_ORIGIN=http://localhost:3000

# R2 (optional for local - can use local file storage)
R2_ACCOUNT_ID=f672838a09e9e6a09d08ce61b5866002
R2_ACCESS_KEY_ID=f2232270caa9e6bf962cc60ee8d3c5e3
R2_SECRET_ACCESS_KEY=e10c35df6da6306b5bb207161aa6b36668b20f429c9c00279d915fc7630cb8d5
R2_BUCKET_NAME=inara-data
R2_ENDPOINT=https://f672838a09e9e6a09d08ce61b5866002.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://hub.inara.ngo
```

### Step 4: Run Database Commands

```bash
cd server

# Generate Prisma client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Seed database (creates admin user)
npm run db:seed
```

### Step 5: Verify

After seeding, you should have:
- ✅ All database tables created
- ✅ Admin user created:
  - **Email:** `admin@inara.org`
  - **Password:** `admin123`

---

## Quick Commands

```bash
# Navigate to server directory
cd server

# Create .env from example
cp env.example .env

# Edit .env with your Neon DATABASE_URL
nano .env  # or use your preferred editor

# Run migrations
npm run db:generate
npm run db:push
npm run db:seed
```

---

## Troubleshooting

### "Environment variable not found: DATABASE_URL"

**Solution:** Make sure you created `.env` file in the `server/` directory (not root)

### "Connection refused" or SSL errors

**Solution:** Ensure your DATABASE_URL includes `?sslmode=require` at the end

### "Invalid connection string"

**Solution:** 
- Copy the full connection string from Neon dashboard
- Make sure it includes the database name
- Verify credentials are correct

---

**Note:** The `.env` file is gitignored, so your credentials won't be committed to Git.

