#!/bin/bash

# General Port Conflict Fixer
# Usage: ./fix-port.sh PORT_NUMBER
# Example: ./fix-port.sh 3001

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if port number is provided
if [ -z "$1" ]; then
  print_error "No port number provided!"
  echo ""
  echo "Usage: $0 PORT_NUMBER"
  echo ""
  echo "Examples:"
  echo "  $0 3001      # Check and fix port 3001"
  echo "  $0 5173      # Check and fix port 5173"
  echo "  $0 80        # Check and fix port 80"
  echo ""
  echo "Common ports in your project:"
  echo "  3001  - Backend server (development)"
  echo "  5173  - Frontend server (Vite dev)"
  echo "  5433  - PostgreSQL (host port)"
  echo "  80    - Nginx (production)"
  echo "  443   - Nginx HTTPS (production)"
  exit 1
fi

PORT=$1

# Validate port number
if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
  print_error "Invalid port number: $PORT"
  echo "Port must be a number between 1 and 65535"
  exit 1
fi

echo "======================================"
echo "  Port Conflict Fixer"
echo "  Checking Port: $PORT"
echo "======================================"
echo ""

# Check if running as root for some commands
if [ "$EUID" -ne 0 ]; then
  print_warning "Not running as root. Some commands may require sudo."
  echo ""
fi

# Function to check port
check_port() {
  if command -v lsof &>/dev/null; then
    PORT_INFO=$(sudo lsof -i :$PORT 2>/dev/null)
    if [ -n "$PORT_INFO" ]; then
      return 0
    fi
  elif command -v ss &>/dev/null; then
    PORT_INFO=$(sudo ss -tulpn | grep ":$PORT ")
    if [ -n "$PORT_INFO" ]; then
      return 0
    fi
  elif command -v netstat &>/dev/null; then
    PORT_INFO=$(sudo netstat -tulpn | grep ":$PORT ")
    if [ -n "$PORT_INFO" ]; then
      return 0
    fi
  else
    print_error "No port checking tools found (lsof, ss, netstat)"
    exit 1
  fi
  return 1
}

# Check if port is in use
if ! check_port; then
  print_success "Port $PORT is free!"
  echo ""
  print_info "No action needed."
  exit 0
fi

# Port is in use - show details
print_error "Port $PORT is in use!"
echo ""
print_info "Details:"
echo "----------------------------------------"

if command -v lsof &>/dev/null; then
  sudo lsof -i :$PORT
  echo ""

  # Get PIDs
  PIDS=$(sudo lsof -ti :$PORT)
else
  sudo ss -tulpn | grep ":$PORT "
  echo ""

  # Try to extract PIDs from ss output
  PIDS=$(sudo ss -tulpn | grep ":$PORT " | awk '{print $7}' | cut -d',' -f2 | cut -d'=' -f2 | sort -u)
fi

echo "----------------------------------------"
echo ""

# If no PIDs found
if [ -z "$PIDS" ]; then
  print_warning "Could not determine PIDs"
  print_info "You may need to manually identify and stop the process"
  exit 1
fi

# Show process details
echo "Process Information:"
echo "----------------------------------------"
for pid in $PIDS; do
  if ps -p $pid >/dev/null 2>&1; then
    echo "PID: $pid"
    ps -p $pid -o pid,user,comm,args | tail -n 1
    echo ""
  fi
done
echo "----------------------------------------"
echo ""

# Ask user what to do
echo "Options:"
echo "  1) Kill process(es) gracefully (recommended)"
echo "  2) Force kill process(es)"
echo "  3) Show more details"
echo "  4) Exit without changes"
echo ""
read -p "Choose option (1-4): " -n 1 -r OPTION
echo ""
echo ""

case $OPTION in
1)
  print_info "Attempting graceful shutdown..."
  for pid in $PIDS; do
    echo "Killing PID $pid..."
    sudo kill $pid 2>/dev/null
    if [ $? -eq 0 ]; then
      print_success "Sent SIGTERM to PID $pid"
    else
      print_error "Failed to kill PID $pid"
    fi
  done

  # Wait a moment
  sleep 2

  # Check if port is now free
  if ! check_port; then
    print_success "Port $PORT is now free!"
  else
    print_warning "Port $PORT is still in use"
    print_info "Try option 2 (force kill) if needed"
  fi
  ;;

2)
  print_warning "Force killing process(es)..."
  for pid in $PIDS; do
    echo "Force killing PID $pid..."
    sudo kill -9 $pid 2>/dev/null
    if [ $? -eq 0 ]; then
      print_success "Sent SIGKILL to PID $pid"
    else
      print_error "Failed to kill PID $pid"
    fi
  done

  # Wait a moment
  sleep 1

  # Check if port is now free
  if ! check_port; then
    print_success "Port $PORT is now free!"
  else
    print_error "Port $PORT is still in use!"
    print_info "You may need to manually investigate"
  fi
  ;;

3)
  print_info "Additional details:"
  echo ""

  # Show full process tree
  for pid in $PIDS; do
    echo "Full info for PID $pid:"
    ps -f -p $pid
    echo ""

    # Show listening sockets
    echo "Network connections:"
    sudo lsof -p $pid -a -i 2>/dev/null || sudo ss -p | grep $pid
    echo ""
    echo "----------------------------------------"
  done

  # Check if it's a container
  print_info "Checking if this is a container..."
  podman ps -a | grep -v CONTAINER 2>/dev/null

  echo ""
  print_info "Run this script again to take action"
  ;;

4)
  print_info "Exiting without changes"
  exit 0
  ;;

*)
  print_error "Invalid option"
  exit 1
  ;;
esac

echo ""
echo "======================================"
echo "Done!"
echo "======================================"

# Offer to check again
echo ""
read -p "Check port $PORT again? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  exec "$0" "$PORT"
fi
