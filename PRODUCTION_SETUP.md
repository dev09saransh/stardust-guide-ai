# Production Setup Checklist

## 🔧 Resend Email Service - Production Setup

### Current Status (Sandbox)
- ✅ API Key configured
- ✅ Emails work but only to registered address
- ❌ Domain not verified

### Production Steps Required
1. **Verify Your Domain**
   ```bash
   # Add DNS records provided by Resend
   # TXT record for verification
   # MX records for email delivery
   ```

2. **Update Email From Address**
   ```javascript
   // In emailService.js, change from:
   from: 'Stardust Security <onboarding@resend.dev>'
   // To:
   from: 'Stardust Security <security@yourdomain.com>'
   ```

3. **Test Production Emails**
   ```bash
   # Send test email to external address
   ```

---

## 📱 Twilio WhatsApp - Production Setup

### Current Status (Sandbox)
- ✅ Account configured
- ✅ Messages work but require manual opt-in
- ❌ Using sandbox number, not production number

### Production Steps Required
1. **Upgrade Twilio Account**
   - Upgrade from trial to production account
   - Add billing information

2. **Request WhatsApp Business Profile**
   - Submit business verification
   - Get WhatsApp Business API approval

3. **Provision Production Number**
   - Request dedicated WhatsApp number
   - Remove sandbox limitations

4. **Update Environment Variables**
   ```bash
   # Replace sandbox number with production number
   TWILIO_WHATSAPP_NUMBER=whatsapp:+YOUR_PRODUCTION_NUMBER
   ```

---

## 🏦 Setu Account Aggregator - Production Setup

### Current Status (UAT Sandbox)
- ✅ Credentials configured
- ✅ API connectivity working
- ❌ Limited mock data only

### Production Steps Required
1. **Complete Setu Onboarding**
   - Submit business documentation
   - Complete compliance verification
   - Get production API credentials

2. **Update Environment Variables**
   ```bash
   # Change from UAT to production
   SETU_AA_BASE_URL=https://fiu.setu.co
   SETU_CLIENT_ID=PRODUCTION_CLIENT_ID
   SETU_CLIENT_SECRET=PRODUCTION_CLIENT_SECRET
   SETU_APP_ID=PRODUCTION_APP_ID
   ```

3. **Handle Real User Consent**
   - Implement proper consent flow
   - Handle real-time data fetching
   - Implement proper error handling for production

---

## 🚀 Deployment Steps

### 1. Pre-Deployment Checklist
- [ ] Verify Resend domain
- [ ] Upgrade Twilio account
- [ ] Complete Setu production onboarding
- [ ] Update all production environment variables
- [ ] Test all APIs with production credentials

### 2. Environment Variables for Production
```bash
# Resend Production
RESEND_API_KEY=re_production_your_key
FROM_EMAIL=security@yourdomain.com

# Twilio Production  
TWILIO_ACCOUNT_SID=AC_production_sid
TWILIO_AUTH_TOKEN=production_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+production_number

# Setu Production
SETU_AA_BASE_URL=https://fiu.setu.co
SETU_CLIENT_ID=production_client_id
SETU_CLIENT_SECRET=production_client_secret
SETU_APP_ID=production_app_id
```

### 3. Testing in Production
- [ ] Send emails to external addresses
- [ ] Send WhatsApp messages without opt-in
- [ ] Fetch real financial data from Setu
- [ ] Test complete user flow end-to-end

---

## ⚠️ Important Notes

### Security Considerations
- Never commit production secrets to git
- Use AWS Secrets Manager or similar for production
- Implement proper API rate limiting
- Add monitoring and logging

### Compliance Requirements
- WhatsApp Business Policy compliance
- Email marketing regulations (CAN-SPAM, GDPR)
- Financial data regulations (RBI guidelines for Setu)
- User consent management

---

## 📞 Support Contacts

Keep these handy for production setup:
- **Resend Support**: support@resend.com
- **Twilio Support**: support@twilio.com  
- **Setu Support**: support@setu.co

---

## 🔄 Migration Timeline

1. **Week 1**: Complete domain verification and account upgrades
2. **Week 2**: Get production credentials and update configs
3. **Week 3**: Test all integrations in production
4. **Week 4**: Deploy to EC2 with full production setup

---

**Current Status**: ✅ Ready for Sandbox Development
**Target Status**: 🚀 Ready for Production Deployment
