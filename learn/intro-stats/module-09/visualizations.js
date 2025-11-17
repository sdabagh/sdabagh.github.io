/**
 * Interactive Visualizations for Module 9: Two-Sample Hypothesis Testing
 *
 * This file contains functions to create interactive SVG visualizations
 * for two-sample t-tests, paired samples, and two-proportion tests.
 *
 * All visualizations are pure JavaScript/SVG with no external dependencies.
 */

// ============================================================================
// 1. TWO-SAMPLE T-DISTRIBUTION COMPARISON
// ============================================================================

/**
 * Creates an interactive visualization comparing two normal distributions
 * for independent two-sample t-tests
 *
 * @param {string} containerId - ID of the container element
 * @param {object} params - {mean1, mean2, sd1, sd2, n1, n2, alpha}
 */
function createTwoSampleComparison(containerId, params = {}) {
  const {
    mean1 = 50,
    mean2 = 55,
    sd1 = 8,
    sd2 = 10,
    n1 = 30,
    n2 = 35,
    alpha = 0.05
  } = params;

  const container = document.getElementById(containerId);
  if (!container) return;

  // SVG dimensions
  const width = 600;
  const height = 400;
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Clear container
  container.innerHTML = '';

  // Create SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.style.border = '1px solid #ccc';
  svg.style.borderRadius = '8px';
  svg.style.background = '#f9f9f9';
  container.appendChild(svg);

  // Title
  const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  title.setAttribute('x', width / 2);
  title.setAttribute('y', 25);
  title.setAttribute('text-anchor', 'middle');
  title.setAttribute('font-size', '16');
  title.setAttribute('font-weight', 'bold');
  title.setAttribute('fill', '#2C5F7C');
  title.textContent = 'Two Independent Samples Comparison';
  svg.appendChild(title);

  // Calculate x-axis range
  const xMin = Math.min(mean1 - 3 * sd1, mean2 - 3 * sd2);
  const xMax = Math.max(mean1 + 3 * sd1, mean2 + 3 * sd2);

  // Scaling functions
  const xScale = (x) => margin.left + ((x - xMin) / (xMax - xMin)) * plotWidth;
  const yScale = (y) => margin.top + plotHeight - (y * plotHeight * 2);

  // Normal distribution function
  const normalPDF = (x, mean, sd) => {
    const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(sd, 2));
    return (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
  };

  // Draw curves
  const drawCurve = (mean, sd, color, label) => {
    const points = [];
    const step = (xMax - xMin) / 200;

    for (let x = xMin; x <= xMax; x += step) {
      const y = normalPDF(x, mean, sd);
      points.push(`${xScale(x)},${yScale(y)}`);
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M' + points.join(' L'));
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '2.5');
    path.setAttribute('opacity', '0.8');
    svg.appendChild(path);

    // Add mean line
    const meanLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    meanLine.setAttribute('x1', xScale(mean));
    meanLine.setAttribute('y1', margin.top);
    meanLine.setAttribute('x2', xScale(mean));
    meanLine.setAttribute('y2', margin.top + plotHeight);
    meanLine.setAttribute('stroke', color);
    meanLine.setAttribute('stroke-width', '1.5');
    meanLine.setAttribute('stroke-dasharray', '5,3');
    meanLine.setAttribute('opacity', '0.6');
    svg.appendChild(meanLine);

    // Label
    const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    labelText.setAttribute('x', xScale(mean));
    labelText.setAttribute('y', margin.top - 5);
    labelText.setAttribute('text-anchor', 'middle');
    labelText.setAttribute('font-size', '12');
    labelText.setAttribute('fill', color);
    labelText.setAttribute('font-weight', '600');
    labelText.textContent = label;
    svg.appendChild(labelText);
  };

  // Draw both distributions
  drawCurve(mean1, sd1, '#2563eb', `Group 1 (μ₁=${mean1})`);
  drawCurve(mean2, sd2, '#dc2626', `Group 2 (μ₂=${mean2})`);

  // X-axis
  const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  xAxis.setAttribute('x1', margin.left);
  xAxis.setAttribute('y1', margin.top + plotHeight);
  xAxis.setAttribute('x2', margin.left + plotWidth);
  xAxis.setAttribute('y2', margin.top + plotHeight);
  xAxis.setAttribute('stroke', '#333');
  xAxis.setAttribute('stroke-width', '2');
  svg.appendChild(xAxis);

  // X-axis label
  const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  xLabel.setAttribute('x', width / 2);
  xLabel.setAttribute('y', height - 20);
  xLabel.setAttribute('text-anchor', 'middle');
  xLabel.setAttribute('font-size', '12');
  xLabel.setAttribute('fill', '#333');
  xLabel.textContent = 'Value';
  svg.appendChild(xLabel);

  // Add legend
  const legendY = height - 40;

  // Legend for Group 1
  const legend1Line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  legend1Line.setAttribute('x1', margin.left + 10);
  legend1Line.setAttribute('y1', legendY);
  legend1Line.setAttribute('x2', margin.left + 40);
  legend1Line.setAttribute('y2', legendY);
  legend1Line.setAttribute('stroke', '#2563eb');
  legend1Line.setAttribute('stroke-width', '2.5');
  svg.appendChild(legend1Line);

  const legend1Text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  legend1Text.setAttribute('x', margin.left + 45);
  legend1Text.setAttribute('y', legendY + 4);
  legend1Text.setAttribute('font-size', '11');
  legend1Text.setAttribute('fill', '#333');
  legend1Text.textContent = `Group 1: n=${n1}, s=${sd1}`;
  svg.appendChild(legend1Text);

  // Legend for Group 2
  const legend2Line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  legend2Line.setAttribute('x1', margin.left + 200);
  legend2Line.setAttribute('y1', legendY);
  legend2Line.setAttribute('x2', margin.left + 230);
  legend2Line.setAttribute('y2', legendY);
  legend2Line.setAttribute('stroke', '#dc2626');
  legend2Line.setAttribute('stroke-width', '2.5');
  svg.appendChild(legend2Line);

  const legend2Text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  legend2Text.setAttribute('x', margin.left + 235);
  legend2Text.setAttribute('y', legendY + 4);
  legend2Text.setAttribute('font-size', '11');
  legend2Text.setAttribute('fill', '#333');
  legend2Text.textContent = `Group 2: n=${n2}, s=${sd2}`;
  svg.appendChild(legend2Text);

  console.log('Two-sample comparison visualization created');
}

// ============================================================================
// 2. PAIRED VS INDEPENDENT SAMPLES VISUALIZATION
// ============================================================================

/**
 * Creates a visualization showing the difference between paired and
 * independent samples designs
 *
 * @param {string} containerId - ID of the container element
 */
function createPairedVsIndependentViz(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Sample data (before and after)
  const data = [
    { subject: 1, before: 65, after: 72 },
    { subject: 2, before: 70, after: 75 },
    { subject: 3, before: 80, after: 85 },
    { subject: 4, before: 55, after: 63 },
    { subject: 5, before: 90, after: 92 },
    { subject: 6, before: 75, after: 80 }
  ];

  const width = 600;
  const height = 400;
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };

  container.innerHTML = '';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.style.border = '1px solid #ccc';
  svg.style.borderRadius = '8px';
  svg.style.background = '#f9f9f9';
  container.appendChild(svg);

  // Title
  const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  title.setAttribute('x', width / 2);
  title.setAttribute('y', 25);
  title.setAttribute('text-anchor', 'middle');
  title.setAttribute('font-size', '16');
  title.setAttribute('font-weight', 'bold');
  title.setAttribute('fill', '#2C5F7C');
  title.textContent = 'Paired Samples: Before vs After';
  svg.appendChild(title);

  // Scaling
  const xScale = (i) => margin.left + (i * (width - margin.left - margin.right) / (data.length + 1));
  const yMin = 50;
  const yMax = 95;
  const yScale = (y) => margin.top + height - margin.bottom -
    ((y - yMin) / (yMax - yMin)) * (height - margin.top - margin.bottom);

  // Y-axis
  const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  yAxis.setAttribute('x1', margin.left);
  yAxis.setAttribute('y1', margin.top);
  yAxis.setAttribute('x2', margin.left);
  yAxis.setAttribute('y2', height - margin.bottom);
  yAxis.setAttribute('stroke', '#333');
  yAxis.setAttribute('stroke-width', '2');
  svg.appendChild(yAxis);

  // X-axis
  const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  xAxis.setAttribute('x1', margin.left);
  xAxis.setAttribute('y1', height - margin.bottom);
  xAxis.setAttribute('x2', width - margin.right);
  xAxis.setAttribute('y2', height - margin.bottom);
  xAxis.setAttribute('stroke', '#333');
  xAxis.setAttribute('stroke-width', '2');
  svg.appendChild(xAxis);

  // Plot paired data
  data.forEach((d, i) => {
    const x = xScale(i + 1);

    // Connection line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x);
    line.setAttribute('y1', yScale(d.before));
    line.setAttribute('x2', x);
    line.setAttribute('y2', yScale(d.after));
    line.setAttribute('stroke', '#94a3b8');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('opacity', '0.6');
    svg.appendChild(line);

    // Before point
    const beforeCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    beforeCircle.setAttribute('cx', x);
    beforeCircle.setAttribute('cy', yScale(d.before));
    beforeCircle.setAttribute('r', '5');
    beforeCircle.setAttribute('fill', '#2563eb');
    beforeCircle.setAttribute('stroke', '#1e40af');
    beforeCircle.setAttribute('stroke-width', '1.5');
    svg.appendChild(beforeCircle);

    // After point
    const afterCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    afterCircle.setAttribute('cx', x);
    afterCircle.setAttribute('cy', yScale(d.after));
    afterCircle.setAttribute('r', '5');
    afterCircle.setAttribute('fill', '#dc2626');
    afterCircle.setAttribute('stroke', '#991b1b');
    afterCircle.setAttribute('stroke-width', '1.5');
    svg.appendChild(afterCircle);

    // Subject label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', height - margin.bottom + 20);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '10');
    label.setAttribute('fill', '#333');
    label.textContent = `S${d.subject}`;
    svg.appendChild(label);
  });

  // Y-axis label
  const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  yLabel.setAttribute('x', 20);
  yLabel.setAttribute('y', height / 2);
  yLabel.setAttribute('text-anchor', 'middle');
  yLabel.setAttribute('font-size', '12');
  yLabel.setAttribute('fill', '#333');
  yLabel.setAttribute('transform', `rotate(-90, 20, ${height / 2})`);
  yLabel.textContent = 'Score';
  svg.appendChild(yLabel);

  // Legend
  const legendY = height - 20;

  const beforeLegend = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  beforeLegend.setAttribute('cx', width / 2 - 60);
  beforeLegend.setAttribute('cy', legendY);
  beforeLegend.setAttribute('r', '5');
  beforeLegend.setAttribute('fill', '#2563eb');
  svg.appendChild(beforeLegend);

  const beforeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  beforeText.setAttribute('x', width / 2 - 50);
  beforeText.setAttribute('y', legendY + 4);
  beforeText.setAttribute('font-size', '11');
  beforeText.textContent = 'Before';
  svg.appendChild(beforeText);

  const afterLegend = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  afterLegend.setAttribute('cx', width / 2 + 20);
  afterLegend.setAttribute('cy', legendY);
  afterLegend.setAttribute('r', '5');
  afterLegend.setAttribute('fill', '#dc2626');
  svg.appendChild(afterLegend);

  const afterText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  afterText.setAttribute('x', width / 2 + 30);
  afterText.setAttribute('y', legendY + 4);
  afterText.setAttribute('font-size', '11');
  afterText.textContent = 'After';
  svg.appendChild(afterText);

  console.log('Paired vs independent visualization created');
}

// ============================================================================
// 3. TWO-PROPORTION COMPARISON VISUALIZATION
// ============================================================================

/**
 * Creates a bar chart comparing two proportions
 *
 * @param {string} containerId - ID of the container element
 * @param {object} params - {p1, p2, n1, n2, label1, label2}
 */
function createTwoProportionComparison(containerId, params = {}) {
  const {
    p1 = 0.60,
    p2 = 0.50,
    n1 = 200,
    n2 = 180,
    label1 = 'Group 1',
    label2 = 'Group 2'
  } = params;

  const container = document.getElementById(containerId);
  if (!container) return;

  const width = 500;
  const height = 400;
  const margin = { top: 40, right: 40, bottom: 80, left: 60 };

  container.innerHTML = '';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.style.border = '1px solid #ccc';
  svg.style.borderRadius = '8px';
  svg.style.background = '#f9f9f9';
  container.appendChild(svg);

  // Title
  const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  title.setAttribute('x', width / 2);
  title.setAttribute('y', 25);
  title.setAttribute('text-anchor', 'middle');
  title.setAttribute('font-size', '16');
  title.setAttribute('font-weight', 'bold');
  title.setAttribute('fill', '#2C5F7C');
  title.textContent = 'Comparing Two Proportions';
  svg.appendChild(title);

  // Calculate pooled proportion
  const pooled = ((n1 * p1) + (n2 * p2)) / (n1 + n2);

  // Axes
  const plotHeight = height - margin.top - margin.bottom;
  const plotWidth = width - margin.left - margin.right;

  // Y-axis
  const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  yAxis.setAttribute('x1', margin.left);
  yAxis.setAttribute('y1', margin.top);
  yAxis.setAttribute('x2', margin.left);
  yAxis.setAttribute('y2', height - margin.bottom);
  yAxis.setAttribute('stroke', '#333');
  yAxis.setAttribute('stroke-width', '2');
  svg.appendChild(yAxis);

  // X-axis
  const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  xAxis.setAttribute('x1', margin.left);
  xAxis.setAttribute('y1', height - margin.bottom);
  xAxis.setAttribute('x2', width - margin.right);
  xAxis.setAttribute('y2', height - margin.bottom);
  xAxis.setAttribute('stroke', '#333');
  xAxis.setAttribute('stroke-width', '2');
  svg.appendChild(xAxis);

  // Y-axis ticks and labels
  for (let i = 0; i <= 10; i++) {
    const y = margin.top + plotHeight - (i / 10) * plotHeight;

    // Tick
    const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tick.setAttribute('x1', margin.left - 5);
    tick.setAttribute('y1', y);
    tick.setAttribute('x2', margin.left);
    tick.setAttribute('y2', y);
    tick.setAttribute('stroke', '#333');
    svg.appendChild(tick);

    // Label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', margin.left - 10);
    label.setAttribute('y', y + 4);
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('font-size', '10');
    label.textContent = `${(i * 10)}%`;
    svg.appendChild(label);
  }

  // Bar width and positions
  const barWidth = 80;
  const x1 = margin.left + plotWidth / 3 - barWidth / 2;
  const x2 = margin.left + 2 * plotWidth / 3 - barWidth / 2;

  // Draw bars
  const drawBar = (x, proportion, color, label, n) => {
    const barHeight = (proportion * plotHeight);
    const y = height - margin.bottom - barHeight;

    // Bar
    const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bar.setAttribute('x', x);
    bar.setAttribute('y', y);
    bar.setAttribute('width', barWidth);
    bar.setAttribute('height', barHeight);
    bar.setAttribute('fill', color);
    bar.setAttribute('stroke', '#333');
    bar.setAttribute('stroke-width', '1.5');
    bar.setAttribute('opacity', '0.8');
    svg.appendChild(bar);

    // Percentage label on bar
    const pctLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    pctLabel.setAttribute('x', x + barWidth / 2);
    pctLabel.setAttribute('y', y - 8);
    pctLabel.setAttribute('text-anchor', 'middle');
    pctLabel.setAttribute('font-size', '14');
    pctLabel.setAttribute('font-weight', 'bold');
    pctLabel.setAttribute('fill', color);
    pctLabel.textContent = `${(proportion * 100).toFixed(1)}%`;
    svg.appendChild(pctLabel);

    // Group label
    const groupLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    groupLabel.setAttribute('x', x + barWidth / 2);
    groupLabel.setAttribute('y', height - margin.bottom + 20);
    groupLabel.setAttribute('text-anchor', 'middle');
    groupLabel.setAttribute('font-size', '12');
    groupLabel.setAttribute('font-weight', '600');
    groupLabel.textContent = label;
    svg.appendChild(groupLabel);

    // Sample size
    const nLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    nLabel.setAttribute('x', x + barWidth / 2);
    nLabel.setAttribute('y', height - margin.bottom + 35);
    nLabel.setAttribute('text-anchor', 'middle');
    nLabel.setAttribute('font-size', '10');
    nLabel.setAttribute('fill', '#666');
    nLabel.textContent = `(n = ${n})`;
    svg.appendChild(nLabel);
  };

  drawBar(x1, p1, '#2563eb', label1, n1);
  drawBar(x2, p2, '#dc2626', label2, n2);

  // Pooled proportion line
  const pooledY = height - margin.bottom - (pooled * plotHeight);
  const pooledLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  pooledLine.setAttribute('x1', margin.left + 20);
  pooledLine.setAttribute('y1', pooledY);
  pooledLine.setAttribute('x2', width - margin.right - 20);
  pooledLine.setAttribute('y2', pooledY);
  pooledLine.setAttribute('stroke', '#16a34a');
  pooledLine.setAttribute('stroke-width', '2');
  pooledLine.setAttribute('stroke-dasharray', '5,3');
  svg.appendChild(pooledLine);

  const pooledLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  pooledLabel.setAttribute('x', width - margin.right);
  pooledLabel.setAttribute('y', pooledY - 5);
  pooledLabel.setAttribute('text-anchor', 'end');
  pooledLabel.setAttribute('font-size', '11');
  pooledLabel.setAttribute('fill', '#16a34a');
  pooledLabel.setAttribute('font-weight', '600');
  pooledLabel.textContent = `Pooled: ${(pooled * 100).toFixed(1)}%`;
  svg.appendChild(pooledLabel);

  // Y-axis label
  const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  yLabel.setAttribute('x', 20);
  yLabel.setAttribute('y', height / 2);
  yLabel.setAttribute('text-anchor', 'middle');
  yLabel.setAttribute('font-size', '12');
  yLabel.setAttribute('fill', '#333');
  yLabel.setAttribute('transform', `rotate(-90, 20, ${height / 2})`);
  yLabel.textContent = 'Proportion (%)';
  svg.appendChild(yLabel);

  console.log('Two-proportion comparison visualization created');
}

// ============================================================================
// 4. DECISION TREE FLOWCHART (Interactive)
// ============================================================================

/**
 * Creates an interactive decision tree for choosing the right test
 *
 * @param {string} containerId - ID of the container element
 */
function createDecisionTreeFlowchart(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const width = 700;
  const height = 500;

  container.innerHTML = '';
  container.style.position = 'relative';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.style.border = '1px solid #ccc';
  svg.style.borderRadius = '8px';
  svg.style.background = '#f9f9f9';
  container.appendChild(svg);

  // Title
  const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  title.setAttribute('x', width / 2);
  title.setAttribute('y', 30);
  title.setAttribute('text-anchor', 'middle');
  title.setAttribute('font-size', '18');
  title.setAttribute('font-weight', 'bold');
  title.setAttribute('fill', '#2C5F7C');
  title.textContent = 'Decision Tree: Choosing the Right Test';
  svg.appendChild(title);

  // Helper function to create a box
  const createBox = (x, y, w, h, text, color = '#2C5F7C', bgColor = 'white') => {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', w);
    rect.setAttribute('height', h);
    rect.setAttribute('fill', bgColor);
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', '2');
    rect.setAttribute('rx', '8');
    svg.appendChild(rect);

    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textEl.setAttribute('x', x + w / 2);
    textEl.setAttribute('y', y + h / 2 + 5);
    textEl.setAttribute('text-anchor', 'middle');
    textEl.setAttribute('font-size', '12');
    textEl.setAttribute('font-weight', '600');
    textEl.setAttribute('fill', '#333');

    // Handle multi-line text
    const lines = text.split('\n');
    if (lines.length > 1) {
      lines.forEach((line, i) => {
        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.setAttribute('x', x + w / 2);
        tspan.setAttribute('dy', i === 0 ? -6 * (lines.length - 1) : 14);
        tspan.textContent = line;
        textEl.appendChild(tspan);
      });
    } else {
      textEl.textContent = text;
    }

    svg.appendChild(textEl);
  };

  // Helper to draw arrow
  const drawArrow = (x1, y1, x2, y2, label = '') => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', '#666');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('marker-end', 'url(#arrowhead)');
    svg.appendChild(line);

    if (label) {
      const labelEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      labelEl.setAttribute('x', (x1 + x2) / 2);
      labelEl.setAttribute('y', (y1 + y2) / 2 - 5);
      labelEl.setAttribute('text-anchor', 'middle');
      labelEl.setAttribute('font-size', '10');
      labelEl.setAttribute('fill', '#666');
      labelEl.setAttribute('font-weight', '600');
      labelEl.textContent = label;
      svg.appendChild(labelEl);
    }
  };

  // Define arrowhead marker
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.setAttribute('id', 'arrowhead');
  marker.setAttribute('markerWidth', '10');
  marker.setAttribute('markerHeight', '10');
  marker.setAttribute('refX', '9');
  marker.setAttribute('refY', '3');
  marker.setAttribute('orient', 'auto');
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.setAttribute('points', '0 0, 10 3, 0 6');
  polygon.setAttribute('fill', '#666');
  marker.appendChild(polygon);
  defs.appendChild(marker);
  svg.appendChild(defs);

  // Build the flowchart
  createBox(250, 60, 200, 40, 'Means or Proportions?', '#D97D54', '#fff9e6');

  drawArrow(250, 80, 150, 120, 'Means');
  drawArrow(450, 80, 550, 120, 'Proportions');

  // Means branch
  createBox(50, 120, 200, 40, 'How many samples?', '#2C5F7C', '#e8f5e9');

  drawArrow(150, 160, 100, 200, 'One');
  drawArrow(150, 160, 200, 200, 'Two');

  createBox(25, 200, 150, 50, 'One-sample\nt-test', '#16a34a', '#d4edda');

  createBox(150, 200, 200, 40, 'Independent or Paired?', '#2C5F7C', '#e8f5e9');

  drawArrow(200, 240, 150, 280, 'Independent');
  drawArrow(300, 240, 350, 280, 'Paired');

  createBox(50, 280, 200, 60, 'Independent\nTwo-Sample\nt-test', '#16a34a', '#d4edda');

  createBox(300, 280, 150, 60, 'Paired\nt-test', '#16a34a', '#d4edda');

  // Proportions branch
  createBox(500, 120, 150, 40, 'How many samples?', '#2C5F7C', '#e8f5e9');

  drawArrow(575, 160, 525, 200, 'One');
  drawArrow(575, 160, 625, 200, 'Two');

  createBox(450, 200, 150, 50, 'One-sample\nz-test (prop)', '#16a34a', '#d4edda');

  createBox(600, 200, 180, 50, 'Two-Proportion\nz-test', '#16a34a', '#d4edda');

  console.log('Decision tree flowchart created');
}

// ============================================================================
// Initialize visualizations when DOM is ready
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('Module 9 visualizations loaded and ready');

  // You can auto-initialize visualizations by calling:
  // createTwoSampleComparison('viz-container-1');
  // createPairedVsIndependentViz('viz-container-2');
  // createTwoProportionComparison('viz-container-3');
  // createDecisionTreeFlowchart('viz-container-4');
});

// Export functions for use in HTML
if (typeof window !== 'undefined') {
  window.createTwoSampleComparison = createTwoSampleComparison;
  window.createPairedVsIndependentViz = createPairedVsIndependentViz;
  window.createTwoProportionComparison = createTwoProportionComparison;
  window.createDecisionTreeFlowchart = createDecisionTreeFlowchart;
}
