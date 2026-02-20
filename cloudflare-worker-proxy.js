// Cloudflare Worker - Secure Proxy for AI Statistics Tutor & Academic Counselor
// Deployed at: https://stats-tutor-api.sofiadabagh383.workers.dev

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// CORS headers - allows requests from your GitHub Pages site
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://sdabagh.github.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Tutor system prompts for different scaffolding levels
const TUTOR_PROMPTS = {
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

// Academic Counselor system prompt
const COUNSELOR_PROMPT = `You are an AI Academic Counselor helping Santa Monica College (SMC) students with course planning, transfer advising, and academic guidance. You are warm, supportive, and knowledgeable about community college academic advising.

IMPORTANT LIMITATIONS:
- You are an AI assistant, NOT an official SMC counselor
- Always recommend students verify critical decisions with an official SMC counselor
- Do not make promises about specific admission outcomes
- When unsure about specific policies, say so honestly and direct students to smc.edu or the Counseling Center

YOUR KNOWLEDGE BASE:

SMC MATH/STATS COURSE SEQUENCE:
- Math 81 -> Math 20 -> Math 26 -> Math 28 (developmental to college level)
- Math 4 (College Algebra) or Math 4C - prerequisite for many STEM paths
- Math 54 (Introductory Statistics) - required for many transfer majors
- Math 7 (Calculus I) -> Math 8 (Calculus II) -> Math 11 (Calculus III) for STEM
- Math 54 satisfies the statistics requirement for UC and CSU transfer

UC TRANSFER INFORMATION:
- UC TAG (Transfer Admission Guarantee) available at 6 UC campuses (not UCLA or UC Berkeley)
- Minimum 30 transferable semester units, minimum 3.0 GPA for TAG (varies by campus)
- IGETC (Intersegmental General Education Transfer Curriculum) satisfies lower-division GE for most UC/CSU majors
- Assist.org is the official resource for course-to-course articulation
- Students should complete major preparation courses listed on Assist.org

CSU TRANSFER INFORMATION:
- CSU GE-Breadth is an alternative to IGETC for CSU-bound students
- ADT (Associate Degree for Transfer) guarantees CSU admission (not to specific campus)
- AA-T and AS-T degrees available at SMC

GENERAL ADVISING:
- Encourage students to see an official counselor for an official Student Education Plan (SEP)
- Recommend checking Assist.org for specific course articulation
- Suggest students apply through the California Community College Application
- Emphasize the importance of maintaining good academic standing
- Encourage use of student support services: tutoring, EOPS, Guardian Scholars, etc.

COMMUNICATION STYLE:
- Be warm, encouraging, and patient - many students are first-generation
- Use simple, clear language - avoid jargon unless explaining it
- Break complex processes (like transfer) into clear steps
- Celebrate student goals and validate their efforts
- Be culturally sensitive - SMC has a very diverse student body
- When listing requirements, use bullet points for clarity
- Always end responses by asking if the student has follow-up questions

RESPONSE FORMAT:
- Keep responses focused and organized
- Use bullet points and numbered lists for clarity
- Bold key terms and deadlines when relevant
- Include specific resource links (smc.edu, assist.org) when helpful
- If a question is outside your knowledge, be honest and direct the student to the appropriate office`;

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

      // Determine mode: 'tutor' (default) or 'counselor'
      const mode = body.mode || 'tutor';
      let systemPrompt;
      let maxTokens;

      if (mode === 'counselor') {
        systemPrompt = COUNSELOR_PROMPT;
        maxTokens = 2048;
      } else {
        // Default: tutor mode (backward compatible)
        const scaffoldingLevel = body.scaffoldingLevel || 1;
        systemPrompt = TUTOR_PROMPTS[scaffoldingLevel] || TUTOR_PROMPTS[1];
        maxTokens = 1024;
      }

      // Log request for research (optional)
      console.log('AI Request:', {
        timestamp: new Date().toISOString(),
        mode,
        scaffoldingLevel: mode === 'tutor' ? (body.scaffoldingLevel || 1) : 'N/A',
        messageLength: body.message.length
      });

      // Call Anthropic API with encrypted key from environment
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: maxTokens,
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
      console.log('AI Response:', {
        timestamp: new Date().toISOString(),
        mode,
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
