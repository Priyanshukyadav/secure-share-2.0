#  Deployment Guide

Complete guide to deploy the End-to-End Encrypted File Sharing System to production.

## Prerequisites

- GitHub account
- MongoDB Atlas account (free tier available)
- Credit card for cloud services (most have free tier)
- Node.js 18+ (for local testing)

##  Services Used

| Component | Service       | Free Tier | Cost        |
| --------- | ------------- | --------- | ----------- |
| Database  | MongoDB Atlas | 512MB     | $0-57/month |
| Backend   | Render        | $7/month  | $7-50/month |
| Frontend  | Vercel        |          | $20+/month  |
| Domain    | Namecheap     | -         | $3-10/year  |

**Total Estimated Cost: $10-60/month**

---

## Step 1: Prepare for Deployment

### 1.1 Create GitHub Repository

```bash
# Create new repo on github.com

# Push your code
cd e:\minorbanaobikaro
git init
git add .
git commit -m "Initial commit: E2E encrypted file sharing system"
git remote add origin https://github.com/YOUR_USERNAME/e2e-file-sharing.git
git branch -M main
git push -u origin main
```

### 1.2 Setup MongoDB Atlas

1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Sign up for free account
3. Create new cluster
4. Select "Free" M0 cluster
5. Choose region close to you
6. Wait for cluster to initialize (5-10 minutes)

### 1.3 Get MongoDB Connection String

1. Click "Connect" button
2. Select "Connect your application"
3. Copy connection string
4. Replace `<username>` and `<password>` with your credentials
5. Replace `<database_name>` with `e2e-file-sharing`

Example:

```
mongodb+srv://user:password@cluster0.abcde.mongodb.net/e2e-file-sharing?retryWrites=true&w=majority
```

### 1.4 Prepare Environment Variables

**For Backend:**

```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=generate-random-key-here
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10
CLIENT_URL=https://your-frontend-domain.com
MAX_FILE_SIZE=104857600
```

**For Frontend:**

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

Generate JWT_SECRET:

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[System.Convert]::ToBase64String((1..32|ForEach-Object {[byte](Get-Random -Max 256)}))
```

---

## Step 2: Deploy Backend

### Option A: Deploy on Render

**Recommended for beginners - Easiest setup**

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +"  "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `e2e-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: `Free` (for testing)

6. Add Environment Variables:

   ```
   PORT=5000
   NODE_ENV=production
   MONGO_URI=<your_mongodb_uri>
   JWT_SECRET=<your_jwt_secret>
   CLIENT_URL=https://your-frontend.vercel.app
   MAX_FILE_SIZE=104857600
   ```

7. Click "Create Web Service"
8. Wait for deployment (5-10 minutes)
9. Copy your backend URL: `https://e2e-backend.onrender.com`

### Option B: Deploy on Railway

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create new project
4. Deploy from GitHub repo
5. Add MongoDB plugin (auto-configured)
6. Set environment variables in dashboard
7. Deploy

### Option C: Deploy on AWS

1. Create EC2 instance (Ubuntu 22.04)
2. Connect via SSH
3. Install Node.js:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
4. Clone repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/e2e-file-sharing.git
   cd e2e-file-sharing/backend
   ```
5. Install dependencies:
   ```bash
   npm install
   npm install -g pm2
   ```
6. Create `.env` file
7. Start with PM2:
   ```bash
   pm2 start src/server.js --name "e2e-backend"
   pm2 startup
   pm2 save
   ```
8. Setup Nginx reverse proxy (optional but recommended)

---

## Step 3: Deploy Frontend

### Option A: Deploy on Vercel

**Recommended - Automatic deployment**

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Add New"  "Project"
4. Select your repository
5. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

6. Add Environment Variables:

   ```
   VITE_API_BASE_URL=https://your-backend.onrender.com/api
   ```

7. Click "Deploy"
8. Your frontend is live! 
9. Copy your frontend URL: `https://e2e-file-sharing.vercel.app`

### Option B: Deploy on Netlify

1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "New site from Git"
4. Connect GitHub repository
5. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

6. Set environment variable
7. Deploy

### Option C: Manual Deployment to VPS

```bash
# Build
cd frontend
npm run build

# Upload dist/ folder to your server
# Setup Nginx to serve frontend
# Configure SSL certificate

# Example Nginx config
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/ssl/cert.pem;
    ssl_certificate_key /etc/ssl/key.pem;

    root /var/www/e2e-frontend/dist;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Step 4: Configure Domain

1. Buy domain from [Namecheap](https://namecheap.com) (~$10/year)
2. Set DNS records:

```
Type    | Name | Value
--------|------|------
CNAME   | @    | your-backend.onrender.com
CNAME   | www  | your-frontend.vercel.app
A       | api  | backend-ip-or-cname
```

Or use your cloud provider's domain service

---

## Step 5: Update Backend URLs

After deployment, update your backend environment variable:

```env
CLIENT_URL=https://your-domain.com
```

This ensures CORS is properly configured.

---

## Step 6: Test Production

### Test Backend API

```bash
# Health check
curl https://your-backend.com/health

# Register
curl -X POST https://your-backend.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!",
    "confirmPassword": "Test123!"
  }'
```

### Test Frontend

1. Open `https://your-domain.com`
2. Register new account
3. Upload file
4. Download file
5. Share file with password
6. Test shared link

### Monitor Logs

**Render:**

- View in Render dashboard
- Click Web Service  Logs

**Vercel:**

- View in Vercel dashboard
- Click Deployments  Logs

---

## Step 7: Security Hardening

### SSL/TLS Certificate

- Render: Automatic (included)
- Vercel: Automatic (included)
- AWS/VPS: Use Let's Encrypt

```bash
# Let's Encrypt (free)
certbot certonly --standalone -d your-domain.com
```

### HTTPS Enforcement

1. Ensure all services use HTTPS
2. Configure HSTS headers
3. Update `CLIENT_URL` to HTTPS

### Environment Variables

 DO:

- Store in cloud provider's secret manager
- Rotate JWT_SECRET periodically
- Use strong MongoDB password

 DON'T:

- Commit .env files to GitHub
- Use same credentials across environments
- Share secrets via email

### Firewall Rules

- Restrict database access to backend only
- Use security groups / IP whitelisting
- Enable WAF (Web Application Firewall)

---

## Monitoring & Maintenance

### Setup Monitoring

1. **Sentry** (Error tracking)

   ```bash
   npm install @sentry/node
   ```

2. **New Relic** (Performance)
   - Free tier available

3. **UptimeRobot** (Uptime monitoring)
   - Monitor backend API
   - Get alerts if down

### Regular Maintenance

- [ ] Update dependencies monthly
- [ ] Check logs weekly
- [ ] Backup database
- [ ] Monitor storage usage
- [ ] Review security patches

### Backup Database

```bash
# Export MongoDB
mongodump --uri "mongodb+srv://..." -o ./backup

# Import MongoDB
mongorestore --uri "mongodb+srv://..." ./backup
```

---

## Troubleshooting

### 502 Bad Gateway

- Backend crashed
- Check logs in cloud dashboard
- Restart service

### CORS Error

- Update `CLIENT_URL` in backend `.env`
- Restart backend
- Clear browser cache

### File Upload Fails

- Check file size limit (100MB default)
- Verify database connection
- Check disk space

### Encryption Errors

- Verify browser supports Web Crypto API
- Ensure HTTPS (required for Web Crypto)
- Check browser console (F12)

### Database Connection

- Verify MONGO_URI in .env
- Check MongoDB Atlas IP whitelist
- Ensure network connectivity

---

## Cost Optimization

### Reduce Costs

1. **Use Free Tiers**
   - MongoDB Atlas: $0 (512MB)
   - Vercel: $0 (unlimited)
   - Render: $7/month minimum

2. **Compress Files**
   - Reduce storage needs
   - Save bandwidth

3. **Schedule Cleanup**
   - Delete old shared files
   - Clean up failed uploads

4. **Optimize Database**
   - Create indexes
   - Archive old data

### Estimated Monthly Costs

| Item              | Cost            |
| ----------------- | --------------- |
| MongoDB Atlas     | $0-15           |
| Backend (Render)  | $7              |
| Frontend (Vercel) | $0-20           |
| Domain            | $1/month        |
| **Total**         | **$8-36/month** |

---

## Production Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Backend deployed on Render/Railway/AWS
- [ ] Frontend deployed on Vercel/Netlify
- [ ] Domain configured with DNS
- [ ] SSL/TLS certificate installed
- [ ] Environment variables set correctly
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Error logging setup
- [ ] Database backups configured
- [ ] Monitoring alerts setup
- [ ] Tested file upload/download
- [ ] Tested file sharing
- [ ] Tested with incognito window
- [ ] Performance tested with 100MB file
- [ ] Security review completed

---

## Post-Deployment

### 1. Monitor Performance

- Check error logs daily first week
- Monitor database usage
- Track API response times

### 2. Gather Feedback

- Test with real users
- Collect bug reports
- Measure satisfaction

### 3. Optimize

- Fix reported issues
- Improve performance
- Add features based on feedback

### 4. Scale

- As usage grows, upgrade tiers
- Implement caching
- Use CDN for frontend

---

## Support & Help

- Backend README: [backend/README.md](../backend/README.md)
- Frontend README: [frontend/README.md](../frontend/README.md)
- Main README: [README.md](../README.md)

---

## Security Considerations

 **Always Remember:**

- HTTPS only in production
- Never log sensitive data
- Rotate secrets periodically
- Monitor for suspicious activity
- Keep dependencies updated
- Test security regularly

---

** Congratulations!** Your E2E encrypted file sharing system is now live!

For production-grade usage, consider:

- Adding authentication 2FA
- Implementing file versioning
- Setting up automated backups
- Adding advanced analytics
- Implementing compliance features (GDPR, etc.)

---

Last Updated: April 2026







