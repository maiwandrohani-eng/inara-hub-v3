#!/bin/bash

# INARA Platform - Production Startup Script

set -e

echo "🚀 Starting INARA Platform..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy env.example to .env and configure it."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --production
fi

# Check if Prisma client is generated
if [ ! -d "node_modules/.prisma" ]; then
    echo "🔧 Generating Prisma client..."
    npm run db:generate
fi

# Check if dist exists
if [ ! -d "dist" ]; then
    echo "🏗️  Building application..."
    npm run build
fi

# Run database migrations (if needed)
echo "🗄️  Checking database..."
npm run db:push || echo "⚠️  Database push failed, continuing anyway..."

# Start the server
echo "✅ Starting server..."
exec node dist/index.js

