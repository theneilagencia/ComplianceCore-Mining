# Production Deployment Checklist - Official Integrations
## QIVO Mining Platform - November 2025

### 📋 Quick Reference

**Target**: Deploy official government integrations + SEC S-K 1300  
**Phases**: 4 phases over 5 weeks  
**First Deployment**: Week 1 (0% rollout - internal testing)

---

## ✅ Phase 0: Pre-Deployment (Complete Before Week 1)

### Code & Tests
- [x] **All 112 unit tests passing** ✅ Commit 5e325b6
- [x] **ANM integration tests** (23 tests) ✅
- [x] **CPRM integration tests** (22 tests) ✅
- [x] **IBAMA integration tests** (20 tests) ✅
- [x] **ANP integration tests** (25 tests) ✅
- [x] **Unified interface tests** (22 tests) ✅
- [ ] **E2E tests** (Playwright) - Pending
- [x] **No TypeScript errors** ✅
- [x] **No linting errors** ✅

### Documentation
- [x] **Feature flags system** implemented ✅
- [x] **Metrics system** implemented ✅
- [x] **Gradual rollout strategy** documented ✅
- [x] **`.env.example` updated** with all new variables ✅
- [ ] **API integration guide** - Pending
- [ ] **User guide** for new features - Pending

### Infrastructure Setup
- [ ] **Redis configured** in Render
  - [ ] Add Redis service to Render project
  - [ ] Set `REDIS_URL` environment variable
  - [ ] Set `REDIS_ENABLED=true`
  - [ ] Test connection

- [ ] **API Keys obtained**
  - [ ] `ANM_API_KEY` (from https://app.anm.gov.br)
  - [ ] `CPRM_API_KEY` (from https://geosgb.cprm.gov.br)
  - [ ] `IBAMA_API_KEY` (from https://servicos.ibama.gov.br)
  - [ ] `ANP_API_KEY` (from https://dados.anp.gov.br)

- [ ] **Environment variables configured** in Render
  ```env
  # Feature Flags
  ENABLE_OFFICIAL_INTEGRATIONS=false  # Start disabled
  ENABLE_SEC_SK_1300=false
  ENABLE_BRAZILIAN_FIELDS=true
  
  # API Keys
  ANM_API_KEY=your-anm-key
  CPRM_API_KEY=your-cprm-key
  IBAMA_API_KEY=your-ibama-key
  ANP_API_KEY=your-anp-key
  
  # Cache
  REDIS_URL=redis://...
  REDIS_ENABLED=true
  
  # Timeouts & TTL
  ANM_TIMEOUT_MS=10000
  ANM_CACHE_TTL_SECONDS=86400
  CPRM_TIMEOUT_MS=10000
  CPRM_CACHE_TTL_SECONDS=86400
  IBAMA_TIMEOUT_MS=10000
  IBAMA_CACHE_TTL_SECONDS=86400
  ANP_TIMEOUT_MS=10000
  ANP_CACHE_TTL_SECONDS=86400
  ```

### Monitoring Setup
- [ ] **Metrics endpoint deployed** (`/api/metrics`)
- [ ] **Health check configured** (`/api/metrics/health`)
- [ ] **Alert rules created**
  - [ ] API success rate < 90%
  - [ ] Error rate > 3%
  - [ ] Response time > 3s (p95)
  - [ ] Cache hit rate < 50%
- [ ] **Dashboard configured** (Grafana/Datadog/Custom)
- [ ] **On-call rotation** defined

---

## 🚀 Phase 1: Internal Testing (Week 1)

### Deployment
- [ ] **Deploy to production** with features disabled
  ```bash
  git push origin main
  # Render will auto-deploy
  ```

- [ ] **Verify deployment successful**
  - [ ] Check Render logs for errors
  - [ ] Health check returning 200 OK
  - [ ] Metrics endpoint accessible

### Testing
- [ ] **Manual testing** by development team
  - [ ] Enable features via admin panel (if implemented)
  - [ ] Or temporarily set `ENABLE_OFFICIAL_INTEGRATIONS=true`
  - [ ] Test ANM process validation
  - [ ] Test CPRM geological data
  - [ ] Test IBAMA license validation
  - [ ] Test ANP concession validation
  - [ ] Test SEC S-K 1300 report generation
  - [ ] Test Brazilian fields auto-injection

- [ ] **Performance testing**
  ```bash
  # Load test with Apache Bench
  ab -n 1000 -c 10 https://qivo-mining.onrender.com/api/metrics/health
  ```

### Metrics Review
- [ ] **API success rate** > 95%
- [ ] **Avg response time** < 1.5s
- [ ] **Cache hit rate** > 70%
- [ ] **Zero critical errors** in logs

### Decision Point
- [ ] ✅ **Proceed to Phase 2** if all checks pass
- [ ] ❌ **Fix issues** and re-test if any checks fail

---

## 📈 Phase 2: Beta Rollout (Week 2)

### Configuration
- [ ] **Update feature flags** in Render
  ```env
  ENABLE_OFFICIAL_INTEGRATIONS=true
  ENABLE_SEC_SK_1300=true
  ```

- [ ] **Set rollout percentage** to 10%
  ```typescript
  // In server/config/feature-flags.ts
  OFFICIAL_INTEGRATIONS: {
    rolloutPercentage: 10,
  }
  ```

### Monitoring (Daily)
- [ ] **Check metrics dashboard**
- [ ] **Review error logs**
- [ ] **Track user feedback**
- [ ] **Monitor costs** (API calls)

### Success Criteria
- [ ] **API success rate** > 95%
- [ ] **Error rate** < 1%
- [ ] **Cache hit rate** > 75%
- [ ] **User satisfaction** > 4/5
- [ ] **Zero critical bugs** reported

### Decision Point
- [ ] ✅ **Proceed to Phase 3** after 1 week
- [ ] ⏸️ **Pause rollout** if issues found
- [ ] ⏪ **Rollback** if critical issues

---

## 🎯 Phase 3: Expanded Beta (Week 3-4)

### Configuration
- [ ] **Increase rollout** to 50%
  ```typescript
  OFFICIAL_INTEGRATIONS: {
    rolloutPercentage: 50,
  }
  ```

### Optimization
- [ ] **Review slow queries**
- [ ] **Optimize cache TTL** based on hit rate
- [ ] **Scale Redis** if needed
- [ ] **Address user feedback**

### Success Criteria
- [ ] **API success rate** > 95%
- [ ] **Error rate** < 0.5%
- [ ] **Cache hit rate** > 80%
- [ ] **Cost within budget**

### Decision Point
- [ ] ✅ **Proceed to Phase 4** after 2 weeks
- [ ] ⏸️ **Pause rollout** if issues found

---

## 🌍 Phase 4: Full Rollout (Week 5+)

### Configuration
- [ ] **Enable for all users** (100%)
  ```typescript
  OFFICIAL_INTEGRATIONS: {
    rolloutPercentage: 100,
  }
  ```

### Post-Launch
- [ ] **Monitor for 1 week** intensively
- [ ] **Generate weekly reports**
- [ ] **Document lessons learned**
- [ ] **Plan future enhancements**

---

## 🚨 Rollback Procedure

### When to Rollback
- API success rate < 85%
- Error rate > 5%
- Critical security issue
- Data corruption

### Steps
1. **Disable features immediately** (< 5 min)
   ```env
   ENABLE_OFFICIAL_INTEGRATIONS=false
   ENABLE_SEC_SK_1300=false
   ```

2. **Verify rollback** (5-10 min)
   - Check metrics returning to normal
   - Verify no new errors

3. **Root cause analysis** (1-2 hours)
   - Review logs
   - Identify failure point

4. **Fix and re-deploy** (1-2 days)
   - Implement fix
   - Re-test thoroughly
   - Restart from Phase 1

---

## 📞 Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| Tech Lead | TBD | slack: @tech-lead |
| DevOps | TBD | slack: @devops |
| On-Call | TBD | Phone: +55 11... |

---

## ✅ Final Checklist Before Go-Live

- [ ] All 112 tests passing
- [ ] API keys configured
- [ ] Redis operational
- [ ] Monitoring active
- [ ] Alerts configured
- [ ] Rollback plan tested
- [ ] Team trained
- [ ] Documentation complete
- [ ] Stakeholders informed
- [ ] Go-live date scheduled

---

**Status**: 🟡 Preparation Phase  
**Next Action**: Complete Phase 0 checklist  
**Target Week 1 Start**: TBD  
**Last Updated**: November 2, 2025
