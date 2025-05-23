# Track-It Deployment Guide

This guide covers deploying Track-It to production using either Docker Compose or Kubernetes.

## Prerequisites

- Docker and Docker Compose (for Docker deployment)
- Kubernetes cluster with kubectl configured (for K8s deployment)
- Domain name configured (trackit.azrty.com)
- SSL certificates (automatic with Let's Encrypt)

## Quick Start

1. **Copy environment template:**
   ```bash
   cp .env.production .env.production.local
   ```

2. **Edit `.env.production.local`** with your values

3. **Run deployment script:**
   ```bash
   ./deploy.sh
   ```

## Environment Configuration

### Required Secrets

Generate secure secrets using the deployment script or manually:

```bash
# Generate a 32-character secret
openssl rand -base64 32
```

Required secrets:
- `JWT_SECRET` - JWT signing key
- `JWT_REFRESH_SECRET` - JWT refresh token key
- `SESSION_SECRET` - Session encryption key
- `POSTGRES_PASSWORD` - Database password
- `ENCRYPTION_KEY` - Data encryption key

### Optional Configuration

- **Google OAuth:** Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- **Email Service:** Configure SMTP settings
- **Monitoring:** Set up Sentry DSN for error tracking

## Docker Compose Deployment

### Building Images

```bash
# Build locally
docker-compose -f docker-compose.production.yml build

# Or use pre-built images
docker-compose -f docker-compose.production.yml pull
```

### Starting Services

```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### SSL Certificate Setup

For initial SSL setup with Let's Encrypt:

```bash
# Create directories
mkdir -p certbot/www certbot/conf

# Get initial certificate
docker run -it --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d trackit.azrty.com
```

## Kubernetes Deployment

### Prerequisites

1. **Cluster Requirements:**
   - NGINX Ingress Controller
   - cert-manager with Let's Encrypt
   - Storage provisioner (e.g., DigitalOcean Block Storage)

2. **Verify cluster setup:**
   ```bash
   kubectl get ingressclass
   kubectl get clusterissuer
   kubectl get storageclass
   ```

### Deployment Steps

1. **Generate secrets:**
   ```bash
   cd k8s
   ./generate-secrets.sh
   ```

2. **Deploy in order:**
   ```bash
   # Create namespace
   kubectl apply -f k8s/00-namespace.yaml

   # Apply configurations
   kubectl apply -f k8s/01-configmap.yaml
   kubectl apply -f k8s/trackit-secrets-generated.yaml

   # Deploy databases
   kubectl apply -f k8s/03-postgres.yaml
   kubectl apply -f k8s/04-redis.yaml

   # Wait for databases
   kubectl -n trackit wait --for=condition=ready pod -l component=postgres --timeout=300s

   # Run migrations
   kubectl apply -f k8s/08-migrate-job.yaml

   # Deploy application
   kubectl apply -f k8s/05-backend.yaml
   kubectl apply -f k8s/06-frontend.yaml
   kubectl apply -f k8s/07-ingress.yaml
   ```

3. **Verify deployment:**
   ```bash
   kubectl -n trackit get pods
   kubectl -n trackit get ingress
   ```

## Database Management

### Migrations

```bash
# Docker Compose
docker-compose -f docker-compose.production.yml exec backend npm run migrate:deploy

# Kubernetes
kubectl -n trackit exec -it deploy/backend -- npm run migrate:deploy
```

### Backups

```bash
# Docker Compose
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U trackit trackit > backup.sql

# Kubernetes
kubectl -n trackit exec -it postgres-0 -- pg_dump -U trackit trackit > backup.sql
```

### Restore

```bash
# Docker Compose
docker-compose -f docker-compose.production.yml exec -T postgres psql -U trackit trackit < backup.sql

# Kubernetes
kubectl -n trackit exec -i postgres-0 -- psql -U trackit trackit < backup.sql
```

## Monitoring

### Health Checks

- Backend health: `https://trackit.azrty.com/health`
- Frontend health: `https://trackit.azrty.com/`

### Logs

```bash
# Docker Compose
docker-compose -f docker-compose.production.yml logs -f backend
docker-compose -f docker-compose.production.yml logs -f frontend

# Kubernetes
kubectl -n trackit logs -l component=backend -f
kubectl -n trackit logs -l component=frontend -f
```

### Metrics

For Kubernetes deployments, consider adding:
- Prometheus for metrics collection
- Grafana for visualization
- Loki for log aggregation

## Scaling

### Docker Compose

Edit `docker-compose.production.yml` to add more replicas:
```yaml
backend:
  deploy:
    replicas: 3
```

### Kubernetes

```bash
kubectl -n trackit scale deployment backend --replicas=3
kubectl -n trackit scale deployment frontend --replicas=3
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check if PostgreSQL is running
   - Verify DATABASE_URL and credentials
   - Check network connectivity

2. **SSL Certificate Issues**
   - Verify domain DNS points to your server
   - Check cert-manager logs: `kubectl logs -n cert-manager deploy/cert-manager`
   - Ensure ingress annotations are correct

3. **Application Errors**
   - Check backend logs for errors
   - Verify all environment variables are set
   - Ensure migrations have run successfully

### Debug Commands

```bash
# Test database connection
kubectl -n trackit exec -it deploy/backend -- nc -zv postgres-service 5432

# Check environment variables
kubectl -n trackit exec -it deploy/backend -- env | grep -E "(JWT|DATABASE|REDIS)"

# Test Redis connection
kubectl -n trackit exec -it deploy/backend -- redis-cli -h redis-service ping
```

## Security Considerations

1. **Secrets Management:**
   - Never commit secrets to version control
   - Use Kubernetes secrets or Docker secrets
   - Rotate secrets regularly

2. **Network Security:**
   - Enable firewall rules
   - Use network policies in Kubernetes
   - Implement rate limiting

3. **Updates:**
   - Keep Docker images updated
   - Regular security patches
   - Monitor for vulnerabilities

## Maintenance

### Regular Tasks

- **Daily:** Check application logs and health
- **Weekly:** Review metrics and performance
- **Monthly:** Update dependencies and security patches
- **Quarterly:** Rotate secrets and review access

### Update Process

1. Build new images with updated code
2. Test in staging environment
3. Deploy during maintenance window
4. Run database migrations if needed
5. Verify application functionality

## Support

For issues or questions:
1. Check application logs
2. Review this documentation
3. Check GitHub issues
4. Contact support team