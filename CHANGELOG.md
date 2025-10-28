# Changelog

All notable changes to QIVO Mining platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0-full-compliance] - 2025-10-28

### Added

#### Features
- **KRCI Extended**: 100+ audit rules organized in 6 categories (Tenure, Geo, ESG, Norma, Satélite, Benchmark)
- **Dark Mode**: Persistent theme toggle with localStorage
- **i18n**: Internationalization support for PT, EN, ES, FR with auto-detection
- **Explainability UI**: AI reasoning, similarity analysis, and integrity checks with Loss Map
- **Stripe Billing**: Complete billing integration with portal, webhooks, discounts (10%, 25%, 40%), and add-ons
- **PWA/Offline**: Service Worker with caching strategies, background sync, and install prompt
- **Real APIs**: Integration with IBAMA, Copernicus, LME, and COMEX with auto-detect and fallback
- **PDF Generation**: ESG reports with SHA-256 AI Accountability Hash
- **S3 Storage**: Presigned URLs with tenant isolation (`tenants/{TENANT_ID}/`)

#### Infrastructure
- **Deploy Scripts**: Blue-green deployment with migrate, health-check, smoke-tests, switch, and rollback scripts
- **CI/CD**: GitHub Actions workflow with lint, build, security audit, deploy, and notify jobs
- **QA Automation**: Weekly QA script with 10 verification categories
- **Notifications**: Email and WhatsApp notifications for QA results

### Changed
- Updated App.tsx to support new features (Dark Mode, i18n, PWA)
- Enhanced DashboardLayout with ThemeToggle and LocaleSelector
- Improved router structure with new modules (billing, integrations, storage)

### Fixed
- JWT refresh token implementation
- Build errors in ESG and Valuation modules
- Service Worker registration and caching strategies

### Security
- Tenant isolation in S3 storage
- Environment variable auto-detection with secure fallbacks
- SHA-256 hash for PDF accountability

---

## [1.1.0] - 2025-10-27

### Added
- ESG Reporting module (Environmental, Social, Governance)
- Valuation Calculator (DCF, NPV, IRR, Payback Period)
- Commodity price service (8 commodities)
- Sensitivity analysis for valuation

### Fixed
- JWT refresh token issues
- Frontend-backend integration for ESG and Valuation

---

## [1.0.0] - 2025-10-26

### Added
- Dashboard Central
- AI Report Generator
- Manual Report Creator
- Standards Converter (JORC, NI 43-101, PERC, SAMREC)
- Regulatory Radar
- KRCI Audit (basic)
- Pre-Certification
- Bridge Regulatória
- Admin Core (Billing, Subscriptions, User Management)

### Infrastructure
- Initial project setup with Vite + React + TypeScript
- tRPC backend with Express
- Drizzle ORM with PostgreSQL
- Authentication with JWT
- Deployment to Render.com

---

## Roadmap

### [1.3.0] - Planned
- [ ] Real-time collaboration
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] API v2 with GraphQL
- [ ] Machine Learning models for prediction
- [ ] Blockchain integration for report verification

### [2.0.0] - Future
- [ ] Multi-tenant architecture
- [ ] White-label solution
- [ ] Marketplace for third-party integrations
- [ ] Advanced AI features (GPT-4, Claude)

---

## Contributors

- Manus AI - Full implementation
- QIVO Team - Product requirements and validation

---

## Links

- **Repository**: https://github.com/theneilagencia/ComplianceCore-Mining
- **Production**: https://qivo-mining.onrender.com
- **Documentation**: /docs/

