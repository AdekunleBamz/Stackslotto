# Render Deployment Guide

## Backend Deployment Steps

### 1. Prepare Your Repository
✅ All code is already pushed to GitHub: `https://github.com/AdekunleBamz/Stackslotto`

### 2. Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `AdekunleBamz/Stackslotto`

### 3. Configure Build Settings

**Name:** `stackslotto-backend` (or any name you prefer)

**Root Directory:** `backend`

**Environment:** `Node`

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Plan:** Choose Free tier (or paid if you need more resources)

### 4. Set Environment Variables

In Render dashboard, go to **Environment** tab and add:

```
HIRO_API_KEY=your_hiro_api_key_here
STACKS_NETWORK=mainnet
LOTTO_CONTRACT=SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.stacks-lotto
WEBHOOK_URL=https://your-service-name.onrender.com/api/chainhook/events
WEBHOOK_SECRET=your_secure_random_string_here
PORT=10000
```

**Important Notes:**
- `WEBHOOK_URL` should be your Render service URL (you'll get this after deployment)
- `WEBHOOK_SECRET` - generate a random secure string (you can use: `openssl rand -hex 32`)
- `PORT` - Render sets this automatically, but you can use `10000` as default

### 5. Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repo
   - Install dependencies
   - Build the TypeScript code
   - Start the server

### 6. Get Your Service URL

After deployment, Render will provide a URL like:
```
https://stackslotto-backend.onrender.com
```

**Update your environment variables:**
- Update `WEBHOOK_URL` to: `https://your-service-name.onrender.com/api/chainhook/events`

### 7. Register Chainhooks

After deployment, you can register chainhooks by:
1. Using Render's shell (SSH into your service)
2. Or run locally with the Render URL in your `.env`:
   ```bash
   cd backend
   WEBHOOK_URL=https://your-service-name.onrender.com/api/chainhook/events npm run chainhook:register
   ```

### 8. Verify Deployment

Check these endpoints:
- Health: `https://your-service-name.onrender.com/health`
- Events API: `https://your-service-name.onrender.com/api/events`

## Troubleshooting

### Build Fails
- Check that `npm run build` completes successfully
- Ensure all TypeScript types are correct

### Service Won't Start
- Check logs in Render dashboard
- Verify all environment variables are set
- Ensure `PORT` is set (Render sets this automatically)

### Chainhooks Not Working
- Verify `WEBHOOK_URL` points to your Render service
- Check that `WEBHOOK_SECRET` matches in both Render and chainhook registration
- Check Render logs for incoming webhook requests

## Next Steps

After backend is deployed:
1. Update frontend `.env` with backend URL (if needed)
2. Deploy frontend to Vercel
3. Test the full application

