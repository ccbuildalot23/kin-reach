# Deployment Guide - Serenity Wellness App

## Pre-Deployment Checklist

### ✅ Completed
- [x] Recovery features implemented
- [x] Compassionate language throughout
- [x] Crisis support on every page
- [x] HIPAA documentation created
- [x] Wellness disclaimer added
- [x] Security measures in place

### ⚠️ Pending (for HIPAA compliance)
- [ ] Supabase BAA (required for medical use)
- [ ] Twilio BAA (required for medical use)
- [ ] Email provider BAA (required for medical use)

## Deployment Options

### Option 1: Deploy via Lovable (RECOMMENDED)
**Time: 5 minutes**

1. **Go to your Lovable project:**
   https://lovable.dev/projects/240268aa-03a2-4d48-b072-7f4df844f39c

2. **Click "Share" → "Publish"**

3. **Your app will be live at:**
   - Default: `https://[your-project-id].lovable.app`
   - Custom domain available in settings

4. **Share the link!**

### Option 2: Deploy to Vercel
**Time: 15 minutes**

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Follow prompts:**
   - Link to existing project? No
   - Project name: serenity-wellness
   - Framework: Vite
   - Build command: npm run build
   - Output directory: dist

4. **Set environment variables in Vercel dashboard:**
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   ```

### Option 3: Deploy to Netlify
**Time: 10 minutes**

1. **Create netlify.toml:**
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy via CLI:**
   ```bash
   npm install -g netlify-cli
   netlify deploy
   netlify deploy --prod
   ```

## Post-Deployment Setup

### 1. Configure Supabase
- Ensure your Supabase project is running
- Run migrations if not already applied:
  ```bash
  supabase db push
  ```

### 2. Update Environment Variables
Make sure your deployed app has:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3. Test Critical Features
- [ ] User registration/login
- [ ] Crisis button functionality
- [ ] Support team management
- [ ] SMS testing (will be in mock mode)

### 4. Configure Custom Domain (Optional)
- Lovable: Project → Settings → Domains
- Vercel: Project Settings → Domains
- Netlify: Site Settings → Domain Management

## Wellness App vs Medical App

### Current Status: Wellness App
- ✅ Can deploy immediately
- ✅ Provides peer support
- ✅ Crisis resources
- ⚠️ Not for medical use
- ⚠️ Wellness disclaimer shown

### To Upgrade to Medical App:
1. Sign all BAAs (Supabase, Twilio, Email)
2. Remove wellness disclaimer
3. Add HIPAA compliance badge
4. Update privacy policy
5. Complete security audit

## Monitoring & Analytics

### Recommended Services:
1. **Sentry** - Error tracking
   ```bash
   npm install @sentry/react
   ```

2. **Google Analytics** - Usage tracking
   ```html
   <!-- Add to index.html -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
   ```

3. **Supabase Dashboard** - Database monitoring

## Launch Checklist

### Before Sharing:
- [ ] Test on mobile devices
- [ ] Verify crisis resources work
- [ ] Check all links (988, text numbers)
- [ ] Test user registration flow
- [ ] Verify wellness disclaimer appears

### Marketing Assets:
- App Name: **Serenity Wellness**
- Tagline: "Your Recovery Support Companion"
- Description: "Connect with your support team, track your recovery journey, and access crisis resources when you need them most."

### App Store Preparation:
1. **Screenshots needed:**
   - Home screen with mood check-in
   - Support team page
   - Peace library
   - Crisis resources

2. **App Description:**
   ```
   Serenity Wellness is your compassionate companion for recovery support. 
   
   Features:
   • One-tap crisis support (988, crisis text)
   • Connect with your support team
   • Track recovery milestones
   • Calming sounds and breathing exercises
   • Daily mood check-ins
   
   Note: This is a wellness support app. For medical emergencies, call 911.
   ```

## Support & Updates

### For Issues:
1. Check Supabase logs
2. Review browser console
3. Check network requests

### Update Process:
1. Make changes in Lovable or locally
2. Test thoroughly
3. Deploy via same method

## Ready to Launch! 🚀

Your wellness app is ready for deployment. Choose Option 1 (Lovable) for the fastest deployment.

Remember: This launches as a wellness app. Upgrade to medical app after obtaining BAAs.

---
*Last Updated: January 2025*