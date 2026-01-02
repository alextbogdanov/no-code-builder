# Complete Setup Guide

## 1. Environment Variables in `.env.local`

Add these to your `.env.local` file (in the `no-code-builder` directory):

```bash
# Convex (you already have this)
NEXT_PUBLIC_CONVEX_URL=https://grand-dalmatian-541.convex.cloud

# AI Providers (REQUIRED)
OPENAI_API_KEY=sk-your-openai-key-here          # REQUIRED for market analysis
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key     # For code generation
GOOGLE_AI_API_KEY=your-google-ai-key            # Optional fallback

# Live Preview (REQUIRED for deploying apps)
E2B_API_KEY=your-e2b-api-key-here
```

**Where to get them:**
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/
- Google AI: https://ai.google.dev/
- E2B: https://e2b.dev/dashboard

---

## 2. Convex Environment Variables

These MUST be set in Convex (not in `.env.local`). Use the commands below or the Convex dashboard.

### Required for Auth:
- `SITE_URL` - Your app URL
- `JWT_PRIVATE_KEY` - RSA private key for JWT signing
- `AUTH_GOOGLE_ID` - Google OAuth Client ID
- `AUTH_GOOGLE_SECRET` - Google OAuth Client Secret

### Optional (for other auth methods):
- `AUTH_GITHUB_ID` - GitHub OAuth Client ID
- `AUTH_GITHUB_SECRET` - GitHub OAuth Client Secret
- `AUTH_RESEND_KEY` - Resend API key for email OTP
- `AUTH_EMAIL_FROM` - Email sender address

---

## 3. Convex Commands (Run These Once)

Run these commands in the `no-code-builder` directory:

### Step 1: Start Convex Dev Server
```bash
cd no-code-builder
npx convex dev
```
This will:
- Connect to your Convex deployment
- Sync your functions to the cloud
- Watch for changes and auto-sync

**Keep this running in a terminal!**

### Step 2: Set Environment Variables

**Set SITE_URL:**
```bash
npx convex env set SITE_URL "http://localhost:3000"
```

**Generate and set JWT_PRIVATE_KEY:**
```bash
# Generate the key
openssl genrsa -out /tmp/private.key 2048
openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in /tmp/private.key -out /tmp/private.pem

# Set it in Convex
cat /tmp/private.pem | npx convex env set JWT_PRIVATE_KEY -

# Clean up
rm /tmp/private.key /tmp/private.pem
```

**Set Google OAuth (after creating OAuth client):**
```bash
npx convex env set AUTH_GOOGLE_ID "your-google-client-id"
npx convex env set AUTH_GOOGLE_SECRET "your-google-client-secret"
```

**Optional - Set GitHub OAuth:**
```bash
npx convex env set AUTH_GITHUB_ID "your-github-client-id"
npx convex env set AUTH_GITHUB_SECRET "your-github-client-secret"
```

**Optional - Set Email OTP (Resend):**
```bash
npx convex env set AUTH_RESEND_KEY "re_your-resend-api-key"
npx convex env set AUTH_EMAIL_FROM "StartupLab <noreply@yourdomain.com>"
```

### Step 3: Verify Environment Variables
```bash
npx convex env list
```

---

## 4. Google OAuth Setup

1. Go to https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Enable "Google+ API" or "People API"
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Configure OAuth consent screen (if prompted)
6. Create OAuth client:
   - Type: Web application
   - Name: "NoCode Builder"
   - **Authorized redirect URI:** `https://grand-dalmatian-541.convex.site/api/auth/callback/google`
7. Copy Client ID and Client Secret
8. Set them in Convex (see commands above)

---

## 5. Quick Reference Commands

```bash
# Start Convex dev server (keep running)
npx convex dev

# List all Convex env vars
npx convex env list

# Set an env var
npx convex env set VARIABLE_NAME "value"

# Set multiline env var (like JWT_PRIVATE_KEY)
cat file.pem | npx convex env set JWT_PRIVATE_KEY -

# Deploy to production (when ready)
npx convex deploy
```

---

## 6. Checklist

### .env.local
- [ ] `NEXT_PUBLIC_CONVEX_URL` (you have this)
- [ ] `OPENAI_API_KEY` (REQUIRED)
- [ ] `ANTHROPIC_API_KEY`
- [ ] `GOOGLE_AI_API_KEY` (optional)
- [ ] `E2B_API_KEY` (if using live preview)

### Convex Environment Variables
- [ ] `SITE_URL` → `http://localhost:3000`
- [ ] `JWT_PRIVATE_KEY` → Generated RSA key
- [ ] `AUTH_GOOGLE_ID` → From Google Cloud Console
- [ ] `AUTH_GOOGLE_SECRET` → From Google Cloud Console

### Google OAuth
- [ ] OAuth client created in Google Cloud Console
- [ ] Redirect URI added: `https://grand-dalmatian-541.convex.site/api/auth/callback/google`
- [ ] Client ID and Secret set in Convex

### Running
- [ ] `npx convex dev` is running
- [ ] Next.js dev server can start (`npm run dev`)

---

## Troubleshooting

**"Missing environment variable" errors:**
- Check `npx convex env list` to see what's set
- Make sure you set it in Convex, not just `.env.local`

**"OAuth client not found" or "redirect_uri_mismatch":**
- Double-check the redirect URI in Google Cloud Console matches exactly
- Should be: `https://grand-dalmatian-541.convex.site/api/auth/callback/google`

**"JWT_PRIVATE_KEY format error":**
- Use the dashboard method: https://dashboard.convex.dev → Settings → Environment Variables
- Paste the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`

**Functions not found:**
- Make sure `npx convex dev` is running
- It should say "Functions synced" or similar

