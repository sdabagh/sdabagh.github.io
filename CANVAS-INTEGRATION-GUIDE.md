# Canvas Integration Guide: AI Statistics Tutor

**For Winter 2026 Intro Stats Course**

This guide explains multiple ways to integrate your AI tutor into Canvas LMS for your Math 54 course.

---

## Quick Start (5 Minutes) ⚡

The **fastest** way to get your tutor in Canvas:

### Method 1: Add to Module Welcome Page

1. In Canvas, go to your **Modules**
2. Click **+ Add** and create a page called "AI Tutor - Get Help"
3. Click the **HTML Editor** button (`</>`)
4. Copy the contents of `canvas-tutor-embed-template.html` from your repository
5. Paste it into the HTML editor
6. Click **Save & Publish**

**Done!** Students can now access the tutor from any module.

---

## All Integration Options

### Option 1: Embed in Canvas Pages (RECOMMENDED)

**Best for:** Making tutor available throughout course content

**Steps:**

1. Edit any Canvas page (or create new pages like "Module 1 Help")
2. Click **HTML Editor** (`</>` icon in toolbar)
3. Add this code:

```html
<h2>Need Help? Ask the AI Tutor</h2>

<iframe
    src="https://sdabagh.github.io/ai-tutor/chat-interface.html"
    width="100%"
    height="700px"
    style="border: 2px solid #2C5F7C; border-radius: 8px;"
    title="AI Statistics Tutor"
></iframe>
```

4. Switch back to **Rich Content Editor**
5. Save and publish

**Pros:**
- Students see tutor without leaving Canvas
- Works immediately, no setup needed
- Can embed in multiple pages (module overviews, assignment instructions, etc.)
- Full tutor functionality

**Cons:**
- Fixed height (students scroll within iframe)
- Takes up vertical space on page

**Where to embed:**
- Module overview pages
- Assignment instructions (for context-specific help)
- "Getting Help" section of syllabus page
- Quiz review pages

---

### Option 2: Popup Button (Least Intrusive)

**Best for:** Adding help buttons throughout course without taking up space

**Steps:**

1. In any Canvas page, click **HTML Editor**
2. Add this code where you want the button:

```html
<div style="background: #F0F7FB; border-left: 4px solid #2C5F7C;
            padding: 15px; margin: 20px 0; border-radius: 4px;">
    <h3 style="margin-top: 0;">💡 Stuck? Get AI Help</h3>
    <p>Open the AI tutor for personalized guidance on this topic.</p>
    <a
        href="https://sdabagh.github.io/ai-tutor/chat-interface.html"
        target="_blank"
        onclick="window.open(this.href, 'AI Tutor',
                 'width=450,height=700,scrollbars=yes,resizable=yes');
                 return false;"
        style="display: inline-block; background: #2C5F7C; color: white;
               padding: 12px 24px; text-decoration: none; border-radius: 6px;
               font-weight: 600; cursor: pointer;"
    >
        Open AI Tutor
    </a>
</div>
```

**Pros:**
- Minimal space usage
- Popup stays accessible while students read content
- Easy to add to every page
- Students can position popup alongside course content

**Cons:**
- Popup blockers might interfere (students need to allow popups)
- Less seamless than iframe embed

**Best placement:**
- Before practice problems
- In assignment instructions
- After complex concept explanations

---

### Option 3: Add as External Tool in Navigation

**Best for:** Making tutor permanently accessible in course sidebar

**Steps:**

#### Step 1: Verify files are deployed

Make sure these files exist in your repository:
- `/ai-tutor/chat-interface.html` ✅ (exists)
- `/ai-tutor/canvas-launch.html` ✅ (just created)

Push changes to GitHub:

```bash
git add ai-tutor/canvas-launch.html canvas-tutor-embed-template.html CANVAS-INTEGRATION-GUIDE.md
git commit -m "Add Canvas integration files for AI tutor"
git push -u origin claude/embed-tutor-canvas-8iJtf
```

#### Step 2: Add External Tool in Canvas

1. Go to your Canvas course
2. Click **Settings** (in course navigation)
3. Click the **Apps** tab
4. Click **+ App** button
5. Select **Configuration Type: Manual Entry**
6. Fill in:
   - **Name:** AI Statistics Tutor
   - **Consumer Key:** (leave blank for public tool)
   - **Shared Secret:** (leave blank for public tool)
   - **Launch URL:** `https://sdabagh.github.io/ai-tutor/canvas-launch.html`
   - **Domain:** `sdabagh.github.io`
   - **Privacy:** Public (no student data needed)
   - **Custom Fields:** (leave blank)
   - **Description:** AI-powered statistics tutor with adaptive scaffolding
   - Check: ☑ "Course Navigation"
7. Click **Submit**

#### Step 3: Enable in Course Navigation

1. Still in **Settings**, click **Navigation** tab
2. Find "AI Statistics Tutor" in the list
3. Drag it up to the active navigation area
4. Position it where you want (e.g., below "Modules")
5. Click **Save** at the bottom

**Result:** Students see "AI Statistics Tutor" in the left sidebar of your course!

**Pros:**
- Always accessible from any page
- Professional integration
- Opens in full Canvas frame (not popup)
- Students don't need to hunt for it

**Cons:**
- Requires admin/instructor permissions
- One-time setup (but worth it!)

---

### Option 4: Link from Syllabus & Home Page

**Best for:** Making students aware of the tutor from day one

Add to your **Syllabus** page:

```html
<h3>📚 Getting Help</h3>

<p>This course includes an AI-powered statistics tutor with adaptive support:</p>

<ul>
    <li><strong>Available 24/7</strong> - Get help whenever you need it</li>
    <li><strong>Adaptive scaffolding</strong> - Adjusts to your learning needs</li>
    <li><strong>Three support levels</strong> - From hints to worked examples</li>
</ul>

<p>
    <a href="https://sdabagh.github.io/ai-tutor/chat-interface.html"
       target="_blank"
       style="display: inline-block; background: #2C5F7C; color: white;
              padding: 12px 24px; text-decoration: none; border-radius: 6px;
              font-weight: 600; margin: 10px 0;">
        Launch AI Tutor
    </a>
</p>

<p><em><strong>Research Note:</strong> This tutor is part of my dissertation research.
Conversations are logged anonymously. Learn more:
<a href="https://sdabagh.github.io/participate.html" target="_blank">
    Research Participation Info
</a></em></p>
```

Add to **Home Page** (Course Front Page):

```html
<div style="background: linear-gradient(135deg, #2C5F7C 0%, #3A7CA5 100%);
            color: white; padding: 25px; border-radius: 10px; margin: 20px 0;">
    <h2 style="margin-top: 0; color: white;">🤖 NEW: AI Statistics Tutor</h2>
    <p style="font-size: 16px; margin-bottom: 15px;">
        Get personalized help with adaptive AI support. Available 24/7 for all course topics.
    </p>
    <a href="https://sdabagh.github.io/ai-tutor/chat-interface.html"
       target="_blank"
       style="display: inline-block; background: white; color: #2C5F7C;
              padding: 12px 24px; text-decoration: none; border-radius: 6px;
              font-weight: 600;">
        Try the AI Tutor →
    </a>
</div>
```

---

## Recommended Setup for Winter 2026

Here's what I recommend for maximum student usage:

### Week 0 (Before Classes Start):

1. ✅ Add External Tool to course navigation (Option 3)
2. ✅ Add announcement about AI tutor on Home Page (Option 4)
3. ✅ Mention in syllabus with research consent info (Option 4)

### Throughout Semester:

4. ✅ Add popup buttons before difficult practice problems (Option 2)
5. ✅ Embed full tutor in "Module Help" pages (Option 1)
6. ✅ Include in assignment instructions for complex topics (Option 2)

### Implementation Checklist:

- [ ] Deploy `canvas-launch.html` and template to GitHub (push changes)
- [ ] Add External Tool in Canvas Settings → Apps
- [ ] Enable in Course Navigation
- [ ] Update Home Page with AI tutor announcement
- [ ] Update Syllabus with research disclosure
- [ ] Create "AI Tutor Help" page in each module (use template)
- [ ] Add popup buttons to 3-5 challenging practice problems
- [ ] Announce in first week Canvas announcement
- [ ] Demonstrate in first live session (if synchronous)

---

## Student Instructions to Share

Add this to your first week announcement:

```
Subject: NEW Resource: 24/7 AI Statistics Tutor

Hi everyone,

I'm excited to introduce a NEW resource for this course: an AI-powered
statistics tutor with adaptive cognitive scaffolding!

🤖 What is it?
An intelligent tutoring system that adjusts its support based on YOUR needs:
  • Level 1: Hints to guide your thinking
  • Level 2: Step-by-step guided questions
  • Level 3: Worked examples and detailed explanations

📍 Where to find it:
  • Click "AI Statistics Tutor" in the left sidebar
  • Look for blue "Get AI Help" buttons throughout the course
  • Direct link: https://sdabagh.github.io/ai-tutor/chat-interface.html

🎯 When to use it:
  • Stuck on a homework problem? Get a hint!
  • Confused about a concept? Ask for step-by-step help!
  • Need to see an example? Request a worked demonstration!

📊 Research Note:
This tutor is part of my dissertation research on AI in education. Your
conversations are logged anonymously to help us understand how AI can best
support statistics learning. Participation is voluntary - you can use the
tutor as much or as little as you'd like.

Questions? Ask in the discussion board or email me!

Happy learning,
Professor Dabagh
```

---

## Troubleshooting

### "The tutor won't load in Canvas"

**Solution 1:** Make sure files are pushed to GitHub and site is live:
- Visit https://sdabagh.github.io/ai-tutor/chat-interface.html directly
- If it loads, the issue is with Canvas iframe permissions

**Solution 2:** Check Canvas iframe settings:
- Canvas may block iframes from external sources
- Ask your Canvas admin to whitelist `sdabagh.github.io`

**Solution 3:** Use popup instead:
- If iframe embedding doesn't work, use Option 2 (popup buttons)
- Popups bypass iframe restrictions

### "Students say popup is blocked"

- Students need to **allow popups** from Canvas in their browser
- Chrome: Click the popup icon in address bar → "Always allow"
- Provide direct link as backup: https://sdabagh.github.io/ai-tutor/chat-interface.html

### "Tutor doesn't know which module students are in"

The tutor has a module selector at the top. Students can change it manually.

**Future enhancement:** You could pass module context via URL parameters:
```
https://sdabagh.github.io/ai-tutor/chat-interface.html?module=module-03
```

Then update `chat-interface.js` to read URL params and auto-select module.

### "How do I track student usage?"

Currently, data is logged to browser console (demo mode).

**To enable full tracking:**
1. Set up Firebase (see `/backend/firebase-setup.md` in your repo)
2. Deploy Cloud Functions (see `/backend/cloud-functions.js`)
3. Set `DEMO_MODE = false` in `chat-interface.js`
4. View analytics at `/backend/analytics-dashboard.html`

---

## Privacy & Research Compliance

### Required Disclosures

Since this is dissertation research, you MUST inform students:

1. **In Syllabus:**
   - Tutor conversations are logged anonymously
   - Data used for educational research
   - Participation is voluntary
   - Link to full research info: https://sdabagh.github.io/participate.html

2. **First Use:**
   - Privacy notice is already displayed in tutor interface footer
   - "Privacy Policy" link opens full details modal

3. **IRB Considerations:**
   - Get UCLA IRB approval before analyzing student data
   - Even though participation is voluntary, you're teaching the class
   - Consider having students opt-in via survey at start of semester
   - Store consent records separately

### Recommended Consent Process

**Week 1 Survey (Qualtrics or Google Forms):**

```
AI Tutor Research Consent

This course includes an AI-powered statistics tutor. I'm conducting
dissertation research on how adaptive AI scaffolding affects learning.

Your use of the tutor is VOLUNTARY. Your grade will NOT be affected
whether you use it or not.

If you consent, your tutor conversations will be logged anonymously
for research purposes.

Do you consent to having your tutor interactions included in research?
[ ] Yes, I consent to research participation
[ ] No, I do not consent (I can still use the tutor for learning)

[If No selected: Data will be logged but flagged to exclude from research analysis]
```

Store consent status in spreadsheet. Students can withdraw consent anytime.

---

## Testing Before Launch

Before you release to students:

1. **Test all embed methods:**
   - [ ] Open `canvas-launch.html` directly in browser
   - [ ] Test iframe embed in a test Canvas page
   - [ ] Test popup button in test page
   - [ ] Verify External Tool appears in navigation

2. **Test on different devices:**
   - [ ] Desktop Chrome
   - [ ] Desktop Safari
   - [ ] Mobile iOS (Safari)
   - [ ] Mobile Android (Chrome)
   - [ ] Canvas mobile app (if students use it)

3. **Test tutor functionality:**
   - [ ] Send test messages
   - [ ] Try each scaffolding level selector
   - [ ] Test module selector
   - [ ] Verify privacy modal opens
   - [ ] Check help modal opens
   - [ ] Test quick action buttons (Hint, Explain, Example)

4. **Verify research logging:**
   - [ ] Open browser console
   - [ ] Send a message
   - [ ] Verify `[RESEARCH LOG]` appears in console
   - [ ] Check that module, level, timestamp are logged

---

## Next Steps After Canvas Integration

Once tutor is embedded in Canvas:

### Week 1-2: Monitor Usage
- Check console logs to see if students are using it
- Ask for feedback in discussion board
- Watch for technical issues

### Week 3-4: Encourage Usage
- Announce in class: "Have you tried the AI tutor yet?"
- Show demo during live session
- Share success story: "A student asked about X and the tutor helped them understand Y"

### Mid-Semester: Collect Feedback
- Survey students:
  - How often do you use the AI tutor?
  - Which features are most helpful?
  - What would make it better?
  - Does it help you learn?

### End of Semester: Research Analysis
- Export all logged data
- Analyze scaffolding effectiveness
- Correlate usage with exam performance
- Write up findings for dissertation Chapter 4

---

## Support & Questions

If you have issues during setup:

1. **Technical issues:** Check browser console for errors
2. **Canvas integration issues:** Contact SMC Canvas admin
3. **Research questions:** Consult with advisors (Handcock/Cheng)
4. **Code changes needed:** Update in repository and redeploy

---

## Summary

**Fastest Setup (15 minutes):**
1. Push new files to GitHub
2. Copy `canvas-tutor-embed-template.html` into a new Canvas page
3. Add popup button code to 2-3 practice problem pages
4. Add announcement about AI tutor to Home Page

**Recommended Full Setup (1 hour):**
1. All of the above, PLUS:
2. Add as External Tool in course navigation
3. Update syllabus with research disclosure
4. Create "AI Tutor Help" page in each of 12 modules
5. Test on multiple devices
6. Prepare Week 1 announcement

**You're ready for Winter 2026!** 🎉

---

**Last Updated:** January 5, 2026
**Author:** Safaa Dabagh
**Purpose:** Canvas LMS integration for dissertation research platform
