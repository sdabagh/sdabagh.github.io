# Cloudflare Worker for AI Tutors

This Worker powers both AI tutor interfaces:
- **AI Statistics Tutor** (`ai-tutor-live.html`) - Adaptive scaffolding for statistics
- **AI Academic Counselor** (`smc-counselor.html`) - SMC course planning

## Deployment Instructions

### Prerequisites
- Cloudflare account (free tier is fine)
- Anthropic API key ([get one here](https://console.anthropic.com))
- Node.js installed on your computer

### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open your browser to authenticate.

### Step 3: Deploy the Worker

Navigate to this directory and deploy:

```bash
cd cloudflare-worker
wrangler deploy
```

### Step 4: Add Your API Key as a Secret

**IMPORTANT**: Never commit your API key to git!

```bash
wrangler secret put ANTHROPIC_API_KEY
```

When prompted, paste your Anthropic API key and press Enter.

### Step 5: Test the Worker

Your worker should now be live at:
```
https://stats-tutor-api.sdabagh-stats.workers.dev
```

Test it with curl:

```bash
curl -X POST https://stats-tutor-api.sdabagh-stats.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the mean?", "scaffoldingLevel": 1}'
```

You should get a JSON response with an AI-generated answer.

## How It Works

### Tutor Mode (Default)
- **Level 1**: Socratic hints, no direct answers
- **Level 2**: Guided step-by-step instruction
- **Level 3**: Complete worked examples

The HTML page automatically escalates scaffolding levels based on student attempts.

### Counselor Mode
Activated by passing `"mode": "counselor"` in the request body.
Provides SMC-specific academic advising.

## Monitoring

- **Dashboard**: https://dash.cloudflare.com/
- **Analytics**: View requests, errors, and performance
- **Logs**: Use `wrangler tail` to see live logs

## Cost Estimates

**Cloudflare Workers**: Free (up to 100,000 requests/day)

**Anthropic API** (Claude 3.5 Sonnet):
- ~$0.005 per student question (half a cent)
- 100 students × 10 questions = $5
- Monthly estimate for moderate use: ~$25

## Updating the Worker

Make changes to `worker.js`, then:

```bash
wrangler deploy
```

No need to re-add secrets unless you're changing them.

## Troubleshooting

### "API key not configured" error
Run: `wrangler secret put ANTHROPIC_API_KEY`

### CORS errors in browser
Check that `Access-Control-Allow-Origin` matches your GitHub Pages domain.

### Worker not found
Verify the URL matches what's in your HTML files.

## Support

- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/
- Anthropic API Docs: https://docs.anthropic.com/
