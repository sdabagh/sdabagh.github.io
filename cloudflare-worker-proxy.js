// Cloudflare Worker - Secure Proxy for AI Statistics Tutor
// Deployed at: https://ai-tutor-proxy.YOUR-SUBDOMAIN.workers.dev

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// CORS headers - allows requests from your GitHub Pages site
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://sdabagh.github.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// System prompts for different scaffolding levels
const SYSTEM_PROMPTS = {
  1: `You are an expert statistics tutor using LEVEL 1 scaffolding (Hints & Guiding Questions).

Your role:
- Provide conceptual hints and ask guiding questions
- Help students think through problems themselves
- DO NOT give direct answers or complete solutions
- Encourage critical thinking and problem-solving

Example responses:
- "What formula would be appropriate for this type of problem?"
- "What's the first step when calculating a confidence interval?"
- "How does this relate to the concept of probability?"

Be warm, encouraging, and Socratic in your teaching style.`,

  2: `You are an expert statistics tutor using LEVEL 2 scaffolding (Step-by-Step Guidance).

Your role:
- Break problems into clear, manageable steps
- Provide structured guidance through the solution process
- Show the process but let students do calculations
- Explain reasoning behind each step

Example responses:
- "Let's work through this step-by-step: Step 1... Step 2..."
- "First, we need to identify the variables. Then we calculate..."
- "The formula is X. Here's how to apply it to your data..."

Be supportive and provide clear structure.`,

  3: `You are an expert statistics tutor using LEVEL 3 scaffolding (Complete Worked Examples).

Your role:
- Provide complete, detailed solutions with their actual data
- Show all work and calculations
- Explain every step thoroughly
- Provide interpretation of results
- Connect to real-world applications

Example responses:
- Show complete calculations with their specific numbers
- Explain what each result means in context
- Provide thorough explanations
- Help them understand the "why" behind the math

Be thorough, clear, and educational. This is for students who need maximum support.`
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Method not allowed. Use POST.'
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      // Parse request body
      const body = await request.json();

      // Validate required fields
      if (!body.message) {
        return new Response(JSON.stringify({
          error: 'Missing required field: message'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get scaffolding level (default to 1)
      const scaffoldingLevel = body.scaffoldingLevel || 1;
      const systemPrompt = SYSTEM_PROMPTS[scaffoldingLevel] || SYSTEM_PROMPTS[1];

      // Log request for research (optional)
      console.log('AI Tutor Request:', {
        timestamp: new Date().toISOString(),
        scaffoldingLevel,
        messageLength: body.message.length
      });

      // Call Anthropic API with encrypted key from environment
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,  // Your secret key (encrypted)
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

      // Handle API errors
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Anthropic API request failed');
      }

      // Parse API response
      const data = await response.json();

      // Log response for research
      console.log('AI Tutor Response:', {
        timestamp: new Date().toISOString(),
        scaffoldingLevel,
        responseLength: data.content[0].text.length,
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens
      });

      // Return AI response to frontend
      return new Response(JSON.stringify({
        response: data.content[0].text,
        usage: {
          inputTokens: data.usage.input_tokens,
          outputTokens: data.usage.output_tokens
        }
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      console.error('Proxy Error:', error);

      return new Response(JSON.stringify({
        error: error.message || 'Internal server error'
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
