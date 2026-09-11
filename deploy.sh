#!/bin/bash

# Usage:
#   ./deploy.sh            # deploy everything (api, ui, admin)
#   ./deploy.sh ui         # deploy only the UI
#   ./deploy.sh ui,api     # deploy only the UI and API (comma-separated, any order)

# Helper function to check the status of the last command and handle errors
check_status() {
  if [ $? -ne 0 ]; then
    echo "Error: $1 failed. Exiting..."
    exit 1
  fi
}

# Comma-separated list of targets to deploy. Empty (no arg) means "all".
TARGETS="${1:-}"

should_deploy() {
  # $1 = target name; deploy if no targets were given, or the target is listed.
  [ -z "$TARGETS" ] && return 0
  case ",$TARGETS," in
    *",$1,"*) return 0 ;;
    *) return 1 ;;
  esac
}

echo "Deploying: ${TARGETS:-all (api, ui, admin)}"

# Ensure script is running from the root of the project
ROOT_DIR="/var/www/hebrew-calendar"
cd "$ROOT_DIR" || { echo "Error: Could not change to project root directory. Exiting..."; exit 1; }

# Pull the latest from main before building
echo "Pulling latest from main..."
git checkout main
check_status "Checking out main"
git pull origin main
check_status "Pulling latest from main"

# Deploy API
if should_deploy "api"; then
  cd "$ROOT_DIR/packages/api" || { echo "Error: Could not change to API directory. Exiting..."; exit 1; }

  echo "Stopping API..."
  pm2 stop hebrew-calendar-api
  check_status "Stopping API"

  echo "Building API..."
  yarn build
  check_status "Building API"

  echo "Starting API..."
  pm2 start pm2.config.js --only hebrew-calendar-api
  check_status "Starting API"
fi

# Deploy UI
if should_deploy "ui"; then
  cd "$ROOT_DIR/packages/ui" || { echo "Error: Could not change to UI directory. Exiting..."; exit 1; }

  echo "Stopping UI..."
  pm2 stop hebrew-calendar-ui
  check_status "Stopping UI"

  echo "Building UI..."
  yarn build
  check_status "Building UI"

  echo "Updating UI environment variables in index.html..."
  ./update_env.sh
  check_status "Updating UI environment variables"

  echo "Starting UI..."
  pm2 start pm2.config.js --only hebrew-calendar-ui
  check_status "Starting UI"
fi

# Deploy admin
if should_deploy "admin"; then
  cd "$ROOT_DIR/packages/admin" || { echo "Error: Could not change to Admin directory. Exiting..."; exit 1; }

  echo "Stopping Admin..."
  pm2 stop hebrew-calendar-admin
  check_status "Stopping Admin"

  echo "Building Admin..."
  yarn build
  check_status "Building Admin"

  echo "Updating Admin environment variables in index.html..."
  ./update_env.sh
  check_status "Updating Admin environment variables"

  echo "Starting Admin..."
  pm2 start pm2.config.js --only hebrew-calendar-admin
  check_status "Starting Admin"
fi

# Return to root
cd "$ROOT_DIR" || { echo "Error: Could not return to project root directory. Exiting..."; exit 1; }

echo "Deployment complete!"
