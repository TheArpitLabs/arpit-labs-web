# Deployment Checklist - Axiora

## Pre-Deployment (Development)

### Code Quality

- ✅ All TypeScript errors resolved
- ✅ All tests passing
- ✅ Linting complete (`npm run lint`)
- ✅ Build successful (`npm run build`)
- ✅ No console errors or warnings
- ✅ Dependencies audit passed

### Environment Variables (Development)

- ✅ `.env.local` configured
- ✅ `NEXT_PUBLIC_SUPABASE_URL` set
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- ✅ `SUPABASE_SERVICE_ROLE_KEY` set
- ✅ `ADMIN_EMAILS` configured

### Database Setup

- ✅ Supabase project created
- ✅ Database schema migrated
- ✅ Tables created (projects, labnotes, experiments, journey_entries, etc.)
- ✅ Storage buckets created (projects, blog, experiments, uploads)
- ✅ RLS policies configured
- ✅ Database backups enabled

### Admin Setup

- ✅ Admin user created
- ✅ Admin login tested
- ✅ Dashboard accessible
- ✅ CRUD operations tested

---

## Production Deployment (Vercel)

### Step 1: Repository Setup

- [ ] Push code to GitHub `main` branch
- [ ] Repository is public or Vercel has access
- [ ] No sensitive data in repository

### Step 2: Vercel Project Setup

- [ ] Create Vercel account (vercel.com)
- [ ] Connect GitHub repository
- [ ] Import project
- [ ] Select "Next.js" framework
- [ ] Install build completed successfully

### Step 3: Environment Variables

- [ ] Add `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Add `ADMIN_EMAILS`
- [ ] Add `NEXT_PUBLIC_SITE_URL` = production URL
- [ ] Add `NEXT_PUBLIC_FROM_EMAIL`
- [ ] Add `NEXT_PUBLIC_GA4_ID` (optional, for analytics)
- [ ] Add `NEXT_PUBLIC_SENTRY_DSN` (optional, for monitoring)
- [ ] Add `RESEND_API_KEY` (optional, for emails)
- [ ] Add `NODE_ENV` = `production`

### Step 4: Domain Configuration

- [ ] Add custom domain in Vercel
- [ ] Point DNS to Vercel (CNAME/A records)
- [ ] Verify domain ownership
- [ ] HTTPS enabled (automatic)
- [ ] SSL certificate generated

### Step 5: Analytics Integration

- [ ] Google Analytics 4 account created
- [ ] GA4 property created for production
- [ ] Measurement ID added to env vars
- [ ] Analytics code deployed
- [ ] Test tracking in production

### Step 6: Monitoring Setup (Optional)

- [ ] Sentry account created
- [ ] Sentry project configured for Next.js
- [ ] DSN added to env vars
- [ ] Error monitoring active
- [ ] Alerts configured

### Step 7: Email Service Setup (Optional)

- [ ] Resend account created
- [ ] Domain verified in Resend
- [ ] API key generated
- [ ] API key added to env vars
- [ ] Test email sent successfully

### Step 8: Database Backup

- [ ] Supabase backup scheduled
- [ ] Backup retention set to 30 days
- [ ] Test backup restoration
- [ ] Document backup procedure

### Step 9: Security Headers

- [ ] CSP headers configured
- [ ] Security headers in `next.config.mjs`
- [ ] HSTS enabled
- [ ] Rate limiting configured

### Step 10: Performance Optimization

- [ ] Images optimized
- [ ] Fonts preloaded
- [ ] Code splitting enabled
- [ ] Cache headers configured
- [ ] Lighthouse score >= 90

---

## Post-Deployment Testing

### Functionality Testing

- [ ] Homepage loads
- [ ] Projects page displays
- [ ] Blog page displays
- [ ] Contact form works
- [ ] Newsletter signup works
- [ ] Admin login works
- [ ] Admin CRUD operations work

### Performance Testing

- [ ] Google Lighthouse scores:
  - [ ] Performance: >= 90
  - [ ] Accessibility: >= 95
  - [ ] Best Practices: >= 95
  - [ ] SEO: >= 95
- [ ] Core Web Vitals: All "Good"
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 2.5s

### Security Testing

- [ ] HTTPS enabled
- [ ] Security headers present
- [ ] No sensitive data exposed
- [ ] Environment variables not leaked
- [ ] CORS configured correctly

### Monitoring Testing

- [ ] Analytics tracking works
- [ ] Events recorded in GA4
- [ ] Errors appear in Sentry (if configured)
- [ ] Email notifications working (if configured)

### SEO Testing

- [ ] Sitemap.xml accessible
- [ ] Robots.txt correct
- [ ] Meta tags present
- [ ] OpenGraph tags correct
- [ ] Structured data valid (JSON-LD)
- [ ] Google Search Console verified

---

## Launch Day

### Before Launch

- [ ] Final build successful
- [ ] All tests passing
- [ ] Team notified
- [ ] Backup created
- [ ] Monitoring configured
- [ ] Status page ready

### Launch

- [ ] Deploy to production
- [ ] Monitor errors in real-time
- [ ] Check analytics
- [ ] Verify all features working
- [ ] Monitor performance metrics

### After Launch

- [ ] Review error logs (24 hours)
- [ ] Review analytics (first week)
- [ ] Gather user feedback
- [ ] Monitor performance trends
- [ ] Celebrate! 🎉

---

## Ongoing Maintenance

### Daily

- [ ] Check error logs
- [ ] Monitor uptime
- [ ] Respond to critical errors

### Weekly

- [ ] Review analytics trends
- [ ] Check security updates
- [ ] Verify backups working
- [ ] Review error patterns

### Monthly

- [ ] Performance review
- [ ] Database cleanup
- [ ] Update dependencies
- [ ] Security audit
- [ ] Backup restoration test

### Quarterly

- [ ] Security review
- [ ] Performance optimization
- [ ] Architecture review
- [ ] Scalability assessment
- [ ] Document updates

---

## Rollback Plan

If critical issues occur:

1. **Immediate Actions**
   - Alert team
   - Check error logs
   - Review recent changes
   - Document issue

2. **Rollback Steps**
   - Go to Vercel Deployments
   - Select previous successful deployment
   - Click "Promote to Production"
   - Wait for deployment to complete
   - Verify site restored

3. **Post-Rollback**
   - Notify users
   - Investigate issue
   - Fix code
   - Test thoroughly
   - Redeploy

---

## Support Contacts

- **Vercel Support**: vercel.com/support
- **Supabase Support**: supabase.com/support
- **Sentry Support** (if used): sentry.io/support
- **Resend Support** (if used): resend.com/support

---

## Success Criteria

✅ Production deployment is successful when:

- Site is live and accessible
- All core features working
- No critical errors in logs
- Analytics tracking correctly
- Performance metrics acceptable
- Security checks passing
- Monitoring systems active
