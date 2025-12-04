#!/bin/bash

# Check All Project Ports
# Checks all common ports used by the Teacher Class Scheduler

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "======================================"
echo "  Port Status Checker"
echo "  Teacher Class Scheduler Project"
echo "======================================"
echo ""

# Define project ports
declare -A PORTS=(
  [3001]="Backend Server (Dev)"
  [3002]="Backend Server (Prod/Alt)"
  [5173]="Frontend Vite (Dev)"
  [5174]="Frontend Vite (Alt)"
  [5433]="PostgreSQL (Host)"
  [5432]="PostgreSQL (Container)"
  [80]="Nginx HTTP (Prod)"
  [443]="Nginx HTTPS (Prod)"
  [8080]="Alternative HTTP"
)

# Check if we have the right tools
if ! command -v lsof &>/dev/null && ! command -v ss &>/dev/null; then
  echo -e "${RED}❌ Neither lsof nor ss found. Please install one of them.${NC}"
  exit 1
fi

# Track if any ports are in use
PORTS_IN_USE=false

# Check each port
for port in "${!PORTS[@]}"; do
  description="${PORTS[$port]}"

  # Check if port is in use
  if command -v lsof &>/dev/null; then
    if sudo lsof -i :$port >/dev/null 2>&1; then
      echo -e "${RED}❌ Port $port${NC} (${description}) - ${RED}IN USE${NC}"

      # Show what's using it
      PROCESS=$(sudo lsof -i :$port 2>/dev/null | tail -n 1 | awk '{print $1, "PID", $2}')
      echo -e "   ${YELLOW}→ $PROCESS${NC}"

      PORTS_IN_USE=true
    else
      echo -e "${GREEN}✅ Port $port${NC} (${description}) - ${GREEN}FREE${NC}"
    fi
  else
    if sudo ss -tulpn | grep -q ":$port "; then
      echo -e "${RED}❌ Port $port${NC} (${description}) - ${RED}IN USE${NC}"

      PROCESS=$(sudo ss -tulpn | grep ":$port " | awk '{print $7}')
      echo -e "   ${YELLOW}→ $PROCESS${NC}"

      PORTS_IN_USE=true
    else
      echo -e "${GREEN}✅ Port $port${NC} (${description}) - ${GREEN}FREE${NC}"
    fi
  fi
done

echo ""
echo "======================================"

if [ "$PORTS_IN_USE" = true ]; then
  echo -e "${YELLOW}Some ports are in use!${NC}"
  echo ""
  echo "Options:"
  echo "  1. Use ./fix-any-port.sh PORT to fix specific port"
  echo "  2. Kill all node processes: pkill node"
  echo "  3. Stop all containers: podman stop \$(podman ps -aq)"
  echo ""

  # Offer to show detailed info
  read -p "Show detailed information for ports in use? (y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "======================================"
    echo "Detailed Information"
    echo "======================================"

    for port in "${!PORTS[@]}"; do
      if command -v lsof &>/dev/null; then
        if sudo lsof -i :$port >/dev/null 2>&1; then
          echo ""
          echo "Port $port (${PORTS[$port]}):"
          echo "----------------------------------------"
          sudo lsof -i :$port
        fi
      fi
    done
  fi
else
  echo -e "${GREEN}All ports are free!${NC}"
  echo ""
  echo -e "${BLUE}✨ You can start your containers safely${NC}"
fi

echo ""
