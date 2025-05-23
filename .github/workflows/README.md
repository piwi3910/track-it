# Track-It GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated building, pushing, and deployment of Track-It.

## Workflows

### 1. `deploy.yml` - Main Deployment Workflow
- **Trigger**: Push to `main` branch
- **Actions**:
  - Builds Docker images for backend and frontend
  - Pushes images to GitHub Container Registry (ghcr.io)
  - Deploys to DigitalOcean Kubernetes cluster
  - Runs database migrations
  - Performs health checks

### 2. `build-and-push.yml` - Build Only Workflow
- **Trigger**: Pull requests to `main` or manual trigger
- **Actions**:
  - Builds Docker images
  - Pushes to registry (for testing)

## Required GitHub Secrets

Set these secrets in your repository settings:

### Required Secrets
- `DO_PAT` - DigitalOcean Personal Access Token (with Kubernetes access)
- `JWT_SECRET` - JWT signing key (32+ chars)
- `JWT_REFRESH_SECRET` - JWT refresh token key (32+ chars)
- `SESSION_SECRET` - Session encryption key (32+ chars)
- `ENCRYPTION_KEY` - Data encryption key (32+ chars)
- `POSTGRES_PASSWORD` - PostgreSQL password

### Optional Secrets
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password

## Setup Instructions

1. **Generate Secrets**:
   ```bash
   cd k8s
   ./generate-secrets.sh
   ```

2. **Set GitHub Secrets**:
   ```bash
   # Use the provided script
   ./setup-github-secrets.sh
   
   # Or manually via GitHub UI:
   # Go to Settings > Secrets and variables > Actions
   ```

3. **Verify Secrets**:
   ```bash
   gh secret list
   ```

4. **Test Deployment**:
   ```bash
   # Push to main branch
   git push origin main
   
   # Or manually trigger
   gh workflow run deploy.yml
   ```

## Workflow Details

### Build Stage
- Uses Docker Buildx for efficient builds
- Caches layers using GitHub Actions cache
- Tags images with both `latest` and commit SHA

### Deploy Stage
- Configures kubectl with DigitalOcean cluster
- Creates/updates Kubernetes resources
- Uses commit SHA tags for immutable deployments
- Performs rolling updates with health checks

### Security Notes
- Images are stored in GitHub Container Registry
- Secrets are never exposed in logs
- Uses least-privilege service account

## Troubleshooting

### Build Failures
- Check Docker context paths
- Verify Dockerfile syntax
- Check for missing dependencies

### Push Failures
- Verify GITHUB_TOKEN has packages:write permission
- Check registry authentication

### Deploy Failures
- Verify DO_PAT is valid and has Kubernetes access
- Check cluster name matches your setup
- Verify all secrets are set correctly
- Check Kubernetes resource quotas

### Common Commands
```bash
# View workflow runs
gh run list --workflow=deploy.yml

# View specific run logs
gh run view <run-id>

# Re-run failed workflow
gh run rerun <run-id>

# Download workflow logs
gh run download <run-id>
```

## Monitoring

After deployment:
1. Check pod status: `kubectl -n trackit get pods`
2. View logs: `kubectl -n trackit logs -l app=trackit`
3. Check ingress: `kubectl -n trackit get ingress`
4. Visit: https://trackit.azrty.com