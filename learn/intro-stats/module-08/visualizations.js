/**
 * visualizations.js
 * Interactive visualizations for Module 8: Hypothesis Testing
 *
 * Includes:
 * 1. Normal distribution with critical regions (two-tailed, right-tailed, left-tailed)
 * 2. Type I and Type II error visualization
 * 3. Power curve demonstration
 * 4. P-value visualization
 * 5. Interactive test statistic calculator
 */

// ============================================================
// 1. NORMAL DISTRIBUTION WITH CRITICAL REGIONS
// ============================================================

function drawHypothesisTestDistribution(containerId, testType, alpha) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const width = 600;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 60, left: 60 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Clear existing SVG
  container.innerHTML = '';

  // Create SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.style.border = '1px solid #ccc';
  svg.style.background = '#fff';
  container.appendChild(svg);

  // Generate normal distribution data
  const numPoints = 200;
  const xMin = -4;
  const xMax = 4;
  const points = [];

  for (let i = 0; i <= numPoints; i++) {
    const x = xMin + (xMax - xMin) * (i / numPoints);
    const y = normalPDF(x, 0, 1);
    points.push({ x, y });
  }

  // Scales
  const xScale = (x) => margin.left + ((x - xMin) / (xMax - xMin)) * plotWidth;
  const yScale = (y) => margin.top + plotHeight - (y / 0.4) * plotHeight;

  // Draw axes
  const axisGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

  // X-axis
  const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  xAxis.setAttribute('x1', margin.left);
  xAxis.setAttribute('y1', yScale(0));
  xAxis.setAttribute('x2', margin.left + plotWidth);
  xAxis.setAttribute('y2', yScale(0));
  xAxis.setAttribute('stroke', '#333');
  xAxis.setAttribute('stroke-width', '2');
  axisGroup.appendChild(xAxis);

  // Y-axis
  const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  yAxis.setAttribute('x1', margin.left);
  yAxis.setAttribute('y1', margin.top);
  yAxis.setAttribute('x2', margin.left);
  yAxis.setAttribute('y2', margin.top + plotHeight);
  yAxis.setAttribute('stroke', '#333');
  yAxis.setAttribute('stroke-width', '2');
  axisGroup.appendChild(yAxis);

  svg.appendChild(axisGroup);

  // Determine critical values based on test type and alpha
  let criticalValues = [];
  if (testType === 'two-tailed') {
    const zCrit = getZCritical(alpha / 2);
    criticalValues = [-zCrit, zCrit];
  } else if (testType === 'right-tailed') {
    const zCrit = getZCritical(alpha);
    criticalValues = [zCrit];
  } else if (testType === 'left-tailed') {
    const zCrit = getZCritical(alpha);
    criticalValues = [-zCrit];
  }

  // Draw shaded critical regions
  if (testType === 'two-tailed') {
    // Left tail
    drawShadedRegion(svg, points, xMin, criticalValues[0], xScale, yScale, '#ffcccc');
    // Right tail
    drawShadedRegion(svg, points, criticalValues[1], xMax, xScale, yScale, '#ffcccc');
  } else if (testType === 'right-tailed') {
    drawShadedRegion(svg, points, criticalValues[0], xMax, xScale, yScale, '#ffcccc');
  } else if (testType === 'left-tailed') {
    drawShadedRegion(svg, points, xMin, criticalValues[0], xScale, yScale, '#ffcccc');
  }

  // Draw normal curve
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  let pathData = `M ${xScale(points[0].x)} ${yScale(points[0].y)}`;
  for (let i = 1; i < points.length; i++) {
    pathData += ` L ${xScale(points[i].x)} ${yScale(points[i].y)}`;
  }
  path.setAttribute('d', pathData);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#2C5F7C');
  path.setAttribute('stroke-width', '2');
  svg.appendChild(path);

  // Draw critical value lines
  criticalValues.forEach(cv => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', xScale(cv));
    line.setAttribute('y1', margin.top);
    line.setAttribute('x2', xScale(cv));
    line.setAttribute('y2', margin.top + plotHeight);
    line.setAttribute('stroke', '#dc3545');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '5,5');
    svg.appendChild(line);

    // Label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', xScale(cv));
    label.setAttribute('y', margin.top + plotHeight + 20);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', '#dc3545');
    label.setAttribute('font-size', '12');
    label.setAttribute('font-weight', 'bold');
    label.textContent = cv.toFixed(3);
    svg.appendChild(label);
  });

  // Title
  const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  title.setAttribute('x', width / 2);
  title.setAttribute('y', margin.top - 5);
  title.setAttribute('text-anchor', 'middle');
  title.setAttribute('font-size', '14');
  title.setAttribute('font-weight', 'bold');
  title.setAttribute('fill', '#2C5F7C');
  title.textContent = `${capitalize(testType)} Test (α = ${alpha})`;
  svg.appendChild(title);

  // X-axis label
  const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  xLabel.setAttribute('x', width / 2);
  xLabel.setAttribute('y', height - 10);
  xLabel.setAttribute('text-anchor', 'middle');
  xLabel.setAttribute('font-size', '12');
  xLabel.textContent = 'z-score';
  svg.appendChild(xLabel);

  // Legend for shaded region
  const legend = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  legend.setAttribute('x', width - margin.right - 10);
  legend.setAttribute('y', margin.top + 20);
  legend.setAttribute('text-anchor', 'end');
  legend.setAttribute('font-size', '11');
  legend.setAttribute('fill', '#721c24');
  legend.textContent = 'Rejection Region';
  svg.appendChild(legend);
}

// ============================================================
// 2. TYPE I AND TYPE II ERROR VISUALIZATION
// ============================================================

function drawErrorVisualization(containerId, effectSize, alpha) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const width = 700;
  const height = 300;
  const margin = { top: 40, right: 20, bottom: 60, left: 60 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  container.innerHTML = '';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.style.border = '1px solid #ccc';
  svg.style.background = '#fff';
  container.appendChild(svg);

  // Two distributions: null (μ=0) and alternative (μ=effectSize)
  const xMin = -4;
  const xMax = 4 + effectSize;
  const numPoints = 200;

  // Critical value for right-tailed test
  const criticalValue = getZCritical(alpha);

  // Scales
  const xScale = (x) => margin.left + ((x - xMin) / (xMax - xMin)) * plotWidth;
  const yScale = (y) => margin.top + plotHeight - (y / 0.4) * plotHeight;

  // Generate points for H0 distribution (μ=0)
  const h0Points = [];
  for (let i = 0; i <= numPoints; i++) {
    const x = xMin + (xMax - xMin) * (i / numPoints);
    const y = normalPDF(x, 0, 1);
    h0Points.push({ x, y });
  }

  // Generate points for Ha distribution (μ=effectSize)
  const haPoints = [];
  for (let i = 0; i <= numPoints; i++) {
    const x = xMin + (xMax - xMin) * (i / numPoints);
    const y = normalPDF(x, effectSize, 1);
    haPoints.push({ x, y });
  }

  // Draw axes
  const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  xAxis.setAttribute('x1', margin.left);
  xAxis.setAttribute('y1', yScale(0));
  xAxis.setAttribute('x2', margin.left + plotWidth);
  xAxis.setAttribute('y2', yScale(0));
  xAxis.setAttribute('stroke', '#333');
  xAxis.setAttribute('stroke-width', '2');
  svg.appendChild(xAxis);

  // Type I error (α) - area in H0 distribution beyond critical value
  drawShadedRegion(svg, h0Points, criticalValue, xMax, xScale, yScale, 'rgba(255, 200, 200, 0.6)');

  // Type II error (β) - area in Ha distribution before critical value
  drawShadedRegion(svg, haPoints, xMin, criticalValue, xScale, yScale, 'rgba(255, 240, 200, 0.6)');

  // Power - area in Ha distribution beyond critical value
  drawShadedRegion(svg, haPoints, criticalValue, xMax, xScale, yScale, 'rgba(200, 255, 200, 0.6)');

  // Draw H0 distribution
  const h0Path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  let pathData = `M ${xScale(h0Points[0].x)} ${yScale(h0Points[0].y)}`;
  for (let i = 1; i < h0Points.length; i++) {
    pathData += ` L ${xScale(h0Points[i].x)} ${yScale(h0Points[i].y)}`;
  }
  h0Path.setAttribute('d', pathData);
  h0Path.setAttribute('fill', 'none');
  h0Path.setAttribute('stroke', '#2C5F7C');
  h0Path.setAttribute('stroke-width', '2');
  svg.appendChild(h0Path);

  // Draw Ha distribution
  const haPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pathData = `M ${xScale(haPoints[0].x)} ${yScale(haPoints[0].y)}`;
  for (let i = 1; i < haPoints.length; i++) {
    pathData += ` L ${xScale(haPoints[i].x)} ${yScale(haPoints[i].y)}`;
  }
  haPath.setAttribute('d', pathData);
  haPath.setAttribute('fill', 'none');
  haPath.setAttribute('stroke', '#D97D54');
  haPath.setAttribute('stroke-width', '2');
  svg.appendChild(haPath);

  // Critical value line
  const cvLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  cvLine.setAttribute('x1', xScale(criticalValue));
  cvLine.setAttribute('y1', margin.top);
  cvLine.setAttribute('x2', xScale(criticalValue));
  cvLine.setAttribute('y2', margin.top + plotHeight);
  cvLine.setAttribute('stroke', '#dc3545');
  cvLine.setAttribute('stroke-width', '2');
  cvLine.setAttribute('stroke-dasharray', '5,5');
  svg.appendChild(cvLine);

  // Labels
  const h0Label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  h0Label.setAttribute('x', xScale(-0.5));
  h0Label.setAttribute('y', margin.top + 20);
  h0Label.setAttribute('fill', '#2C5F7C');
  h0Label.setAttribute('font-weight', 'bold');
  h0Label.textContent = 'H₀ True';
  svg.appendChild(h0Label);

  const haLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  haLabel.setAttribute('x', xScale(effectSize + 0.5));
  haLabel.setAttribute('y', margin.top + 20);
  haLabel.setAttribute('fill', '#D97D54');
  haLabel.setAttribute('font-weight', 'bold');
  haLabel.textContent = 'H₀ False';
  svg.appendChild(haLabel);

  // Title
  const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  title.setAttribute('x', width / 2);
  title.setAttribute('y', 20);
  title.setAttribute('text-anchor', 'middle');
  title.setAttribute('font-size', '14');
  title.setAttribute('font-weight', 'bold');
  title.setAttribute('fill', '#2C5F7C');
  title.textContent = 'Type I Error (α), Type II Error (β), and Power (1-β)';
  svg.appendChild(title);

  // Legend
  const legendY = margin.top + plotHeight + 30;
  drawLegendItem(svg, margin.left, legendY, 'rgba(255, 200, 200, 0.8)', 'Type I Error (α)');
  drawLegendItem(svg, margin.left + 150, legendY, 'rgba(255, 240, 200, 0.8)', 'Type II Error (β)');
  drawLegendItem(svg, margin.left + 300, legendY, 'rgba(200, 255, 200, 0.8)', 'Power (1-β)');
}

// ============================================================
// 3. P-VALUE VISUALIZATION
// ============================================================

function drawPValueVisualization(containerId, testStatistic, testType) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const width = 600;
  const height = 300;
  const margin = { top: 40, right: 20, bottom: 60, left: 60 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  container.innerHTML = '';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.style.border = '1px solid #ccc';
  svg.style.background = '#fff';
  container.appendChild(svg);

  const xMin = -4;
  const xMax = 4;
  const numPoints = 200;

  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const x = xMin + (xMax - xMin) * (i / numPoints);
    const y = normalPDF(x, 0, 1);
    points.push({ x, y });
  }

  const xScale = (x) => margin.left + ((x - xMin) / (xMax - xMin)) * plotWidth;
  const yScale = (y) => margin.top + plotHeight - (y / 0.4) * plotHeight;

  // Draw axes
  const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  xAxis.setAttribute('x1', margin.left);
  xAxis.setAttribute('y1', yScale(0));
  xAxis.setAttribute('x2', margin.left + plotWidth);
  xAxis.setAttribute('y2', yScale(0));
  xAxis.setAttribute('stroke', '#333');
  xAxis.setAttribute('stroke-width', '2');
  svg.appendChild(xAxis);

  // Shade p-value region based on test type
  if (testType === 'two-tailed') {
    const absZ = Math.abs(testStatistic);
    drawShadedRegion(svg, points, -absZ, -xMin, xScale, yScale, 'rgba(100, 150, 255, 0.3)');
    drawShadedRegion(svg, points, absZ, xMax, xScale, yScale, 'rgba(100, 150, 255, 0.3)');
  } else if (testType === 'right-tailed') {
    drawShadedRegion(svg, points, testStatistic, xMax, xScale, yScale, 'rgba(100, 150, 255, 0.3)');
  } else if (testType === 'left-tailed') {
    drawShadedRegion(svg, points, xMin, testStatistic, xScale, yScale, 'rgba(100, 150, 255, 0.3)');
  }

  // Draw normal curve
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  let pathData = `M ${xScale(points[0].x)} ${yScale(points[0].y)}`;
  for (let i = 1; i < points.length; i++) {
    pathData += ` L ${xScale(points[i].x)} ${yScale(points[i].y)}`;
  }
  path.setAttribute('d', pathData);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#2C5F7C');
  path.setAttribute('stroke-width', '2');
  svg.appendChild(path);

  // Draw test statistic line
  const tsLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  tsLine.setAttribute('x1', xScale(testStatistic));
  tsLine.setAttribute('y1', margin.top);
  tsLine.setAttribute('x2', xScale(testStatistic));
  tsLine.setAttribute('y2', margin.top + plotHeight);
  tsLine.setAttribute('stroke', '#28A745');
  tsLine.setAttribute('stroke-width', '2');
  svg.appendChild(tsLine);

  // Calculate p-value
  let pValue;
  if (testType === 'two-tailed') {
    pValue = 2 * (1 - normalCDF(Math.abs(testStatistic)));
  } else if (testType === 'right-tailed') {
    pValue = 1 - normalCDF(testStatistic);
  } else {
    pValue = normalCDF(testStatistic);
  }

  // Title with p-value
  const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  title.setAttribute('x', width / 2);
  title.setAttribute('y', 20);
  title.setAttribute('text-anchor', 'middle');
  title.setAttribute('font-size', '14');
  title.setAttribute('font-weight', 'bold');
  title.setAttribute('fill', '#2C5F7C');
  title.textContent = `P-value = ${pValue.toFixed(4)} (Test Statistic: ${testStatistic.toFixed(2)})`;
  svg.appendChild(title);

  // Label
  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', xScale(testStatistic));
  label.setAttribute('y', margin.top + plotHeight + 20);
  label.setAttribute('text-anchor', 'middle');
  label.setAttribute('fill', '#28A745');
  label.setAttribute('font-weight', 'bold');
  label.textContent = `z = ${testStatistic.toFixed(2)}`;
  svg.appendChild(label);

  // Shaded area label
  const pLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  pLabel.setAttribute('x', width - margin.right - 10);
  pLabel.setAttribute('y', margin.top + 30);
  pLabel.setAttribute('text-anchor', 'end');
  pLabel.setAttribute('font-size', '11');
  pLabel.setAttribute('fill', '#4169E1');
  pLabel.textContent = 'P-value (shaded)';
  svg.appendChild(pLabel);
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Normal probability density function
function normalPDF(x, mean = 0, sd = 1) {
  const exponent = -0.5 * Math.pow((x - mean) / sd, 2);
  return (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
}

// Normal cumulative distribution function (approximation)
function normalCDF(x, mean = 0, sd = 1) {
  const z = (x - mean) / sd;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - prob : prob;
}

// Get critical z-value for given alpha (one-tailed)
function getZCritical(alpha) {
  // Common values
  if (Math.abs(alpha - 0.10) < 0.001) return 1.282;
  if (Math.abs(alpha - 0.05) < 0.001) return 1.645;
  if (Math.abs(alpha - 0.025) < 0.001) return 1.96;
  if (Math.abs(alpha - 0.01) < 0.001) return 2.326;
  if (Math.abs(alpha - 0.005) < 0.001) return 2.576;

  // Approximation for other values
  return Math.sqrt(2) * inverseErf(1 - 2 * alpha);
}

// Inverse error function (approximation)
function inverseErf(x) {
  const a = 0.147;
  const b = 2 / (Math.PI * a) + Math.log(1 - x * x) / 2;
  const sqrt1 = Math.sqrt(b * b - Math.log(1 - x * x) / a);
  const sqrt2 = Math.sqrt(sqrt1 - b);
  return (x < 0 ? -1 : 1) * sqrt2;
}

// Draw shaded region under curve
function drawShadedRegion(svg, points, xStart, xEnd, xScale, yScale, color) {
  const filteredPoints = points.filter(p => p.x >= xStart && p.x <= xEnd);
  if (filteredPoints.length === 0) return;

  let pathData = `M ${xScale(xStart)} ${yScale(0)}`;
  pathData += ` L ${xScale(filteredPoints[0].x)} ${yScale(filteredPoints[0].y)}`;

  for (let i = 1; i < filteredPoints.length; i++) {
    pathData += ` L ${xScale(filteredPoints[i].x)} ${yScale(filteredPoints[i].y)}`;
  }

  pathData += ` L ${xScale(xEnd)} ${yScale(0)}`;
  pathData += ` Z`;

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  path.setAttribute('fill', color);
  path.setAttribute('stroke', 'none');
  svg.appendChild(path);
}

// Draw legend item
function drawLegendItem(svg, x, y, color, text) {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', x);
  rect.setAttribute('y', y - 10);
  rect.setAttribute('width', 15);
  rect.setAttribute('height', 15);
  rect.setAttribute('fill', color);
  rect.setAttribute('stroke', '#333');
  svg.appendChild(rect);

  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', x + 20);
  label.setAttribute('y', y + 2);
  label.setAttribute('font-size', '11');
  label.textContent = text;
  svg.appendChild(label);
}

// Capitalize first letter
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================
// EXPORT FOR USE IN HTML
// ============================================================

// Make functions available globally
window.HypothesisTesting = {
  drawHypothesisTestDistribution,
  drawErrorVisualization,
  drawPValueVisualization
};
