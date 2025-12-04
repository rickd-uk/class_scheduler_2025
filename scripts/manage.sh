#!/bin/bash
# Bulletproof dev environment starter
# This GUARANTEES a clean start every time

cd ~/Documents/D/PRJ/WEB/scheduler

echo "🧹 Step 1: Cleaning up old containers..."
podman-compose -f podman-compose.dev.yml down -v --remove-orphans 2>/dev/null || true
podman stop $(podman ps -aq) 2>/dev/null || true
podman rm -f $(podman ps -aq) 2>/dev/null || true

echo "🔓 Step 2: Freeing ports..."
sudo fuser -k 3001/tcp 2>/dev/null || true
sudo fuser -k 5173/tcp 2>/dev/null || true
sudo fuser -k 5433/tcp 2>/dev/null || true

echo "🧹 Step 3: Cleaning podman cache..."
podman network prune -f 2>/dev/null || true

echo "⏳ Step 4: Waiting for cleanup..."
sleep 3

echo "🚀 Step 5: Starting fresh containers..."
podman-compose -f podman-compose.dev.yml up -d

echo ""
echo "✅ Done! Your containers:"
podman ps

echo ""
echo "🌐 Access your app:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo ""
echo "📋 View logs: podman-compose -f podman-compose.dev.yml logs -f"
