#!/bin/bash

echo "=================================================="
echo "  End-to-End Encrypted File Sharing System"
echo "  Quick Setup Script"
echo "=================================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Backend setup
echo ""
echo "📦 Setting up Backend..."
cd backend
npm install
cp .env.example .env

echo ""
echo "⚠️  IMPORTANT: Edit backend/.env with your MongoDB URI"
echo "   Example: MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/e2e-file-sharing"
echo ""
read -p "Press Enter when you've configured backend/.env..."

# Frontend setup
echo ""
echo "📦 Setting up Frontend..."
cd ../frontend
npm install
cp .env.example .env.local

echo ""
echo "✅ Setup Complete!"
echo ""
echo "🚀 Start Development Servers:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend && npm run dev"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend && npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo ""
