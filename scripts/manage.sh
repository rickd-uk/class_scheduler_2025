#!/bin/bash

# A unified script to manage the Class Scheduler development and production environments.

# --- Helper function to navigate to project root ---
cd_to_project_root() {
  # This finds the directory where the script is located and goes up one level.
  cd "$(dirname "$0")/.." || exit
}

# --- Main script logic ---
cd_to_project_root

COMMAND="$1"

case $COMMAND in
  start:dev)
    echo "--- 🚀 Starting DEVELOPMENT environment (Client + Server + DB)... ---"
    podman-compose -f podman-compose.dev.yml up --build -d
    echo "✅ Development containers are starting. Use './scripts/manage.sh logs:dev' to see their status."
    ;;

  start:prod)
    echo "--- 🚀 Starting PRODUCTION environment (Client + Server + DB)... ---"
    podman-compose -f podman-compose.yml up --build -d
    echo "✅ Production containers are starting. Use './scripts/manage.sh logs:prod' to see their status."
    ;;

  stop:dev)
    echo "--- 🛑 Stopping DEVELOPMENT environment... ---"
    podman-compose -f podman-compose.dev.yml down
    echo "--- ✅ Development containers stopped. ---"
    ;;

  stop:prod)
    echo "--- 🛑 Stopping PRODUCTION environment... ---"
    podman-compose -f podman-compose.yml down
    echo "--- ✅ Production containers stopped. ---"
    ;;

  logs:dev)
    echo "--- 🪵 Viewing real-time logs for the DEVELOPMENT server... (Press Ctrl+C to stop) ---"
    podman-compose -f podman-compose.dev.yml logs -f server
    ;;

  logs:prod)
    echo "--- 🪵 Viewing real-time logs for the PRODUCTION server... (Press Ctrl+C to stop) ---"
    podman-compose -f podman-compose.yml logs -f server
    ;;

  *)
    echo "Usage: ./scripts/manage.sh [command]"
    echo ""
    echo "Development Commands (For your local machine):"
    echo "  start:dev        - Builds and starts all services for local development with live-reloading."
    echo "  stop:dev         - Stops and removes all development containers."
    echo "  logs:dev         - Shows the real-time logs for the development backend server."
    echo ""
    echo "Production Commands (For your VPS):"
    echo "  start:prod       - Builds and starts all services for production."
    echo "  stop:prod        - Stops and removes all production containers."
    echo "  logs:prod        - Shows the real-time logs for the production backend server."
    ;;
esac
