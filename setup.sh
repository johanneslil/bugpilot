#!/bin/bash

# Bugpilot Cold Start Setup Script
# This script automates the entire setup process for first-time users

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_banner() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                                       ║${NC}"
    echo -e "${BLUE}║     Bugpilot Setup - Cold Start         ║${NC}"
    echo -e "${BLUE}║                                       ║${NC}"
    echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
    echo ""
}

# Check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Check for required dependencies
check_dependencies() {
    log_info "Checking for required dependencies..."
    
    local missing_deps=()
    
    # Check Node.js
    if ! command_exists node; then
        missing_deps+=("Node.js 20+")
    else
        local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -lt 20 ]; then
            log_warning "Node.js version is $node_version. Version 20+ is recommended."
        else
            log_success "Node.js $(node -v) found"
        fi
    fi
    
    # Check pnpm
    if ! command_exists pnpm; then
        log_warning "pnpm not found. Will attempt to install via npm..."
        if command_exists npm; then
            npm install -g pnpm
            log_success "pnpm installed successfully"
        else
            missing_deps+=("pnpm 8+")
        fi
    else
        log_success "pnpm $(pnpm -v) found"
    fi
    
    # Check Docker
    if ! command_exists docker; then
        missing_deps+=("Docker")
    else
        log_success "Docker found"
    fi
    
    # Check Docker Compose
    if ! command_exists docker-compose && ! docker compose version &> /dev/null; then
        missing_deps+=("Docker Compose")
    else
        log_success "Docker Compose found"
    fi
    
    # If any dependencies are missing, exit
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing required dependencies:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        echo ""
        echo "Please install the missing dependencies and try again."
        echo "Visit https://nodejs.org, https://pnpm.io, and https://docker.com"
        exit 1
    fi
    
    log_success "All required dependencies are installed!"
    echo ""
}

# Setup environment file
setup_env() {
    log_info "Setting up environment variables..."
    
    if [ -f .env ]; then
        log_warning ".env file already exists. Skipping creation."
        read -p "Do you want to update your OpenAI API key? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Enter your OpenAI API key: " openai_key
            if [[ -n "$openai_key" ]]; then
                # Update the existing .env file
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    sed -i '' "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=\"$openai_key\"|" .env
                else
                    sed -i "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=\"$openai_key\"|" .env
                fi
                log_success "OpenAI API key updated"
            fi
        fi
    else
        # Copy from example
        if [ -f .env.example ]; then
            cp .env.example .env
            log_success ".env file created from template"
        else
            log_error ".env.example not found. Creating basic .env file..."
            cat > .env << EOF
DATABASE_URL="postgresql://bugpilot:bugpilot_dev@localhost:5432/bugpilot"
OPENAI_API_KEY="your-openai-api-key-here"
PORT=3000
NODE_ENV=development
VITE_API_URL="http://localhost:3000"
EOF
        fi
        
        # Prompt for OpenAI API key
        echo ""
        log_info "OpenAI API key is required for AI features"
        log_info "Get your key from: https://platform.openai.com/api-keys"
        echo ""
        read -p "Enter your OpenAI API key (or press Enter to skip): " openai_key
        
        if [[ -n "$openai_key" ]]; then
            # Update .env with the provided key
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=\"$openai_key\"|" .env
            else
                sed -i "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=\"$openai_key\"|" .env
            fi
            log_success "OpenAI API key saved to .env"
        else
            log_warning "Skipping OpenAI API key. You can add it later in the .env file"
        fi
    fi
    
    echo ""
}

# Install dependencies
install_dependencies() {
    log_info "Installing project dependencies..."
    log_info "This may take a few minutes on first run..."
    
    pnpm install
    
    log_success "Dependencies installed successfully!"
    echo ""
}

# Start Docker services
start_docker() {
    log_info "Starting Docker services (PostgreSQL with pgvector)..."
    
    # Check if containers are already running
    if docker-compose ps | grep -q "Up"; then
        log_warning "Docker containers are already running"
        read -p "Do you want to restart them? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose down
            docker-compose up -d
        fi
    else
        docker-compose up -d
    fi
    
    log_info "Waiting for PostgreSQL to be ready..."
    
    # Wait for database to be healthy
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps | grep postgres | grep -q "healthy"; then
            log_success "PostgreSQL is ready!"
            echo ""
            break
        fi
        
        echo -n "."
        sleep 1
        ((attempt++))
        
        if [ $attempt -gt $max_attempts ]; then
            log_error "PostgreSQL failed to start within 30 seconds"
            log_info "Check Docker logs with: docker-compose logs postgres"
            exit 1
        fi
    done
}

# Setup database
setup_database() {
    log_info "Setting up database (Prisma)..."
    
    # Generate Prisma Client
    log_info "Generating Prisma Client..."
    pnpm db:generate
    log_success "Prisma Client generated"
    
    # Run migrations
    log_info "Running database migrations..."
    pnpm db:migrate
    log_success "Database migrations completed"
    
    echo ""
}

# Seed database
seed_database() {
    echo ""
    log_info "Database seeding creates sample users and bugs with AI embeddings"
    log_warning "This requires a valid OpenAI API key"
    echo ""
    read -p "Do you want to seed the database with sample data? (Y/n): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        log_info "Seeding database..."
        log_info "This will generate embeddings and may take a minute..."
        
        if pnpm db:seed; then
            log_success "Database seeded successfully!"
            echo ""
            log_info "Sample users created: Alice, Bob, Charlie, Diana, Eve"
            log_info "15 sample bugs with embeddings created"
        else
            log_error "Database seeding failed"
            log_warning "This might be due to missing/invalid OpenAI API key"
            log_info "You can seed later with: pnpm db:seed"
        fi
    else
        log_info "Skipping database seeding"
        log_info "You can seed later with: pnpm db:seed"
    fi
    
    echo ""
}

# Print next steps
print_next_steps() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                       ║${NC}"
    echo -e "${GREEN}║     Setup Complete! 🎉                ║${NC}"
    echo -e "${GREEN}║                                       ║${NC}"
    echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo ""
    echo "  1. Start the development servers:"
    echo -e "     ${YELLOW}pnpm dev${NC}"
    echo ""
    echo "  2. Open your browser:"
    echo -e "     Frontend: ${YELLOW}http://localhost:5173${NC}"
    echo -e "     Backend:  ${YELLOW}http://localhost:3000${NC}"
    echo ""
    echo -e "${BLUE}Useful Commands:${NC}"
    echo ""
    echo -e "  ${YELLOW}pnpm dev${NC}              - Start both frontend and backend"
    echo -e "  ${YELLOW}pnpm dev:backend${NC}      - Start only backend"
    echo -e "  ${YELLOW}pnpm dev:frontend${NC}     - Start only frontend"
    echo -e "  ${YELLOW}pnpm db:studio${NC}        - Open Prisma Studio (DB GUI)"
    echo -e "  ${YELLOW}docker-compose logs${NC}   - View database logs"
    echo ""
    echo -e "${BLUE}Documentation:${NC}"
    echo "  - README.md - Full project documentation"
    echo "  - QUICK_START_AI_TOOLS.md - AI features guide"
    echo ""
}

# Main execution flow
main() {
    print_banner
    
    # Change to script directory
    cd "$(dirname "$0")"
    
    check_dependencies
    setup_env
    install_dependencies
    start_docker
    setup_database
    seed_database
    print_next_steps
    
    # Ask if user wants to start dev servers
    echo ""
    read -p "Do you want to start the development servers now? (Y/n): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        log_info "Starting development servers..."
        echo ""
        log_info "Press Ctrl+C to stop the servers"
        echo ""
        sleep 2
        pnpm dev
    else
        log_info "You can start the servers later with: pnpm dev"
    fi
}

# Run main function
main

