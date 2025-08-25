#!/bin/bash

# Script to start the frontend client for the Class Scheduler.

echo "--- 🚀 Starting Scheduler Frontend ---"
echo ""

# Navigate to the client directory relative to the script's location
cd "$(dirname "$0")/../client"

# --- Step 1: Check for dependencies ---
if [ ! -d "node_modules" ]; then
  echo "--- 'node_modules' not found. Running 'yarn install'... ---"
  yarn install
  if [ $? -ne 0 ]; then
    echo "❌ ERROR: 'yarn install' failed. Please check for errors."
    exit 1
  fi
  echo "--- Dependencies installed. ---"
  echo ""
fi

# --- Step 2: Start the Vite dev server ---
echo "--- Starting the Vite development server... ---"
echo "Your application will be available at http://localhost:5173"
echo "Press Ctrl+C to stop the client."
echo ""

yarn dev

