# FastTrace Frontend - Vercel Deployment Guide

This guide will help you deploy the FastTrace frontend to Vercel for production.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Git Repository**: Your code should be pushed to GitHub, GitLab, or Bitbucket
3. **Backend API**: Your backend should be deployed and accessible
4. **Razorpay Account**: Live API keys for production payments
5. **Node.js**: Version 18+ installed locally for testing

## 🚀 Quick Start

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your repository
   - Vercel will auto-detect Vite configuration

3. **Configure Environment Variables**
   
   Add these in the Vercel dashboard under "Environment Variables":
   
   **Required Variables:**
   ```
   VITE_API_BASE_URL=https://your-backend-api.com
   VITE_WS_URL=wss://your-backend-api.com
   VITE_RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_HERE
   VITE_NODE_ENV=production
   VITE_APP_NAME=FastTrace
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for the build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from frontend directory**
   ```bash
   cd frontend
   vercel
   ```

4. **Follow the prompts**
   - Link to existing project or create new
   - Configure settings
   - Deploy!

## ⚙️ Environment Variables Configuration

Create a `.env.production` file (use `.env.production.example` as template):

### Required Variables

```env
# Backend API (REQUIRED)
VITE_API_BASE_URL=https://your-backend-api.com
VITE_WS_URL=wss://your-backend-api.com

# Payment Gateway (REQUIRED for payments)
VITE_RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_HERE
VITE_PAYMENT_CURRENCY=INR

# Application
VITE_NODE_ENV=production
VITE_APP_NAME=FastTrace
VITE_APP_VERSION=1.0.0

# Production Settings
VITE_ENABLE_DEV_TOOLS=false
VITE_ENABLE_SOURCE_MAPS=false
VITE_ENABLE_DEBUG_MODE=false
```

### Optional Variables

```env
# Analytics (Recommended)
VITE_ANALYTICS_ID=your_google_analytics_id
VITE_SENTRY_DSN=your_sentry_dsn
VITE_ENABLE_ERROR_REPORTING=true

# Feature Flags
VITE_ENABLE_AUTO_SYNC=true
VITE_ENABLE_REAL_TIME_UPDATES=true
VITE_ENABLE_NOTIFICATIONS=true

# Performance
VITE_SYNC_INTERVAL_GROUPS=1800000
VITE_SYNC_INTERVAL_EXPENSES=1200000
VITE_CACHE_EXPIRY=600000
```

## 🔧 Build Configuration

The project is configured with optimal production settings:

- **Framework**: Vite + React + TypeScript
- **Build Command**: `npm run build:prod`
- **Output Directory**: `dist`
- **Node Version**: 18+ (specified in package.json engines)

### Build Optimizations

- ✅ Code splitting by vendor chunks
- ✅ Terser minification
- ✅ Tree shaking
- ✅ CSS code splitting
- ✅ Asset optimization
- ✅ Console logs removed in production
- ✅ Source maps disabled by default

## 🔒 Security Configuration

The deployment includes:

- Content Security Policy (CSP) headers
- X-Frame-Options protection
- XSS Protection
- HTTPS enforcement
- Secure cookie settings
- CORS configuration

## 📦 Production Checklist

Before deploying to production, verify:

- [ ] Backend API is deployed and accessible
- [ ] Environment variables are configured in Vercel
- [ ] Razorpay LIVE keys are set (not test keys)
- [ ] CORS is configured on backend to allow your frontend domain
- [ ] Backend API URLs use HTTPS (not HTTP)
- [ ] WebSocket URL uses WSS protocol (not WS)
- [ ] Test the build locally: `npm run build:prod && npm run preview`
- [ ] All features work in preview mode
- [ ] Payment flow is tested with live keys (in test mode first)
- [ ] Error tracking is configured (Sentry recommended)
- [ ] Analytics is set up (optional)

## 🧪 Test Production Build Locally

Before deploying, test your production build:

```bash
# Build for production
npm run build:prod

# Preview the production build
npm run preview

# Run production checks
npm run production-check
```

Visit `http://localhost:4173` to test the production build locally.

## 🔄 Continuous Deployment

Vercel automatically deploys:

- **Production**: Commits to `main` branch → `your-project.vercel.app`
- **Preview**: Pull requests → unique preview URL
- **Branches**: Other branches → branch-specific URLs

### Disable Auto-Deploy (Optional)

In Vercel dashboard → Settings → Git:
- Configure which branches trigger deployments
- Disable auto-deployment if needed

## 🌐 Custom Domain

To add a custom domain:

1. Go to your project in Vercel dashboard
2. Settings → Domains
3. Add your domain (e.g., `app.yourdomain.com`)
4. Update DNS records as instructed
5. Wait for SSL certificate provisioning
6. Update `VITE_DOMAIN` environment variable

## 🐛 Troubleshooting

### Build Fails

**Error: "Module not found"**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error: "Out of memory"**
- In Vercel dashboard, increase memory limit (Settings → General)

### Runtime Errors

**Error: "Failed to fetch" / API errors**
- Verify `VITE_API_BASE_URL` is correct
- Check backend CORS configuration
- Ensure backend is deployed and accessible

**Error: "WebSocket connection failed"**
- Verify `VITE_WS_URL` uses `wss://` protocol
- Check backend WebSocket support
- Verify firewall/proxy settings

**Error: "Razorpay not defined"**
- Verify CSP headers allow Razorpay
- Check `VITE_RAZORPAY_KEY_ID` is set
- Ensure you're using LIVE key for production

### SPA Routing Issues

If direct URLs (e.g., `/dashboard`) return 404:
- Verify `vercel.json` is in the frontend directory
- Check the rewrites configuration
- Redeploy if changes were made

## 📊 Monitoring

### Vercel Analytics

Enable in Vercel dashboard:
- Project → Analytics → Enable

### Error Tracking (Recommended)

Set up Sentry:
```bash
npm install @sentry/react @sentry/vite-plugin
```

Add to environment variables:
```env
VITE_SENTRY_DSN=your_sentry_dsn
VITE_ENABLE_ERROR_REPORTING=true
```

## 🔄 Update Production

To update your production deployment:

```bash
# Make changes
git add .
git commit -m "Update description"
git push origin main
```

Vercel will automatically build and deploy the changes.

### Manual Deploy

```bash
vercel --prod
```

## 📈 Performance Tips

1. **Enable Compression**: Vercel automatically enables Gzip/Brotli
2. **Image Optimization**: Use Vercel Image Optimization for images
3. **Caching**: Static assets are cached automatically (1 year)
4. **CDN**: Content is served from Vercel's global CDN
5. **Analytics**: Monitor with Vercel Analytics or Google Analytics

## 🔐 Environment Variables Best Practices

- Never commit `.env.production` with real secrets
- Use Vercel's environment variable encryption
- Rotate API keys regularly
- Use different keys for staging and production
- Prefix all frontend env vars with `VITE_`

## 📞 Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Vite Documentation**: [vitejs.dev](https://vitejs.dev)
- **Project Issues**: Create an issue in your repository

## 🎉 Success!

Your FastTrace frontend should now be deployed and accessible. Test all features thoroughly before announcing to users.

### Post-Deployment Checklist

- [ ] Homepage loads correctly
- [ ] Authentication works (login/register)
- [ ] Dashboard displays data
- [ ] Group features work
- [ ] Expense tracking works
- [ ] Payment integration works
- [ ] Real-time updates work
- [ ] Mobile responsive
- [ ] All links work
- [ ] No console errors

---

**Last Updated**: November 2025
**Deployment Platform**: Vercel
**Framework**: Vite + React + TypeScript
