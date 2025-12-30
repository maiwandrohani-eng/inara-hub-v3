# Troubleshooting Guide

## Common Issues and Solutions

### Issue: "Missing required environment variables: DATABASE_URL, JWT_SECRET"

**Symptoms:**
- Error when starting dev server
- Database commands fail

**Solutions:**

1. **Verify .env file exists:**
   ```bash
   cd server
   ls -la .env
   ```

2. **Check .env file has required variables:**
   ```bash
   cd server
   grep -E "DATABASE_URL|JWT_SECRET" .env
   ```

3. **Make sure you're using dotenv-cli:**
   - The `dev` script should use: `dotenv -e .env -- tsx watch src/index.ts`
   - If not, restart the dev server after pulling latest changes

4. **Restart the dev server:**
   ```bash
   # Stop the current server (Ctrl+C)
   cd server
   npm run dev
   ```

5. **If still not working, manually test:**
   ```bash
   cd server
   dotenv -e .env -- node -e "console.log(process.env.DATABASE_URL)"
   ```

---

### Issue: "require is not defined" or "ReferenceError: require is not defined"

**Symptoms:**
- Error when importing modules
- Happens with pdf-parse or other CommonJS modules

**Solutions:**

1. **Make sure you have the latest code:**
   ```bash
   git pull origin main
   ```

2. **The code should use dynamic imports, not require():**
   - Check `server/src/utils/aiQuestionGenerator.ts`
   - Should use `await import('pdf-parse')` not `require('pdf-parse')`

3. **Restart the dev server** after code changes

---

### Issue: "Environment variable not found: DATABASE_URL" (Prisma)

**Symptoms:**
- `npm run db:push` fails
- `npm run db:seed` fails

**Solutions:**

1. **Make sure dotenv-cli is installed:**
   ```bash
   cd server
   npm install
   ```

2. **Verify .env file has DATABASE_URL:**
   ```bash
   cd server
   grep DATABASE_URL .env
   ```

3. **The scripts should use dotenv-cli:**
   - `db:push`: `dotenv -e .env -- prisma db push`
   - `db:seed`: `dotenv -e .env -- tsx src/seed.ts`

---

### Issue: Dev server not loading .env file

**Solutions:**

1. **Check package.json dev script:**
   ```json
   "dev": "dotenv -e .env -- tsx watch src/index.ts"
   ```

2. **If using old script, update it:**
   ```bash
   cd server
   # Edit package.json or pull latest changes
   git pull origin main
   npm install
   ```

3. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

---

### Quick Fix Checklist

- [ ] `.env` file exists in `server/` directory
- [ ] `.env` has `DATABASE_URL` and `JWT_SECRET`
- [ ] `dotenv-cli` is installed (`npm install` in server/)
- [ ] Dev script uses `dotenv -e .env --`
- [ ] Restarted dev server after changes
- [ ] Pulled latest code from GitHub

---

### Still Not Working?

1. **Check .env file format:**
   ```bash
   cd server
   cat .env
   ```
   - Should NOT have quotes around values (unless needed)
   - Should be: `DATABASE_URL=postgresql://...`
   - NOT: `DATABASE_URL="postgresql://..."`

2. **Test environment loading:**
   ```bash
   cd server
   dotenv -e .env -- node -e "console.log(process.env.DATABASE_URL)"
   ```

3. **Verify file location:**
   ```bash
   cd server
   pwd
   ls -la .env
   ```
   - Should be: `/path/to/inara-hub-v3/server/.env`

