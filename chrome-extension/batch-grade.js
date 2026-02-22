// Batch Grading Logic for Canvas AI Grader Extension
// Handles zip file extraction, submission processing, and batch grading

// State management
let state = {
  submissions: [],
  gradingResults: [],
  selectedType: null,
  config: {
    apiKey: '',
    workerUrl: ''
  }
};

// Rubric templates for different assignment types
const RUBRIC_TEMPLATES = {
  discussion: `# Discussion Post Grading Rubric

## Criteria (10 points total):

1. **Content Quality (4 points)**
   - Demonstrates understanding of topic
   - Includes relevant examples or evidence
   - Addresses all parts of the prompt

2. **Critical Thinking (3 points)**
   - Shows original analysis or insight
   - Makes connections to course concepts
   - Asks thoughtful questions

3. **Engagement (2 points)**
   - Responds to peers thoughtfully
   - Contributes to discussion
   - Respects diverse viewpoints

4. **Writing Quality (1 point)**
   - Clear and organized
   - Proper grammar and spelling
   - Appropriate length and depth

## Feedback Style:
- Be encouraging and constructive
- Highlight specific strengths
- Provide actionable suggestions for improvement
- Reference specific parts of the student's post`,

  research: `# Research Assignment Grading Rubric

## Criteria (10 points total):

1. **Thesis & Argument (3 points)**
   - Clear, focused thesis statement
   - Logical argument structure
   - Strong supporting evidence

2. **Research & Sources (3 points)**
   - Uses credible, relevant sources
   - Proper citations (APA/MLA)
   - Synthesizes multiple perspectives

3. **Analysis & Critical Thinking (2 points)**
   - Deep analysis of topic
   - Original insights or conclusions
   - Addresses counterarguments

4. **Organization & Writing (2 points)**
   - Clear structure with introduction, body, conclusion
   - Smooth transitions between ideas
   - Professional academic writing
   - Proper grammar, spelling, formatting

## Feedback Style:
- Be specific and detailed
- Reference particular sections of the paper
- Suggest concrete improvements
- Acknowledge strong analytical thinking
- Guide toward deeper research or analysis`
};

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', async () => {
  // Load configuration from storage
  await loadConfig();

  // Set up event listeners
  setupEventListeners();

  console.log('Batch grading interface initialized');
});

// Load API key and worker URL from Chrome storage
async function loadConfig() {
  try {
    const data = await chrome.storage.local.get(['apiKey', 'workerUrl']);
    state.config.apiKey = data.apiKey || '';
    state.config.workerUrl = data.workerUrl || '';

    if (!state.config.apiKey || !state.config.workerUrl) {
      showError('Please configure your API key and Worker URL in the extension settings first!');
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
}

// Set up all event listeners
function setupEventListeners() {
  // Upload zone click
  document.getElementById('uploadZone').addEventListener('click', () => {
    document.getElementById('zipInput').click();
  });

  // File input change
  document.getElementById('zipInput').addEventListener('change', handleFileSelect);

  // Drag and drop
  const uploadZone = document.getElementById('uploadZone');
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.zip')) {
      handleZipFile(file);
    } else {
      showError('Please drop a .zip file');
    }
  });

  // Assignment type selection
  document.querySelectorAll('.type-card').forEach(card => {
    card.addEventListener('click', () => {
      selectAssignmentType(card.dataset.type);
    });
  });

  // Start grading button
  document.getElementById('startGrading').addEventListener('click', startBatchGrading);

  // Download buttons
  document.getElementById('downloadCSV').addEventListener('click', downloadCSV);
  document.getElementById('downloadJSON').addEventListener('click', downloadJSON);
  document.getElementById('startOver').addEventListener('click', resetInterface);
}

// Handle file selection
async function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    await handleZipFile(file);
  }
}

// Process uploaded zip file
async function handleZipFile(zipFile) {
  try {
    console.log('Processing zip file:', zipFile.name);

    // Check if JSZip is available
    if (typeof JSZip === 'undefined') {
      showError('JSZip library not found! Please download jszip.min.js and place it in the lib/ folder. See lib/README.md for instructions.');
      return;
    }

    // Show loading state
    document.getElementById('uploadZone').innerHTML = `
      <div class="upload-icon spinning">⏳</div>
      <div class="upload-text">Extracting submissions...</div>
    `;

    // Load and extract zip
    const zip = await JSZip.loadAsync(zipFile);
    state.submissions = [];

    // Process each file in the zip
    for (const [filename, file] of Object.entries(zip.files)) {
      if (file.dir) continue; // Skip directories

      // Skip metadata files
      if (filename.startsWith('__MACOSX') || filename.includes('.DS_Store')) {
        continue;
      }

      // Extract student name from Canvas filename
      // Canvas format: "lastname_firstname_123456_assignmentname.txt"
      // Or: "lastname_firstname_late_123456_assignmentname.txt"
      const studentName = extractStudentName(filename);

      // Read file content
      const content = await file.async('text');

      if (content.trim()) {
        state.submissions.push({
          filename: filename,
          student: studentName,
          content: content.trim()
        });
      }
    }

    console.log(`Extracted ${state.submissions.length} submissions`);

    if (state.submissions.length === 0) {
      showError('No valid submissions found in zip file. Please check the file and try again.');
      resetUploadZone();
      return;
    }

    // Update UI
    showConfigSection(zipFile.size);

  } catch (error) {
    console.error('Error processing zip:', error);
    showError('Error extracting zip file: ' + error.message);
    resetUploadZone();
  }
}

// Extract student name from Canvas filename
function extractStudentName(filename) {
  // Remove path if present
  const basename = filename.split('/').pop();

  // Canvas format: "lastname_firstname_123456_assignment.txt"
  // Or: "lastname_firstname_late_123456_assignment.txt"
  const parts = basename.split('_');

  if (parts.length >= 2) {
    const lastname = parts[0];
    const firstname = parts[1];

    // Check if "late" is in the name
    const isLate = parts.includes('late') || parts.includes('LATE');
    const lateFlag = isLate ? ' (LATE)' : '';

    // Capitalize first letters
    const formattedFirst = capitalize(firstname);
    const formattedLast = capitalize(lastname);

    return `${formattedFirst} ${formattedLast}${lateFlag}`;
  }

  // Fallback: use filename without extension
  return basename.replace(/\.[^/.]+$/, '');
}

// Capitalize first letter
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Show configuration section
function showConfigSection(fileSize) {
  // Hide upload section
  document.getElementById('uploadSection').classList.add('hidden');

  // Show config section
  document.getElementById('configSection').classList.remove('hidden');

  // Update stats
  document.getElementById('totalSubmissions').textContent = state.submissions.length;
  document.getElementById('totalStudents').textContent = state.submissions.length;
  document.getElementById('fileSize').textContent = formatFileSize(fileSize);
}

// Format file size
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Select assignment type and load template
function selectAssignmentType(type) {
  state.selectedType = type;

  // Update UI
  document.querySelectorAll('.type-card').forEach(card => {
    card.classList.remove('selected');
  });
  document.querySelector(`[data-type="${type}"]`).classList.add('selected');

  // Load rubric template
  document.getElementById('rubric').value = RUBRIC_TEMPLATES[type];

  console.log('Selected assignment type:', type);
}

// Start batch grading process
async function startBatchGrading() {
  const rubric = document.getElementById('rubric').value.trim();
  const maxPoints = parseInt(document.getElementById('points').value);

  // Validation
  if (!rubric) {
    showError('Please enter a grading rubric or select an assignment type');
    return;
  }

  if (!state.config.apiKey || !state.config.workerUrl) {
    showError('Please configure your API key and Worker URL in the extension settings');
    return;
  }

  // Hide config, show progress
  document.getElementById('configSection').classList.add('hidden');
  document.getElementById('progressSection').classList.remove('hidden');

  // Initialize results
  state.gradingResults = [];

  // Process each submission
  const processingList = document.getElementById('processingList');
  processingList.innerHTML = '';

  for (let i = 0; i < state.submissions.length; i++) {
    const submission = state.submissions[i];

    // Add to processing list
    const itemId = `item-${i}`;
    processingList.innerHTML += `
      <div class="processing-item current" id="${itemId}">
        <span class="status-icon">⏳</span>
        <span>${submission.student}</span>
      </div>
    `;

    // Update progress bar
    updateProgress(i + 1, state.submissions.length);

    try {
      // Grade this submission
      const result = await gradeSubmission(submission, rubric, maxPoints);
      state.gradingResults.push(result);

      // Update UI
      const item = document.getElementById(itemId);
      item.classList.remove('current');
      item.classList.add('completed');
      item.innerHTML = `
        <span class="status-icon">✅</span>
        <span>${submission.student}</span>
        <span style="margin-left: auto; font-weight: 600;">${result.score}/${maxPoints}</span>
      `;

      console.log(`Graded ${submission.student}: ${result.score}/${maxPoints}`);

    } catch (error) {
      console.error(`Error grading ${submission.student}:`, error);

      // Add error result
      state.gradingResults.push({
        student: submission.student,
        filename: submission.filename,
        score: 0,
        feedback: 'Error: ' + error.message,
        error: true
      });

      // Update UI
      const item = document.getElementById(itemId);
      item.classList.remove('current');
      item.classList.add('error');
      item.innerHTML = `
        <span class="status-icon">❌</span>
        <span>${submission.student}</span>
        <span style="margin-left: auto; color: #c53030;">Error</span>
      `;
    }

    // Rate limiting: Wait 2 seconds between API calls to avoid hitting limits
    if (i < state.submissions.length - 1) {
      await sleep(2000);
    }
  }

  // Show results
  showResults();
}

// Grade a single submission
async function gradeSubmission(submission, rubric, maxPoints) {
  console.log(`Grading submission for ${submission.student}...`);

  const response = await fetch(state.config.workerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      apiKey: state.config.apiKey,
      submission: submission.content,
      rubric: rubric,
      maxPoints: maxPoints,
      studentName: submission.student
    })
  });

  if (!response.ok) {
    throw new Error(`Worker returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    student: submission.student,
    filename: submission.filename,
    score: data.score || 0,
    feedback: data.feedback || '',
    strengths: data.strengths || [],
    improvements: data.improvements || []
  };
}

// Update progress bar
function updateProgress(current, total) {
  const percent = Math.round((current / total) * 100);
  document.getElementById('progressFill').style.width = percent + '%';
  document.getElementById('progressPercent').textContent = percent + '%';
  document.getElementById('progressText').textContent =
    `Processing ${current} of ${total} submissions...`;
}

// Show results section
function showResults() {
  // Hide progress
  document.getElementById('progressSection').classList.add('hidden');

  // Show results
  document.getElementById('resultsSection').classList.remove('hidden');

  // Calculate stats
  const successfulGrades = state.gradingResults.filter(r => !r.error);
  const errors = state.gradingResults.filter(r => r.error);
  const avgScore = successfulGrades.length > 0
    ? (successfulGrades.reduce((sum, r) => sum + r.score, 0) / successfulGrades.length).toFixed(1)
    : 0;

  // Update stats
  document.getElementById('gradedCount').textContent = successfulGrades.length;
  document.getElementById('avgScore').textContent = avgScore;
  document.getElementById('errorCount').textContent = errors.length;

  // Generate preview table
  generatePreviewTable();
}

// Generate preview table
function generatePreviewTable() {
  const preview = document.getElementById('resultsPreview');

  let html = `
    <table class="preview-table">
      <thead>
        <tr>
          <th>Student</th>
          <th>Score</th>
          <th>Feedback Preview</th>
        </tr>
      </thead>
      <tbody>
  `;

  state.gradingResults.forEach(result => {
    const feedbackPreview = result.feedback.substring(0, 100) + (result.feedback.length > 100 ? '...' : '');
    const scoreClass = result.error ? 'error' : '';

    html += `
      <tr>
        <td>${result.student}</td>
        <td><span class="score-badge ${scoreClass}">${result.score}</span></td>
        <td style="font-size: 0.85rem; color: #4a5568;">${feedbackPreview}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  preview.innerHTML = html;
}

// Download results as CSV (Canvas-compatible format)
function downloadCSV() {
  // CSV format: Student,Score,Feedback
  let csv = 'Student,Score,Feedback\n';

  state.gradingResults.forEach(result => {
    // Escape quotes in feedback
    const escapedFeedback = result.feedback.replace(/"/g, '""');
    csv += `"${result.student}",${result.score},"${escapedFeedback}"\n`;
  });

  downloadFile('canvas-grades.csv', csv, 'text/csv');
  console.log('Downloaded CSV with', state.gradingResults.length, 'grades');
}

// Download results as JSON
function downloadJSON() {
  const json = JSON.stringify(state.gradingResults, null, 2);
  downloadFile('grading-results.json', json, 'application/json');
  console.log('Downloaded JSON with', state.gradingResults.length, 'results');
}

// Download file helper
function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Reset interface to start over
function resetInterface() {
  // Reset state
  state.submissions = [];
  state.gradingResults = [];
  state.selectedType = null;

  // Reset UI
  document.getElementById('configSection').classList.add('hidden');
  document.getElementById('progressSection').classList.add('hidden');
  document.getElementById('resultsSection').classList.add('hidden');
  document.getElementById('uploadSection').classList.remove('hidden');

  resetUploadZone();

  // Clear form
  document.getElementById('rubric').value = '';
  document.getElementById('points').value = '10';
  document.querySelectorAll('.type-card').forEach(card => {
    card.classList.remove('selected');
  });

  // Reset file input
  document.getElementById('zipInput').value = '';
}

// Reset upload zone to initial state
function resetUploadZone() {
  document.getElementById('uploadZone').innerHTML = `
    <div class="upload-icon">📁</div>
    <div class="upload-text">Drop submissions.zip here or click to browse</div>
    <div class="upload-subtext">Accepts .zip files from Canvas gradebook</div>
    <input type="file" id="zipInput" accept=".zip" style="display: none;">
  `;
}

// Show error message
function showError(message) {
  alert('Error: ' + message);
  console.error('Error:', message);
}

// Sleep utility
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Log initialization
console.log('Batch grading script loaded');
console.log('Rubric templates available:', Object.keys(RUBRIC_TEMPLATES));
