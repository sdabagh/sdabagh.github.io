// Module 6: Confidence Intervals & Sample Size - Interactive Visualizations
// Pure JavaScript SVG charts with no external dependencies

// ========================================
// Chart 1: Confidence Interval Visualizer
// Shows how confidence level affects interval width
// ========================================
function createCIVisualizer(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const width = 600;
  const height = 300;
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Sample data
  const mean = 100;
  const se = 5;
  const confidenceLevels = [
    { level: 90, z: 1.645, color: '#28a745' },
    { level: 95, z: 1.96, color: '#ffc107' },
    { level: 99, z: 2.576, color: '#dc3545' }
  ];

  let svg = '<svg width="' + width + '" height="' + height + '" style="font-family: Arial, sans-serif;">';
  svg += '<text x="' + (width/2) + '" y="20" text-anchor="middle" font-size="16" font-weight="bold" fill="#2C5F7C">';
  svg += 'Confidence Interval Width by Confidence Level</text>';

  // Draw intervals
  const yStart = margin.top + 40;
  const ySpacing = 60;
  const xScale = plotWidth / 40; // Scale for values around 100

  confidenceLevels.forEach((conf, idx) => {
    const y = yStart + idx * ySpacing;
    const margin_of_error = conf.z * se;
    const lower = mean - margin_of_error;
    const upper = mean + margin_of_error;

    const x1 = margin.left + (lower - 80) * xScale;
    const x2 = margin.left + (upper - 80) * xScale;
    const xMean = margin.left + (mean - 80) * xScale;

    // Draw interval line
    svg += '<line x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" stroke="' + conf.color + '" stroke-width="4"/>';

    // Draw endpoints
    svg += '<circle cx="' + x1 + '" cy="' + y + '" r="4" fill="' + conf.color + '"/>';
    svg += '<circle cx="' + x2 + '" cy="' + y + '" r="4" fill="' + conf.color + '"/>';

    // Draw mean marker
    svg += '<circle cx="' + xMean + '" cy="' + y + '" r="6" fill="#2C5F7C"/>';

    // Label
    svg += '<text x="30" y="' + (y + 5) + '" font-size="14" font-weight="600" fill="' + conf.color + '">';
    svg += conf.level + '% CI</text>';

    // Value labels
    svg += '<text x="' + x1 + '" y="' + (y - 10) + '" text-anchor="middle" font-size="11" fill="' + conf.color + '">';
    svg += lower.toFixed(1) + '</text>';
    svg += '<text x="' + x2 + '" y="' + (y - 10) + '" text-anchor="middle" font-size="11" fill="' + conf.color + '">';
    svg += upper.toFixed(1) + '</text>';
  });

  // Mean label
  svg += '<text x="' + (margin.left + (mean - 80) * xScale) + '" y="' + (height - 10) + '" text-anchor="middle" font-size="12" font-weight="600" fill="#2C5F7C">';
  svg += 'x̄ = ' + mean + '</text>';

  svg += '</svg>';
  container.innerHTML = svg;
}

// ========================================
// Chart 2: Sample Size Calculator Visualization
// Interactive demonstration of how n affects margin of error
// ========================================
function createSampleSizeCalc(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const width = 600;
  const height = 400;

  // Create interactive controls and chart
  let html = '<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">';
  html += '<h4 style="margin-top: 0; color: #2C5F7C;">Sample Size Effect on Margin of Error</h4>';
  html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">';
  html += '<div><label style="font-weight: 600;">Sample Size (n): <span id="nValue">100</span></label>';
  html += '<input type="range" id="nSlider" min="10" max="400" value="100" step="10" style="width: 100%;"></div>';
  html += '<div><label style="font-weight: 600;">Confidence Level: <span id="confValue">95</span>%</label>';
  html += '<input type="range" id="confSlider" min="90" max="99" value="95" step="1" style="width: 100%;"></div>';
  html += '</div><div id="calcResults" style="margin-top: 10px; font-size: 1.1rem; color: #2C5F7C; font-weight: 600;"></div></div>';
  html += '<svg id="sampleSizeChart" width="' + width + '" height="' + height + '"></svg>';

  container.innerHTML = html;

  // Update chart function
  function updateChart() {
    const n = parseInt(document.getElementById('nSlider').value);
    const confLevel = parseInt(document.getElementById('confSlider').value);
    document.getElementById('nValue').textContent = n;
    document.getElementById('confValue').textContent = confLevel;

    const sigma = 20;
    const z = confLevel === 90 ? 1.645 : confLevel === 99 ? 2.576 : 1.96;

    const marginError = z * (sigma / Math.sqrt(n));

    document.getElementById('calcResults').innerHTML =
      'Margin of Error: ±' + marginError.toFixed(2) + ' • Required n for E=3: ' + Math.ceil(Math.pow(z * sigma / 3, 2));

    // Draw bar chart showing margin of error
    const svg = document.getElementById('sampleSizeChart');
    const barHeight = 60;
    const maxME = 20;
    const barWidth = (marginError / maxME) * 400;

    let chartSVG = '<text x="300" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#2C5F7C">';
    chartSVG += 'Current Margin of Error: ±' + marginError.toFixed(2) + '</text>';
    chartSVG += '<rect x="50" y="60" width="' + barWidth + '" height="' + barHeight + '" fill="#3A7CA5" rx="4"/>';
    chartSVG += '<text x="' + (50 + barWidth + 10) + '" y="' + (60 + barHeight/2 + 5) + '" font-size="14" font-weight="600" fill="#2C5F7C">';
    chartSVG += '±' + marginError.toFixed(2) + '</text>';
    chartSVG += '<text x="50" y="150" font-size="13" fill="#666">As n increases, margin of error decreases (√n relationship)</text>';
    chartSVG += '<text x="50" y="180" font-size="13" fill="#666">Formula: E = z* × (σ/√n) = ' + z.toFixed(3) + ' × (20/√' + n + ') = ' + marginError.toFixed(2) + '</text>';

    svg.innerHTML = chartSVG;
  }

  // Attach event listeners
  document.getElementById('nSlider').addEventListener('input', updateChart);
  document.getElementById('confSlider').addEventListener('input', updateChart);
  updateChart();
}

// ========================================
// Chart 3: t-Distribution vs z-Distribution Comparison
// Shows how t approaches z as df increases
// ========================================
function createTvsZComparison(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const width = 600;
  const height = 350;
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };

  // t-distribution critical values for different df at 95% confidence
  const data = [
    { df: 5, t: 2.571, z: 1.96 },
    { df: 10, t: 2.228, z: 1.96 },
    { df: 20, t: 2.086, z: 1.96 },
    { df: 30, t: 2.042, z: 1.96 },
    { df: 50, t: 2.009, z: 1.96 },
    { df: 100, t: 1.984, z: 1.96 }
  ];

  const maxY = 2.8;
  const yScale = (height - margin.top - margin.bottom) / maxY;
  const xSpacing = (width - margin.left - margin.right) / (data.length + 1);

  let svg = '<svg width="' + width + '" height="' + height + '">';
  svg += '<text x="' + (width/2) + '" y="25" text-anchor="middle" font-size="16" font-weight="bold" fill="#2C5F7C">';
  svg += 't* vs z* (95% Confidence) - t approaches z as df increases</text>';

  // Draw gridlines
  for (let y = 0; y <= maxY; y += 0.5) {
    const yPos = height - margin.bottom - y * yScale;
    svg += '<line x1="' + margin.left + '" y1="' + yPos + '" x2="' + (width - margin.right) + '" y2="' + yPos + '" stroke="#e0e0e0" stroke-width="1"/>';
    svg += '<text x="' + (margin.left - 10) + '" y="' + (yPos + 5) + '" text-anchor="end" font-size="11" fill="#666">' + y.toFixed(1) + '</text>';
  }

  // Draw z reference line
  const zY = height - margin.bottom - 1.96 * yScale;
  svg += '<line x1="' + margin.left + '" y1="' + zY + '" x2="' + (width - margin.right) + '" y2="' + zY + '" stroke="#dc3545" stroke-width="2" stroke-dasharray="5,5"/>';
  svg += '<text x="' + (width - margin.right + 5) + '" y="' + (zY - 5) + '" font-size="11" font-weight="600" fill="#dc3545">z* = 1.96</text>';

  // Draw bars
  data.forEach((d, i) => {
    const x = margin.left + (i + 1) * xSpacing;
    const barWidth = 40;
    const tHeight = d.t * yScale;
    const tY = height - margin.bottom - tHeight;

    // t-bar
    svg += '<rect x="' + (x - barWidth/2) + '" y="' + tY + '" width="' + barWidth + '" height="' + tHeight + '" fill="#3A7CA5" stroke="#2C5F7C" stroke-width="2" rx="3"/>';

    // Value label
    svg += '<text x="' + x + '" y="' + (tY - 5) + '" text-anchor="middle" font-size="11" font-weight="600" fill="#2C5F7C">' + d.t.toFixed(3) + '</text>';

    // df label
    svg += '<text x="' + x + '" y="' + (height - margin.bottom + 20) + '" text-anchor="middle" font-size="12" fill="#666">df=' + d.df + '</text>';
  });

  // Axis labels
  svg += '<text x="' + (width/2) + '" y="' + (height - 5) + '" text-anchor="middle" font-size="13" font-weight="600" fill="#2C5F7C">Degrees of Freedom (df)</text>';

  svg += '</svg>';
  container.innerHTML = svg;
}

// ========================================
// Chart 4: CI Coverage Simulation
// Demonstrates what "95% confidence" means
// ========================================
function createCICoverageSimulation(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const width = 700;
  const height = 500;
  const margin = { top: 60, right: 40, bottom: 40, left: 80 };

  // Simulate 20 confidence intervals
  const trueMean = 100;
  const numIntervals = 20;
  const intervals = [];

  for (let i = 0; i < numIntervals; i++) {
    // Simulate sample mean (normally distributed around true mean)
    const sampleMean = trueMean + (Math.random() - 0.5) * 10;
    const se = 2.5;
    const marginError = 1.96 * se; // 95% CI
    const lower = sampleMean - marginError;
    const upper = sampleMean + marginError;
    const captures = (lower <= trueMean && trueMean <= upper);
    intervals.push({ sampleMean: sampleMean, lower: lower, upper: upper, captures: captures });
  }

  const captured = intervals.filter(d => d.captures).length;
  const percentage = (captured / numIntervals * 100).toFixed(0);

  const xMin = 90;
  const xMax = 110;
  const xScale = (width - margin.left - margin.right) / (xMax - xMin);
  const ySpacing = (height - margin.top - margin.bottom) / (numIntervals + 1);

  let svg = '<svg width="' + width + '" height="' + height + '">';
  svg += '<text x="' + (width/2) + '" y="25" text-anchor="middle" font-size="16" font-weight="bold" fill="#2C5F7C">';
  svg += '95% CI Simulation: ' + captured + ' of ' + numIntervals + ' intervals (' + percentage + '%) capture true μ = ' + trueMean + '</text>';
  svg += '<text x="' + (width/2) + '" y="45" text-anchor="middle" font-size="12" fill="#666">Green intervals capture μ, Red intervals do not</text>';

  // Draw true mean line
  const trueMeanX = margin.left + (trueMean - xMin) * xScale;
  svg += '<line x1="' + trueMeanX + '" y1="' + margin.top + '" x2="' + trueMeanX + '" y2="' + (height - margin.bottom) + '" stroke="#2C5F7C" stroke-width="3" stroke-dasharray="5,5"/>';
  svg += '<text x="' + trueMeanX + '" y="' + (margin.top - 10) + '" text-anchor="middle" font-size="13" font-weight="600" fill="#2C5F7C">True μ = ' + trueMean + '</text>';

  // Draw intervals
  intervals.forEach((d, i) => {
    const y = margin.top + (i + 1) * ySpacing;
    const x1 = margin.left + (d.lower - xMin) * xScale;
    const x2 = margin.left + (d.upper - xMin) * xScale;
    const xMean = margin.left + (d.sampleMean - xMin) * xScale;
    const color = d.captures ? '#28a745' : '#dc3545';

    // Interval line
    svg += '<line x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" stroke="' + color + '" stroke-width="2"/>';

    // Endpoints
    svg += '<circle cx="' + x1 + '" cy="' + y + '" r="2" fill="' + color + '"/>';
    svg += '<circle cx="' + x2 + '" cy="' + y + '" r="2" fill="' + color + '"/>';

    // Sample mean point
    svg += '<circle cx="' + xMean + '" cy="' + y + '" r="3" fill="' + color + '"/>';
  });

  // X-axis
  for (let x = xMin; x <= xMax; x += 5) {
    const xPos = margin.left + (x - xMin) * xScale;
    svg += '<line x1="' + xPos + '" y1="' + (height - margin.bottom) + '" x2="' + xPos + '" y2="' + (height - margin.bottom + 5) + '" stroke="#666" stroke-width="1"/>';
    svg += '<text x="' + xPos + '" y="' + (height - margin.bottom + 20) + '" text-anchor="middle" font-size="11" fill="#666">' + x + '</text>';
  }

  svg += '</svg>';
  container.innerHTML = svg;
}

// Export functions for use in lessons
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createCIVisualizer: createCIVisualizer,
    createSampleSizeCalc: createSampleSizeCalc,
    createTvsZComparison: createTvsZComparison,
    createCICoverageSimulation: createCICoverageSimulation
  };
}
