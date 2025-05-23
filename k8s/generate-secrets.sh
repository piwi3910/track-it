#!/bin/bash

# Script to generate secure secrets for production
# Usage: ./generate-secrets.sh

echo "Generating secure secrets for Track-It production deployment..."

# Generate random secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24)

# Create the secret in Kubernetes
kubectl create secret generic trackit-secrets \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --from-literal=JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" \
  --from-literal=SESSION_SECRET="$SESSION_SECRET" \
  --from-literal=ENCRYPTION_KEY="$ENCRYPTION_KEY" \
  --from-literal=POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  --from-literal=POSTGRES_USER=trackit \
  --from-literal=POSTGRES_DB=trackit \
  --from-literal=GOOGLE_CLIENT_ID="" \
  --from-literal=GOOGLE_CLIENT_SECRET="" \
  --from-literal=SMTP_HOST="" \
  --from-literal=SMTP_PORT="587" \
  --from-literal=SMTP_USER="" \
  --from-literal=SMTP_PASS="" \
  --from-literal=SMTP_FROM="noreply@trackit.azrty.com" \
  -n trackit \
  --dry-run=client -o yaml > trackit-secrets-generated.yaml

echo "Secrets generated successfully!"
echo ""
echo "Generated values (save these securely):"
echo "======================================="
echo "JWT_SECRET: $JWT_SECRET"
echo "JWT_REFRESH_SECRET: $JWT_REFRESH_SECRET"
echo "SESSION_SECRET: $SESSION_SECRET"
echo "ENCRYPTION_KEY: $ENCRYPTION_KEY"
echo "POSTGRES_PASSWORD: $POSTGRES_PASSWORD"
echo ""
echo "Secret manifest saved to: trackit-secrets-generated.yaml"
echo "Apply with: kubectl apply -f trackit-secrets-generated.yaml"