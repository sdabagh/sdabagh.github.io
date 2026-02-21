// Cloudflare Worker - MAT300 Discussion Grading Assistant
// Handles AI-powered grading for Canvas SpeedGrader Chrome Extension

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Allowed origins for CORS (Chrome extension and development)
const ALLOWED_ORIGINS = [
  'https://sdabagh.github.io'
  // Chrome extensions will be handled separately
];

// Function to get CORS headers based on request origin
function getCorsHeaders(origin) {
  // Allow Chrome extension origins
  if (origin && origin.startsWith('chrome-extension://')) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
  }

  // Allow GitHub Pages
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// MAT300 Discussion Grading Rubric System Prompt
const GRADING_SYSTEM_PROMPT = `You are an expert grader for MAT300 (Intermediate Algebra) discussion posts at Santa Monica College. You grade discussions based on a specific rubric with five categories:

**RUBRIC BREAKDOWN (100 points total):**

**1. Comprehensive Initial Post (45 points)**
- Exemplary (45 pts): Exceptionally thorough, insightful analysis; demonstrates deep understanding; well-organized with clear mathematical reasoning; makes meaningful connections
- Accomplished (40 pts): Thorough response showing solid understanding; well-organized; addresses all key components; clear mathematical reasoning
- Developing (35 pts): Adequate response with moderate understanding; addresses most components but may lack depth; some organizational issues
- Beginning (25 pts): Minimal effort; surface-level understanding; missing key components; lacks organization or clarity
- Deficient (0 pts): No initial post or completely off-topic

**2. Comprehensive Peer Responses (35 points)**
- Exemplary (35 pts): Two+ substantive responses that extend discussion; build on peers' ideas; demonstrate engagement and critical thinking; ask thought-provoking questions
- Accomplished (30 pts): Two adequate responses showing engagement; contribute meaningfully to discussion; demonstrate understanding
- Developing (20 pts): Two basic responses with minimal engagement; surface-level comments; may lack substance
- Beginning (10 pts): Only one response, or two very brief/superficial responses
- Deficient (0 pts): No peer responses or completely off-topic

**3. Clarity and Mechanics (10 points)**
- Exemplary (10 pts): Professional, error-free writing; proper grammar, spelling, punctuation; well-formatted
- Accomplished (6 pts): Generally professional with minor errors; good organization
- Deficient (0 pts): Significant errors affecting clarity; very poor mechanics

**4. Participation Guidelines (5 points)**
- Full Marks (5 pts): Posted on 2+ different days AND replied to instructor feedback
- No Marks (0 pts): All posts on same day OR did not reply to instructor

**5. Timeliness (5 points)**
- Full Marks (5 pts): First post submitted by Wednesday
- No Marks (0 pts): First post submitted after Wednesday

**YOUR TASK:**
Given a student's discussion post content, provide:
1. A score for each category (choose the exact point value from the rubric)
2. Detailed reasoning for each score (2-3 sentences explaining why this level was chosen)
3. Overall feedback comment for Canvas

**IMPORTANT NOTES:**
- For categories 4 and 5 (Participation and Timeliness), you CANNOT determine these from the discussion text alone
- Always assign 0 pts for Participation and Timeliness with a note that instructor must verify manually
- Focus your grading on categories 1-3 which can be assessed from the content

**RESPONSE FORMAT (JSON):**
{
  "scores": {
    "initialPost": <45|40|35|25|0>,
    "peerResponses": <35|30|20|10|0>,
    "clarity": <10|6|0>,
    "participation": 0,
    "timeliness": 0
  },
  "reasoning": {
    "initialPost": "Detailed explanation for initial post score...",
    "peerResponses": "Detailed explanation for peer responses score...",
    "clarity": "Detailed explanation for clarity/mechanics score...",
    "participation": "⚠️ Cannot assess from content. Instructor must verify: Posted on 2+ days AND replied to instructor.",
    "timeliness": "⚠️ Cannot assess from content. Instructor must verify: First post by Wednesday."
  },
  "feedbackComment": "Overall feedback comment for Canvas. Start with positive aspects, then constructive suggestions. Include the AI-assessed total (/90 pts) and note that participation/timeliness need manual verification."
}

**GRADING GUIDELINES:**
- Be fair, consistent, and objective
- Look for evidence of mathematical understanding, not just correctness
- Value effort and engagement
- Consider the context of intermediate algebra (not expecting advanced concepts)
- Provide constructive feedback that helps students improve
- Be encouraging while maintaining academic standards
- If content is missing (e.g., no peer responses), assign 0 for that category`;

export default {
  async fetch(request, env) {
    // Get request origin for CORS
    const origin = request.headers.get('Origin');
    const corsHeaders = getCorsHeaders(origin);

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
      if (!body.discussion) {
        return new Response(JSON.stringify({
          error: 'Missing required field: discussion'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!body.apiKey) {
        return new Response(JSON.stringify({
          error: 'Missing required field: apiKey'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate API key format
      if (!body.apiKey.startsWith('sk-ant-')) {
        return new Response(JSON.stringify({
          error: 'Invalid API key format'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate discussion structure
      const { studentName, discussionTitle, content } = body.discussion;
      if (!content || typeof content !== 'string') {
        return new Response(JSON.stringify({
          error: 'Invalid discussion content'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Prepare user message with discussion content
      const userMessage = `Please grade the following discussion post:

**Student:** ${studentName || 'Unknown'}
**Discussion:** ${discussionTitle || 'Untitled'}

**Discussion Content:**
${content}

Provide grading in JSON format as specified in the rubric.`;

      // Log request for debugging
      console.log('Grading Request:', {
        timestamp: new Date().toISOString(),
        student: studentName || 'Unknown',
        discussion: discussionTitle || 'Untitled',
        contentLength: content.length
      });

      // Call Anthropic API using the provided API key
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': body.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 2048,
          system: GRADING_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: userMessage
            }
          ]
        })
      });

      // Handle API errors
      if (!response.ok) {
        const error = await response.json();
        console.error('Anthropic API Error:', error);
        throw new Error(error.error?.message || 'Anthropic API request failed');
      }

      // Parse API response
      const data = await response.json();
      const aiResponse = data.content[0].text;

      // Log response for debugging
      console.log('Grading Response:', {
        timestamp: new Date().toISOString(),
        responseLength: aiResponse.length,
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens
      });

      // Try to extract JSON from response (Claude might wrap it in markdown)
      let gradingResult;
      try {
        // Remove markdown code blocks if present
        let jsonText = aiResponse.trim();
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '').trim();
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '').trim();
        }

        gradingResult = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        // If JSON parsing fails, return raw response
        gradingResult = {
          error: 'Failed to parse grading response',
          raw_response: aiResponse
        };
      }

      // Return grading results in the format expected by the extension
      return new Response(JSON.stringify(gradingResult), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      console.error('Grading Worker Error:', error);

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
