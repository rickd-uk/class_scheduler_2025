#!/bin/bash

# A unified script to manage the Class Scheduler development environment.

# --- Helper function to navigate to project root ---
cd_to_project_root() {
  # This finds the directory where the script is located and goes up one level.
  cd "$(dirname "$0")/.." || exit
}

# --- Function to start the backend services ---
start_backend() {
  echo "--- 🚀 Starting Backend Environment (Database & Server)... ---"
  podman-compose up --build -d
  if [ $? -ne 0 ]; then
    echo "❌ ERROR: 'podman-compose up' failed. Please check the output for errors."
    exit 1
  fi
  echo "✅ Backend containers are starting in the background."
  echo "Use './scripts/dev.sh logs' to see their status."
}

# --- Function to start the frontend client ---
start_frontend() {
  echo "--- 🚀 Starting Frontend Client... ---"
  cd client || exit
  if [ ! -d "node_modules" ]; then
    echo "--- 'node_modules' not found. Running 'yarn install'... ---"
    yarn install
  fi
  echo "--- Starting Vite dev server at http://localhost:5173 ---"
  yarn dev
}

# --- Function to stop all services ---
stop_all() {
  echo "--- 🛑 Stopping all containers... ---"
  podman-compose down
  echo "--- ✅ All containers stopped. ---"
}

# --- Function to view server logs ---
view_logs() {
  echo "--- 🪵 Viewing real-time logs for the server... ---"
  echo "--- Press Ctrl+C to stop viewing ---"
  podman-compose logs -f server
}

# --- Main script logic ---
cd_to_project_root

COMMAND="$1"

case $COMMAND in
  start-backend)
    start_backend
    ;;
  start-frontend)
    start_frontend
    ;;
  stop)
    stop_all
    ;;
  logs)
    view_logs
    ;;
  *)
    echo "Usage: ./scripts/dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start-backend    - Builds and starts the backend containers (server & db) in the background."
    echo "  start-frontend   - Starts the frontend Vite development server."
    echo "  stop             - Stops and removes all running containers."
    echo "  logs             - Shows the real-time logs for the backend server."
    ;;
esac

