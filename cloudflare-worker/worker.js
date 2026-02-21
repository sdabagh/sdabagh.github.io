/**
 * Cloudflare Worker for AI Statistics Tutor & Academic Counselor
 * Handles requests from:
 * - ai-tutor-live.html (statistics tutor with adaptive scaffolding)
 * - smc-counselor.html (SMC academic counseling)
 */

export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: getCORSHeaders(),
      });
    }

    try {
      // Parse request body
      const body = await request.json();
      const { message, scaffoldingLevel, mode } = body;

      // Validate input
      if (!message || typeof message !== 'string') {
        return new Response(JSON.stringify({ error: 'Invalid message' }), {
          status: 400,
          headers: getCORSHeaders(),
        });
      }

      // Check if API key is configured
      if (!env.ANTHROPIC_API_KEY) {
        console.error('ANTHROPIC_API_KEY not configured');
        return new Response(
          JSON.stringify({ error: 'Server configuration error' }),
          {
            status: 500,
            headers: getCORSHeaders(),
          }
        );
      }

      // Determine system prompt based on mode and scaffolding level
      const systemPrompt = getSystemPrompt(mode, scaffoldingLevel);

      // Call Claude API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: message,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API error:', errorText);
        return new Response(
          JSON.stringify({
            error: 'AI service temporarily unavailable',
          }),
          {
            status: 502,
            headers: getCORSHeaders(),
          }
        );
      }

      const data = await response.json();
      const aiResponse = data.content[0].text;

      // Return successful response
      return new Response(
        JSON.stringify({
          response: aiResponse,
          scaffoldingLevel: scaffoldingLevel || 1,
        }),
        {
          status: 200,
          headers: getCORSHeaders(),
        }
      );
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({
          error: 'An unexpected error occurred',
        }),
        {
          status: 500,
          headers: getCORSHeaders(),
        }
      );
    }
  },
};

/**
 * Get system prompt based on mode and scaffolding level
 */
function getSystemPrompt(mode, scaffoldingLevel) {
  // Academic Counselor mode
  if (mode === 'counselor') {
    return `You are an AI academic counselor for Santa Monica College (SMC) students. Help with:

- Course selection and scheduling
- Transfer planning to UC and CSU systems (UC TAG, IGETC requirements)
- Math course sequences (Math 20, 28, 31, 7, 8, 54, etc.)
- Associate Degree for Transfer (ADT) programs
- General education requirements
- Prerequisites and corequisites

Important guidelines:
- Always remind students that you're an AI assistant, not an official counselor
- Encourage students to verify information with the SMC Counseling Center
- Be specific about SMC course numbers when applicable
- Provide helpful, actionable advice
- Be warm and supportive

Keep responses clear and organized. Use bullet points where appropriate.`;
  }

  // Statistics Tutor mode with adaptive scaffolding
  const level = scaffoldingLevel || 1;

  if (level === 1) {
    // Level 1: Hints and Socratic questioning
    return `You are an encouraging statistics tutor using Socratic questioning. When students ask questions:

- Give minimal hints, not complete answers
- Ask guiding questions to help them think through the problem
- Encourage them to work through it themselves
- Never solve the problem directly
- Be warm, patient, and supportive
- Help them discover the answer on their own

Keep responses concise (2-3 short paragraphs maximum).`;
  } else if (level === 2) {
    // Level 2: Guided step-by-step instruction
    return `You are a helpful statistics tutor providing guided instruction. When students ask questions:

- Break down the solution into clear, logical steps
- Explain what to do in each step without doing all the work for them
- Give examples of how to approach each step
- Check their understanding along the way
- Provide frameworks they can apply to similar problems

Keep responses focused and well-organized. Use numbered steps or bullet points.`;
  } else {
    // Level 3: Complete worked examples
    return `You are an expert statistics tutor providing complete worked examples. When students ask questions:

- Provide full step-by-step solutions with detailed explanations
- Show all calculations and mathematical reasoning
- Explain why each step is necessary
- Include the final answer with clear interpretation
- Help them understand the underlying concepts

Use clear formatting with numbered steps. Show your work completely and thoroughly.`;
  }
}

/**
 * Get CORS headers for allowing requests from GitHub Pages
 */
function getCORSHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://sdabagh.github.io',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

/**
 * Handle CORS preflight requests
 */
function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: getCORSHeaders(),
  });
}
