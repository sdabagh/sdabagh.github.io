# Canvas AI Grader Extension - Production TODO

## 🎯 **Goal**
Prepare the Canvas AI Grader Chrome extension for sharing with SMC Math Department instructors.

---

## ✅ **Current Status**

### **Working:**
- ✅ Grading functionality is fully operational
- ✅ Cloudflare Worker processes submissions correctly
- ✅ AI feedback generation via Claude API
- ✅ Extension communicates with Worker successfully
- ✅ Grading results are accurate and helpful

### **Known Issues:**
- ❌ "View Grading" button behavior is inconsistent
  - Grading happens correctly in background
  - Button visibility/functionality needs debugging

---

## 🔧 **MUST FIX - Critical Issues**

### 1. Fix "View Grading" Button ⚠️ HIGH PRIORITY
- [ ] Add detailed console logging to trace button behavior
- [ ] Debug DOM update timing issues
- [ ] Test button across different Canvas pages/contexts
- [ ] Ensure button appears reliably after grading
- [ ] Verify button click event handlers work consistently
- [ ] Test with multiple assignments and student submissions

### 2. Comprehensive Testing
- [ ] Test with multiple assignment types (text, file uploads, etc.)
- [ ] Test with multiple students (batch grading)
- [ ] Test error scenarios:
  - [ ] Missing submissions
  - [ ] API failures (Worker down, Claude API timeout)
  - [ ] Malformed student responses
  - [ ] Network errors
- [ ] Test across different Canvas course contexts
- [ ] Verify data persistence after page reload

### 3. Error Handling & User Feedback
- [ ] Add clear error messages for common failures
- [ ] Show loading states during grading
- [ ] Handle API rate limits gracefully
- [ ] Add retry logic for transient failures
- [ ] Display helpful messages when things go wrong

---

## 📚 **SHOULD HAVE - Polish for Professional Use**

### 4. User Documentation
- [ ] **Installation Guide** (`INSTALLATION.md`)
  - Chrome extension setup (developer mode)
  - Cloudflare Worker deployment
  - API key configuration
  - Worker URL setup
- [ ] **User Manual** (`USER_GUIDE.md`)
  - How to use in Canvas SpeedGrader
  - Interpreting AI feedback
  - Customizing grading prompts
  - Troubleshooting common issues
- [ ] **Video Tutorial** (optional)
  - Screen recording showing setup and usage

### 5. Configuration & Customization
- [ ] **Settings Page** for extension
  - API key input (currently in popup)
  - Worker URL input
  - Custom grading rubrics
  - Point value configuration
  - Prompt templates for different assignment types
- [ ] **Prompt Templates** for different courses
  - Statistics assignments
  - Algebra assignments
  - Calculus assignments
  - Allow instructors to customize feedback style

### 6. Professional UI/UX Polish
- [ ] Improve button styling (consistent with Canvas design)
- [ ] Add loading spinner during grading
- [ ] Better visual feedback for success/error states
- [ ] Clean up console logging (remove debug logs in production)
- [ ] Add extension icon/branding
- [ ] Improve grading display formatting

---

## 🔒 **CRITICAL - Privacy & Security**

### 7. Data Privacy Review
- [ ] **Document data flow:**
  - What student data is sent to Claude API?
  - How long is data retained?
  - Is data encrypted in transit?
- [ ] **Privacy Policy** for instructors
  - Inform about AI processing of student work
  - FERPA compliance considerations
  - Student consent implications
- [ ] **Security Best Practices:**
  - Secure API key storage (chrome.storage.local encryption?)
  - HTTPS-only communication
  - No logging of student PII

### 8. Institutional Compliance
- [ ] Check SMC policies on AI use in grading
- [ ] Verify Canvas Terms of Service compliance
- [ ] Consider accessibility requirements (WCAG)
- [ ] Document appropriate use cases

---

## 🎁 **NICE TO HAVE - Future Enhancements**

### 9. Advanced Features (Post-Launch)
- [ ] Batch grading (grade all submissions at once)
- [ ] Grading analytics (track time saved, consistency metrics)
- [ ] Integration with Canvas gradebook (auto-post scores)
- [ ] Multi-language support
- [ ] Custom rubric builder UI
- [ ] Feedback templates library

### 10. Collaboration Features
- [ ] Share prompt templates across instructors
- [ ] Department-wide grading standards
- [ ] Feedback calibration tools

---

## 📋 **Pre-Launch Checklist**

Before sharing with Math Department Chair:

- [ ] All critical bugs fixed (especially "View Grading" button)
- [ ] Comprehensive testing completed
- [ ] Installation guide written and tested by another person
- [ ] User guide available
- [ ] Privacy/security review completed
- [ ] Demo/presentation prepared for chair
- [ ] Collect feedback from 1-2 trusted colleagues first (beta test)

---

## 🚀 **Launch Plan**

### Phase 1: Beta Testing (1-2 instructors)
- Share with trusted colleagues
- Gather feedback on usability
- Fix any issues discovered
- Refine documentation

### Phase 2: Department Presentation
- Demo to Math Department Chair
- Present benefits (time savings, consistent feedback)
- Address privacy/security questions
- Get approval for wider rollout

### Phase 3: Department Rollout
- Workshop/training session for interested instructors
- Provide installation support
- Create support channel (email, Slack, etc.)
- Monitor for issues and iterate

---

## 📝 **Notes & Context**

**Current Setup:**
- Chrome extension: `/chrome-extension/` directory
- Cloudflare Worker: Deployed and functional
- Tech Stack: Vanilla JS, Chrome Extension Manifest V3, Claude API

**Key Files:**
- `chrome-extension/content.js` - Main extension logic
- `chrome-extension/popup.html` - Settings UI
- Cloudflare Worker - Backend grading service

**Timeline:**
- Current Status: Grading works, button needs fixing
- Target: Ready for beta testing by [DATE TBD]
- Goal: Department rollout Spring 2026

---

**Last Updated:** February 22, 2026
**Status:** In Development - Button Fix Priority
**Next Session:** Debug "View Grading" button behavior
