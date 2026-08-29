#!/bin/bash
set -e

PROJECT_DIR="/home/adhi/Projects/animesalt-tamil-addon"
SYSTEMD_USER_DIR="$HOME/.config/systemd/user"

echo "======================================================"
echo "  AnimeSalt Tamil Dubs Addon - Setup & Installation   "
echo "======================================================"
echo ""

show_menu() {
    echo "Please choose an action:"
    echo "  1) Install & Enable Background Daemon (systemd user service)"
    echo "  2) Start Local Addon Manually (Port 7000)"
    echo "  3) Run Automated Test Suite"
    echo "  4) Re-index All Catalogs (Series & Movies)"
    echo "  5) Build & Run with Docker Compose"
    echo "  6) Exit"
    echo ""
}

if [ "$1" == "--install-service" ]; then
    CHOICE=1
elif [ "$1" == "--test" ]; then
    CHOICE=3
elif [ "$1" == "--index" ]; then
    CHOICE=4
else
    show_menu
    read -p "Enter choice [1-6]: " CHOICE
fi

case $CHOICE in
    1)
        echo "[Setup] Installing systemd user service..."
        mkdir -p "$SYSTEMD_USER_DIR"
        cp "$PROJECT_DIR/systemd/animesalt-addon.service" "$SYSTEMD_USER_DIR/"
        systemctl --user daemon-reload
        systemctl --user enable --now animesalt-addon.service
        echo ""
        echo "✅ Service successfully enabled and started!"
        echo "📡 Manifest URL: http://localhost:7000/manifest.json"
        echo "📊 Check status: systemctl --user status animesalt-addon"
        echo "📜 View logs:    journalctl --user -u animesalt-addon -f"
        ;;
    2)
        echo "[Setup] Starting Addon on port 7000..."
        cd "$PROJECT_DIR"
        npm start
        ;;
    3)
        echo "[Setup] Running test suite..."
        cd "$PROJECT_DIR"
        npm test
        ;;
    4)
        echo "[Setup] Running catalog indexer..."
        cd "$PROJECT_DIR"
        npm run index
        ;;
    5)
        echo "[Setup] Starting with Docker Compose..."
        cd "$PROJECT_DIR"
        docker-compose up -d --build
        echo "✅ Container started on port 7000!"
        ;;
    6)
        echo "Exiting."
        exit 0
        ;;
    *)
        echo "Invalid option."
        exit 1
        ;;
esac
