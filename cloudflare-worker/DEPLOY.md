# Quick Deployment Guide

## Dashboard Method (Recommended - Easiest!)

1. **Open your Worker**:
   - Go to https://dash.cloudflare.com/
   - Click **Workers & Pages**
   - Click **stats-tutor-api**

2. **Edit the code**:
   - Click **"Edit code"** button
   - Select all existing code and delete it
   - Copy and paste the entire contents of `worker.js`
   - Click **"Save and Deploy"**

3. **Add your API key** (CRITICAL!):
   - Click **Settings** tab
   - Click **Variables**
   - Under "Environment Variables", click **"Add variable"**
   - Name: `ANTHROPIC_API_KEY`
   - Type: Select **"Encrypt"** (this keeps it secret!)
   - Value: Paste your Anthropic API key
   - Click **"Save"**

4. **Test it**:
   - Visit https://sdabagh.github.io/ai-tutor-live.html
   - Type: "What is standard deviation?"
   - You should get an AI response!

---

## Command Line Method (Alternative)

If you prefer using the terminal:

```bash
# Install Wrangler (Cloudflare's CLI)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Navigate to the worker directory
cd cloudflare-worker

# Deploy
wrangler deploy

# Add API key as encrypted secret
wrangler secret put ANTHROPIC_API_KEY
# Then paste your key when prompted
```

---

## Getting an Anthropic API Key

If you don't have one yet:

1. Go to https://console.anthropic.com
2. Sign up or log in
3. Go to **API Keys** section
4. Click **"Create Key"**
5. Copy the key (you won't see it again!)
6. You'll get $5 free credit to start

---

## Troubleshooting

**Error: "Server configuration error"**
→ You forgot to add the ANTHROPIC_API_KEY. Go to Worker Settings → Variables.

**Error: "CORS error"**
→ Make sure you deployed the new worker.js code.

**Error: "Worker not found"**
→ Check that the Worker URL matches: `stats-tutor-api.sdabagh-stats.workers.dev`

---

## You're Done! 🎉

Once deployed and the API key is added, students can immediately use:
- **Statistics Tutor**: https://sdabagh.github.io/ai-tutor-live.html
- **Academic Counselor**: https://sdabagh.github.io/smc-counselor.html
