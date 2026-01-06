# Setting Up Secure Backend Proxy for AI Tutor

## Why You Need This

Canvas blocks direct API calls to Anthropic. Also, **NEVER put your API key in browser code** - anyone can see it and use it!

## Solution: Cloudflare Workers (Free Proxy)

### Step 1: Create Cloudflare Account

1. Go to https://workers.cloudflare.com/
2. Sign up (free plan - 100,000 requests/day)
3. Verify your email

### Step 2: Create a Worker

1. Click **"Create a Worker"**
2. Replace the code with the code below
3. Click **"Save and Deploy"**

### Step 3: Add Your API Key Securely

1. In the Worker dashboard, go to **Settings** → **Variables**
2. Click **"Add variable"**
3. Name: `ANTHROPIC_API_KEY`
4. Value: Your actual API key (paste here)
5. Check **"Encrypt"** ✅
6. Click **"Save"**

### Step 4: Get Your Worker URL

After deployment, you'll get a URL like:
```
https://ai-tutor-proxy.YOUR-SUBDOMAIN.workers.dev
```

Copy this URL - you'll use it in the AI tutor.

---

## Cloudflare Worker Code

```javascript
// Cloudflare Worker - Secure Proxy for Anthropic API
// This keeps your API key secret and allows Canvas to work

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// CORS headers to allow requests from your website
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://sdabagh.github.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders
      });
    }

    try {
      // Get request body (user message, scaffolding level, etc.)
      const body = await request.json();

      // Validate required fields
      if (!body.message || !body.scaffoldingLevel) {
        return new Response(JSON.stringify({
          error: 'Missing required fields: message, scaffoldingLevel'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // System prompts for different scaffolding levels
      const systemPrompts = {
        1: `You are an expert statistics tutor using LEVEL 1 scaffolding (Hints & Guiding Questions).

Your role:
- Provide conceptual hints and ask guiding questions
- Help students think through problems themselves
- DO NOT give direct answers or complete solutions
- Encourage critical thinking and problem-solving

Be warm, encouraging, and Socratic in your teaching style.`,

        2: `You are an expert statistics tutor using LEVEL 2 scaffolding (Step-by-Step Guidance).

Your role:
- Break problems into clear, manageable steps
- Provide structured guidance through the solution process
- Show the process but let students do some work
- Explain reasoning behind each step

Be supportive and provide clear structure.`,

        3: `You are an expert statistics tutor using LEVEL 3 scaffolding (Complete Worked Examples).

Your role:
- Provide complete, detailed solutions
- Show all work and calculations
- Explain every step thoroughly
- Use their specific data and numbers
- Provide interpretation of results

Be thorough, clear, and educational.`
      };

      // Get system prompt based on scaffolding level
      const systemPrompt = systemPrompts[body.scaffoldingLevel] || systemPrompts[1];

      // Call Anthropic API with YOUR secret key (stored in environment)
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,  // Secret key from environment
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: body.message
            }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }

      const data = await response.json();

      // Return AI response to frontend
      return new Response(JSON.stringify({
        response: data.content[0].text,
        usage: data.usage  // Track token usage for research
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  }
};
```

---

## Step 5: Update the AI Tutor HTML

After deploying your worker, I'll update `ai-tutor-live.html` to use your proxy URL instead of calling Anthropic directly.

---

## Security Benefits

✅ API key is encrypted on Cloudflare's servers
✅ Key never exposed in browser
✅ Only your website can call the proxy (CORS protection)
✅ You can monitor all requests
✅ Works perfectly in Canvas iframe

## Cost

- **Cloudflare Workers:** FREE (100k requests/day)
- **Anthropic API:** Pay per use (~$0.10 per tutoring session)

---

## Next Steps

1. ✅ Revoke the exposed API key
2. ✅ Set up Cloudflare Worker with the code above
3. ✅ Add your API key to Worker environment (encrypted)
4. ✅ Get your Worker URL
5. ✅ Tell me the URL and I'll update the AI tutor code

---

**Questions? Let me know!**
