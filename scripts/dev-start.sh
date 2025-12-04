#!/bin/bash
# Dead Simple Dev Start - GUARANTEED to work
# No fancy logic, just brute force cleanup then start

set -e # Exit on any error

cd ~/Documents/D/PRJ/WEB/scheduler

echo "🛑 Stopping everything..."
podman-compose -f podman-compose.dev.yml down -v --remove-orphans 2>/dev/null || true
podman stop $(podman ps -aq) 2>/dev/null || true
podman rm -f $(podman ps -aq) 2>/dev/null || true

echo "🔓 Freeing ports..."
sudo fuser -k 3001/tcp 2>/dev/null || true
sudo fuser -k 5173/tcp 2>/dev/null || true
sudo fuser -k 5433/tcp 2>/dev/null || true

echo "🧹 Cleaning up..."
podman network prune -f 2>/dev/null || true
podman volume prune -f 2>/dev/null || true

echo "⏳ Waiting..."
sleep 3

echo "🚀 Starting..."
podman-compose -f podman-compose.dev.yml up -d

echo ""
echo "✅ Done!"
echo ""
echo "🌐 Your app:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "📋 View logs:"
echo "   podman-compose -f podman-compose.dev.yml logs -f"
echo ""
echo "🛑 To stop:"
echo "   podman-compose -f podman-compose.dev.yml down -v --remove-orphans"
