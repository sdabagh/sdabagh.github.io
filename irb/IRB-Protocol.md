# IRB Application Materials
## AI-Powered Cognitive Scaffolding for Statistics Education

**Principal Investigator**: Safaa Dabagh
**Institution**: University of California, Los Angeles (UCLA)
**Department**: Statistics
**Degree Program**: PhD in Statistics
**Dissertation Advisors**: Prof. Mark Handcock, Prof. Guang Cheng
**Submission Date**: [To be completed]
**IRB Protocol Number**: [To be assigned]

---

## TABLE OF CONTENTS

1. Study Overview
2. Research Questions & Hypotheses
3. Background & Significance
4. Research Design & Methods
5. Participant Recruitment
6. Informed Consent Process
7. Data Collection Procedures
8. Risks & Benefits
9. Privacy & Confidentiality
10. Data Management & Security
11. Pilot Study Protocol
12. Timeline
13. Appendices

---

## 1. STUDY OVERVIEW

### 1.1 Study Title
**AI-Powered Cognitive Scaffolding for Introductory Statistics: A Mixed-Methods Study of Adaptive Learning Support**

### 1.2 Purpose
This dissertation research investigates the effectiveness of AI-powered cognitive scaffolding in supporting community college students learning introductory statistics. The study examines how adaptive, AI-delivered support at three levels (minimal hints, guided questions, and worked examples) affects learning outcomes, help-seeking behavior, and self-efficacy.

### 1.3 Study Type
- **Design**: Mixed-methods, quasi-experimental
- **Duration**: 16 weeks (one semester)
- **Population**: Community college students enrolled in introductory statistics
- **Sample Size**:
  - Pilot: 10-20 participants (Winter 2026)
  - Full study: 150-200 participants (Spring 2026)
- **Setting**: Online learning platform (GitHub Pages + Firebase)

### 1.4 Key Features
- Free online statistics course (12 modules, ~120 hours content)
- AI tutoring system with adaptive scaffolding (Claude API)
- Anonymous participation (no PII collected)
- Voluntary participation (not required for any course)
- No compensation (intrinsic motivation - free learning resource)

---

## 2. RESEARCH QUESTIONS & HYPOTHESES

### 2.1 Primary Research Questions

**RQ1**: How does AI-powered scaffolding affect student learning outcomes in introductory statistics?
- **Hypothesis H1**: Students receiving adaptive AI scaffolding will demonstrate greater learning gains (pre-post assessment) compared to students receiving minimal or no scaffolding.

**RQ2**: What level of scaffolding (minimal, moderate, extensive) is most effective for different student proficiency levels?
- **Hypothesis H2a**: Lower-proficiency students will benefit more from extensive scaffolding (Level 3).
- **Hypothesis H2b**: Higher-proficiency students will achieve similar outcomes with minimal scaffolding (Level 1).

**RQ3**: How do students interact with AI scaffolding over time, and what patterns emerge in help-seeking behavior?
- **Exploratory**: No pre-specified hypothesis; qualitative and quantitative analysis of interaction patterns.

**RQ4**: Does AI scaffolding affect student self-efficacy in statistics?
- **Hypothesis H4**: Students receiving adaptive scaffolding will report higher self-efficacy at course completion.

### 2.2 Secondary Research Questions
- What topics/modules require the most scaffolding support?
- How does scaffolding level change as students progress through modules?
- What misconceptions are most commonly addressed by the AI tutor?
- Do students prefer AI scaffolding or traditional resources?

---

## 3. BACKGROUND & SIGNIFICANCE

### 3.1 Educational Context
- **Community college students** face unique challenges: diverse academic preparation, time constraints, statistics anxiety
- **Introductory statistics** is a gateway course with high failure rates (30-40% nationally)
- **Cognitive scaffolding** theory (Vygotsky's ZPD) suggests tailored support enhances learning
- **AI tutoring systems** offer scalable, personalized support not feasible with traditional instruction

### 3.2 Gap in Literature
- Limited research on **adaptive AI scaffolding** specifically for statistics education
- Few studies examine scaffolding at **community college level**
- Lack of research on **help-seeking patterns** with AI tutors in STEM
- Need for **mixed-methods** approaches combining learning analytics and qualitative insights

### 3.3 Significance
- **Theoretical**: Advances understanding of AI-mediated cognitive scaffolding
- **Practical**: Informs design of AI tutoring systems for STEM education
- **Equity**: Provides free, accessible learning resource for underserved populations
- **Scalability**: Demonstrates feasible model for supplementary instruction

---

## 4. RESEARCH DESIGN & METHODS

### 4.1 Study Design
**Mixed-Methods, Convergent Design**:
- **Quantitative**: Learning outcomes, interaction analytics, scaffolding effectiveness
- **Qualitative**: Student surveys, open-ended feedback, interaction analysis

### 4.2 Study Phases

**Phase 1: Pilot Study (Winter 2026)**
- N = 10-20 participants
- Duration: 4 weeks
- Purpose: Test platform usability, refine scaffolding algorithm, identify technical issues
- Data collection: Full data logging + exit interviews

**Phase 2: Full Study (Spring 2026)**
- N = 150-200 participants
- Duration: 16 weeks (one semester)
- Purpose: Test research hypotheses, collect dissertation data
- Data collection: Comprehensive learning analytics + surveys

### 4.3 Participants

**Inclusion Criteria**:
- Age 18 or older
- Currently enrolled in community college OR recent graduate
- Interested in learning introductory statistics
- Access to internet-connected device
- English proficiency (content in English)

**Exclusion Criteria**:
- Under age 18
- Previously completed college-level statistics course
- Unable to access online platform

**Recruitment**:
- Santa Monica College students (PI's institution)
- Other Southern California community colleges
- Online recruitment (social media, education forums)
- Word of mouth

**No vulnerable populations** are specifically targeted.

### 4.4 Variables

**Independent Variables**:
- Scaffolding level received (Level 1, 2, 3) - **adaptive, not random**
- Student proficiency (low, medium, high) - **measured via assessments**
- Module/topic difficulty

**Dependent Variables**:
- Learning outcomes (pre/post assessment scores)
- Quiz performance
- Time to problem completion
- Help-seeking frequency
- Self-efficacy scores

**Moderating Variables**:
- Prior math background
- Statistics anxiety
- Self-reported effort

---

## 5. PARTICIPANT RECRUITMENT

### 5.1 Recruitment Methods

**Primary**: Direct recruitment at Santa Monica College
- In-class announcements (with instructor permission)
- Flyers posted on campus bulletin boards
- Email to students (via institutional lists, with approval)

**Secondary**: Online recruitment
- Social media posts (LinkedIn, Facebook education groups)
- Community college forums and Reddit communities
- Email to PI's professional networks

### 5.2 Recruitment Materials
- **Flyer**: "Free Statistics Course + Research Participation" (see Appendix A)
- **Email script**: Brief invitation with study overview (see Appendix B)
- **Website landing page**: `participate.html` with study details

### 5.3 Recruitment Timeline
- **Pilot**: December 2025 - January 2026 (recruit 10-20)
- **Full study**: January - February 2026 (recruit 150-200)
- **Rolling recruitment**: Participants can join throughout Spring 2026 semester

### 5.4 Compensation
**None**. Participation is voluntary and uncompensated.

**Rationale**:
- Maintains research integrity (intrinsic motivation)
- Participants benefit from free, high-quality learning resource
- Avoids coercion
- Typical for educational research

---

## 6. INFORMED CONSENT PROCESS

### 6.1 Consent Procedure

**Two-Stage Consent**:

**Stage 1: Initial Information**
- Upon first visit to platform, users see overview of research
- Can browse freely without consent
- **"Participate in Research"** page (`participate.html`) provides full study details

**Stage 2: Explicit Consent**
- Before any data is logged, user must explicitly consent
- **Consent modal** appears when using AI tutor for first time
- Clear "I Agree" and "I Decline" buttons
- Can decline and still use platform (data not used for research)
- Can withdraw consent at any time

### 6.2 Consent Form Elements
- **Study purpose**: Learn about AI scaffolding effectiveness
- **Procedures**: Use free online course, AI tutor optional, assessments voluntary
- **Time commitment**: Self-paced, estimated 4-10 hours/week
- **Risks**: Minimal (see Section 8)
- **Benefits**: Free statistics learning, contribute to research
- **Privacy**: Anonymous, encrypted data
- **Voluntary**: Can withdraw anytime
- **Contact**: PI email for questions
- **IRB**: UCLA IRB contact information

### 6.3 Consent Documentation
- **Electronic consent**: Stored in Firestore with timestamp
- **No signatures required**: Anonymous study, electronic consent appropriate
- **Consent withdrawal**: Email PI or use platform form

### 6.4 Special Considerations
- **No deception**: Fully transparent about AI tutor and data collection
- **No coercion**: Not required for any course, no compensation
- **Capacity to consent**: Adults (18+) only
- **Language**: English (consent form at 8th grade reading level)

---

## 7. DATA COLLECTION PROCEDURES

### 7.1 Data Collection Methods

**Automatically Logged Data** (with consent):
1. **Learning Analytics**:
   - Assessment scores (pre/post/quiz)
   - Time spent per module/lesson
   - Practice problem attempts
   - Module completion rates

2. **AI Interaction Data**:
   - Student questions (encrypted)
   - AI responses (encrypted)
   - Scaffolding level for each interaction
   - Response times
   - Escalation/de-escalation events
   - Context (module, lesson, problem number)

3. **Student Proficiency Metrics**:
   - Overall proficiency score (0-1)
   - Module-by-module performance
   - Learning gain calculations
   - Help-seeking frequency

**Voluntary Survey Data**:
1. **Demographic Survey** (optional):
   - Age range (18-24, 25-34, 35-44, 45+)
   - Gender (optional, free response)
   - Race/ethnicity (optional, standard categories)
   - Prior math background (last math course taken)
   - College experience (first-time vs. returning)

2. **Self-Efficacy Survey** (pre/post):
   - 10-item Statistics Self-Efficacy Scale
   - 5-point Likert scale
   - Administered at start and end

3. **Exit Survey**:
   - Satisfaction with platform (5-point scale)
   - Perceived usefulness of AI tutor
   - Suggestions for improvement
   - Open-ended feedback

### 7.2 Data Storage & Security
- **Database**: Google Firebase Firestore (HIPAA-compliant tier)
- **Encryption**: All AI conversations encrypted at rest (AES-256)
- **Access**: PI only (password-protected, 2FA enabled)
- **Backup**: Automated daily backups
- **Retention**: 5 years post-publication (UCLA policy)
- **Destruction**: Secure deletion after retention period

### 7.3 Data Minimization
- **No PII collected**: Anonymous user IDs only
- **No email required**: Optional for study updates only (separate database)
- **No IP logging**: Disabled in Firebase
- **Demographics optional**: Can participate without providing
- **Encrypted conversations**: Not accessible even to PI without decryption key

---

## 8. RISKS & BENEFITS

### 8.1 Risks

**Minimal Risk Study**: Risks no greater than everyday online learning.

**Potential Risks**:

1. **Privacy/Confidentiality Breach** (Low Risk)
   - **Mitigation**: Encryption, anonymous IDs, secure database, no PII collection
   - **Response**: Immediate notification, data breach protocol, enhanced security

2. **Psychological Discomfort** (Minimal Risk)
   - **Source**: Statistics anxiety, frustration with difficult problems
   - **Mitigation**: Optional participation, ability to skip problems, supportive AI tutor tone
   - **Response**: Resources for math tutoring, counseling services

3. **Time/Inconvenience** (Minimal Risk)
   - **Source**: Time spent on platform
   - **Mitigation**: Self-paced, voluntary, can stop anytime
   - **Response**: Clear time estimates provided upfront

4. **Technical Issues** (Low Risk)
   - **Source**: Platform errors, AI tutor failures
   - **Mitigation**: Demo mode testing, error logging, help resources
   - **Response**: Technical support email, bug fixes within 24-48 hours

**No physical risks, no deception, no vulnerable populations, no sensitive topics.**

### 8.2 Benefits

**Direct Benefits to Participants**:
- Free, high-quality statistics learning resource
- Personalized AI tutoring support
- Self-paced learning at own convenience
- Certificate of completion (optional)
- Skills applicable to career/academics

**Benefits to Society**:
- Advances understanding of AI in education
- Informs design of accessible learning tools
- Contributes to equity in STEM education
- Scholarly contribution (dissertation, publications)

**Risk-Benefit Analysis**: Benefits clearly outweigh minimal risks.

---

## 9. PRIVACY & CONFIDENTIALITY

### 9.1 Privacy Protections

**Anonymous Participation**:
- No names, student IDs, or email addresses required
- Auto-generated anonymous IDs (e.g., "P_A7B3C9XY")
- No linkage to real identity possible

**Data Encryption**:
- All AI conversations encrypted at rest (AES-256)
- Encryption key stored separately from data
- Even PI cannot access raw conversations without key

**No PII Collection**:
- Demographics are optional and aggregate categories only
- No birthdate, address, phone, SSN, or identifiers
- IP addresses not logged

**Secure Storage**:
- Google Firebase (HIPAA-compliant tier)
- Two-factor authentication required
- Access logs maintained
- Regular security audits

### 9.2 Confidentiality Measures

**Access Limits**:
- **PI only**: Safaa Dabagh has data access
- **Advisors**: Aggregated data only (no individual records)
- **No third parties**: Data never shared outside research team

**Reporting**:
- All results reported in aggregate
- Minimum cell size of 5 for subgroup reporting
- No individual quotes without explicit permission
- De-identification review before publication

**Data Sharing**:
- De-identified dataset may be shared with qualified researchers (post-publication)
- Only after additional de-identification review
- Data use agreements required

### 9.3 GDPR & CCPA Compliance

**Right to Access**: Participants can export their complete data
**Right to Deletion**: Can request data removal at any time
**Right to Rectification**: Can correct demographic information
**Right to Object**: Can decline research use while keeping platform access
**Data Minimization**: Only collect data necessary for research
**Purpose Limitation**: Data used only for stated research purposes

---

## 10. DATA MANAGEMENT & SECURITY

### 10.1 Data Management Plan

**Storage**:
- Primary: Google Firebase Firestore (encrypted)
- Backup: Weekly encrypted backups to UCLA Google Drive
- Long-term: UCLA Library Data Archive (post-dissertation)

**Organization**:
- Separate collections: users, sessions, interactions, assessments
- Indexed for efficient querying
- Version controlled analysis code (GitHub private repo)

**Documentation**:
- Data dictionary (all variables defined)
- Codebook for categorical variables
- Analysis log (all queries and transformations documented)

**Quality Control**:
- Automated validation (data types, ranges)
- Missing data handling protocol
- Outlier detection and review
- Inter-rater reliability for qualitative coding (if applicable)

### 10.2 Security Measures

**Technical**:
- Firebase security rules (user-owned data only)
- Encryption at rest and in transit (TLS 1.3)
- Two-factor authentication for all accounts
- Regular security updates and patches
- Automated malware scanning

**Administrative**:
- PI CITI-trained in human subjects research
- Data access logs reviewed monthly
- Incident response plan
- Regular backups tested for restoration

**Physical**:
- No physical data storage (cloud-only)
- PI devices password-protected, encrypted
- No data on portable devices

### 10.3 Data Retention & Destruction

**Retention**: 5 years post-publication (UCLA policy)
**Destruction**: Secure deletion of all records
- Firebase database deletion
- Backup deletion from Google Drive
- Confirmation of deletion documented

---

## 11. PILOT STUDY PROTOCOL

### 11.1 Pilot Study Purpose
- Test platform usability and technical functionality
- Refine adaptive scaffolding algorithm
- Identify bugs and user experience issues
- Estimate effect sizes for power analysis
- Practice data collection procedures

### 11.2 Pilot Participants
- **N**: 10-20
- **Recruitment**: Santa Monica College students, colleagues' students
- **Duration**: 4 weeks (January - February 2026)
- **Compensation**: None (same as full study)

### 11.3 Pilot Procedures
1. **Week 1**: Recruitment, consent, demographic survey, Module 1-2
2. **Week 2**: Modules 3-4, first use of AI tutor, usability feedback
3. **Week 3**: Modules 5-6, continued AI use
4. **Week 4**: Complete remaining modules, exit survey, optional interview

### 11.4 Pilot Data Collection
- **All regular data**: Assessments, interactions, performance metrics
- **Additional**: Screen recordings (with permission), think-aloud protocols
- **Exit interview**: 30-minute Zoom interview about experience

### 11.5 Pilot Analysis
- Descriptive statistics (completion rates, interaction patterns)
- Usability issues identified and prioritized
- Algorithm refinements based on performance data
- Effect size estimates for sample size calculation

### 11.6 Pilot to Full Study Transition
- Pilot data **not** included in dissertation analysis (separate dataset)
- Platform updates implemented based on pilot feedback
- Revised procedures documented
- IRB modification submitted if major changes needed

---

## 12. TIMELINE

### 12.1 Pre-Data Collection
- **November 2025**: Finalize platform, complete IRB application
- **December 2025**: IRB submission, await approval
- **December 2025**: Pilot recruitment begins

### 12.2 Pilot Study
- **January 2026**: Pilot consent, data collection (4 weeks)
- **February 2026**: Pilot data analysis, platform refinements

### 12.3 Full Study
- **January - February 2026**: Full study recruitment (rolling)
- **February - May 2026**: Data collection (16 weeks)
- **June 2026**: Final surveys, close recruitment

### 12.4 Data Analysis
- **June - August 2026**: Quantitative analysis
- **August - September 2026**: Qualitative analysis
- **September - October 2026**: Mixed-methods integration

### 12.5 Dissertation
- **November 2026**: Dissertation writing
- **March 2027**: Dissertation defense (target)
- **May 2027**: Graduation

---

## 13. APPENDICES

### Appendix A: Recruitment Flyer [Separate file]
### Appendix B: Recruitment Email Script [Separate file]
### Appendix C: Informed Consent Form [Separate file]
### Appendix D: Demographic Survey [Separate file]
### Appendix E: Self-Efficacy Survey [Separate file]
### Appendix F: Exit Survey [Separate file]
### Appendix G: Data Security Plan [Separate file]
### Appendix H: Sample AI Tutor Interactions [Separate file]
### Appendix I: Platform Screenshots [Separate file]

---

## PRINCIPAL INVESTIGATOR STATEMENT

I, Safaa Dabagh, certify that:

1. I have completed CITI training in human subjects research
2. I will conduct this research in accordance with UCLA IRB policies
3. I will obtain informed consent from all participants
4. I will protect participant privacy and data security
5. I will report any adverse events or protocol deviations to the IRB
6. I will submit modifications for IRB approval before implementing changes
7. I will submit continuing review applications as required
8. I will close the study when complete and submit final report

**Signature**: _________________________ **Date**: _____________
Safaa Dabagh, PhD Candidate, UCLA Statistics Department

**Faculty Advisor Approval**:

**Signature**: _________________________ **Date**: _____________
Prof. Mark Handcock, PhD, UCLA Statistics Department

**Signature**: _________________________ **Date**: _____________
Prof. Guang Cheng, PhD, UCLA Statistics Department

---

**END OF IRB PROTOCOL**

**Submitted to**: UCLA Institutional Review Board (IRB)
**Date**: [To be completed]
**Contact**: Safaa Dabagh, dabagh_safaa@smc.edu

For IRB questions: UCLA Office of the Human Research Protection Program (OHRPP)
Phone: (310) 825-7122 | Email: participants@research.ucla.edu
