#!/bin/bash
# Gym Management System - Setup Script (for Linux/macOS)
# For Windows, follow the commands manually in PowerShell

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Gym Management System - Setup Script  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

# Step 1: Check Node.js and npm
echo -e "${YELLOW}[1/5] Checking Node.js and npm...${NC}"
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v14 or higher."
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) installed${NC}"
echo -e "${GREEN}✓ npm $(npm -v) installed${NC}\n"

# Step 2: Install dependencies
echo -e "${YELLOW}[2/5] Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dependencies installed${NC}\n"

# Step 3: Setup environment file
echo -e "${YELLOW}[3/5] Setting up environment configuration...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file from .env.example${NC}"
    echo -e "  Please edit .env and configure your settings if needed"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi
echo ""

# Step 4: Initialize database
echo -e "${YELLOW}[4/5] Initializing database...${NC}"
npm run db:init
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to initialize database${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Database initialized${NC}\n"

# Step 5: Ready to start
echo -e "${YELLOW}[5/5] Setup complete!${NC}"
echo -e "${GREEN}✓ All preparations done${NC}\n"

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ System ready to run!${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

echo "To start the application:"
echo -e "  ${YELLOW}npm run dev${NC}    (Development mode with auto-reload)"
echo -e "  ${YELLOW}npm start${NC}      (Production mode)"
echo ""
echo "Access the application at:"
echo -e "  ${YELLOW}http://localhost:5000${NC}"
echo ""
echo "For more information, see:"
echo -e "  ${YELLOW}README.md${NC} - Main documentation"
echo -e "  ${YELLOW}docs/EXECUTION.md${NC} - How to run the application"
echo ""
