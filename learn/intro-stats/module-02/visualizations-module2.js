// Interactive Data Visualizations for Module 2: Descriptive Statistics
// Pure JavaScript - no external dependencies

// Utility Functions
function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function quartiles(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const q2 = median(sorted);
  const mid = Math.floor(sorted.length / 2);

  let lower, upper;
  if (sorted.length % 2 === 0) {
    lower = sorted.slice(0, mid);
    upper = sorted.slice(mid);
  } else {
    lower = sorted.slice(0, mid);
    upper = sorted.slice(mid + 1);
  }

  return {
    q1: median(lower),
    q2: q2,
    q3: median(upper)
  };
}

function standardDeviation(arr) {
  const m = mean(arr);
  const squareDiffs = arr.map(x => Math.pow(x - m, 2));
  const variance = squareDiffs.reduce((a, b) => a + b, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

// Chart 1: Spread Comparison Tool
// Shows three datasets with different spreads but same mean
function createSpreadComparison(containerId) {
  const datasets = {
    low: { name: 'Low Spread', data: [48, 49, 50, 51, 52], color: '#28A745' },
    medium: { name: 'Medium Spread', data: [40, 45, 50, 55, 60], color: '#3A7CA5' },
    high: { name: 'High Spread', data: [20, 35, 50, 65, 80], color: '#DC3545' }
  };

  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 700);
  const height = 400;
  const padding = { top: 60, right: 20, bottom: 80, left: 60 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate statistics for all datasets
  const stats = {};
  Object.keys(datasets).forEach(key => {
    const data = datasets[key].data;
    stats[key] = {
      mean: mean(data),
      range: Math.max(...data) - Math.min(...data),
      sd: standardDeviation(data)
    };
  });

  const allValues = Object.values(datasets).flatMap(d => d.data);
  const minVal = Math.min(...allValues) - 5;
  const maxVal = Math.max(...allValues) + 5;
  const xScale = chartWidth / (maxVal - minVal);

  let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

  // Title
  svg += `<text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" fill="#2D2D2D">Comparing Spread: Same Mean, Different Variability</text>`;
  svg += `<text x="${width/2}" y="45" text-anchor="middle" font-size="12" fill="#666">All three datasets have a mean of 50, but different amounts of spread</text>`;

  // X-axis
  svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;

  // X-axis ticks
  for (let i = minVal; i <= maxVal; i += 10) {
    const x = padding.left + (i - minVal) * xScale;
    svg += `<line x1="${x}" y1="${height - padding.bottom}" x2="${x}" y2="${height - padding.bottom + 5}" stroke="#666" stroke-width="1"/>`;
    svg += `<text x="${x}" y="${height - padding.bottom + 20}" text-anchor="middle" font-size="10" fill="#666">${i}</text>`;
  }
  svg += `<text x="${width/2}" y="${height - padding.bottom + 40}" text-anchor="middle" font-size="12" fill="#666">Value</text>`;

  // Plot each dataset
  let yOffset = padding.top + 20;
  Object.keys(datasets).forEach((key, index) => {
    const dataset = datasets[key];
    const stat = stats[key];

    // Dataset label
    svg += `<text x="${padding.left}" y="${yOffset}" font-size="12" font-weight="600" fill="${dataset.color}">${dataset.name}</text>`;

    // Mean line
    const meanX = padding.left + (stat.mean - minVal) * xScale;
    svg += `<line x1="${meanX}" y1="${yOffset + 10}" x2="${meanX}" y2="${yOffset + 40}" stroke="${dataset.color}" stroke-width="2" stroke-dasharray="4,2"/>`;
    svg += `<text x="${meanX}" y="${yOffset + 8}" text-anchor="middle" font-size="9" fill="${dataset.color}">Mean</text>`;

    // Data points
    dataset.data.forEach(value => {
      const x = padding.left + (value - minVal) * xScale;
      svg += `<circle cx="${x}" cy="${yOffset + 25}" r="5" fill="${dataset.color}" opacity="0.8">
        <title>${value}</title>
      </circle>`;
    });

    // Range indicator
    const rangeMin = Math.min(...dataset.data);
    const rangeMax = Math.max(...dataset.data);
    const rangeMinX = padding.left + (rangeMin - minVal) * xScale;
    const rangeMaxX = padding.left + (rangeMax - minVal) * xScale;
    svg += `<line x1="${rangeMinX}" y1="${yOffset + 50}" x2="${rangeMaxX}" y2="${yOffset + 50}" stroke="${dataset.color}" stroke-width="2" opacity="0.5"/>`;
    svg += `<line x1="${rangeMinX}" y1="${yOffset + 45}" x2="${rangeMinX}" y2="${yOffset + 55}" stroke="${dataset.color}" stroke-width="2" opacity="0.5"/>`;
    svg += `<line x1="${rangeMaxX}" y1="${yOffset + 45}" x2="${rangeMaxX}" y2="${yOffset + 55}" stroke="${dataset.color}" stroke-width="2" opacity="0.5"/>`;

    // Statistics text
    svg += `<text x="${width - padding.right - 180}" y="${yOffset + 25}" font-size="10" fill="#666">Range: ${stat.range.toFixed(0)} | SD: ${stat.sd.toFixed(2)}</text>`;

    yOffset += 80;
  });

  // Legend
  svg += `<text x="${padding.left}" y="${height - 15}" font-size="11" fill="#666" font-style="italic">💡 Notice: Higher spread = larger range and standard deviation</text>`;

  svg += `</svg>`;
  container.innerHTML = svg;
}

// Chart 2: Distribution Shape & Skewness Demonstrator
// Shows how mean and median relate in different distribution shapes
function createSkewnessDemo(containerId) {
  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 700);
  const height = 500;
  const padding = { top: 60, right: 40, bottom: 60, left: 40 };

  const distributions = {
    symmetric: {
      name: 'Symmetric',
      data: [50, 55, 60, 65, 70, 75, 80, 85, 90, 70, 75, 80, 65, 70, 75],
      description: 'Mean ≈ Median'
    },
    rightSkewed: {
      name: 'Right-Skewed',
      data: [50, 55, 60, 65, 70, 75, 80, 60, 65, 70, 55, 60, 65, 90, 95, 100, 110],
      description: 'Mean > Median'
    },
    leftSkewed: {
      name: 'Left-Skewed',
      data: [70, 75, 80, 85, 90, 95, 100, 80, 85, 90, 95, 85, 90, 40, 45, 50, 55],
      description: 'Mean < Median'
    }
  };

  let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

  // Title
  svg += `<text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" fill="#2D2D2D">Distribution Shapes: Mean vs. Median</text>`;
  svg += `<text x="${width/2}" y="45" text-anchor="middle" font-size="12" fill="#666">The relationship between mean and median reveals distribution shape</text>`;

  const boxHeight = 120;
  const boxWidth = (width - padding.left - padding.right - 40) / 3;
  let xOffset = padding.left;

  Object.keys(distributions).forEach((key, index) => {
    const dist = distributions[key];
    const data = dist.data;
    const m = mean(data);
    const med = median(data);
    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);

    // Create simple dot plot
    const yBase = padding.top + 20;
    const localWidth = boxWidth - 20;
    const xScale = localWidth / (maxVal - minVal);

    // Box background
    svg += `<rect x="${xOffset}" y="${yBase - 10}" width="${boxWidth}" height="${boxHeight + 40}" fill="#F8F9FA" stroke="#ddd" stroke-width="1" rx="4"/>`;

    // Title
    svg += `<text x="${xOffset + boxWidth/2}" y="${yBase + 5}" text-anchor="middle" font-size="13" font-weight="600" fill="#2C5F7C">${dist.name}</text>`;

    // Dot plot
    const dotCounts = {};
    data.forEach(val => {
      const rounded = Math.round(val / 5) * 5; // Round to nearest 5 for stacking
      dotCounts[rounded] = (dotCounts[rounded] || 0) + 1;
    });

    Object.keys(dotCounts).forEach(val => {
      const numVal = parseFloat(val);
      const x = xOffset + 10 + (numVal - minVal) * xScale;
      for (let i = 0; i < dotCounts[val]; i++) {
        const y = yBase + 80 - (i * 8);
        svg += `<circle cx="${x}" cy="${y}" r="3" fill="#3A7CA5" opacity="0.7"/>`;
      }
    });

    // Mean line (red)
    const meanX = xOffset + 10 + (m - minVal) * xScale;
    svg += `<line x1="${meanX}" y1="${yBase + 85}" x2="${meanX}" y2="${yBase + 110}" stroke="#DC3545" stroke-width="3"/>`;
    svg += `<text x="${meanX}" y="${yBase + 125}" text-anchor="middle" font-size="9" fill="#DC3545" font-weight="600">Mean: ${m.toFixed(1)}</text>`;

    // Median line (green)
    const medX = xOffset + 10 + (med - minVal) * xScale;
    svg += `<line x1="${medX}" y1="${yBase + 85}" x2="${medX}" y2="${yBase + 110}" stroke="#28A745" stroke-width="3"/>`;
    svg += `<text x="${medX}" y="${yBase + 137}" text-anchor="middle" font-size="9" fill="#28A745" font-weight="600">Median: ${med.toFixed(1)}</text>`;

    // Relationship
    svg += `<text x="${xOffset + boxWidth/2}" y="${yBase + 155}" text-anchor="middle" font-size="11" fill="#666" font-style="italic">${dist.description}</text>`;

    xOffset += boxWidth + 20;
  });

  // Legend
  svg += `<line x1="${padding.left}" y1="${height - 35}" x2="${padding.left + 30}" y2="${height - 35}" stroke="#DC3545" stroke-width="3"/>`;
  svg += `<text x="${padding.left + 35}" y="${height - 31}" font-size="11" fill="#666">Mean (pulled by outliers)</text>`;

  svg += `<line x1="${padding.left + 200}" y1="${height - 35}" x2="${padding.left + 230}" y2="${height - 35}" stroke="#28A745" stroke-width="3"/>`;
  svg += `<text x="${padding.left + 235}" y="${height - 31}" font-size="11" fill="#666">Median (resistant to outliers)</text>`;

  svg += `<text x="${width/2}" y="${height - 10}" text-anchor="middle" font-size="11" fill="#666" font-style="italic">💡 The mean is always pulled in the direction of the skew (toward the tail)</text>`;

  svg += `</svg>`;
  container.innerHTML = svg;
}

// Chart 3: Interactive Boxplot Builder
// Users can see five-number summary and boxplot for preset datasets
function createBoxplotBuilder(containerId) {
  const datasets = {
    symmetric: {
      name: 'Symmetric Data',
      data: [12, 15, 18, 20, 22, 24, 25, 26, 28, 30, 32, 34, 36, 38, 40]
    },
    rightSkewed: {
      name: 'Right-Skewed Data',
      data: [10, 12, 14, 15, 16, 18, 20, 22, 24, 26, 35, 40, 50]
    },
    withOutliers: {
      name: 'Data with Outliers',
      data: [20, 22, 24, 25, 26, 28, 30, 32, 34, 36, 38, 40, 42, 70, 75]
    }
  };

  const container = document.getElementById(containerId);
  container.innerHTML = `
    <div style="background: white; padding: 1.5rem; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #2C5F7C; text-align: center;">Interactive Boxplot Builder</h3>
      <p style="text-align: center; color: #666; font-size: 0.95rem;">Select a dataset to see its five-number summary and boxplot</p>

      <div style="text-align: center; margin: 1rem 0;">
        <select id="${containerId}_select" style="padding: 0.5rem; font-size: 1rem; border-radius: 4px; border: 2px solid #3A7CA5;">
          <option value="symmetric">Symmetric Data</option>
          <option value="rightSkewed">Right-Skewed Data</option>
          <option value="withOutliers">Data with Outliers</option>
        </select>
      </div>

      <div id="${containerId}_stats" style="background: #F8F9FA; padding: 1rem; border-radius: 4px; margin: 1rem 0;"></div>
      <div id="${containerId}_chart"></div>
    </div>
  `;

  function updateBoxplot(datasetKey) {
    const data = datasets[datasetKey].data.sort((a, b) => a - b);
    const min = Math.min(...data);
    const max = Math.max(...data);
    const q = quartiles(data);
    const iqr = q.q3 - q.q1;

    // Outlier detection
    const lowerFence = q.q1 - 1.5 * iqr;
    const upperFence = q.q3 + 1.5 * iqr;
    const outliers = data.filter(x => x < lowerFence || x > upperFence);
    const whiskerMin = Math.min(...data.filter(x => x >= lowerFence));
    const whiskerMax = Math.max(...data.filter(x => x <= upperFence));

    // Display statistics
    const statsDiv = document.getElementById(`${containerId}_stats`);
    statsDiv.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; text-align: center;">
        <div>
          <div style="font-weight: 600; color: #2C5F7C;">Minimum</div>
          <div style="font-size: 1.2rem; color: #333;">${min}</div>
        </div>
        <div>
          <div style="font-weight: 600; color: #2C5F7C;">Q1</div>
          <div style="font-size: 1.2rem; color: #333;">${q.q1.toFixed(1)}</div>
        </div>
        <div>
          <div style="font-weight: 600; color: #2C5F7C;">Median (Q2)</div>
          <div style="font-size: 1.2rem; color: #333;">${q.q2.toFixed(1)}</div>
        </div>
        <div>
          <div style="font-weight: 600; color: #2C5F7C;">Q3</div>
          <div style="font-size: 1.2rem; color: #333;">${q.q3.toFixed(1)}</div>
        </div>
        <div>
          <div style="font-weight: 600; color: #2C5F7C;">Maximum</div>
          <div style="font-size: 1.2rem; color: #333;">${max}</div>
        </div>
      </div>
      <div style="margin-top: 1rem; text-align: center; color: #666;">
        <strong>IQR:</strong> ${iqr.toFixed(1)} |
        <strong>Lower Fence:</strong> ${lowerFence.toFixed(1)} |
        <strong>Upper Fence:</strong> ${upperFence.toFixed(1)}
        ${outliers.length > 0 ? ` | <span style="color: #DC3545;"><strong>Outliers:</strong> ${outliers.join(', ')}</span>` : ''}
      </div>
    `;

    // Draw boxplot
    const chartDiv = document.getElementById(`${containerId}_chart`);
    const width = Math.min(chartDiv.offsetWidth || 600, 600);
    const height = 200;
    const padding = { top: 40, right: 40, bottom: 40, left: 40 };

    const chartWidth = width - padding.left - padding.right;
    const xScale = chartWidth / (max - min + 10);

    let svg = `<svg width="${width}" height="${height}" style="background: white;">`;

    // Title
    svg += `<text x="${width/2}" y="25" text-anchor="middle" font-size="14" font-weight="600" fill="#2D2D2D">Boxplot</text>`;

    // Scale
    const yCenter = height / 2;
    const boxHeight = 40;

    // X-axis
    for (let i = Math.floor(min); i <= Math.ceil(max); i += 5) {
      const x = padding.left + (i - min + 5) * xScale;
      svg += `<line x1="${x}" y1="${height - padding.bottom + 5}" x2="${x}" y2="${height - padding.bottom}" stroke="#999" stroke-width="1"/>`;
      svg += `<text x="${x}" y="${height - padding.bottom + 20}" text-anchor="middle" font-size="10" fill="#666">${i}</text>`;
    }

    // Convert values to x coordinates
    const x = (val) => padding.left + (val - min + 5) * xScale;

    // Lower whisker
    svg += `<line x1="${x(whiskerMin)}" y1="${yCenter}" x2="${x(q.q1)}" y2="${yCenter}" stroke="#333" stroke-width="2"/>`;
    svg += `<line x1="${x(whiskerMin)}" y1="${yCenter - boxHeight/3}" x2="${x(whiskerMin)}" y2="${yCenter + boxHeight/3}" stroke="#333" stroke-width="2"/>`;

    // Box
    svg += `<rect x="${x(q.q1)}" y="${yCenter - boxHeight/2}" width="${x(q.q3) - x(q.q1)}" height="${boxHeight}" fill="#3A7CA5" stroke="#2C5F7C" stroke-width="2" opacity="0.7"/>`;

    // Median line
    svg += `<line x1="${x(q.q2)}" y1="${yCenter - boxHeight/2}" x2="${x(q.q2)}" y2="${yCenter + boxHeight/2}" stroke="#DC3545" stroke-width="3"/>`;

    // Upper whisker
    svg += `<line x1="${x(q.q3)}" y1="${yCenter}" x2="${x(whiskerMax)}" y2="${yCenter}" stroke="#333" stroke-width="2"/>`;
    svg += `<line x1="${x(whiskerMax)}" y1="${yCenter - boxHeight/3}" x2="${x(whiskerMax)}" y2="${yCenter + boxHeight/3}" stroke="#333" stroke-width="2"/>`;

    // Outliers
    outliers.forEach(val => {
      svg += `<circle cx="${x(val)}" cy="${yCenter}" r="5" fill="#DC3545" stroke="#8B0000" stroke-width="1">
        <title>Outlier: ${val}</title>
      </circle>`;
    });

    // Labels
    svg += `<text x="${x(q.q1)}" y="${yCenter - boxHeight/2 - 8}" text-anchor="middle" font-size="9" fill="#2C5F7C">Q1</text>`;
    svg += `<text x="${x(q.q2)}" y="${yCenter - boxHeight/2 - 8}" text-anchor="middle" font-size="9" fill="#DC3545">Median</text>`;
    svg += `<text x="${x(q.q3)}" y="${yCenter - boxHeight/2 - 8}" text-anchor="middle" font-size="9" fill="#2C5F7C">Q3</text>`;

    svg += `</svg>`;
    chartDiv.innerHTML = svg;
  }

  // Initial render
  updateBoxplot('symmetric');

  // Event listener
  document.getElementById(`${containerId}_select`).addEventListener('change', (e) => {
    updateBoxplot(e.target.value);
  });
}

// Chart 4: Standard Deviation Visualizer (Empirical Rule)
// Shows bell curve with ±1, ±2, ±3 SD regions
function createEmpiricalRuleViz(containerId) {
  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 700);
  const height = 400;
  const padding = { top: 60, right: 40, bottom: 80, left: 40 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Bell curve parameters
  const mean = 100;
  const sd = 15;
  const numPoints = 100;
  const minX = mean - 4 * sd;
  const maxX = mean + 4 * sd;

  // Normal distribution function
  function normalDist(x, mean, sd) {
    const exponent = -0.5 * Math.pow((x - mean) / sd, 2);
    return (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
  }

  // Generate curve points
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const x = minX + (maxX - minX) * (i / numPoints);
    const y = normalDist(x, mean, sd);
    points.push({ x, y });
  }

  const maxY = Math.max(...points.map(p => p.y));
  const xScale = chartWidth / (maxX - minX);
  const yScale = (chartHeight - 40) / maxY;

  let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

  // Title
  svg += `<text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" fill="#2D2D2D">The Empirical Rule (68-95-99.7 Rule)</text>`;
  svg += `<text x="${width/2}" y="45" text-anchor="middle" font-size="12" fill="#666">For bell-shaped distributions: Mean = ${mean}, SD = ${sd}</text>`;

  // Helper function to convert data coordinates to SVG coordinates
  const toX = (x) => padding.left + (x - minX) * xScale;
  const toY = (y) => height - padding.bottom - y * yScale;

  // Shaded regions for SD ranges
  const regions = [
    { range: 3, color: '#FFE5E5', label: '99.7%' },
    { range: 2, color: '#FFF3CD', label: '95%' },
    { range: 1, color: '#D4EDDA', label: '68%' }
  ];

  regions.forEach(region => {
    const leftX = mean - region.range * sd;
    const rightX = mean + region.range * sd;

    // Create polygon for shaded area under curve
    let pathData = `M ${toX(leftX)} ${toY(0)}`;

    points.forEach(p => {
      if (p.x >= leftX && p.x <= rightX) {
        pathData += ` L ${toX(p.x)} ${toY(p.y)}`;
      }
    });

    pathData += ` L ${toX(rightX)} ${toY(0)} Z`;
    svg += `<path d="${pathData}" fill="${region.color}" opacity="0.7"/>`;
  });

  // Draw the bell curve
  let curvePath = `M ${toX(points[0].x)} ${toY(points[0].y)}`;
  points.forEach(p => {
    curvePath += ` L ${toX(p.x)} ${toY(p.y)}`;
  });
  svg += `<path d="${curvePath}" fill="none" stroke="#2C5F7C" stroke-width="3"/>`;

  // X-axis
  svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;

  // Mean line and SD markers
  for (let i = -3; i <= 3; i++) {
    const x = mean + i * sd;
    const svgX = toX(x);

    // Tick marks
    svg += `<line x1="${svgX}" y1="${height - padding.bottom}" x2="${svgX}" y2="${height - padding.bottom + 8}" stroke="#666" stroke-width="2"/>`;

    // Labels
    if (i === 0) {
      svg += `<text x="${svgX}" y="${height - padding.bottom + 25}" text-anchor="middle" font-size="11" font-weight="600" fill="#2C5F7C">μ = ${x}</text>`;
      svg += `<text x="${svgX}" y="${height - padding.bottom + 40}" text-anchor="middle" font-size="10" fill="#666">(Mean)</text>`;
    } else {
      const sign = i > 0 ? '+' : '';
      svg += `<text x="${svgX}" y="${height - padding.bottom + 25}" text-anchor="middle" font-size="10" fill="#666">${x}</text>`;
      svg += `<text x="${svgX}" y="${height - padding.bottom + 40}" text-anchor="middle" font-size="9" fill="#999">μ${sign}${i}σ</text>`;
    }

    // Vertical dashed lines for SD
    if (i !== 0) {
      svg += `<line x1="${svgX}" y1="${toY(0)}" x2="${svgX}" y2="${toY(maxY * 0.9)}" stroke="#999" stroke-width="1" stroke-dasharray="4,4" opacity="0.5"/>`;
    }
  }

  // Percentage labels
  svg += `<text x="${toX(mean)}" y="${toY(maxY * 0.35)}" text-anchor="middle" font-size="13" font-weight="600" fill="#155724">68%</text>`;
  svg += `<text x="${toX(mean)}" y="${toY(maxY * 0.2)}" text-anchor="middle" font-size="13" font-weight="600" fill="#856404">95%</text>`;
  svg += `<text x="${toX(mean)}" y="${toY(maxY * 0.08)}" text-anchor="middle" font-size="13" font-weight="600" fill="#721C24">99.7%</text>`;

  // Legend
  const legendY = height - 15;
  svg += `<rect x="${padding.left}" y="${legendY - 10}" width="15" height="15" fill="#D4EDDA" opacity="0.7"/>`;
  svg += `<text x="${padding.left + 20}" y="${legendY}" font-size="10" fill="#666">68% within ±1 SD</text>`;

  svg += `<rect x="${padding.left + 140}" y="${legendY - 10}" width="15" height="15" fill="#FFF3CD" opacity="0.7"/>`;
  svg += `<text x="${padding.left + 160}" y="${legendY}" font-size="10" fill="#666">95% within ±2 SD</text>`;

  svg += `<rect x="${padding.left + 280}" y="${legendY - 10}" width="15" height="15" fill="#FFE5E5" opacity="0.7"/>`;
  svg += `<text x="${padding.left + 300}" y="${legendY}" font-size="10" fill="#666">99.7% within ±3 SD</text>`;

  svg += `</svg>`;
  container.innerHTML = svg;
}

// Window resize handler to make charts responsive
function makeResponsive() {
  const charts = [
    { id: 'spreadComparisonChart', fn: createSpreadComparison },
    { id: 'skewnessDemoChart', fn: createSkewnessDemo },
    { id: 'boxplotBuilderChart', fn: createBoxplotBuilder },
    { id: 'empiricalRuleChart', fn: createEmpiricalRuleViz }
  ];

  charts.forEach(chart => {
    if (document.getElementById(chart.id)) {
      chart.fn(chart.id);
    }
  });
}

// Initialize charts when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', makeResponsive);
} else {
  makeResponsive();
}

// Add resize listener for responsiveness
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(makeResponsive, 250);
});
