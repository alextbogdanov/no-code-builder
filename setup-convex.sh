#!/bin/bash
# Quick setup script for Convex environment variables
# Run this from the no-code-builder directory

set -e

echo "🚀 Setting up Convex environment variables..."
echo ""

# 1. Set SITE_URL
echo "Setting SITE_URL..."
npx convex env set SITE_URL "http://localhost:3000"
echo "✅ SITE_URL set"
echo ""

# 2. Generate and set JWT_PRIVATE_KEY
echo "Generating JWT_PRIVATE_KEY..."
openssl genrsa -out /tmp/private.key 2048 2>/dev/null
openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in /tmp/private.key -out /tmp/private.pem 2>/dev/null
cat /tmp/private.pem | npx convex env set JWT_PRIVATE_KEY -
rm -f /tmp/private.key /tmp/private.pem
echo "✅ JWT_PRIVATE_KEY set"
echo ""

# 3. Prompt for Google OAuth
echo "📝 Google OAuth Setup:"
echo "   Get your credentials from: https://console.cloud.google.com/apis/credentials"
echo "   Redirect URI must be: https://grand-dalmatian-541.convex.site/api/auth/callback/google"
echo ""
read -p "Enter AUTH_GOOGLE_ID (or press Enter to skip): " GOOGLE_ID
if [ ! -z "$GOOGLE_ID" ]; then
    npx convex env set AUTH_GOOGLE_ID "$GOOGLE_ID"
    echo "✅ AUTH_GOOGLE_ID set"
fi

read -p "Enter AUTH_GOOGLE_SECRET (or press Enter to skip): " GOOGLE_SECRET
if [ ! -z "$GOOGLE_SECRET" ]; then
    npx convex env set AUTH_GOOGLE_SECRET "$GOOGLE_SECRET"
    echo "✅ AUTH_GOOGLE_SECRET set"
fi
echo ""

# 4. List all env vars
echo "📋 Current Convex environment variables:"
npx convex env list
echo ""

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure 'npx convex dev' is running"
echo "2. Add your API keys to .env.local (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)"
echo "3. Start your Next.js dev server: npm run dev"

