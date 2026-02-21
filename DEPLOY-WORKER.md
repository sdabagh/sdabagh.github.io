# 🚀 How to Deploy the Worker to Cloudflare

## Current Issue
- Your HTML pages call: `https://stats-tutor-api.sdabagh-stats.workers.dev`
- But the worker code may be deployed to a different URL or not deployed at all
- API key shows "Never used" - worker isn't reaching Anthropic API

## Solution: Deploy the Correct Code

### Option 1: Deploy via Cloudflare Dashboard (EASIEST)

1. **Go to Cloudflare Dashboard**
   - https://dash.cloudflare.com/
   - Click: **Workers & Pages**
   - Click: **stats-tutor-api**

2. **Open Quick Edit**
   - Click the **"Quick Edit"** button
   - You'll see the code editor

3. **Copy the Worker Code**
   - Open this file on your computer: `cloudflare-worker-proxy.js`
   - Select ALL the code (Ctrl+A or Cmd+A)
   - Copy it (Ctrl+C or Cmd+C)

4. **Paste into Cloudflare**
   - Delete everything in the Quick Edit window
   - Paste your code (Ctrl+V or Cmd+V)
   - Click **"Save and Deploy"**

5. **Verify the URL**
   - After deploying, look at the top of the page
   - Find the worker URL (e.g., `https://stats-tutor-api.XXXXX.workers.dev`)
   - **Copy this exact URL**

6. **Update Your HTML Files**
   - Replace the `WORKER_URL` in:
     - `ai-tutor-live.html` (around line 272)
     - `smc-counselor.html` (around line 315)
   - Change to your actual worker URL

7. **Test It!**
   - Open your website
   - Try asking a question
   - Check the Anthropic API dashboard - "Last Used" should update!

---

### Option 2: Deploy via Wrangler CLI (Advanced)

If you want to use the command line:

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy the worker
wrangler deploy cloudflare-worker-proxy.js --name stats-tutor-api

# Set the API key
wrangler secret put ANTHROPIC_API_KEY --name stats-tutor-api
# (paste your API key when prompted)
```

---

## ✅ Verification Checklist

After deployment:

- [ ] Worker shows "Active" status in Cloudflare dashboard
- [ ] You can see your code in Quick Edit
- [ ] Worker URL is confirmed (check the page header)
- [ ] HTML files have the correct WORKER_URL
- [ ] API key is set in Settings → Variables
- [ ] Test the website - try asking a question
- [ ] Check Anthropic dashboard - "Last Used" should show today's date
- [ ] Check Cloudflare logs - should show successful requests

---

## 🐛 If It Still Doesn't Work

Check the Cloudflare logs:
1. Go to your worker
2. Click **"Logs"** tab
3. Try asking a question on your website
4. Look for error messages in the logs

Common issues:
- **API key not set**: Go to Settings → Variables → Add `ANTHROPIC_API_KEY`
- **Wrong model**: Code uses `claude-3-5-sonnet-20241022` (correct ✅)
- **CORS error**: Code allows `https://sdabagh.github.io` (correct ✅)

---

## 📝 Current File Status

**Worker Code Files:**
- ✅ `cloudflare-worker-proxy.js` - Best version (USE THIS)
- ⚠️ `cloudflare-worker/worker.js` - Older version (simpler)

**HTML Files (need correct URL):**
- `ai-tutor-live.html` - Line 272
- `smc-counselor.html` - Line 315

**Current API Key:**
- ✅ Created: Feb 20, 2026
- ❌ Last Used: Never
- ⚠️ This means the worker never successfully called the API

---

## Need Help?

If you get stuck, let me know:
1. What error you see in Cloudflare logs
2. What the actual worker URL is
3. Any error messages from the browser console
