# Stripe Configuration for Production

**Data:** 05/11/2025  
**Versão:** 1.0

---

## Overview

QIVO Mining uses Stripe for subscription management and one-time payments. This document describes how to configure Stripe for production.

---

## Step 1: Create Stripe Account

1. Go to https://dashboard.stripe.com/register
2. Complete business verification
3. Activate account

---

## Step 2: Create Products

### Subscription Products

#### 1. QIVO Mining - START Plan

**Product Details:**
- Name: QIVO Mining - START
- Description: Plano inicial para pequenas empresas de mineração
- Statement Descriptor: QIVO START

**Prices:**
- Monthly: US$ 2,500/month
- Annual: US$ 27,000/year (10% discount)

**Create in Dashboard:**
```
Products → Create Product
Name: QIVO Mining - START
Pricing Model: Recurring
Price: $2,500 USD / month
Billing Period: Monthly
```

Copy Price ID: `price_start_monthly_id`

Repeat for annual:
```
Price: $27,000 USD / year
Billing Period: Yearly
```

Copy Price ID: `price_start_annual_id`

---

#### 2. QIVO Mining - PRO Plan

**Product Details:**
- Name: QIVO Mining - PRO
- Description: Plano profissional com recursos avançados
- Statement Descriptor: QIVO PRO

**Prices:**
- Monthly: US$ 12,500/month
- Annual: US$ 135,000/year (10% discount)

Copy Price IDs:
- `price_pro_monthly_id`
- `price_pro_annual_id`

---

#### 3. QIVO Mining - ENTERPRISE Plan

**Product Details:**
- Name: QIVO Mining - ENTERPRISE
- Description: Plano enterprise com suporte dedicado
- Statement Descriptor: QIVO ENTERPRISE

**Prices:**
- Monthly: US$ 35,000/month
- Annual: US$ 378,000/year (10% discount)

Copy Price IDs:
- `price_enterprise_monthly_id`
- `price_enterprise_annual_id`

---

### One-Time Products

#### 1. Relatório Simplificado

**Product Details:**
- Name: Relatório Simplificado
- Description: Relatório técnico simplificado
- Price: US$ 2,800

Copy Price ID: `price_report_simplified_id`

---

#### 2. Relatório Técnico Completo

**Product Details:**
- Name: Relatório Técnico Completo
- Description: Relatório técnico completo com auditoria KRCI
- Price: US$ 6,800

Copy Price ID: `price_report_technical_id`

---

#### 3. Relatório ESG Integrado

**Product Details:**
- Name: Relatório ESG Integrado
- Description: Relatório técnico + ESG + auditoria completa
- Price: US$ 12,800

Copy Price ID: `price_report_esg_id`

---

## Step 3: Configure Webhooks

### Create Webhook Endpoint

**URL:** `https://api.qivomining.com/api/payment/webhook`

**Events to Listen:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Create in Dashboard:**
```
Developers → Webhooks → Add Endpoint
Endpoint URL: https://api.qivomining.com/api/payment/webhook
Events: Select all above
```

Copy Webhook Secret: `whsec_your_webhook_secret_here`

---

## Step 4: Configure Customer Portal

**Enable Customer Portal:**
```
Settings → Billing → Customer Portal
```

**Configure:**
- ✅ Allow customers to update payment methods
- ✅ Allow customers to update billing information
- ✅ Allow customers to cancel subscriptions
- ✅ Show invoice history
- ✅ Allow customers to switch plans

**Portal URL:** `https://billing.stripe.com/p/login/test_xxx`

---

## Step 5: Set Environment Variables

Add to `.env.production`:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Subscription Price IDs
STRIPE_PRICE_START_MONTHLY=price_start_monthly_id
STRIPE_PRICE_START_ANNUAL=price_start_annual_id
STRIPE_PRICE_PRO_MONTHLY=price_pro_monthly_id
STRIPE_PRICE_PRO_ANNUAL=price_pro_annual_id
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_enterprise_monthly_id
STRIPE_PRICE_ENTERPRISE_ANNUAL=price_enterprise_annual_id

# One-Time Report Price IDs
STRIPE_PRICE_REPORT_SIMPLIFIED=price_report_simplified_id
STRIPE_PRICE_REPORT_TECHNICAL=price_report_technical_id
STRIPE_PRICE_REPORT_ESG=price_report_esg_id
```

---

## Step 6: Test Integration

### Test Subscription Flow

```bash
# Use Stripe CLI to test webhooks locally
stripe listen --forward-to localhost:8080/api/payment/webhook

# In another terminal, trigger test event
stripe trigger checkout.session.completed
```

### Test Cards

**Successful Payment:**
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

**Declined Payment:**
```
Card Number: 4000 0000 0000 0002
```

**3D Secure Required:**
```
Card Number: 4000 0025 0000 3155
```

---

## Step 7: Enable Production Mode

1. Complete business verification
2. Activate account
3. Switch to live mode
4. Update API keys in production

---

## Monitoring

### Key Metrics

1. **Successful Payments**
   - Target: > 95%

2. **Failed Payments**
   - Monitor and retry

3. **Subscription Churn**
   - Target: < 5%/month

4. **MRR (Monthly Recurring Revenue)**
   - Track growth

### Stripe Dashboard

Monitor in real-time:
- Payments
- Subscriptions
- Customers
- Revenue

---

## Security

### Best Practices

1. **Never Log API Keys**
   ```javascript
   // ❌ Bad
   console.log('Stripe key:', process.env.STRIPE_SECRET_KEY);
   
   // ✅ Good
   console.log('Stripe key:', '***');
   ```

2. **Verify Webhook Signatures**
   ```javascript
   const signature = req.headers['stripe-signature'];
   const event = stripe.webhooks.constructEvent(
     req.body,
     signature,
     process.env.STRIPE_WEBHOOK_SECRET
   );
   ```

3. **Use HTTPS Only**
   - All Stripe API calls must use HTTPS
   - Webhook endpoint must use HTTPS

4. **Rotate Keys Regularly**
   - Rotate every 90 days
   - Use Google Secret Manager

---

## Troubleshooting

### Webhook Not Receiving Events

**Symptoms:**
- Webhooks not being called
- Events not processed

**Solutions:**
1. Check webhook URL is correct
2. Check webhook is enabled
3. Check firewall allows Stripe IPs
4. Check webhook signature verification
5. Test with Stripe CLI

### Payment Declined

**Symptoms:**
- Payment fails with decline error

**Solutions:**
1. Check card details are correct
2. Check card has sufficient funds
3. Contact customer to update payment method
4. Enable retry logic

### Subscription Not Created

**Symptoms:**
- Checkout succeeds but subscription not created

**Solutions:**
1. Check webhook is processing `checkout.session.completed`
2. Check database connection
3. Check logs for errors
4. Verify customer ID is correct

---

## Pricing Summary

### Subscription Plans

| Plan | Monthly | Annual | Discount |
|------|---------|--------|----------|
| START | US$ 2,500 | US$ 27,000 | 10% |
| PRO | US$ 12,500 | US$ 135,000 | 10% |
| ENTERPRISE | US$ 35,000 | US$ 378,000 | 10% |

### One-Time Reports

| Report | Price | Subscriber Discount |
|--------|-------|---------------------|
| Simplificado | US$ 2,800 | US$ 2,520 (10%) |
| Técnico Completo | US$ 6,800 | US$ 6,120 (10%) |
| ESG Integrado | US$ 12,800 | US$ 11,520 (10%) |

---

## Checklist

### Pre-Production

- [ ] Stripe account created and verified
- [ ] Products created
- [ ] Prices created
- [ ] Webhook endpoint configured
- [ ] Customer Portal enabled
- [ ] Test mode tested
- [ ] Environment variables set
- [ ] Webhook signature verification implemented

### Production

- [ ] Live mode activated
- [ ] Live API keys set
- [ ] Webhook endpoint verified
- [ ] Test subscription created
- [ ] Test payment processed
- [ ] Customer Portal tested
- [ ] Monitoring enabled
- [ ] Alerts configured

---

## Support

**Stripe Support:**
- Documentation: https://stripe.com/docs
- Support: https://support.stripe.com
- Status: https://status.stripe.com

**QIVO Support:**
- Email: support@qivomining.com
- Slack: #stripe-integration

---

**Status:** READY FOR PRODUCTION ✅  
**Last Updated:** 05/11/2025
