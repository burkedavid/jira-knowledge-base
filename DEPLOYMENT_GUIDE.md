# Knowledge Base v2 - Network Deployment Guide

## Overview

This guide covers the complete deployment of the Knowledge Base v2 application on your internal network infrastructure. The application is a Next.js-based AI-powered knowledge management system with RAG capabilities, defect analysis, and JIRA integration.

## 🏗️ Infrastructure Requirements

### Database Requirements
- **PostgreSQL Server** (v13+ recommended)
- **Minimum Specifications:**
  - CPU: 4 cores
  - RAM: 4GB minimum, 8GB recommended
  - Storage: 100GB SSD (for performance)
  - Network: 1Gbps connection
- **High Availability:** Consider PostgreSQL clustering for production
- **Backup Requirements:** 200GB additional storage for backups

### Application Server Requirements
- **Node.js Runtime** (v18+ required)
- **Minimum Specifications:**
  - CPU: 4 cores
  - RAM: 8GB minimum, 16GB recommended
  - Storage: 50GB SSD
  - Network: 1Gbps connection
- **Load Balancing:** Multiple instances recommended for high availability
- **Reverse Proxy:** Nginx or Apache for SSL termination

### File Storage Requirements
- **Document Storage:** 500GB+ depending on document volume
- **Vector Embeddings:** Fast SSD storage for optimal performance
- **Backup Storage:** Separate location with 2x capacity of primary storage

### Network Requirements
- **Internal Network Access:** All servers on same VLAN/subnet
- **Internet Access:** Required for AI API calls (Claude, OpenAI)
- **DNS Resolution:** Internal DNS entries for service discovery
- **Firewall Ports:**
  - 80/443 (HTTP/HTTPS)
  - 5432 (PostgreSQL)
  - 3000 (Application - internal)

## 🔧 Technical Setup

### 1. Environment Configuration

Create a `.env.production` file with the following variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://kb_user:secure_password@your-db-server:5432/knowledge_base"
POSTGRES_PRISMA_URL="postgresql://kb_user:secure_password@your-db-server:5432/knowledge_base"

# Application URLs
NEXTAUTH_URL="https://knowledge-base.your-company.com"
NEXTAUTH_SECRET="your-very-secure-nextauth-secret-key-here"

# AI Service Configuration
ANTHROPIC_API_KEY="your-claude-api-key"
OPENAI_API_KEY="your-openai-api-key"

# JIRA Integration (Optional)
JIRA_BASE_URL="https://your-jira.your-company.com"
JIRA_USERNAME="kb-service-account"
JIRA_API_TOKEN="your-jira-api-token"
JIRA_PROJECT_KEY="your-default-project"

# File Upload Configuration
MAX_FILE_SIZE="10485760"  # 10MB
ALLOWED_FILE_TYPES="pdf,doc,docx,txt,md"

# RAG Configuration
EMBEDDING_MODEL="text-embedding-3-small"
SIMILARITY_THRESHOLD="0.1"
MAX_RESULTS="10"

# Application Settings
NODE_ENV="production"
PORT="3000"
```

### 2. Database Setup

#### PostgreSQL Installation & Configuration

```sql
-- Create database and user
CREATE DATABASE knowledge_base;
CREATE USER kb_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE knowledge_base TO kb_user;

-- Configure PostgreSQL settings (postgresql.conf)
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

#### Database Migration & Seeding

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed initial data
npm run seed

# Create initial user accounts
node scripts/create-auth-users.js
```

### 3. Application Deployment

#### Option A: Traditional Server Deployment

```bash
# Clone repository
git clone <your-repo-url> /opt/knowledge-base
cd /opt/knowledge-base

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Install PM2 for process management
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'knowledge-base',
    script: 'npm',
    args: 'start',
    cwd: '/opt/knowledge-base',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/knowledge-base/error.log',
    out_file: '/var/log/knowledge-base/out.log',
    log_file: '/var/log/knowledge-base/combined.log'
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Option B: Docker Deployment

```bash
# Build Docker image
docker build -t knowledge-base:latest .

# Create docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'
services:
  app:
    image: knowledge-base:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://kb_user:secure_password@db:5432/knowledge_base
      - NEXTAUTH_URL=https://knowledge-base.your-company.com
      - NEXTAUTH_SECRET=your-secure-secret
    depends_on:
      - db
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=knowledge_base
      - POSTGRES_USER=kb_user
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped

volumes:
  postgres_data:
EOF

# Deploy with Docker Compose
docker-compose up -d
```

#### Option C: Kubernetes Deployment (RECOMMENDED for Production)

**⚠️ CRITICAL: This application has been tested and fixed for proxy/K8s issues**

```bash
# Build and tag Docker image
docker build -t knowledge-base:latest .
docker tag knowledge-base:latest your-registry/knowledge-base:v1.0.0
docker push your-registry/knowledge-base:v1.0.0

# Update image in k8s-deployment.yaml
sed -i 's|knowledge-base:latest|your-registry/knowledge-base:v1.0.0|' k8s-deployment.yaml

# Create namespace
kubectl create namespace knowledge-base

# Apply secrets (update with your values first)
kubectl apply -f k8s-deployment.yaml -n knowledge-base

# Verify deployment
kubectl get pods -n knowledge-base
kubectl get ingress -n knowledge-base

# Check health status
kubectl exec -it deployment/knowledge-base-v2 -n knowledge-base -- curl http://localhost:3000/api/health/k8s
```

**Key K8s Features Implemented:**
- ✅ Proper proxy header handling
- ✅ NextAuth URL configuration for proxies  
- ✅ Kubernetes-optimized health checks
- ✅ Resource limits and security contexts
- ✅ Ingress with SSL termination
- ✅ Secret management for sensitive data

### 4. Reverse Proxy Configuration (Nginx)

```nginx
# /etc/nginx/sites-available/knowledge-base
server {
    listen 80;
    server_name knowledge-base.your-company.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name knowledge-base.your-company.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static file caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🔐 Security Configuration

### Application Security

1. **Environment Variables Security**
   ```bash
   # Set proper file permissions
   chmod 600 .env.production
   chown app:app .env.production
   ```

2. **Database Security**
   ```sql
   -- Restrict database access
   REVOKE ALL ON SCHEMA public FROM PUBLIC;
   GRANT USAGE ON SCHEMA public TO kb_user;
   GRANT ALL ON ALL TABLES IN SCHEMA public TO kb_user;
   GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO kb_user;
   ```

3. **Firewall Configuration**
   ```bash
   # UFW firewall rules (Ubuntu)
   ufw allow 22/tcp    # SSH
   ufw allow 80/tcp    # HTTP
   ufw allow 443/tcp   # HTTPS
   ufw allow from 10.0.0.0/8 to any port 5432  # PostgreSQL (internal network only)
   ufw enable
   ```

### Network Security

- **VPN Access:** Restrict access to internal network or VPN
- **SSL/TLS:** Enforce HTTPS with strong ciphers
- **Rate Limiting:** Implement API rate limiting
- **Input Validation:** All user inputs are validated
- **CORS Policy:** Restrict cross-origin requests

## 📊 Monitoring & Maintenance

### Monitoring Setup

1. **Application Monitoring**
   ```bash
   # Install monitoring tools
   npm install -g @pm2/io
   
   # Configure PM2 monitoring
   pm2 install pm2-server-monit
   ```

2. **Database Monitoring**
   ```sql
   -- Enable PostgreSQL logging
   log_statement = 'all'
   log_duration = on
   log_min_duration_statement = 1000
   ```

3. **Log Management**
   ```bash
   # Configure log rotation
   cat > /etc/logrotate.d/knowledge-base << EOF
   /var/log/knowledge-base/*.log {
       daily
       rotate 30
       compress
       delaycompress
       missingok
       create 644 app app
       postrotate
           pm2 reloadLogs
       endscript
   }
   EOF
   ```

### Backup Strategy

1. **Database Backups**
   ```bash
   #!/bin/bash
   # /opt/scripts/backup-db.sh
   BACKUP_DIR="/backups/database"
   DATE=$(date +%Y%m%d_%H%M%S)
   
   pg_dump -h localhost -U kb_user -d knowledge_base | gzip > "$BACKUP_DIR/kb_backup_$DATE.sql.gz"
   
   # Keep only last 30 days
   find "$BACKUP_DIR" -name "kb_backup_*.sql.gz" -mtime +30 -delete
   ```

2. **File System Backups**
   ```bash
   #!/bin/bash
   # /opt/scripts/backup-files.sh
   rsync -av --delete /opt/knowledge-base/uploads/ /backups/uploads/
   rsync -av --delete /opt/knowledge-base/.env.production /backups/config/
   ```

3. **Automated Backup Schedule**
   ```bash
   # Add to crontab
   0 2 * * * /opt/scripts/backup-db.sh
   0 3 * * * /opt/scripts/backup-files.sh
   ```

## 💰 Cost Estimation

### Infrastructure Costs (Monthly)

| Component | Specification | Estimated Cost |
|-----------|---------------|----------------|
| App Server | 4 cores, 16GB RAM, 100GB SSD | $200-400 |
| Database Server | 4 cores, 8GB RAM, 200GB SSD | $150-300 |
| Load Balancer | 2 cores, 4GB RAM | $100-200 |
| Storage | 1TB network storage | $50-100 |
| Networking | Internal bandwidth | $50-100 |
| **Total Infrastructure** | | **$550-1,100** |

### Operational Costs (Monthly)

| Service | Usage | Estimated Cost |
|---------|-------|----------------|
| Claude API | ~100K tokens/day | $30-90 |
| OpenAI Embeddings | ~50K tokens/day | $5-15 |
| SSL Certificates | Annual cost | $10-20 |
| Monitoring Tools | Basic plan | $20-50 |
| **Total Operational** | | **$65-175** |

### **Total Monthly Cost: $615-1,275**

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Server infrastructure provisioned
- [ ] PostgreSQL database installed and configured
- [ ] SSL certificates obtained and installed
- [ ] DNS records configured
- [ ] Firewall rules implemented
- [ ] Backup systems configured
- [ ] Monitoring tools installed

### Deployment
- [ ] Application code deployed
- [ ] Environment variables configured
- [ ] Database migrations executed
- [ ] Initial user accounts created
- [ ] Reverse proxy configured
- [ ] SSL/TLS working correctly
- [ ] All application features tested

### Post-Deployment
- [ ] Performance monitoring active
- [ ] Log aggregation working
- [ ] Backup jobs scheduled
- [ ] Alert systems configured
- [ ] Documentation updated
- [ ] Team training completed
- [ ] Disaster recovery plan documented

## 🚨 Troubleshooting

### Critical Proxy/K8s Issues

1. **NextAuth Authentication Failures Behind Proxy**
   ```bash
   # Check if NEXTAUTH_URL_INTERNAL is set correctly
   echo $NEXTAUTH_URL_INTERNAL
   
   # Verify proxy headers are being forwarded
   curl -H "X-Forwarded-Proto: https" -H "X-Forwarded-For: 192.168.1.1" https://your-domain.com/api/health/k8s
   ```

2. **Cookie/Session Issues in K8s**
   ```bash
   # Check cookie domain configuration
   # Ensure COOKIE_DOMAIN is set to your domain
   # Example: COOKIE_DOMAIN=".your-company.com"
   ```

3. **URL Redirect Loops**
   ```bash
   # Verify NEXTAUTH_URL matches external domain
   # NEXTAUTH_URL=https://your-external-domain.com
   # NEXTAUTH_URL_INTERNAL=http://localhost:3000
   ```

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check PostgreSQL status
   systemctl status postgresql
   
   # Test connection
   psql -h localhost -U kb_user -d knowledge_base
   
   # K8s database connectivity
   kubectl exec -it deployment/knowledge-base-v2 -- curl http://localhost:3000/api/health/k8s
   ```

2. **Application Won't Start**
   ```bash
   # Check logs
   pm2 logs knowledge-base
   
   # K8s logs
   kubectl logs deployment/knowledge-base-v2
   
   # Check environment variables
   pm2 env 0
   kubectl exec -it deployment/knowledge-base-v2 -- printenv
   ```

3. **High Memory Usage**
   ```bash
   # Monitor memory usage
   pm2 monit
   
   # K8s resource monitoring
   kubectl top pods
   kubectl describe pod <pod-name>
   
   # Restart application
   pm2 restart knowledge-base
   kubectl rollout restart deployment/knowledge-base-v2
   ```

### Performance Optimization

1. **Database Optimization**
   ```sql
   -- Create indexes for common queries
   CREATE INDEX idx_defects_created_at ON defects(created_at);
   CREATE INDEX idx_user_stories_project ON user_stories(project);
   CREATE INDEX idx_documents_type ON documents(type);
   ```

2. **Application Optimization**
   ```bash
   # Enable Node.js production optimizations
   export NODE_ENV=production
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

## 📞 Support & Maintenance

### Regular Maintenance Tasks

- **Weekly:** Review logs and performance metrics
- **Monthly:** Update dependencies and security patches
- **Quarterly:** Review backup and recovery procedures
- **Annually:** Security audit and penetration testing

### Emergency Contacts

- **System Administrator:** [Your IT contact]
- **Database Administrator:** [Your DB contact]
- **Application Support:** [Your dev team contact]

### Documentation Updates

This document should be updated whenever:
- Infrastructure changes are made
- New features are deployed
- Security configurations are modified
- Backup procedures are changed

---

**Document Version:** 1.0  
**Last Updated:** $(date)  
**Next Review:** $(date -d "+3 months") 