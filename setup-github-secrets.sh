#!/bin/bash

# Script to help set up GitHub secrets for Track-It deployment
# This script uses the GitHub CLI (gh) to set repository secrets

echo "Setting up GitHub Secrets for Track-It Deployment"
echo "================================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed."
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if logged in
if ! gh auth status &> /dev/null; then
    echo "Error: Not logged in to GitHub CLI."
    echo "Run: gh auth login"
    exit 1
fi

# Get repository name
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Setting secrets for repository: $REPO"
echo ""

# Function to set a secret
set_secret() {
    local name=$1
    local value=$2
    echo "Setting $name..."
    echo "$value" | gh secret set "$name" --repo "$REPO"
}

# Check if secrets file exists
if [ -f "k8s/trackit-secrets-generated.yaml" ]; then
    echo "Found generated secrets file. Extracting values..."
    
    # Extract secrets from the generated file
    JWT_SECRET=$(grep "JWT_SECRET:" k8s/trackit-secrets-generated.yaml | cut -d'"' -f2)
    JWT_REFRESH_SECRET=$(grep "JWT_REFRESH_SECRET:" k8s/trackit-secrets-generated.yaml | cut -d'"' -f2)
    SESSION_SECRET=$(grep "SESSION_SECRET:" k8s/trackit-secrets-generated.yaml | cut -d'"' -f2)
    ENCRYPTION_KEY=$(grep "ENCRYPTION_KEY:" k8s/trackit-secrets-generated.yaml | cut -d'"' -f2)
    POSTGRES_PASSWORD=$(grep "POSTGRES_PASSWORD:" k8s/trackit-secrets-generated.yaml | cut -d'"' -f2)
    
    # Set the secrets
    set_secret "JWT_SECRET" "$JWT_SECRET"
    set_secret "JWT_REFRESH_SECRET" "$JWT_REFRESH_SECRET"
    set_secret "SESSION_SECRET" "$SESSION_SECRET"
    set_secret "ENCRYPTION_KEY" "$ENCRYPTION_KEY"
    set_secret "POSTGRES_PASSWORD" "$POSTGRES_PASSWORD"
else
    echo "Warning: Generated secrets file not found."
    echo "Please run: cd k8s && ./generate-secrets.sh"
    echo ""
    echo "Or manually set these secrets in GitHub:"
    echo "- JWT_SECRET"
    echo "- JWT_REFRESH_SECRET"
    echo "- SESSION_SECRET"
    echo "- ENCRYPTION_KEY"
    echo "- POSTGRES_PASSWORD"
fi

# Check for DigitalOcean PAT
echo ""
echo "Setting DigitalOcean Personal Access Token..."
echo "You need a DigitalOcean PAT with read/write access to Kubernetes."
read -s -p "Enter your DigitalOcean Personal Access Token: " DO_PAT
echo ""

if [ -n "$DO_PAT" ]; then
    set_secret "DO_PAT" "$DO_PAT"
else
    echo "Warning: No DO_PAT provided. Deployment will fail without it."
fi

# Optional secrets
echo ""
echo "Optional: Google OAuth Configuration"
read -p "Do you want to configure Google OAuth? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter Google Client ID: " GOOGLE_CLIENT_ID
    read -s -p "Enter Google Client Secret: " GOOGLE_CLIENT_SECRET
    echo ""
    
    if [ -n "$GOOGLE_CLIENT_ID" ]; then
        set_secret "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID"
    fi
    if [ -n "$GOOGLE_CLIENT_SECRET" ]; then
        set_secret "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET"
    fi
fi

echo ""
echo "Optional: SMTP Configuration"
read -p "Do you want to configure SMTP for emails? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter SMTP Host: " SMTP_HOST
    read -p "Enter SMTP Port (default: 587): " SMTP_PORT
    read -p "Enter SMTP User: " SMTP_USER
    read -s -p "Enter SMTP Password: " SMTP_PASS
    echo ""
    
    if [ -n "$SMTP_HOST" ]; then
        set_secret "SMTP_HOST" "$SMTP_HOST"
    fi
    if [ -n "$SMTP_PORT" ]; then
        set_secret "SMTP_PORT" "$SMTP_PORT"
    fi
    if [ -n "$SMTP_USER" ]; then
        set_secret "SMTP_USER" "$SMTP_USER"
    fi
    if [ -n "$SMTP_PASS" ]; then
        set_secret "SMTP_PASS" "$SMTP_PASS"
    fi
fi

echo ""
echo "GitHub Secrets Setup Complete!"
echo ""
echo "To verify secrets were set:"
echo "gh secret list --repo $REPO"
echo ""
echo "To trigger deployment:"
echo "git push origin main"
echo ""
echo "Or manually trigger the workflow:"
echo "gh workflow run deploy.yml --repo $REPO"