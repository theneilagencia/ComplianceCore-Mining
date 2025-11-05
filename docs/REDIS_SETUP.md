# Redis Configuration for Production

**Data:** 05/11/2025  
**Versão:** 1.0

---

## Overview

QIVO Mining uses Redis for distributed caching, session storage, and circuit breaker state management. This document describes how to configure Redis for production.

---

## Recommended Services

### Option 1: Google Cloud Memorystore (Recommended for GCP)

**Advantages:**
- Fully managed Redis service
- Automatic failover and replication
- VPC integration for security
- Automatic backups
- 99.9% SLA

**Setup:**

```bash
# Create Redis instance
gcloud redis instances create qivo-mining-redis \
  --size=1 \
  --region=us-central1 \
  --redis-version=redis_7_0 \
  --tier=standard \
  --replica-count=1

# Get connection info
gcloud redis instances describe qivo-mining-redis \
  --region=us-central1 \
  --format="get(host,port)"
```

**Environment Variables:**

```bash
REDIS_URL=redis://10.0.0.3:6379
REDIS_TLS=false  # Memorystore uses VPC, not TLS
REDIS_PASSWORD=  # Not required for Memorystore
```

---

### Option 2: Redis Cloud

**Advantages:**
- Multi-cloud support
- Global distribution
- Advanced features (RedisJSON, RediSearch)
- Free tier available

**Setup:**

1. Create account at https://redis.com/try-free/
2. Create database
3. Get connection string

**Environment Variables:**

```bash
REDIS_URL=rediss://default:password@redis-12345.c1.us-central1-1.gce.cloud.redislabs.com:12345
REDIS_TLS=true
REDIS_PASSWORD=your_password_here
```

---

### Option 3: Self-Hosted Redis (Not Recommended)

**Only if you have specific requirements.**

**Setup:**

```bash
# Install Redis
sudo apt-get install redis-server

# Configure for production
sudo nano /etc/redis/redis.conf

# Set:
# bind 0.0.0.0
# requirepass your_strong_password_here
# maxmemory 2gb
# maxmemory-policy allkeys-lru

# Restart
sudo systemctl restart redis-server
```

---

## Configuration

### Cache TTL Settings

```bash
# Default cache TTL (24 hours)
CACHE_TTL_DEFAULT=86400

# KRCI audit cache (24 hours)
CACHE_TTL_KRCI=86400

# Integration cache (1 hour)
CACHE_TTL_INTEGRATIONS=3600
```

### Memory Management

**Recommended Settings:**

```bash
# Maximum memory
maxmemory 2gb

# Eviction policy (remove least recently used keys)
maxmemory-policy allkeys-lru
```

---

## Testing Connection

```bash
# Test Redis connection
node -e "
const redis = require('ioredis');
const client = new redis(process.env.REDIS_URL);
client.ping().then(() => {
  console.log('✓ Redis connected');
  client.quit();
}).catch(err => {
  console.error('✗ Redis connection failed:', err);
});
"
```

---

## Monitoring

### Key Metrics to Monitor

1. **Memory Usage**
   - Alert if > 80%
   - Scale up if consistently high

2. **Hit Rate**
   - Target: > 80%
   - Low hit rate indicates cache is not effective

3. **Latency**
   - Target: < 1ms
   - High latency indicates network or Redis issues

4. **Evictions**
   - Monitor eviction count
   - High evictions indicate memory pressure

### Prometheus Metrics

Redis metrics are automatically exported by the application:

- `redis_cache_hits_total`
- `redis_cache_misses_total`
- `redis_cache_hit_rate`
- `redis_memory_used_bytes`
- `redis_connected_clients`

---

## Backup and Recovery

### Google Cloud Memorystore

Automatic backups are enabled by default.

**Manual Backup:**

```bash
gcloud redis instances export gs://qivo-mining-backups/redis-backup.rdb \
  --source=qivo-mining-redis \
  --region=us-central1
```

**Restore:**

```bash
gcloud redis instances import gs://qivo-mining-backups/redis-backup.rdb \
  --source=qivo-mining-redis \
  --region=us-central1
```

### Redis Cloud

Backups are automatic. Configure retention in dashboard.

---

## Security

### Best Practices

1. **Use Strong Passwords**
   ```bash
   # Generate strong password
   openssl rand -base64 32
   ```

2. **Enable TLS**
   ```bash
   REDIS_TLS=true
   ```

3. **Restrict Network Access**
   - Use VPC for Memorystore
   - Use IP whitelist for Redis Cloud
   - Never expose Redis to public internet

4. **Rotate Passwords**
   - Rotate every 90 days
   - Use Google Secret Manager

---

## Troubleshooting

### Connection Refused

**Symptoms:**
```
Error: connect ECONNREFUSED
```

**Solutions:**
1. Check REDIS_URL is correct
2. Check firewall rules
3. Check Redis is running
4. Check VPC connectivity (for Memorystore)

### Out of Memory

**Symptoms:**
```
Error: OOM command not allowed when used memory > 'maxmemory'
```

**Solutions:**
1. Increase maxmemory
2. Check eviction policy
3. Reduce cache TTL
4. Scale up Redis instance

### Slow Performance

**Symptoms:**
- High latency (> 10ms)
- Timeouts

**Solutions:**
1. Check network latency
2. Check Redis CPU usage
3. Optimize queries (avoid KEYS command)
4. Enable pipelining

---

## Cost Optimization

### Google Cloud Memorystore

**Pricing (us-central1):**
- Basic tier: $0.049/GB/hour
- Standard tier: $0.078/GB/hour

**Recommendations:**
- Start with 1GB Standard tier (~$57/month)
- Scale up based on usage
- Use Basic tier for development

### Redis Cloud

**Pricing:**
- Free tier: 30MB
- Paid: Starting at $5/month

**Recommendations:**
- Free tier for development
- Paid tier for production

---

## Checklist

### Pre-Production

- [ ] Redis instance created
- [ ] Connection tested
- [ ] Environment variables set
- [ ] TLS enabled (if applicable)
- [ ] Password set
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Firewall rules configured

### Post-Production

- [ ] Monitor memory usage
- [ ] Monitor hit rate
- [ ] Monitor latency
- [ ] Test failover (Standard tier)
- [ ] Document connection details
- [ ] Set up alerts

---

## Support

**Google Cloud Memorystore:**
- Documentation: https://cloud.google.com/memorystore/docs/redis
- Support: Google Cloud Support

**Redis Cloud:**
- Documentation: https://docs.redis.com/latest/rc/
- Support: support@redis.com

---

**Status:** READY FOR PRODUCTION ✅  
**Last Updated:** 05/11/2025
