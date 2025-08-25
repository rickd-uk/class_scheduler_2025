#!/bin/bash

# Script to start the backend services (database and server) for the Class Scheduler.
# This version is NON-DESTRUCTIVE and will preserve your database data.

echo "--- 🚀 Starting Scheduler Backend Environment ---"
echo ""

# --- Step 1: Check Podman Service ---
echo "--- Checking Podman service status (with a 10-second timeout)... ---"
if ! timeout 10s podman ps > /dev/null; then
  if [ $? -eq 124 ]; then
    echo "❌ ERROR: 'podman ps' command timed out. Your Podman service is unresponsive."
    echo "Please try restarting it. On Linux, this is often 'systemctl --user restart podman.socket'."
    exit 1
  else
    # This case is unlikely but handled for robustness.
    echo "Podman service seems responsive but 'podman ps' failed."
  fi
else
  echo "✅ Podman service is responsive."
fi
echo ""

# --- Step 2: Stop any previous instances (SAFE VERSION) ---
echo "--- Stopping any old containers to ensure a clean start... ---"
# This command stops and removes the containers but LEAVES THE VOLUMES INTACT.
podman-compose down > /dev/null 2>&1
echo "--- Old containers stopped. ---"
echo ""

# --- Step 3: Start containers in the background ---
echo "--- Building and starting backend containers with podman-compose... ---"
podman-compose up --build -d
if [ $? -ne 0 ]; then
    echo "❌ ERROR: 'podman-compose up' failed. Please check the output for errors."
    exit 1
fi
echo ""

# --- Step 4: Verify containers are running ---
echo "--- Verifying that containers have started... ---"
sleep 5 # Give containers a moment to initialize

if ! podman ps | grep -q 'scheduler-server-dev'; then
    echo "❌ ERROR: The server container (scheduler-server-dev) failed to start."
    echo "Check the logs for errors with: podman-compose logs server"
    exit 1
fi

if ! podman ps | grep -q 'scheduler-db-dev'; then
    echo "❌ ERROR: The database container (scheduler-db-dev) failed to start."
    echo "Check the logs for errors with: podman-compose logs db"
    exit 1
fi

echo "✅ Backend and database containers are running successfully!"
echo "You can monitor the server logs with: podman-compose logs -f server"

