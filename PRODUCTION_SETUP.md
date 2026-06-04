# Production Environment Configuration

## Required Environment Variables

### Analytics
```env
# Google Analytics 4
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX

# Site URL for analytics
NEXT_PUBLIC_SITE_URL=https://arpit-labs.com
```

### Error Monitoring (Sentry)
```env
# Sentry for error tracking
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

### Email System (Resend)
```env
# Resend API for email delivery
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Email configuration
NEXT_PUBLIC_FROM_EMAIL=noreply@arpit-labs.com
ADMIN_EMAILS=admin@arpit-labs.com,support@arpit-labs.com
```

### Supabase Configuration
```env
# Supabase - Already configured
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

### Security Headers
```env
# Deployed domain for CSP headers
NEXT_PUBLIC_SITE_DOMAIN=arpit-labs.com
```

## Setup Instructions

### 1. Google Analytics 4
1. Go to https://analytics.google.com
2. Create a new property for Arpit Labs
3. Create a Web data stream
4. Copy the Measurement ID (starts with G-)
5. Add to environment variables as `NEXT_PUBLIC_GA4_ID`

### 2. Sentry Error Tracking
1. Create account at https://sentry.io
2. Create a new Next.js project
3. Copy the DSN
4. Add to environment variables as `NEXT_PUBLIC_SENTRY_DSN`

### 3. Resend Email Service
1. Create account at https://resend.com
2. Generate API key
3. Configure verified domain
4. Add to environment variables as `RESEND_API_KEY`

### 4. Vercel Deployment
1. Connect GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Enable Analytics in Vercel settings
4. Configure custom domain

## Production Checklist

- [ ] Google Analytics 4 configured
- [ ] Sentry error tracking setup
- [ ] Resend email service active
- [ ] Environment variables in Vercel
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Security headers configured
- [ ] Rate limiting configured
- [ ] CSRF protection enabled
- [ ] Input sanitization implemented
- [ ] Database backups configured
- [ ] Storage backups configured
- [ ] Monitoring alerts setup
- [ ] Contact form email notifications working
- [ ] Newsletter signup email working
- [ ] Admin notifications configured

## Performance Targets

- Lighthouse Performance: 90+
- Lighthouse SEO: 95+
- Lighthouse Accessibility: 95+
- Lighthouse Best Practices: 95+
- Core Web Vitals: All "Good"
- Time to First Byte (TTFB): < 200ms
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1

## Security Headers

All security headers are configured via Next.js middleware:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000
- Content-Security-Policy: Configured with safe defaults

## Rate Limiting

API endpoints are protected with rate limiting:
- Contact Form: 5 submissions per hour per IP
- Newsletter: 1 signup per day per email
- Admin API: 100 requests per minute per authenticated user

## Data Backup

- Database backups: Daily via Supabase
- Storage backups: Weekly to AWS S3
- Backup retention: 30 days
- Recovery tested: Monthly

## Monitoring

- Error tracking: Sentry (real-time)
- Performance monitoring: Vercel Analytics
- Uptime monitoring: Vercel Uptime
- Custom alerts: Email notifications

## Deployment

1. Push to main branch
2. Vercel automatically builds and deploys
3. Run tests and type checking
4. Deploy to production
5. Monitor Sentry for errors
6. Check analytics for traffic

## Maintenance

- Weekly: Check error logs in Sentry
- Weekly: Review analytics trends
- Monthly: Verify all integrations working
- Monthly: Test backup recovery
- Quarterly: Review and update security policies
