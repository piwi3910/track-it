#!/bin/bash

# Track-It Deployment Script
# This script helps deploy Track-It to production

set -e

echo "Track-It Production Deployment"
echo "=============================="

# Check if .env.production.local exists
if [ ! -f .env.production.local ]; then
    echo "Error: .env.production.local not found!"
    echo "Please copy .env.production to .env.production.local and fill in the values."
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env.production.local | xargs)

# Function to generate secure secrets
generate_secrets() {
    echo "Generating secure secrets..."
    
    if [ -z "$JWT_SECRET" ]; then
        export JWT_SECRET=$(openssl rand -base64 32)
        echo "Generated JWT_SECRET"
    fi
    
    if [ -z "$JWT_REFRESH_SECRET" ]; then
        export JWT_REFRESH_SECRET=$(openssl rand -base64 32)
        echo "Generated JWT_REFRESH_SECRET"
    fi
    
    if [ -z "$SESSION_SECRET" ]; then
        export SESSION_SECRET=$(openssl rand -base64 32)
        echo "Generated SESSION_SECRET"
    fi
    
    if [ -z "$POSTGRES_PASSWORD" ]; then
        export POSTGRES_PASSWORD=$(openssl rand -base64 24)
        echo "Generated POSTGRES_PASSWORD"
    fi
    
    if [ -z "$ENCRYPTION_KEY" ]; then
        export ENCRYPTION_KEY=$(openssl rand -base64 32)
        echo "Generated ENCRYPTION_KEY"
    fi
    
    # Save generated secrets
    cat > .env.secrets << EOF
# Generated secrets - KEEP THIS FILE SECURE!
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
SESSION_SECRET=$SESSION_SECRET
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
ENCRYPTION_KEY=$ENCRYPTION_KEY
EOF
    
    echo "Secrets saved to .env.secrets - KEEP THIS FILE SECURE!"
}

# Function to build Docker images
build_images() {
    echo "Building Docker images..."
    
    # Build backend
    echo "Building backend image..."
    docker build -t ghcr.io/piwi3910/trackit-backend:latest ./backend
    
    # Build frontend with build args
    echo "Building frontend image..."
    docker build \
        --build-arg VITE_API_URL="${VITE_API_URL:-https://trackit.azrty.com/api/trpc}" \
        --build-arg VITE_APP_URL="${VITE_APP_URL:-https://trackit.azrty.com}" \
        --build-arg VITE_WS_URL="${VITE_WS_URL:-wss://trackit.azrty.com/ws}" \
        -t ghcr.io/piwi3910/trackit-frontend:latest ./frontend
}

# Function to push images to registry
push_images() {
    echo "Pushing images to registry..."
    
    # Login to GitHub Container Registry
    echo "Please login to GitHub Container Registry:"
    docker login ghcr.io
    
    # Push images
    docker push ghcr.io/piwi3910/trackit-backend:latest
    docker push ghcr.io/piwi3910/trackit-frontend:latest
}

# Function to deploy with Docker Compose
deploy_compose() {
    echo "Deploying with Docker Compose..."
    
    # Create necessary directories
    mkdir -p certbot/www certbot/conf
    
    # Stop existing containers
    docker-compose -f docker-compose.production.yml down
    
    # Pull latest images
    docker-compose -f docker-compose.production.yml pull
    
    # Start services
    docker-compose -f docker-compose.production.yml up -d
    
    # Wait for database to be ready
    echo "Waiting for database to be ready..."
    sleep 10
    
    # Run migrations
    echo "Running database migrations..."
    docker-compose -f docker-compose.production.yml exec backend npm run migrate:deploy
    
    echo "Docker Compose deployment complete!"
}

# Function to deploy to Kubernetes
deploy_kubernetes() {
    echo "Deploying to Kubernetes..."
    
    # Check if kubectl is configured
    if ! kubectl cluster-info &> /dev/null; then
        echo "Error: kubectl is not configured or cluster is not accessible"
        exit 1
    fi
    
    # Create namespace
    kubectl apply -f k8s/00-namespace.yaml
    
    # Generate and apply secrets
    if [ ! -f k8s/trackit-secrets-generated.yaml ]; then
        cd k8s && ./generate-secrets.sh && cd ..
    fi
    
    # Apply all manifests in order
    kubectl apply -f k8s/01-configmap.yaml
    kubectl apply -f k8s/trackit-secrets-generated.yaml
    kubectl apply -f k8s/03-postgres.yaml
    kubectl apply -f k8s/04-redis.yaml
    
    # Wait for databases
    echo "Waiting for databases to be ready..."
    kubectl -n trackit wait --for=condition=ready pod -l component=postgres --timeout=300s
    kubectl -n trackit wait --for=condition=ready pod -l component=redis --timeout=300s
    
    # Run migrations
    kubectl apply -f k8s/08-migrate-job.yaml
    kubectl -n trackit wait --for=condition=complete job/trackit-migrate --timeout=300s
    
    # Deploy application
    kubectl apply -f k8s/05-backend.yaml
    kubectl apply -f k8s/06-frontend.yaml
    kubectl apply -f k8s/07-ingress.yaml
    
    echo "Kubernetes deployment complete!"
    echo "Check status with: kubectl -n trackit get pods"
}

# Main menu
echo ""
echo "Select deployment option:"
echo "1) Generate secrets only"
echo "2) Build Docker images"
echo "3) Build and push Docker images"
echo "4) Deploy with Docker Compose"
echo "5) Deploy to Kubernetes"
echo "6) Full deployment (build, push, deploy to Kubernetes)"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        generate_secrets
        ;;
    2)
        build_images
        ;;
    3)
        build_images
        push_images
        ;;
    4)
        if [ ! -f .env.secrets ]; then
            generate_secrets
        fi
        deploy_compose
        ;;
    5)
        deploy_kubernetes
        ;;
    6)
        if [ ! -f .env.secrets ]; then
            generate_secrets
        fi
        build_images
        push_images
        deploy_kubernetes
        ;;
    *)
        echo "Invalid choice!"
        exit 1
        ;;
esac

echo ""
echo "Deployment script completed!"