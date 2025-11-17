// Interactive Data Visualizations for Module 4: The Normal Distribution
// Pure JavaScript - no external dependencies

// Utility Functions
function normalPDF(x, mu, sigma) {
  const coefficient = 1 / (sigma * Math.sqrt(2 * Math.PI));
  const exponent = -Math.pow(x - mu, 2) / (2 * Math.pow(sigma, 2));
  return coefficient * Math.exp(exponent);
}

function normalCDF(x, mu, sigma) {
  // Approximation of cumulative distribution function
  const z = (x - mu) / sigma;
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

function erf(x) {
  // Error function approximation
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

// Chart 1: Normal Distribution with Empirical Rule
// Shows bell curve with shaded regions for 68%, 95%, 99.7%
function createEmpiricalRuleChart(containerId) {
  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 700);
  const height = 450;

  const padding = { top: 60, right: 20, bottom: 80, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const mu = 0;
  const sigma = 1;

  const xMin = -4;
  const xMax = 4;
  const xScale = chartWidth / (xMax - xMin);

  const points = [];
  for (let x = xMin; x <= xMax; x += 0.1) {
    points.push({ x, y: normalPDF(x, mu, sigma) });
  }

  const yMax = Math.max(...points.map(p => p.y)) * 1.1;
  const yScale = chartHeight / yMax;

  let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

  // Title
  svg += `<text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" fill="#2D2D2D">Normal Distribution: Empirical Rule (68-95-99.7)</text>`;
  svg += `<text x="${width/2}" y="45" text-anchor="middle" font-size="12" fill="#666">Standard Normal: μ = 0, σ = 1</text>`;

  // Shaded regions for 99.7% (±3σ)
  const region3Points = points.filter(p => p.x >= -3 && p.x <= 3);
  const path3 = region3Points.map((p, i) => {
    const x = padding.left + (p.x - xMin) * xScale;
    const y = height - padding.bottom - p.y * yScale;
    return i === 0 ? `M ${x} ${height - padding.bottom}` : `L ${x} ${y}`;
  }).join(' ') + ` L ${padding.left + (3 - xMin) * xScale} ${height - padding.bottom} Z`;
  svg += `<path d="${path3}" fill="#e3f2fd" opacity="0.4"/>`;

  // Shaded regions for 95% (±2σ)
  const region2Points = points.filter(p => p.x >= -2 && p.x <= 2);
  const path2 = region2Points.map((p, i) => {
    const x = padding.left + (p.x - xMin) * xScale;
    const y = height - padding.bottom - p.y * yScale;
    return i === 0 ? `M ${x} ${height - padding.bottom}` : `L ${x} ${y}`;
  }).join(' ') + ` L ${padding.left + (2 - xMin) * xScale} ${height - padding.bottom} Z`;
  svg += `<path d="${path2}" fill="#bbdefb" opacity="0.5"/>`;

  // Shaded region for 68% (±1σ)
  const region1Points = points.filter(p => p.x >= -1 && p.x <= 1);
  const path1 = region1Points.map((p, i) => {
    const x = padding.left + (p.x - xMin) * xScale;
    const y = height - padding.bottom - p.y * yScale;
    return i === 0 ? `M ${x} ${height - padding.bottom}` : `L ${x} ${y}`;
  }).join(' ') + ` L ${padding.left + (1 - xMin) * xScale} ${height - padding.bottom} Z`;
  svg += `<path d="${path1}" fill="#90caf9" opacity="0.6"/>`;

  // X-axis
  svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;
  svg += `<text x="${width/2}" y="${height - padding.bottom + 40}" text-anchor="middle" font-size="12" fill="#666">Standard Deviations from Mean</text>`;

  // X-axis ticks and labels
  for (let i = -3; i <= 3; i++) {
    const x = padding.left + (i - xMin) * xScale;
    svg += `<line x1="${x}" y1="${height - padding.bottom}" x2="${x}" y2="${height - padding.bottom + 5}" stroke="#666" stroke-width="1"/>`;
    svg += `<text x="${x}" y="${height - padding.bottom + 20}" text-anchor="middle" font-size="10" fill="#666">${i}σ</text>`;
  }

  // Y-axis
  svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;
  svg += `<text x="20" y="${padding.top + chartHeight/2}" text-anchor="middle" transform="rotate(-90, 20, ${padding.top + chartHeight/2})" font-size="12" fill="#666">Probability Density</text>`;

  // Normal curve
  const curvePath = points.map((p, i) => {
    const x = padding.left + (p.x - xMin) * xScale;
    const y = height - padding.bottom - p.y * yScale;
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');
  svg += `<path d="${curvePath}" stroke="#2C5F7C" stroke-width="3" fill="none"/>`;

  // Labels for regions
  svg += `<text x="${width/2}" y="${height - padding.bottom - 80}" text-anchor="middle" font-size="11" font-weight="600" fill="#1976D2">68%</text>`;
  svg += `<text x="${width/2}" y="${height - padding.bottom - 120}" text-anchor="middle" font-size="11" font-weight="600" fill="#1565C0">95%</text>`;
  svg += `<text x="${width/2}" y="${height - padding.bottom - 160}" text-anchor="middle" font-size="11" font-weight="600" fill="#0D47A1">99.7%</text>`;

  // Legend
  svg += `<rect x="20" y="${height - 60}" width="200" height="40" fill="#f8f9fa" stroke="#ccc" stroke-width="1" rx="4"/>`;
  svg += `<text x="30" y="${height - 42}" font-size="10" fill="#666">Within ±1σ: 68%</text>`;
  svg += `<text x="30" y="${height - 29}" font-size="10" fill="#666">Within ±2σ: 95% | Within ±3σ: 99.7%</text>`;

  svg += `</svg>`;
  container.innerHTML = svg;
}

// Chart 2: Interactive Z-Score Calculator
// User can input value to see z-score visualization
function createZScoreCalculator(containerId) {
  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 700);
  const height = 450;

  let mu = 100;
  let sigma = 15;
  let x = 115;

  function drawChart() {
    const padding = { top: 80, right: 20, bottom: 80, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const xMin = mu - 4 * sigma;
    const xMax = mu + 4 * sigma;
    const xScale = chartWidth / (xMax - xMin);

    const points = [];
    for (let val = xMin; val <= xMax; val += sigma / 10) {
      points.push({ x: val, y: normalPDF(val, mu, sigma) });
    }

    const yMax = Math.max(...points.map(p => p.y)) * 1.1;
    const yScale = chartHeight / yMax;

    const z = ((x - mu) / sigma).toFixed(2);

    let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

    // Title
    svg += `<text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" fill="#2D2D2D">Interactive Z-Score Calculator</text>`;
    svg += `<text x="${width/2}" y="45" text-anchor="middle" font-size="12" fill="#666">μ = ${mu}, σ = ${sigma}</text>`;
    svg += `<text x="${width/2}" y="65" text-anchor="middle" font-size="13" font-weight="600" fill="#D97D54">x = ${x} → z = ${z}</text>`;

    // Axes
    svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;
    svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;

    // X-axis ticks
    for (let i = -3; i <= 3; i++) {
      const val = mu + i * sigma;
      const xPos = padding.left + (val - xMin) * xScale;
      svg += `<line x1="${xPos}" y1="${height - padding.bottom}" x2="${xPos}" y2="${height - padding.bottom + 5}" stroke="#666" stroke-width="1"/>`;
      svg += `<text x="${xPos}" y="${height - padding.bottom + 20}" text-anchor="middle" font-size="10" fill="#666">${val.toFixed(0)}</text>`;
    }

    // Normal curve
    const curvePath = points.map((p, i) => {
      const xPos = padding.left + (p.x - xMin) * xScale;
      const yPos = height - padding.bottom - p.y * yScale;
      return i === 0 ? `M ${xPos} ${yPos}` : `L ${xPos} ${yPos}`;
    }).join(' ');
    svg += `<path d="${curvePath}" stroke="#2C5F7C" stroke-width="3" fill="none"/>`;

    // Highlight selected x value
    const xPos = padding.left + (x - xMin) * xScale;
    const yPos = height - padding.bottom - normalPDF(x, mu, sigma) * yScale;
    svg += `<line x1="${xPos}" y1="${height - padding.bottom}" x2="${xPos}" y2="${yPos}" stroke="#D97D54" stroke-width="2" stroke-dasharray="5,5"/>`;
    svg += `<circle cx="${xPos}" cy="${yPos}" r="6" fill="#D97D54"/>`;

    // Mean line
    const muPos = padding.left + (mu - xMin) * xScale;
    svg += `<line x1="${muPos}" y1="${padding.top}" x2="${muPos}" y2="${height - padding.bottom}" stroke="#28A745" stroke-width="2" stroke-dasharray="3,3"/>`;
    svg += `<text x="${muPos + 10}" y="${padding.top + 20}" font-size="10" fill="#28A745" font-weight="600">μ = ${mu}</text>`;

    svg += `</svg>`;

    return svg;
  }

  container.innerHTML = drawChart();

  // Add controls
  const controlsDiv = document.createElement('div');
  controlsDiv.style.textAlign = 'center';
  controlsDiv.style.marginTop = '15px';
  controlsDiv.innerHTML = `
    <div style="display: inline-flex; gap: 15px; align-items: center; flex-wrap: wrap;">
      <div>
        <label style="font-size: 0.9rem; margin-right: 5px;">x value:</label>
        <input type="number" id="xInput" value="${x}" step="5" style="width: 70px; padding: 5px;">
      </div>
      <div>
        <label style="font-size: 0.9rem; margin-right: 5px;">μ (mean):</label>
        <input type="number" id="muInput" value="${mu}" step="10" style="width: 70px; padding: 5px;">
      </div>
      <div>
        <label style="font-size: 0.9rem; margin-right: 5px;">σ (SD):</label>
        <input type="number" id="sigmaInput" value="${sigma}" step="1" min="1" style="width: 70px; padding: 5px;">
      </div>
      <button id="updateBtn" class="btn btn-primary btn-sm">Update Chart</button>
    </div>
  `;
  container.appendChild(controlsDiv);

  document.getElementById('updateBtn').onclick = () => {
    x = parseFloat(document.getElementById('xInput').value) || 100;
    mu = parseFloat(document.getElementById('muInput').value) || 100;
    sigma = parseFloat(document.getElementById('sigmaInput').value) || 15;
    container.innerHTML = drawChart();
    container.appendChild(controlsDiv);
    document.getElementById('updateBtn').onclick = arguments.callee;
  };
}

// Chart 3: Probability Area Visualizer
// Shows shaded area for different probability questions
function createProbabilityAreaChart(containerId) {
  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 700);
  const height = 450;

  let probType = 'less'; // 'less', 'greater', 'between'
  let zValue = 1.0;
  let zValue2 = -1.0; // For 'between' type

  function drawChart() {
    const padding = { top: 80, right: 20, bottom: 80, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const mu = 0;
    const sigma = 1;
    const xMin = -3.5;
    const xMax = 3.5;
    const xScale = chartWidth / (xMax - xMin);

    const points = [];
    for (let x = xMin; x <= xMax; x += 0.05) {
      points.push({ x, y: normalPDF(x, mu, sigma) });
    }

    const yMax = Math.max(...points.map(p => p.y)) * 1.1;
    const yScale = chartHeight / yMax;

    let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

    // Title
    let titleText = '';
    let prob = 0;
    if (probType === 'less') {
      titleText = `Finding P(Z < ${zValue.toFixed(2)})`;
      prob = normalCDF(zValue, mu, sigma);
    } else if (probType === 'greater') {
      titleText = `Finding P(Z > ${zValue.toFixed(2)})`;
      prob = 1 - normalCDF(zValue, mu, sigma);
    } else {
      const lower = Math.min(zValue, zValue2);
      const upper = Math.max(zValue, zValue2);
      titleText = `Finding P(${lower.toFixed(2)} < Z < ${upper.toFixed(2)})`;
      prob = normalCDF(upper, mu, sigma) - normalCDF(lower, mu, sigma);
    }

    svg += `<text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" fill="#2D2D2D">${titleText}</text>`;
    svg += `<text x="${width/2}" y="50" text-anchor="middle" font-size="14" fill="#D97D54" font-weight="600">Probability = ${prob.toFixed(4)}</text>`;
    svg += `<text x="${width/2}" y="70" text-anchor="middle" font-size="12" fill="#666">Standard Normal Distribution (μ = 0, σ = 1)</text>`;

    // Axes
    svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;
    svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;

    // X-axis ticks
    for (let i = -3; i <= 3; i++) {
      const xPos = padding.left + (i - xMin) * xScale;
      svg += `<line x1="${xPos}" y1="${height - padding.bottom}" x2="${xPos}" y2="${height - padding.bottom + 5}" stroke="#666" stroke-width="1"/>`;
      svg += `<text x="${xPos}" y="${height - padding.bottom + 20}" text-anchor="middle" font-size="10" fill="#666">${i}</text>`;
    }

    // Shaded area
    let shadedPoints = [];
    if (probType === 'less') {
      shadedPoints = points.filter(p => p.x <= zValue);
    } else if (probType === 'greater') {
      shadedPoints = points.filter(p => p.x >= zValue);
    } else {
      const lower = Math.min(zValue, zValue2);
      const upper = Math.max(zValue, zValue2);
      shadedPoints = points.filter(p => p.x >= lower && p.x <= upper);
    }

    if (shadedPoints.length > 0) {
      const shadedPath = shadedPoints.map((p, i) => {
        const xPos = padding.left + (p.x - xMin) * xScale;
        const yPos = height - padding.bottom - p.y * yScale;
        if (i === 0) {
          return `M ${xPos} ${height - padding.bottom} L ${xPos} ${yPos}`;
        }
        return `L ${xPos} ${yPos}`;
      }).join(' ') + ` L ${padding.left + (shadedPoints[shadedPoints.length - 1].x - xMin) * xScale} ${height - padding.bottom} Z`;
      svg += `<path d="${shadedPath}" fill="#D97D54" opacity="0.5"/>`;
    }

    // Normal curve
    const curvePath = points.map((p, i) => {
      const xPos = padding.left + (p.x - xMin) * xScale;
      const yPos = height - padding.bottom - p.y * yScale;
      return i === 0 ? `M ${xPos} ${yPos}` : `L ${xPos} ${yPos}`;
    }).join(' ');
    svg += `<path d="${curvePath}" stroke="#2C5F7C" stroke-width="3" fill="none"/>`;

    // Vertical line at z-value
    const zPos = padding.left + (zValue - xMin) * xScale;
    svg += `<line x1="${zPos}" y1="${padding.top}" x2="${zPos}" y2="${height - padding.bottom}" stroke="#DC3545" stroke-width="2"/>`;
    svg += `<text x="${zPos + 10}" y="${padding.top + 20}" font-size="11" fill="#DC3545" font-weight="600">z = ${zValue.toFixed(2)}</text>`;

    if (probType === 'between') {
      const z2Pos = padding.left + (zValue2 - xMin) * xScale;
      svg += `<line x1="${z2Pos}" y1="${padding.top}" x2="${z2Pos}" y2="${height - padding.bottom}" stroke="#DC3545" stroke-width="2"/>`;
      svg += `<text x="${z2Pos - 10}" y="${padding.top + 20}" text-anchor="end" font-size="11" fill="#DC3545" font-weight="600">z = ${zValue2.toFixed(2)}</text>`;
    }

    svg += `</svg>`;
    return svg;
  }

  container.innerHTML = drawChart();

  // Add controls
  const controlsDiv = document.createElement('div');
  controlsDiv.style.textAlign = 'center';
  controlsDiv.style.marginTop = '15px';
  controlsDiv.innerHTML = `
    <div style="display: inline-flex; gap: 10px; align-items: center; flex-wrap: wrap;">
      <div>
        <label style="font-size: 0.9rem; margin-right: 5px;">Type:</label>
        <select id="probTypeSelect" style="padding: 5px;">
          <option value="less">P(Z < z)</option>
          <option value="greater">P(Z > z)</option>
          <option value="between">P(z1 < Z < z2)</option>
        </select>
      </div>
      <div>
        <label style="font-size: 0.9rem; margin-right: 5px;">z-value:</label>
        <input type="number" id="zInput" value="${zValue}" step="0.1" style="width: 60px; padding: 5px;">
      </div>
      <div id="z2Div" style="display: none;">
        <label style="font-size: 0.9rem; margin-right: 5px;">z-value 2:</label>
        <input type="number" id="z2Input" value="${zValue2}" step="0.1" style="width: 60px; padding: 5px;">
      </div>
      <button id="updateProbBtn" class="btn btn-primary btn-sm">Update</button>
    </div>
  `;
  container.appendChild(controlsDiv);

  const updateChart = () => {
    probType = document.getElementById('probTypeSelect').value;
    zValue = parseFloat(document.getElementById('zInput').value) || 0;
    if (probType === 'between') {
      document.getElementById('z2Div').style.display = 'block';
      zValue2 = parseFloat(document.getElementById('z2Input').value) || -1;
    } else {
      document.getElementById('z2Div').style.display = 'none';
    }
    container.innerHTML = drawChart();
    container.appendChild(controlsDiv);
    document.getElementById('updateProbBtn').onclick = updateChart;
    document.getElementById('probTypeSelect').onchange = updateChart;
  };

  document.getElementById('updateProbBtn').onclick = updateChart;
  document.getElementById('probTypeSelect').onchange = updateChart;
}

// Chart 4: Comparing Normal Distributions
// Shows how μ and σ affect the bell curve
function createCompareDistributions(containerId) {
  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 700);
  const height = 450;

  const distributions = [
    { mu: 0, sigma: 1, color: '#2C5F7C', label: 'μ=0, σ=1 (Standard)' },
    { mu: 0, sigma: 0.5, color: '#28A745', label: 'μ=0, σ=0.5 (Narrower)' },
    { mu: 0, sigma: 2, color: '#FFA500', label: 'μ=0, σ=2 (Wider)' },
    { mu: 2, sigma: 1, color: '#DC3545', label: 'μ=2, σ=1 (Shifted)' }
  ];

  const padding = { top: 80, right: 20, bottom: 80, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xMin = -4;
  const xMax = 6;
  const xScale = chartWidth / (xMax - xMin);

  const allPoints = [];
  distributions.forEach(dist => {
    const points = [];
    for (let x = xMin; x <= xMax; x += 0.1) {
      points.push({ x, y: normalPDF(x, dist.mu, dist.sigma) });
    }
    allPoints.push({ dist, points });
  });

  const yMax = Math.max(...allPoints.flatMap(d => d.points.map(p => p.y))) * 1.1;
  const yScale = chartHeight / yMax;

  let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

  // Title
  svg += `<text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" fill="#2D2D2D">Comparing Normal Distributions</text>`;
  svg += `<text x="${width/2}" y="45" text-anchor="middle" font-size="12" fill="#666">How μ (mean) and σ (standard deviation) affect the shape</text>`;

  // Axes
  svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;
  svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;

  // X-axis ticks
  for (let i = -4; i <= 6; i += 2) {
    const xPos = padding.left + (i - xMin) * xScale;
    svg += `<line x1="${xPos}" y1="${height - padding.bottom}" x2="${xPos}" y2="${height - padding.bottom + 5}" stroke="#666" stroke-width="1"/>`;
    svg += `<text x="${xPos}" y="${height - padding.bottom + 20}" text-anchor="middle" font-size="10" fill="#666">${i}</text>`;
  }

  // Draw all curves
  allPoints.forEach(({ dist, points }) => {
    const curvePath = points.map((p, i) => {
      const xPos = padding.left + (p.x - xMin) * xScale;
      const yPos = height - padding.bottom - p.y * yScale;
      return i === 0 ? `M ${xPos} ${yPos}` : `L ${xPos} ${yPos}`;
    }).join(' ');
    svg += `<path d="${curvePath}" stroke="${dist.color}" stroke-width="2.5" fill="none"/>`;
  });

  // Legend
  let legendY = padding.top + 20;
  distributions.forEach(dist => {
    svg += `<line x1="${width - 170}" y1="${legendY}" x2="${width - 140}" y2="${legendY}" stroke="${dist.color}" stroke-width="2.5"/>`;
    svg += `<text x="${width - 135}" y="${legendY + 4}" font-size="10" fill="#666">${dist.label}</text>`;
    legendY += 20;
  });

  svg += `</svg>`;
  container.innerHTML = svg;
}

// Resize handling
window.addEventListener('resize', () => {
  if (document.getElementById('empiricalRuleChart')) createEmpiricalRuleChart('empiricalRuleChart');
  if (document.getElementById('zScoreCalculator')) createZScoreCalculator('zScoreCalculator');
  if (document.getElementById('probabilityAreaChart')) createProbabilityAreaChart('probabilityAreaChart');
  if (document.getElementById('compareDistributions')) createCompareDistributions('compareDistributions');
});
