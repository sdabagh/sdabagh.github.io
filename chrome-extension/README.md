# MAT300 Grading Assistant Chrome Extension

AI-powered discussion grading assistant for Canvas SpeedGrader using Claude API.

## What This Does

This Chrome extension helps you grade MAT300 (Intermediate Algebra) discussion posts in Canvas using AI. It:

1. **Extracts** student discussion content from Canvas SpeedGrader
2. **Grades** the discussion using Claude AI based on your rubric (100 points)
3. **Provides** detailed feedback and reasoning for each score
4. **Applies** grades back to Canvas with one click

## Grading Rubric (100 points)

| Category | Max Points | AI-Graded? |
|----------|------------|------------|
| 1. Comprehensive Initial Post | 45 pts | ✅ Yes |
| 2. Comprehensive Peer Responses | 35 pts | ✅ Yes |
| 3. Clarity and Mechanics | 10 pts | ✅ Yes |
| 4. Participation Guidelines | 5 pts | ⚠️ Manual (requires timestamps) |
| 5. Timeliness | 5 pts | ⚠️ Manual (requires timestamps) |
| **Total** | **100 pts** | **90 pts AI + 10 pts manual** |

**Note**: The AI can grade content quality (90 pts) but cannot assess participation patterns or timeliness without access to post timestamps. You'll need to manually verify these two categories.

## Quick Start

### 1. Deploy the Cloudflare Worker

The extension needs a Cloudflare Worker to securely call the Claude API.

**Deploy in 3 minutes:**

1. Go to https://dash.cloudflare.com (create free account if needed)
2. Click "Workers & Pages" → "Create Application" → "Create Worker"
3. Name it `mat300-grader` and click "Deploy"
4. Click "Edit Code"
5. Copy ALL code from `/cloudflare-worker-grader.js` and paste it
6. Click "Save and Deploy"
7. Copy your worker URL (e.g., `https://mat300-grader.your-name.workers.dev`)

📖 **Detailed instructions**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

### 2. Install the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder from this repository

### 3. Configure the Extension

1. Click the extension icon in your Chrome toolbar
2. Enter your **Anthropic API Key** (get one at https://console.anthropic.com)
3. Enter your **Worker URL** from Step 1
4. Click "Save Key" and "Save URL"

### 4. Test It!

**Option A: Use the test page**
- Open `test-worker.html` in your browser
- Enter your worker URL and API key
- Click "Test Worker" to verify it's working

**Option B: Try it in Canvas**
- Navigate to any Canvas SpeedGrader page
- Click the extension icon
- Click "Extract Discussion"
- Click "Grade with AI"

## How to Use

### In Canvas SpeedGrader:

1. **Navigate** to Canvas SpeedGrader for a discussion assignment
   - The URL should contain `instructure.com` and `speed_grader`

2. **Click** the extension icon (📊 in toolbar)

3. **Extract** the discussion:
   - Click "📥 Extract Discussion"
   - Review the student's content

4. **Grade** with AI:
   - Click "🤖 Grade with AI"
   - Wait 5-10 seconds for Claude to analyze

5. **Review** the AI's grading:
   - Read the reasoning for each score
   - Adjust any scores if needed using the dropdowns
   - Edit the feedback comment if desired

6. **Verify** manual categories:
   - Check "Participation Guidelines" (posted on 2+ days, replied to instructor)
   - Check "Timeliness" (first post by Wednesday)
   - Update scores to 5 pts if criteria met

7. **Apply** to Canvas:
   - Click "✅ Apply to Canvas"
   - The total score and feedback will be inserted into SpeedGrader
   - Click "Submit" in Canvas to save the grade

## Files Overview

```
chrome-extension/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup UI
├── popup.js               # Grading logic
├── content.js             # Canvas page interaction
├── styles.css             # Extension styling
├── icons/                 # Extension icons
├── README.md              # This file
├── DEPLOYMENT.md          # Detailed deployment guide
└── test-worker.html       # Worker testing tool

cloudflare-worker-grader.js  # Cloudflare Worker code (deploy this!)
```

## Cost Breakdown

### Cloudflare Workers
- **Free tier**: 100,000 requests/day
- **Realistic usage**: ~500 gradings/week = well within free tier
- **Cost**: $0

### Claude API (Sonnet 4.5)
- **Input tokens**: ~500 tokens/grading
- **Output tokens**: ~300 tokens/grading
- **Pricing**: $3/M input, $15/M output
- **Per grading**: ~$0.006
- **Cost for 100 students**: ~$0.60

**Total cost**: Essentially free for typical course usage!

## Security & Privacy

✅ **Secure**:
- API key stored locally in Chrome (never sent to servers)
- Worker code is open source and auditable
- All communication over HTTPS
- No student data is stored or logged

⚠️ **Best Practices**:
- Set API spending limits in Anthropic console
- Don't share your API key
- Regularly rotate your API key
- Review AI feedback before submitting to students

## Troubleshooting

### Extension doesn't show grading section
- **Fix**: Make sure you're on a Canvas SpeedGrader page (URL contains `speed_grader`)

### "Failed to fetch" error
- **Fix 1**: Verify worker URL is correct (should start with `https://`)
- **Fix 2**: Test worker using `test-worker.html`
- **Fix 3**: Check Cloudflare Worker logs for errors

### "Invalid API key" error
- **Fix**: Get a new API key from https://console.anthropic.com
- **Check**: Make sure it starts with `sk-ant-`

### Grades don't populate correctly
- **Fix**: Check browser console (F12) for JavaScript errors
- **Fix**: Make sure worker code is the latest version

### AI grades seem inconsistent
- **Note**: AI grading can vary slightly between requests
- **Best practice**: Always review and adjust scores before applying to Canvas
- **Tip**: Use the AI feedback as a starting point, not final authority

## Customization

### Modify the Rubric

To change scoring criteria or point values:

1. Edit `cloudflare-worker-grader.js`:
   - Update the `GRADING_SYSTEM_PROMPT` section
   - Modify point values and criteria

2. Edit `popup.html`:
   - Update the `<select>` options to match new point values
   - Update section headings and labels

3. Edit `popup.js`:
   - Update `populateGradingResults()` if you add/remove categories
   - Update `updateTotalScore()` to match new total

4. Re-deploy the worker (copy updated code to Cloudflare Dashboard)

### Change the AI Model

To use a different Claude model:

1. Edit `cloudflare-worker-grader.js`
2. Find the line: `model: 'claude-sonnet-4-5-20250929'`
3. Change to:
   - `claude-opus-4-6` (more capable, slower, more expensive)
   - `claude-haiku-4-5-20251001` (faster, cheaper, less detailed)

## Limitations

❌ **What the AI CANNOT do**:
- Determine if posts were made on different days (no timestamp access)
- Verify if student replied to instructor feedback
- Check if first post was by Wednesday
- Access any Canvas data beyond the visible discussion text

✅ **What the AI CAN do**:
- Assess quality and depth of initial post
- Evaluate peer response substance and engagement
- Check grammar, mechanics, and clarity
- Provide constructive feedback

**Bottom line**: Use AI for content assessment (90 pts), manually verify timing/participation (10 pts).

## Support

- **Deployment help**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Test the worker**: Use `test-worker.html`
- **Check logs**: Cloudflare Dashboard → Workers → Logs
- **Browser console**: Press F12 to see JavaScript errors

## License

This extension is part of Safaa Dabagh's MAT300 teaching materials.

For personal and educational use only.

---

**Created by**: Safaa Dabagh, Santa Monica College
**Course**: MAT300 - Intermediate Algebra
**Last Updated**: February 2026
