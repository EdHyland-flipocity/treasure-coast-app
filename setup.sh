#!/bin/bash
# Treasure Coast Intelligence Platform — Setup Script

set -e
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════╗"
echo "║   Treasure Coast Intelligence Platform — Setup    ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# 1. Check Node.js
echo -e "${YELLOW}[1/4] Checking Node.js...${NC}"
if ! command -v node &>/dev/null; then
    echo -e "${RED}Node.js not found. Install from https://nodejs.org (v18+)${NC}"
    exit 1
fi
NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 18 ]; then
    echo -e "${RED}Node.js v18+ required. Found: $(node -v)${NC}"
    exit 1
fi
echo "  ✓ Node.js $(node -v)"

# 2. Check PHP
echo -e "${YELLOW}[2/4] Checking PHP...${NC}"
if ! command -v php &>/dev/null; then
    echo -e "${RED}PHP not found.${NC}"
    echo "  Linux:   sudo apt install php php-mysql"
    echo "  macOS:   brew install php"
    echo "  Windows: https://windows.php.net/download/"
    exit 1
fi
echo "  ✓ PHP $(php -r 'echo PHP_VERSION;')"

# Check pdo_mysql
if ! php -m | grep -q pdo_mysql; then
    echo -e "${RED}  PHP pdo_mysql extension missing.${NC}"
    echo "  Linux: sudo apt install php-mysql"
    echo "  macOS: brew install php (includes pdo_mysql)"
    exit 1
fi
echo "  ✓ PHP pdo_mysql extension"

# 3. Install Electron
echo -e "${YELLOW}[3/4] Installing Electron...${NC}"
npm install
if [ -f "node_modules/electron/dist/chrome-sandbox" ]; then
    sudo chown root:root node_modules/electron/dist/chrome-sandbox 2>/dev/null || true
    sudo chmod 4755 node_modules/electron/dist/chrome-sandbox 2>/dev/null || true
fi
echo "  ✓ Electron installed"

# 4. Database config reminder
echo -e "${YELLOW}[4/4] Database configuration...${NC}"
echo ""
echo -e "${YELLOW}  ⚠  Configure your database credentials:${NC}"
echo "     Edit all files matching: www/*/includes/db.php"
echo "     Set DB_HOST, DB_NAME, DB_USER, DB_PASS to your MySQL connection."
echo ""

echo -e "${GREEN}╔══════════════════════════════════════════════╗"
echo "║           Setup complete!                   ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  Start the app:  npm start                  ║"
echo "╚══════════════════════════════════════════════╝${NC}"
