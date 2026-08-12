# eTunda Platform - Production Deployment Guide

## 🚀 Pre-Deployment Checklist

- [ ] All tests passing (100% coverage target)
- [ ] Code review completed
- [ ] Security audit performed
- [ ] Database backups configured
- [ ] SSL certificates obtained
- [ ] DNS records configured
- [ ] CDN configured (Cloudflare)
- [ ] Monitoring & logging set up
- [ ] Incident response plan ready
- [ ] Load testing completed

---

## 📋 Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│              Cloudflare CDN                      │
│           (DDoS Protection, SSL)                 │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│         Nginx Load Balancer                      │
│  (Port 80→443, Rate Limiting, Caching)          │
└──────────────┬──────────────────────────────────┘
               │
      ┌────────┼────────┐
      │        │        │
   ┌──▼──┐  ┌──▼──┐  ┌──▼──┐
   │  BE1 │  │  BE2 │  │  BE3 │  (Backend Instances)
   └──┬──┘  └──┬──┘  └──┬──┘
      │        │        │
      └────────┼────────┘
               │
      ┌────────▼─────────┐
      │  PostgreSQL DB   │  (Primary - Write)
      │  + Replication   │  (Replicas - Read)
      └──────────────────┘
               │
      ┌────────▼─────────┐
      │   Redis Cache    │  (Session & Data Cache)
      └──────────────────┘
```

---

## 🔧 Deployment Steps

### Step 1: Prepare Infrastructure

#### AWS EC2 Setup
```bash
# Launch 3 instances for backend load balancing
# t3.medium (2vCPU, 4GB RAM) minimum
# Ubuntu 22.04 LTS

# Install dependencies
sudo apt update
sudo apt install -y docker.io docker-compose nodejs npm git

# Add user to docker group
sudo usermod -aG docker $USER

# Start Docker daemon
sudo systemctl start docker
sudo systemctl enable docker
```

#### RDS Database Setup
```bash
# Create RDS PostgreSQL instance
# Engine: PostgreSQL 16.x
# Instance: db.t3.small or larger
# Storage: 100GB SSD
# Multi-AZ: Yes (for high availability)
# Backup retention: 30 days
# Enable encryption: Yes
```

#### ElastiCache Redis
```bash
# Create Redis cluster
# Engine: Redis 7.x
# Node type: cache.t3.micro or larger
# Number of nodes: 3 (for replication)
# Automatic failover: Yes
```

### Step 2: Configure Production Secrets

```bash
# Copy environment template
cp .env.production.example .env.production

# Edit with production values
nano .env.production

# Required secrets:
# - DB_PASSWORD (32+ chars, strong)
# - JWT_SECRET (64+ chars, random)
# - STRIPE_SECRET_KEY
# - STRIPE_PUBLIC_KEY
# - GRAFANA_PASSWORD
```

### Step 3: Build and Push Docker Images

```bash
# Login to Docker registry
docker login ghcr.io -u $GITHUB_USERNAME

# Build backend image
docker build -t ghcr.io/username/etunda-backend:1.0.0 packages/backend
docker push ghcr.io/username/etunda-backend:1.0.0

# Build frontend image
docker build -t ghcr.io/username/etunda-frontend:1.0.0 packages/frontend
docker push ghcr.io/username/etunda-frontend:1.0.0

# Tag as latest
docker tag ghcr.io/username/etunda-backend:1.0.0 ghcr.io/username/etunda-backend:latest
docker push ghcr.io/username/etunda-backend:latest
```

### Step 4: SSL Certificate Setup (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --standalone \
  -d etunda.com \
  -d www.etunda.com \
  -d api.etunda.com

# Copy to deployment directory
sudo cp /etc/letsencrypt/live/etunda.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/etunda.com/privkey.pem ./ssl/key.pem
sudo chown $USER:$USER ./ssl/*

# Auto-renewal
sudo systemctl enable certbot.timer
```

### Step 5: Deploy with Docker Compose

```bash
# Clone repository
git clone https://github.com/SOTWke/etunda-platform.git
cd etunda-platform

# Load environment
export $(cat .env.production | xargs)

# Deploy production stack
docker compose -f docker-compose.prod.yml up -d

# Verify all services
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs -f
```

### Step 6: Database Migration

```bash
# Connect to RDS database
psql -h $RDS_ENDPOINT -U postgres -d etunda_db

# Run migrations (handled by app initialization)
# Tables auto-created on first run

# Verify tables created
\dt

# Check indexes
\di
```

### Step 7: Configure Backups

```bash
# RDS Automated Backups
# - Retention: 30 days
# - Backup window: 02:00 UTC
# - Multi-AZ: Enabled

# Additional S3 backups
aws s3 sync /database-backups s3://etunda-backups --delete

# Setup backup cron job
0 3 * * * /scripts/backup-to-s3.sh
```

---

## 🔒 Security Configuration

### 1. Firewall Rules

```bash
# Allow only necessary ports
# SSH: 22 (restricted IP)
# HTTP: 80 (world)
# HTTPS: 443 (world)
# Database: 5432 (internal only)
# Redis: 6379 (internal only)
```

### 2. WAF Configuration (Cloudflare)

```
- DDoS Protection: On
- Bot Management: On
- Rate Limiting: 10 req/s per IP
- Geo-blocking: Configure as needed
- SSL/TLS: Full (Strict)
```

### 3. Database Security

```sql
-- Create limited user (not postgres)
CREATE USER etunda_app WITH PASSWORD 'strong_password';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE etunda_db TO etunda_app;
GRANT USAGE ON SCHEMA public TO etunda_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO etunda_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO etunda_app;

-- Enable SSL connections
-- Update postgresql.conf: ssl = on

-- Enable query logging
log_statement = 'all'
log_duration = on
```

### 4. Application Security

```bash
# Environment variables
export NODE_ENV=production
export CORS_ORIGIN=https://etunda.com

# Helmet security headers
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Strict-Transport-Security: max-age=31536000

# Rate limiting
# Auth endpoints: 5 req/min
# API endpoints: 10 req/sec
```

---

## 📊 Monitoring & Logging

### Prometheus Metrics

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend_1:5000', 'backend_2:5000', 'backend_3:5000']
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres_exporter:9187']
```

### Grafana Dashboards

1. **System Health**
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network I/O

2. **Application Performance**
   - Request rate
   - Response time
   - Error rate
   - Database query time

3. **Business Metrics**
   - Registered users
   - Products listed
   - Orders placed
   - Revenue

### Alerting (PagerDuty)

```
- CPU > 80% → Warning
- Memory > 85% → Warning
- Error rate > 1% → Critical
- Response time p95 > 500ms → Warning
- Database replication lag > 10s → Critical
```

---

## 🔄 Continuous Deployment

### GitHub Actions Workflow

```yaml
# Triggers on push to main
1. Run tests
2. Build Docker images
3. Push to registry
4. Deploy to staging
5. Run smoke tests
6. Deploy to production
7. Run health checks
```

### Deployment Commands

```bash
# Automated via CI/CD
# Manual rollback
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Verify deployment
curl https://api.etunda.com/health
curl https://etunda.com
```

---

## 🚨 Incident Response

### Health Check Failure

```bash
# 1. Check service status
docker compose -f docker-compose.prod.yml ps

# 2. View logs
docker logs etunda_backend_1

# 3. Restart service
docker compose -f docker-compose.prod.yml restart backend_1

# 4. Check database connectivity
psql -h $RDS_ENDPOINT -U etunda_app -d etunda_db -c "SELECT 1"
```

### Database Connection Issues

```bash
# 1. Check RDS instance
aws rds describe-db-instances --db-instance-identifier etunda-prod

# 2. Check security groups
aws ec2 describe-security-groups

# 3. Test connection
psql -h $RDS_ENDPOINT -U etunda_app -d etunda_db

# 4. Check connection pool
SELECT count(*) FROM pg_stat_activity;
```

### High Load / Scaling

```bash
# 1. Monitor metrics
# Check CPU, memory, database connections

# 2. Scale backend instances
docker compose -f docker-compose.prod.yml up -d --scale backend=5

# 3. Increase database resources
# AWS RDS: Modify instance type

# 4. Enable read replicas
# AWS RDS: Create read replica
```

---

## 📈 Performance Optimization

### Caching Strategy

```
1. Redis Cache Layer
   - Session data (TTL: 24h)
   - Product listings (TTL: 5m)
   - Farmer profiles (TTL: 1h)

2. CDN Caching (Cloudflare)
   - Images (TTL: 30d)
   - CSS/JS (TTL: 7d)
   - HTML (TTL: 5m)

3. Database Query Optimization
   - Use indexes on FK columns
   - Batch queries
   - Connection pooling
```

### Database Performance

```sql
-- Monitor slow queries
SELECT query, calls, mean_time FROM pg_stat_statements
  ORDER BY mean_time DESC LIMIT 10;

-- Analyze query plans
EXPLAIN ANALYZE SELECT * FROM products WHERE farmer_id = $1;

-- Vacuum and analyze tables
VACUUM ANALYZE products;
```

---

## 🔗 Post-Deployment Tasks

- [ ] Run full test suite
- [ ] Verify all health checks passing
- [ ] Check monitoring dashboards
- [ ] Review logs for errors
- [ ] Test payment integration (test mode)
- [ ] Verify email notifications
- [ ] Test user registration flow
- [ ] Load test with 1000+ concurrent users
- [ ] Document any issues
- [ ] Schedule post-launch review

---

## 📞 Support & Escalation

**Severity 1** (Critical - Complete outage)
- Response: 15 minutes
- Escalation: On-call engineer → CTO

**Severity 2** (High - Partial functionality broken)
- Response: 1 hour
- Escalation: On-call engineer → Team Lead

**Severity 3** (Medium - Degraded performance)
- Response: 4 hours
- Escalation: Team Lead → Product Manager

**Severity 4** (Low - Minor issues)
- Response: 24 hours
- Escalation: Support Team

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com)
- [PostgreSQL Deployment](https://www.postgresql.org/docs/current/runtime.html)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Stripe Integration](https://stripe.com/docs/payments)
- [AWS RDS Guide](https://docs.aws.amazon.com/rds/)
- [Prometheus & Grafana](https://prometheus.io/docs/)

---

**Happy Deploying! 🚀**
