// Interactive Data Visualizations for Module 1 Lesson 4
// Pure JavaScript - no external dependencies

// Bar Chart: Ice Cream Flavors
function createBarChart(containerId) {
  const data = [
    { label: 'Chocolate', value: 45, color: '#8B4513' },
    { label: 'Vanilla', value: 32, color: '#F5DEB3' },
    { label: 'Strawberry', value: 28, color: '#FF69B4' },
    { label: 'Mint', value: 15, color: '#98FB98' }
  ];

  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 600);
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 60, left: 50 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = chartWidth / data.length * 0.8;
  const gap = chartWidth / data.length * 0.2;

  let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

  // Title
  svg += `<text x="${width/2}" y="15" text-anchor="middle" font-size="14" font-weight="600" fill="#2D2D2D">Favorite Ice Cream Flavors</text>`;

  // Y-axis
  svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;

  // Y-axis label
  svg += `<text x="15" y="${height/2}" text-anchor="middle" font-size="12" fill="#666" transform="rotate(-90 15 ${height/2})">Number of People</text>`;

  // Y-axis ticks and grid
  for (let i = 0; i <= 5; i++) {
    const y = height - padding.bottom - (chartHeight * i / 5);
    const value = Math.round(maxValue * i / 5);
    svg += `<line x1="${padding.left}" y1="${y}" x2="${padding.left - 5}" y2="${y}" stroke="#666" stroke-width="1"/>`;
    svg += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="10" fill="#666">${value}</text>`;
    if (i > 0) {
      svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#E0E0E0" stroke-width="1" stroke-dasharray="3,3"/>`;
    }
  }

  // X-axis
  svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;

  // Bars
  data.forEach((d, i) => {
    const x = padding.left + (i * (barWidth + gap)) + gap/2;
    const barHeight = (d.value / maxValue) * chartHeight;
    const y = height - padding.bottom - barHeight;

    // Bar with hover effect
    svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${d.color}" stroke="#333" stroke-width="1" opacity="0.9">
      <title>${d.label}: ${d.value} people</title>
    </rect>`;

    // Value on top of bar
    svg += `<text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" font-size="12" font-weight="600" fill="#333">${d.value}</text>`;

    // Label below bar
    svg += `<text x="${x + barWidth/2}" y="${height - padding.bottom + 20}" text-anchor="middle" font-size="11" fill="#666">${d.label}</text>`;
  });

  svg += `</svg>`;
  container.innerHTML = svg;
}

// Histogram: Test Scores
function createHistogram(containerId) {
  const data = [
    { range: '50-60', count: 3 },
    { range: '60-70', count: 8 },
    { range: '70-80', count: 15 },
    { range: '80-90', count: 20 },
    { range: '90-100', count: 9 }
  ];

  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 600);
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 60, left: 50 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map(d => d.count));
  const barWidth = chartWidth / data.length;

  let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

  // Title
  svg += `<text x="${width/2}" y="15" text-anchor="middle" font-size="14" font-weight="600" fill="#2D2D2D">Distribution of Test Scores</text>`;

  // Y-axis
  svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;

  // Y-axis label
  svg += `<text x="15" y="${height/2}" text-anchor="middle" font-size="12" fill="#666" transform="rotate(-90 15 ${height/2})">Number of Students</text>`;

  // Y-axis ticks
  for (let i = 0; i <= 4; i++) {
    const y = height - padding.bottom - (chartHeight * i / 4);
    const value = Math.round(maxValue * i / 4);
    svg += `<line x1="${padding.left}" y1="${y}" x2="${padding.left - 5}" y2="${y}" stroke="#666" stroke-width="1"/>`;
    svg += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="10" fill="#666">${value}</text>`;
    if (i > 0) {
      svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#E0E0E0" stroke-width="1" stroke-dasharray="3,3"/>`;
    }
  }

  // X-axis
  svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;

  // X-axis label
  svg += `<text x="${width/2}" y="${height - 10}" text-anchor="middle" font-size="12" fill="#666">Test Score Range</text>`;

  // Bars (touching - key feature of histograms!)
  data.forEach((d, i) => {
    const x = padding.left + (i * barWidth);
    const barHeight = (d.count / maxValue) * chartHeight;
    const y = height - padding.bottom - barHeight;

    // Bar - note: no gaps between bars!
    svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#3A7CA5" stroke="#2C5F7C" stroke-width="1" opacity="0.85">
      <title>${d.range}: ${d.count} students</title>
    </rect>`;

    // Value on top
    svg += `<text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" font-size="12" font-weight="600" fill="#333">${d.count}</text>`;

    // Range label
    svg += `<text x="${x + barWidth/2}" y="${height - padding.bottom + 20}" text-anchor="middle" font-size="10" fill="#666">${d.range}</text>`;
  });

  // Annotation showing bars touch
  svg += `<text x="${width/2}" y="${height - 35}" text-anchor="middle" font-size="10" fill="#D97D54" font-style="italic">← Notice: bars touch (continuous data) →</text>`;

  svg += `</svg>`;
  container.innerHTML = svg;
}

// Pie Chart: Transportation Methods
function createPieChart(containerId) {
  const data = [
    { label: 'Drive', value: 40, color: '#3A7CA5' },
    { label: 'Public Transit', value: 30, color: '#D97D54' },
    { label: 'Walk/Bike', value: 20, color: '#28A745' },
    { label: 'Carpool', value: 10, color: '#FFC107' }
  ];

  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 600);
  const height = 350;
  const centerX = width / 2;
  const centerY = height / 2 - 20;
  const radius = Math.min(width, height) / 3;

  let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

  // Title
  svg += `<text x="${width/2}" y="20" text-anchor="middle" font-size="14" font-weight="600" fill="#2D2D2D">Student Transportation Methods</text>`;

  let currentAngle = -90; // Start at top

  data.forEach((d, i) => {
    const sliceAngle = (d.value / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;

    // Calculate slice path
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArc = sliceAngle > 180 ? 1 : 0;

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');

    svg += `<path d="${pathData}" fill="${d.color}" stroke="white" stroke-width="2" opacity="0.9">
      <title>${d.label}: ${d.value}%</title>
    </path>`;

    // Label
    const labelAngle = startAngle + sliceAngle / 2;
    const labelRad = (labelAngle * Math.PI) / 180;
    const labelX = centerX + (radius * 0.6) * Math.cos(labelRad);
    const labelY = centerY + (radius * 0.6) * Math.sin(labelRad);

    svg += `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="12" font-weight="600" fill="white">${d.value}%</text>`;

    currentAngle = endAngle;
  });

  // Legend
  let legendY = height - 80;
  data.forEach((d, i) => {
    const legendX = 20 + (i % 2) * (width / 2);
    if (i === 2) legendY += 25;

    svg += `<rect x="${legendX}" y="${legendY + (i >= 2 ? 0 : 0)}" width="15" height="15" fill="${d.color}"/>`;
    svg += `<text x="${legendX + 20}" y="${legendY + (i >= 2 ? 0 : 0) + 12}" font-size="11" fill="#666">${d.label} (${d.value}%)</text>`;
  });

  svg += `</svg>`;
  container.innerHTML = svg;
}

// Line Graph: Temperature Over Year
function createLineGraph(containerId) {
  const data = [
    { month: 'Jan', temp: 45 },
    { month: 'Feb', temp: 48 },
    { month: 'Mar', temp: 55 },
    { month: 'Apr', temp: 65 },
    { month: 'May', temp: 75 },
    { month: 'Jun', temp: 85 },
    { month: 'Jul', temp: 92 },
    { month: 'Aug', temp: 90 },
    { month: 'Sep', temp: 82 },
    { month: 'Oct', temp: 70 },
    { month: 'Nov', temp: 58 },
    { month: 'Dec', temp: 48 }
  ];

  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 600);
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 50, left: 50 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minTemp = Math.min(...data.map(d => d.temp));
  const maxTemp = Math.max(...data.map(d => d.temp));

  let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

  // Title
  svg += `<text x="${width/2}" y="15" text-anchor="middle" font-size="14" font-weight="600" fill="#2D2D2D">Average Monthly Temperature</text>`;

  // Y-axis
  svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;
  svg += `<text x="15" y="${height/2}" text-anchor="middle" font-size="12" fill="#666" transform="rotate(-90 15 ${height/2})">Temperature (°F)</text>`;

  // Y-axis ticks
  for (let i = 0; i <= 5; i++) {
    const y = height - padding.bottom - (chartHeight * i / 5);
    const value = Math.round(minTemp + (maxTemp - minTemp) * i / 5);
    svg += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="10" fill="#666">${value}°</text>`;
    svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#E0E0E0" stroke-width="1" stroke-dasharray="3,3"/>`;
  }

  // X-axis
  svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;

  // Build line path
  let linePath = '';
  const points = [];

  data.forEach((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartWidth;
    const y = height - padding.bottom - ((d.temp - minTemp) / (maxTemp - minTemp)) * chartHeight;
    points.push({ x, y, temp: d.temp, month: d.month });

    if (i === 0) {
      linePath += `M ${x} ${y}`;
    } else {
      linePath += ` L ${x} ${y}`;
    }

    // Month label
    svg += `<text x="${x}" y="${height - padding.bottom + 20}" text-anchor="middle" font-size="9" fill="#666">${d.month}</text>`;
  });

  // Draw line
  svg += `<path d="${linePath}" fill="none" stroke="#D97D54" stroke-width="3" stroke-linecap="round"/>`;

  // Draw points
  points.forEach(p => {
    svg += `<circle cx="${p.x}" cy="${p.y}" r="5" fill="#D97D54" stroke="white" stroke-width="2">
      <title>${p.month}: ${p.temp}°F</title>
    </circle>`;
  });

  svg += `</svg>`;
  container.innerHTML = svg;
}

// Scatterplot: Study Hours vs Test Scores
function createScatterplot(containerId) {
  // Generate realistic data with positive correlation
  const data = [];
  for (let i = 0; i < 50; i++) {
    const hours = Math.random() * 15;
    const baseScore = 50 + hours * 3;
    const noise = (Math.random() - 0.5) * 20;
    const score = Math.min(100, Math.max(40, baseScore + noise));
    data.push({ hours: hours, score: score });
  }

  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 600);
  const height = 350;
  const padding = { top: 20, right: 20, bottom: 60, left: 50 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

  // Title
  svg += `<text x="${width/2}" y="15" text-anchor="middle" font-size="14" font-weight="600" fill="#2D2D2D">Study Hours vs Test Scores</text>`;

  // Y-axis
  svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;
  svg += `<text x="15" y="${height/2}" text-anchor="middle" font-size="12" fill="#666" transform="rotate(-90 15 ${height/2})">Test Score (%)</text>`;

  // Y-axis ticks
  for (let i = 0; i <= 5; i++) {
    const y = height - padding.bottom - (chartHeight * i / 5);
    const value = 20 * i;
    svg += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="10" fill="#666">${value}</text>`;
    svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#E0E0E0" stroke-width="1" stroke-dasharray="3,3"/>`;
  }

  // X-axis
  svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;
  svg += `<text x="${width/2}" y="${height - 10}" text-anchor="middle" font-size="12" fill="#666">Study Hours per Week</text>`;

  // X-axis ticks
  for (let i = 0; i <= 5; i++) {
    const x = padding.left + (chartWidth * i / 5);
    const value = 3 * i;
    svg += `<text x="${x}" y="${height - padding.bottom + 15}" text-anchor="middle" font-size="10" fill="#666">${value}</text>`;
  }

  // Plot points
  data.forEach(d => {
    const x = padding.left + (d.hours / 15) * chartWidth;
    const y = height - padding.bottom - (d.score / 100) * chartHeight;

    svg += `<circle cx="${x}" cy="${y}" r="4" fill="#3A7CA5" opacity="0.6" stroke="#2C5F7C" stroke-width="1">
      <title>${d.hours.toFixed(1)} hrs → ${d.score.toFixed(0)}%</title>
    </circle>`;
  });

  // Trend annotation
  svg += `<text x="${width/2}" y="${height - 30}" text-anchor="middle" font-size="10" fill="#D97D54" font-style="italic">Positive correlation: As study hours increase, scores tend to increase</text>`;

  svg += `</svg>`;
  container.innerHTML = svg;
}

// Misleading Graph Comparison
let showMisleading = false;

function createMisleadingComparison(containerId) {
  const data = [
    { year: '2023', sales: 98000 },
    { year: '2024', sales: 102000 }
  ];

  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 700);
  const height = 400;
  const chartWidth = (width - 60) / 2;
  const chartHeight = 280;
  const padding = { top: 60, bottom: 60, left: 10, right: 10 };

  let html = `<div style="text-align: center; margin-bottom: 1rem;">
    <button onclick="toggleMisleadingGraph()" style="padding: 0.75rem 2rem; background: #D97D54; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
      ${showMisleading ? '👁️ Show Honest Graph' : '⚠️ Show Misleading Graph'}
    </button>
    <p style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">Click to toggle between honest and misleading versions</p>
  </div>`;

  html += `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

  if (showMisleading) {
    // MISLEADING VERSION - Truncated Y-axis
    const yMin = 95000;
    const yMax = 105000;
    const yRange = yMax - yMin;

    // Title
    html += `<text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="700" fill="#D9534F">⚠️ MISLEADING: Truncated Y-Axis</text>`;
    html += `<text x="${width/2}" y="45" text-anchor="middle" font-size="12" fill="#666">Y-axis starts at $95,000 instead of $0</text>`;

    // Y-axis
    const xStart = 80;
    html += `<line x1="${xStart}" y1="${padding.top}" x2="${xStart}" y2="${padding.top + chartHeight}" stroke="#666" stroke-width="2"/>`;

    // Y-axis zigzag to show break
    html += `<path d="M ${xStart-15} ${padding.top + chartHeight + 15} L ${xStart-10} ${padding.top + chartHeight + 20} L ${xStart-5} ${padding.top + chartHeight + 15} L ${xStart} ${padding.top + chartHeight + 20}" stroke="#D9534F" stroke-width="3" fill="none"/>`;

    // Y-axis labels
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + chartHeight - (chartHeight * i / 4);
      const value = yMin + (yRange * i / 4);
      html += `<text x="${xStart - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#666">$${(value/1000).toFixed(0)}k</text>`;
      html += `<line x1="${xStart}" y1="${y}" x2="${width - 20}" y2="${y}" stroke="#E0E0E0" stroke-width="1" stroke-dasharray="2,2"/>`;
    }

    // X-axis
    html += `<line x1="${xStart}" y1="${padding.top + chartHeight}" x2="${width - 20}" y2="${padding.top + chartHeight}" stroke="#666" stroke-width="2"/>`;

    // Bars
    data.forEach((d, i) => {
      const barWidth = 100;
      const x = xStart + 50 + (i * 200);
      const barHeight = ((d.sales - yMin) / yRange) * chartHeight;
      const y = padding.top + chartHeight - barHeight;

      html += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#D9534F" stroke="#C9302C" stroke-width="2" opacity="0.9"/>`;
      html += `<text x="${x + barWidth/2}" y="${y - 8}" text-anchor="middle" font-size="13" font-weight="700" fill="#333">$${(d.sales/1000).toFixed(0)}k</text>`;
      html += `<text x="${x + barWidth/2}" y="${padding.top + chartHeight + 25}" text-anchor="middle" font-size="12" font-weight="600" fill="#666">${d.year}</text>`;
    });

    // Warning annotation
    html += `<text x="${width/2}" y="${height - 25}" text-anchor="middle" font-size="11" font-weight="600" fill="#D9534F">Visual impression: Sales MORE THAN DOUBLED! 📈</text>`;
    html += `<text x="${width/2}" y="${height - 10}" text-anchor="middle" font-size="10" fill="#666">(But actually only increased 4%)</text>`;

  } else {
    // HONEST VERSION - Starts at zero
    const yMax = 120000;

    // Title
    html += `<text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="700" fill="#28A745">✅ HONEST: Y-Axis Starts at Zero</text>`;
    html += `<text x="${width/2}" y="45" text-anchor="middle" font-size="12" fill="#666">Shows true proportions</text>`;

    // Y-axis
    const xStart = 80;
    html += `<line x1="${xStart}" y1="${padding.top}" x2="${xStart}" y2="${padding.top + chartHeight}" stroke="#666" stroke-width="2"/>`;

    // Y-axis labels
    for (let i = 0; i <= 6; i++) {
      const y = padding.top + chartHeight - (chartHeight * i / 6);
      const value = (yMax * i / 6);
      html += `<text x="${xStart - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#666">$${(value/1000).toFixed(0)}k</text>`;
      html += `<line x1="${xStart}" y1="${y}" x2="${width - 20}" y2="${y}" stroke="#E0E0E0" stroke-width="1" stroke-dasharray="2,2"/>`;
    }

    // X-axis
    html += `<line x1="${xStart}" y1="${padding.top + chartHeight}" x2="${width - 20}" y2="${padding.top + chartHeight}" stroke="#666" stroke-width="2"/>`;

    // Bars
    data.forEach((d, i) => {
      const barWidth = 100;
      const x = xStart + 50 + (i * 200);
      const barHeight = (d.sales / yMax) * chartHeight;
      const y = padding.top + chartHeight - barHeight;

      html += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#28A745" stroke="#218838" stroke-width="2" opacity="0.9"/>`;
      html += `<text x="${x + barWidth/2}" y="${y - 8}" text-anchor="middle" font-size="13" font-weight="700" fill="#333">$${(d.sales/1000).toFixed(0)}k</text>`;
      html += `<text x="${x + barWidth/2}" y="${padding.top + chartHeight + 25}" text-anchor="middle" font-size="12" font-weight="600" fill="#666">${d.year}</text>`;
    });

    // Honest annotation
    html += `<text x="${width/2}" y="${height - 25}" text-anchor="middle" font-size="11" font-weight="600" fill="#28A745">Visual impression: Small, modest growth</text>`;
    html += `<text x="${width/2}" y="${height - 10}" text-anchor="middle" font-size="10" fill="#666">Actual increase: $4,000 (4.1%)</text>`;
  }

  html += `</svg>`;

  container.innerHTML = html;
}

function toggleMisleadingGraph() {
  showMisleading = !showMisleading;
  createMisleadingComparison('misleadingDemo');
}

// Initialize all charts when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('barChart')) createBarChart('barChart');
  if (document.getElementById('histogram')) createHistogram('histogram');
  if (document.getElementById('pieChart')) createPieChart('pieChart');
  if (document.getElementById('lineGraph')) createLineGraph('lineGraph');
  if (document.getElementById('scatterplot')) createScatterplot('scatterplot');
  if (document.getElementById('misleadingDemo')) createMisleadingComparison('misleadingDemo');
});

// Make responsive
window.addEventListener('resize', function() {
  if (document.getElementById('barChart')) createBarChart('barChart');
  if (document.getElementById('histogram')) createHistogram('histogram');
  if (document.getElementById('pieChart')) createPieChart('pieChart');
  if (document.getElementById('lineGraph')) createLineGraph('lineGraph');
  if (document.getElementById('scatterplot')) createScatterplot('scatterplot');
  if (document.getElementById('misleadingDemo')) createMisleadingComparison('misleadingDemo');
});
