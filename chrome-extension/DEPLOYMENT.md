# MAT300 Grading Assistant - Deployment Guide

This guide explains how to deploy the Cloudflare Worker for the MAT300 Grading Assistant Chrome Extension.

## Prerequisites

- Cloudflare account (free tier works!)
- Anthropic API key (get one at https://console.anthropic.com)

## Step 1: Deploy the Cloudflare Worker

### Option A: Using Cloudflare Dashboard (Easiest)

1. **Log in to Cloudflare**:
   - Go to https://dash.cloudflare.com
   - Sign in or create a free account

2. **Navigate to Workers & Pages**:
   - Click "Workers & Pages" in the left sidebar
   - Click "Create Application"
   - Choose "Create Worker"

3. **Create the Worker**:
   - Give it a name: `mat300-grader` (or any name you prefer)
   - Click "Deploy"

4. **Replace the Code**:
   - After deployment, click "Edit Code"
   - Delete all default code
   - Copy and paste the entire contents of `/cloudflare-worker-grader.js`
   - Click "Save and Deploy"

5. **Copy the Worker URL**:
   - Your worker URL will be: `https://mat300-grader.YOUR-SUBDOMAIN.workers.dev`
   - Copy this URL - you'll need it for the Chrome extension

### Option B: Using Wrangler CLI (Advanced)

1. **Install Wrangler**:
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Create wrangler.toml** (in the cloudflare-worker-grader directory):
   ```toml
   name = "mat300-grader"
   main = "cloudflare-worker-grader.js"
   compatibility_date = "2024-01-01"

   [env.production]
   ```

4. **Deploy**:
   ```bash
   wrangler deploy cloudflare-worker-grader.js
   ```

## Step 2: Configure the Chrome Extension

1. **Install the Extension**:
   - Open Chrome
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `/chrome-extension` folder

2. **Configure API Settings**:
   - Click the extension icon in Chrome toolbar
   - In the "Configuration" section:
     - **Anthropic API Key**: Paste your API key (starts with `sk-ant-`)
     - Click "Save Key"
     - **Cloudflare Worker URL**: Paste your worker URL from Step 1
     - Click "Save URL"

3. **Verify Configuration**:
   - You should see success messages for both saves
   - The extension is now ready to use!

## Step 3: Use the Extension

1. **Open Canvas SpeedGrader**:
   - Navigate to any Canvas course
   - Open SpeedGrader for a discussion assignment
   - The grading section will appear in the extension popup

2. **Extract Discussion**:
   - Click "Extract Discussion" to load the student's post
   - Review the extracted content

3. **Grade with AI**:
   - Click "Grade with AI"
   - Claude will analyze the discussion and provide scores
   - Review and adjust scores as needed

4. **Apply to Canvas**:
   - Click "Apply to Canvas" to insert grades into SpeedGrader
   - Manually verify Participation and Timeliness categories
   - Save the grade in Canvas

## Troubleshooting

### "Failed to fetch" Error

**Cause**: The worker URL is incorrect or CORS is blocking the request

**Solutions**:
1. Verify the worker URL is correct (should start with `https://`)
2. Check that the worker is deployed and accessible
3. Try accessing the worker URL directly in your browser (should return a "Method not allowed" error for GET requests)

### "Invalid API key format" Error

**Cause**: The API key doesn't start with `sk-ant-`

**Solution**: Get a valid API key from https://console.anthropic.com

### "API request failed: 401" Error

**Cause**: The API key is invalid or expired

**Solution**: Generate a new API key and update the configuration

### Extension not showing grading section

**Cause**: Not on a Canvas SpeedGrader page

**Solution**: Navigate to a Canvas SpeedGrader page (URL should contain `instructure.com` and `speed_grader`)

### Grading results don't populate

**Cause**: The worker response format doesn't match expectations

**Solution**: Check browser console (F12) for errors and verify worker is using the latest code

## Cost Estimation

- **Cloudflare Workers**: Free tier includes 100,000 requests/day (more than enough!)
- **Claude API**:
  - Input: ~500 tokens per grading request
  - Output: ~300 tokens per grading response
  - Claude Sonnet 4.5: $3 per million input tokens, $15 per million output tokens
  - **Estimated cost**: ~$0.005 per grading (~$5 for 1000 student discussions)

## Security Notes

- Your API key is stored locally in Chrome (never sent to Cloudflare's servers)
- The worker receives your API key with each request but doesn't store it
- All communication is encrypted (HTTPS)
- Consider setting API spending limits in the Anthropic console

## Advanced: Rate Limiting (Optional)

If you want to add rate limiting to prevent abuse:

1. In Cloudflare Dashboard, go to your worker
2. Click "Settings" → "Variables"
3. Add rate limiting logic to the worker code (example below)

```javascript
// Add at the top of the worker
const RATE_LIMIT = 10; // requests per minute
const rateLimitCache = new Map();

// Add before calling Anthropic API
const clientId = request.headers.get('CF-Connecting-IP');
const now = Date.now();
const requests = rateLimitCache.get(clientId) || [];
const recentRequests = requests.filter(t => now - t < 60000);

if (recentRequests.length >= RATE_LIMIT) {
  return new Response(JSON.stringify({
    error: 'Rate limit exceeded. Please wait a minute.'
  }), {
    status: 429,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

recentRequests.push(now);
rateLimitCache.set(clientId, recentRequests);
```

## Support

If you encounter issues:

1. Check the browser console (F12) for error messages
2. Check the Cloudflare Worker logs (Dashboard → Workers → your-worker → Logs)
3. Verify all configuration settings
4. Ensure you have a valid Anthropic API key with available credits

## Updates

To update the worker after making changes:

1. Edit `cloudflare-worker-grader.js` locally
2. Go to Cloudflare Dashboard → Workers → your-worker
3. Click "Edit Code"
4. Paste the updated code
5. Click "Save and Deploy"

The Chrome extension will automatically use the updated worker code (no need to reload the extension).
