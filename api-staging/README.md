# Staging API Files - Vercel KV Integration

These files are NOT in production. They're prepared for when we enable Vercel KV.

## Setup Steps

### 1. Create Vercel KV Database
1. Go to https://vercel.com/dashboard
2. Select your `titan` project
3. Go to **Storage** tab
4. Click **Create Database** → **KV**
5. Name it `titan-db`
6. Click **Create**
7. Click **Connect to Project**

### 2. Update package.json
Add `@vercel/kv` dependency:
```json
"dependencies": {
    "express": "^4.18.2",
    "@vercel/kv": "^1.0.0"
}
```

### 3. Migrate Existing Data
```bash
# Set environment variables first (get from Vercel dashboard)
export KV_REST_API_URL="your-url"
export KV_REST_API_TOKEN="your-token"

# Run migration
node api-staging/migrate-to-kv.js
```

### 4. Replace API Files
```bash
# Backup current files
cp api/raids.js api/raids-backup.js
cp api/top-parsers.js api/top-parsers-backup.js

# Replace with KV versions
cp api-staging/raids-kv.js api/raids.js
cp api-staging/top-parsers-kv.js api/top-parsers.js
```

### 5. Push to Production
```bash
git add .
git commit -m "Enable Vercel KV for admin panel"
git push
```

## Files

- `raids-kv.js` - KV-enabled raids API (GET/POST/DELETE)
- `top-parsers-kv.js` - KV-enabled top parsers API
- `migrate-to-kv.js` - One-time migration script

## KV Keys Used

- `titan:raids` - Array of raid objects
- `titan:top-parsers` - Top parsers data object
