// Interactive Algebra Visualizations for Module 1
// Pure JavaScript - no external dependencies

// 1. Number Line: Real Number Hierarchy
function createNumberLine(containerId) {
  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 800);
  const height = 400;

  let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

  // Title
  svg += `<text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="700" fill="#2C5F7C">Real Number System Hierarchy</text>`;

  // Nested rectangles showing hierarchy (Venn diagram style)
  const centerX = width / 2;
  const centerY = height / 2 + 20;

  // Real Numbers (outermost)
  svg += `<rect x="${centerX - 350}" y="${centerY - 150}" width="700" height="300" fill="#E3F2FD" stroke="#2C5F7C" stroke-width="3" rx="10" opacity="0.3"/>`;
  svg += `<text x="${centerX - 330}" y="${centerY - 125}" font-size="14" font-weight="600" fill="#2C5F7C">ℝ Real Numbers</text>`;

  // Rational Numbers
  svg += `<rect x="${centerX - 250}" y="${centerY - 120}" width="400" height="240" fill="#BBDEFB" stroke="#1976D2" stroke-width="2" rx="8" opacity="0.4"/>`;
  svg += `<text x="${centerX - 235}" y="${centerY - 100}" font-size="13" font-weight="600" fill="#1976D2">ℚ Rational Numbers (fractions)</text>`;

  // Integers
  svg += `<rect x="${centerX - 150}" y="${centerY - 90}" width="250" height="180" fill="#90CAF9" stroke="#1565C0" stroke-width="2" rx="6" opacity="0.5"/>`;
  svg += `<text x="${centerX - 135}" y="${centerY - 70}" font-size="12" font-weight="600" fill="#1565C0">ℤ Integers</text>`;

  // Whole Numbers
  svg += `<rect x="${centerX - 80}" y="${centerY - 60}" width="140" height="120" fill="#64B5F6" stroke="#0D47A1" stroke-width="2" rx="4" opacity="0.6"/>`;
  svg += `<text x="${centerX - 65}" y="${centerY - 40}" font-size="11" font-weight="600" fill="#0D47A1">𝕎 Whole Numbers</text>`;

  // Natural Numbers (innermost)
  svg += `<rect x="${centerX - 50}" y="${centerY - 30}" width="80" height="60" fill="#42A5F5" stroke="#01579B" stroke-width="2" rx="3" opacity="0.7"/>`;
  svg += `<text x="${centerX - 40}" y="${centerY - 12}" font-size="10" font-weight="600" fill="#01579B">ℕ Natural</text>`;
  svg += `<text x="${centerX - 10}" y="${centerY + 5}" text-anchor="middle" font-size="11" fill="#333">1, 2, 3...</text>`;

  // Irrational Numbers (separate box)
  svg += `<rect x="${centerX + 100}" y="${centerY - 120}" width="140" height="100" fill="#FFE0B2" stroke="#F57C00" stroke-width="2" rx="6" opacity="0.6"/>`;
  svg += `<text x="${centerX + 115}" y="${centerY - 100}" font-size="12" font-weight="600" fill="#F57C00">Irrational Numbers</text>`;
  svg += `<text x="${centerX + 170}" y="${centerY - 80}" text-anchor="middle" font-size="11" fill="#666">√2, π, e</text>`;
  svg += `<text x="${centerX + 170}" y="${centerY - 60}" text-anchor="middle" font-size="9" fill="#666">(Cannot be written</text>`;
  svg += `<text x="${centerX + 170}" y="${centerY - 45}" text-anchor="middle" font-size="9" fill="#666">as fractions)</text>`;

  // Examples
  const exY = height - 50;
  svg += `<text x="${width/2}" y="${exY - 10}" text-anchor="middle" font-size="11" font-weight="600" fill="#333">Examples:</text>`;
  svg += `<text x="80" y="${exY + 10}" font-size="10" fill="#666"><tspan font-weight="600">5:</tspan> Natural, Whole, Integer, Rational, Real</text>`;
  svg += `<text x="${width/2 - 100}" y="${exY + 10}" font-size="10" fill="#666"><tspan font-weight="600">0:</tspan> Whole, Integer, Rational, Real</text>`;
  svg += `<text x="${width/2 + 100}" y="${exY + 10}" font-size="10" fill="#666"><tspan font-weight="600">-3:</tspan> Integer, Rational, Real</text>`;
  svg += `<text x="80" y="${exY + 25}" font-size="10" fill="#666"><tspan font-weight="600">2/3:</tspan> Rational, Real</text>`;
  svg += `<text x="${width/2 - 100}" y="${exY + 25}" font-size="10" fill="#666"><tspan font-weight="600">√7:</tspan> Irrational, Real</text>`;
  svg += `<text x="${width/2 + 100}" y="${exY + 25}" font-size="10" fill="#666"><tspan font-weight="600">π:</tspan> Irrational, Real</text>`;

  svg += `</svg>`;
  container.innerHTML = svg;
}

// 2. Coordinate Plane: Cartesian Plane with Quadrants
function createCoordinatePlane(containerId) {
  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 600);
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = 30;

  let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

  // Title
  svg += `<text x="${width/2}" y="20" text-anchor="middle" font-size="16" font-weight="700" fill="#2C5F7C">Cartesian Coordinate Plane</text>`;

  // Grid lines (light)
  for (let i = -8; i <= 8; i++) {
    if (i !== 0) {
      // Vertical lines
      svg += `<line x1="${centerX + i * scale}" y1="40" x2="${centerX + i * scale}" y2="${height - 20}" stroke="#E0E0E0" stroke-width="1"/>`;
      // Horizontal lines
      svg += `<line x1="40" y1="${centerY + i * scale}" x2="${width - 40}" y2="${centerY + i * scale}" stroke="#E0E0E0" stroke-width="1"/>`;
    }
  }

  // Axes
  svg += `<line x1="40" y1="${centerY}" x2="${width - 40}" y2="${centerY}" stroke="#333" stroke-width="2"/>`;
  svg += `<line x1="${centerX}" y1="40" x2="${centerX}" y2="${height - 20}" stroke="#333" stroke-width="2"/>`;

  // Axis labels
  svg += `<text x="${width - 30}" y="${centerY - 10}" font-size="14" font-weight="600" fill="#333">x</text>`;
  svg += `<text x="${centerX + 10}" y="50" font-size="14" font-weight="600" fill="#333">y</text>`;

  // Tick marks and numbers
  for (let i = -7; i <= 7; i++) {
    if (i !== 0) {
      // X-axis ticks
      svg += `<line x1="${centerX + i * scale}" y1="${centerY - 3}" x2="${centerX + i * scale}" y2="${centerY + 3}" stroke="#333" stroke-width="1"/>`;
      if (i % 2 === 0) {
        svg += `<text x="${centerX + i * scale}" y="${centerY + 15}" text-anchor="middle" font-size="10" fill="#666">${i}</text>`;
      }
      // Y-axis ticks
      svg += `<line x1="${centerX - 3}" y1="${centerY - i * scale}" x2="${centerX + 3}" y2="${centerY - i * scale}" stroke="#333" stroke-width="1"/>`;
      if (i % 2 === 0) {
        svg += `<text x="${centerX - 15}" y="${centerY - i * scale + 4}" text-anchor="end" font-size="10" fill="#666">${i}</text>`;
      }
    }
  }

  // Origin
  svg += `<text x="${centerX - 15}" y="${centerY + 15}" font-size="11" fill="#333">(0,0)</text>`;

  // Quadrant labels
  svg += `<text x="${centerX + 80}" y="${centerY - 80}" font-size="14" font-weight="700" fill="#2C5F7C">Quadrant I</text>`;
  svg += `<text x="${centerX + 80}" y="${centerY - 65}" font-size="11" fill="#666">(+, +)</text>`;

  svg += `<text x="${centerX - 80}" y="${centerY - 80}" font-size="14" font-weight="700" fill="#2C5F7C">Quadrant II</text>`;
  svg += `<text x="${centerX - 80}" y="${centerY - 65}" font-size="11" fill="#666">(−, +)</text>`;

  svg += `<text x="${centerX - 80}" y="${centerY + 80}" font-size="14" font-weight="700" fill="#2C5F7C">Quadrant III</text>`;
  svg += `<text x="${centerX - 80}" y="${centerY + 95}" font-size="11" fill="#666">(−, −)</text>`;

  svg += `<text x="${centerX + 80}" y="${centerY + 80}" font-size="14" font-weight="700" fill="#2C5F7C">Quadrant IV</text>`;
  svg += `<text x="${centerX + 80}" y="${centerY + 95}" font-size="11" fill="#666">(+, −)</text>`;

  // Sample points
  const points = [
    { x: 3, y: 4, label: '(3, 4)', color: '#28A745' },
    { x: -4, y: 2, label: '(−4, 2)', color: '#DC3545' },
    { x: -3, y: -3, label: '(−3, −3)', color: '#FFC107' },
    { x: 4, y: -2, label: '(4, −2)', color: '#D97D54' }
  ];

  points.forEach(p => {
    const px = centerX + p.x * scale;
    const py = centerY - p.y * scale;
    svg += `<circle cx="${px}" cy="${py}" r="5" fill="${p.color}" stroke="white" stroke-width="2">
      <title>${p.label} in Quadrant</title>
    </circle>`;
    svg += `<text x="${px + 10}" y="${py - 10}" font-size="11" font-weight="600" fill="${p.color}">${p.label}</text>`;
  });

  svg += `</svg>`;
  container.innerHTML = svg;
}

// 3. Distance and Midpoint Visualization
function createDistanceMidpoint(containerId) {
  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 600);
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = 35;

  let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

  // Title
  svg += `<text x="${width/2}" y="20" text-anchor="middle" font-size="16" font-weight="700" fill="#2C5F7C">Distance & Midpoint Formulas</text>`;

  // Grid (subtle)
  for (let i = -6; i <= 6; i++) {
    svg += `<line x1="${centerX + i * scale}" y1="40" x2="${centerX + i * scale}" y2="${height - 80}" stroke="#F0F0F0" stroke-width="1"/>`;
    svg += `<line x1="40" y1="${centerY + i * scale}" x2="${width - 40}" y2="${centerY + i * scale}" stroke="#F0F0F0" stroke-width="1"/>`;
  }

  // Axes
  svg += `<line x1="40" y1="${centerY}" x2="${width - 40}" y2="${centerY}" stroke="#999" stroke-width="1.5"/>`;
  svg += `<line x1="${centerX}" y1="40" x2="${centerX}" y2="${height - 80}" stroke="#999" stroke-width="1.5"/>`;

  // Points
  const p1 = { x: 2, y: 3, label: 'A(2, 3)' };
  const p2 = { x: 8, y: 7, label: 'B(8, 7)' };
  const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

  const p1x = centerX + p1.x * scale;
  const p1y = centerY - p1.y * scale;
  const p2x = centerX + p2.x * scale;
  const p2y = centerY - p2.y * scale;
  const midx = centerX + mid.x * scale;
  const midy = centerY - mid.y * scale;

  // Line connecting points
  svg += `<line x1="${p1x}" y1="${p1y}" x2="${p2x}" y2="${p2y}" stroke="#D97D54" stroke-width="3" opacity="0.6"/>`;

  // Right triangle visualization
  svg += `<line x1="${p1x}" y1="${p1y}" x2="${p2x}" y2="${p1y}" stroke="#999" stroke-width="1.5" stroke-dasharray="4,4"/>`;
  svg += `<line x1="${p2x}" y1="${p1y}" x2="${p2x}" y2="${p2y}" stroke="#999" stroke-width="1.5" stroke-dasharray="4,4"/>`;

  // Leg labels
  svg += `<text x="${(p1x + p2x) / 2}" y="${p1y + 20}" text-anchor="middle" font-size="11" fill="#666">Δx = 6</text>`;
  svg += `<text x="${p2x + 30}" y="${(p1y + p2y) / 2}" text-anchor="middle" font-size="11" fill="#666">Δy = 4</text>`;

  // Points
  svg += `<circle cx="${p1x}" cy="${p1y}" r="6" fill="#2C5F7C" stroke="white" stroke-width="2"/>`;
  svg += `<text x="${p1x - 30}" y="${p1y - 10}" font-size="13" font-weight="600" fill="#2C5F7C">${p1.label}</text>`;

  svg += `<circle cx="${p2x}" cy="${p2y}" r="6" fill="#2C5F7C" stroke="white" stroke-width="2"/>`;
  svg += `<text x="${p2x + 15}" y="${p2y - 10}" font-size="13" font-weight="600" fill="#2C5F7C">${p2.label}</text>`;

  // Midpoint
  svg += `<circle cx="${midx}" cy="${midy}" r="6" fill="#28A745" stroke="white" stroke-width="2"/>`;
  svg += `<text x="${midx}" y="${midy - 15}" text-anchor="middle" font-size="13" font-weight="600" fill="#28A745">Midpoint M(5, 5)</text>`;

  // Distance label
  const distY = (p1y + p2y) / 2 - 15;
  svg += `<text x="${(p1x + p2x) / 2 + 20}" y="${distY}" font-size="12" font-weight="600" fill="#D97D54">d = √52 ≈ 7.21</text>`;

  // Formulas at bottom
  const formulaY = height - 55;
  svg += `<rect x="50" y="${formulaY - 10}" width="${width - 100}" height="50" fill="#F8F9FA" stroke="#2C5F7C" stroke-width="2" rx="6"/>`;
  svg += `<text x="${width/2}" y="${formulaY + 5}" text-anchor="middle" font-size="13" font-weight="600" fill="#2C5F7C">Distance Formula:</text>`;
  svg += `<text x="${width/2}" y="${formulaY + 22}" text-anchor="middle" font-size="12" fill="#333">d = √[(x₂ − x₁)² + (y₂ − y₁)²] = √[(8−2)² + (7−3)²] = √[36 + 16] = √52</text>`;

  svg += `</svg>`;
  container.innerHTML = svg;
}

// 4. Vertical Line Test (Interactive - will show both examples)
function createVerticalLineTest(containerId) {
  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 700);
  const height = 350;

  let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

  // Title
  svg += `<text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="700" fill="#2C5F7C">Vertical Line Test</text>`;
  svg += `<text x="${width/2}" y="45" text-anchor="middle" font-size="12" fill="#666">If ANY vertical line intersects the graph more than once, it's NOT a function</text>`;

  const graphY = 70;
  const graphWidth = (width - 80) / 2;
  const graphHeight = height - graphY - 60;

  // FUNCTION EXAMPLE: Parabola
  const g1X = 40;
  svg += `<text x="${g1X + graphWidth/2}" y="${graphY + 20}" text-anchor="middle" font-size="14" font-weight="600" fill="#28A745">✓ IS a Function</text>`;
  svg += `<text x="${g1X + graphWidth/2}" y="${graphY + 38}" text-anchor="middle" font-size="11" fill="#666">f(x) = x²</text>`;

  // Axes
  const centerX1 = g1X + graphWidth / 2;
  const centerY1 = graphY + 60 + graphHeight / 2;
  svg += `<line x1="${g1X + 20}" y1="${centerY1}" x2="${g1X + graphWidth - 20}" y2="${centerY1}" stroke="#999" stroke-width="1"/>`;
  svg += `<line x1="${centerX1}" y1="${graphY + 60}" x2="${centerX1}" y2="${graphY + 60 + graphHeight}" stroke="#999" stroke-width="1"/>`;

  // Parabola (function)
  let path1 = `M ${centerX1 - 60} ${centerY1 - 90}`;
  for (let x = -60; x <= 60; x += 2) {
    const y = -(x * x) / 40;
    path1 += ` L ${centerX1 + x} ${centerY1 + y}`;
  }
  svg += `<path d="${path1}" fill="none" stroke="#28A745" stroke-width="3"/>`;

  // Vertical line
  svg += `<line x1="${centerX1 + 30}" y1="${graphY + 60}" x2="${centerX1 + 30}" y2="${graphY + 60 + graphHeight}" stroke="#2C5F7C" stroke-width="2" stroke-dasharray="5,5"/>`;
  svg += `<circle cx="${centerX1 + 30}" cy="${centerY1 - 22.5}" r="4" fill="#DC3545"/>`;
  svg += `<text x="${centerX1 + 30}" y="${graphY + 60 + graphHeight + 15}" text-anchor="middle" font-size="10" fill="#28A745">Hits ONCE ✓</text>`;

  // NOT FUNCTION EXAMPLE: Circle
  const g2X = width / 2 + 20;
  svg += `<text x="${g2X + graphWidth/2}" y="${graphY + 20}" text-anchor="middle" font-size="14" font-weight="600" fill="#DC3545">✗ NOT a Function</text>`;
  svg += `<text x="${g2X + graphWidth/2}" y="${graphY + 38}" text-anchor="middle" font-size="11" fill="#666">x² + y² = r²</text>`;

  // Axes
  const centerX2 = g2X + graphWidth / 2;
  const centerY2 = graphY + 60 + graphHeight / 2;
  svg += `<line x1="${g2X + 20}" y1="${centerY2}" x2="${g2X + graphWidth - 20}" y2="${centerY2}" stroke="#999" stroke-width="1"/>`;
  svg += `<line x1="${centerX2}" y1="${graphY + 60}" x2="${centerX2}" y2="${graphY + 60 + graphHeight}" stroke="#999" stroke-width="1"/>`;

  // Circle (not a function)
  svg += `<circle cx="${centerX2}" cy="${centerY2}" r="60" fill="none" stroke="#DC3545" stroke-width="3"/>`;

  // Vertical line (hits twice)
  svg += `<line x1="${centerX2 + 20}" y1="${graphY + 60}" x2="${centerX2 + 20}" y2="${graphY + 60 + graphHeight}" stroke="#2C5F7C" stroke-width="2" stroke-dasharray="5,5"/>`;
  const circleY1 = centerY2 - Math.sqrt(3600 - 400);
  const circleY2 = centerY2 + Math.sqrt(3600 - 400);
  svg += `<circle cx="${centerX2 + 20}" cy="${circleY1}" r="4" fill="#DC3545"/>`;
  svg += `<circle cx="${centerX2 + 20}" cy="${circleY2}" r="4" fill="#DC3545"/>`;
  svg += `<text x="${centerX2 + 20}" y="${graphY + 60 + graphHeight + 15}" text-anchor="middle" font-size="10" fill="#DC3545">Hits TWICE ✗</text>`;

  svg += `</svg>`;
  container.innerHTML = svg;
}

// 5. Parent Functions (All 6)
function createParentFunctions(containerId) {
  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 900);
  const height = 550;

  let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

  // Title
  svg += `<text x="${width/2}" y="25" text-anchor="middle" font-size="18" font-weight="700" fill="#2C5F7C">Six Parent Functions</text>`;

  const functions = [
    { name: 'Linear', equation: 'f(x) = x', color: '#2C5F7C' },
    { name: 'Quadratic', equation: 'f(x) = x²', color: '#28A745' },
    { name: 'Cubic', equation: 'f(x) = x³', color: '#DC3545' },
    { name: 'Absolute Value', equation: 'f(x) = |x|', color: '#FFC107' },
    { name: 'Square Root', equation: 'f(x) = √x', color: '#D97D54' },
    { name: 'Reciprocal', equation: 'f(x) = 1/x', color: '#6F42C1' }
  ];

  const gridCols = 3;
  const gridRows = 2;
  const cellW = (width - 80) / gridCols;
  const cellH = (height - 80) / gridRows;

  functions.forEach((fn, i) => {
    const col = i % gridCols;
    const row = Math.floor(i / gridCols);
    const x = 40 + col * cellW;
    const y = 50 + row * cellH;

    const graphW = cellW - 20;
    const graphH = cellH - 60;
    const cx = x + graphW / 2;
    const cy = y + 40 + graphH / 2;
    const scale = Math.min(graphW, graphH) / 5;

    // Title
    svg += `<text x="${x + graphW/2}" y="${y + 15}" text-anchor="middle" font-size="13" font-weight="600" fill="${fn.color}">${fn.name}</text>`;
    svg += `<text x="${x + graphW/2}" y="${y + 30}" text-anchor="middle" font-size="11" fill="#666">${fn.equation}</text>`;

    // Mini axes
    svg += `<line x1="${cx - scale * 2.2}" y1="${cy}" x2="${cx + scale * 2.2}" y2="${cy}" stroke="#CCC" stroke-width="1"/>`;
    svg += `<line x1="${cx}" y1="${cy - scale * 2.2}" x2="${cx}" y2="${cy + scale * 2.2}" stroke="#CCC" stroke-width="1"/>`;

    // Draw function
    let path = '';
    if (fn.name === 'Linear') {
      path = `M ${cx - scale * 2} ${cy + scale * 2} L ${cx + scale * 2} ${cy - scale * 2}`;
    } else if (fn.name === 'Quadratic') {
      path = `M ${cx - scale * 2} ${cy - scale * 4}`;
      for (let t = -2; t <= 2; t += 0.1) {
        path += ` L ${cx + t * scale} ${cy - t * t * scale}`;
      }
    } else if (fn.name === 'Cubic') {
      path = `M ${cx - scale * 1.5} ${cy + scale * 1.5 * 1.5 * 1.5}`;
      for (let t = -1.5; t <= 1.5; t += 0.1) {
        path += ` L ${cx + t * scale} ${cy - t * t * t * scale / 2}`;
      }
    } else if (fn.name === 'Absolute Value') {
      path = `M ${cx - scale * 2} ${cy - scale * 2} L ${cx} ${cy} L ${cx + scale * 2} ${cy - scale * 2}`;
    } else if (fn.name === 'Square Root') {
      path = `M ${cx} ${cy}`;
      for (let t = 0; t <= 4; t += 0.1) {
        path += ` L ${cx + t * scale / 2} ${cy - Math.sqrt(t) * scale / 2}`;
      }
    } else if (fn.name === 'Reciprocal') {
      // Quadrant I
      path = `M ${cx + scale * 0.3} ${cy - scale * 2}`;
      for (let t = 0.3; t <= 2; t += 0.1) {
        path += ` L ${cx + t * scale} ${cy - scale / t}`;
      }
      // Quadrant III
      path += ` M ${cx - scale * 0.3} ${cy + scale * 2}`;
      for (let t = -2; t <= -0.3; t += 0.1) {
        path += ` L ${cx + t * scale} ${cy - scale / t}`;
      }
    }

    svg += `<path d="${path}" fill="none" stroke="${fn.color}" stroke-width="2.5"/>`;
  });

  svg += `</svg>`;
  container.innerHTML = svg;
}

// 6. Transformation Comparison (Interactive)
let currentTransform = 'none';

function createTransformationComparison(containerId) {
  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 700);
  const height = 450;
  const centerX = width / 2;
  const centerY = height / 2 + 30;
  const scale = 25;

  let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

  // Title
  svg += `<text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="700" fill="#2C5F7C">Function Transformations</text>`;
  svg += `<text x="${width/2}" y="45" text-anchor="middle" font-size="12" fill="#666">See how transformations change f(x) = x²</text>`;

  // Grid
  for (let i = -6; i <= 6; i++) {
    svg += `<line x1="${centerX + i * scale}" y1="65" x2="${centerX + i * scale}" y2="${height - 80}" stroke="#F0F0F0" stroke-width="1"/>`;
    svg += `<line x1="50" y1="${centerY + i * scale}" x2="${width - 50}" y2="${centerY + i * scale}" stroke="#F0F0F0" stroke-width="1"/>`;
  }

  // Axes
  svg += `<line x1="50" y1="${centerY}" x2="${width - 50}" y2="${centerY}" stroke="#666" stroke-width="1.5"/>`;
  svg += `<line x1="${centerX}" y1="65" x2="${centerX}" y2="${height - 80}" stroke="#666" stroke-width="1.5"/>`;

  // Original function f(x) = x² (always shown in blue)
  let originalPath = `M ${centerX - 5 * scale} ${centerY - 25 * scale}`;
  for (let x = -5; x <= 5; x += 0.2) {
    const y = x * x;
    if (y <= 6.5) {
      originalPath += ` L ${centerX + x * scale} ${centerY - y * scale}`;
    }
  }
  svg += `<path d="${originalPath}" fill="none" stroke="#2C5F7C" stroke-width="2.5" opacity="0.5"/>`;
  svg += `<text x="100" y="90" font-size="12" font-weight="600" fill="#2C5F7C">f(x) = x²</text>`;

  // Transformed function (depends on currentTransform)
  let transformedPath = '';
  let transformLabel = '';
  let transformColor = '#D97D54';

  if (currentTransform === 'shiftUp') {
    // f(x) + 2
    transformedPath = `M ${centerX - 5 * scale} ${centerY - 27 * scale}`;
    for (let x = -5; x <= 5; x += 0.2) {
      const y = x * x + 2;
      if (y <= 6.5) {
        transformedPath += ` L ${centerX + x * scale} ${centerY - y * scale}`;
      }
    }
    transformLabel = 'g(x) = x² + 2 (shift up 2)';
    transformColor = '#28A745';
  } else if (currentTransform === 'shiftRight') {
    // (x-3)²
    transformedPath = `M ${centerX - 2 * scale} ${centerY - 25 * scale}`;
    for (let x = -2; x <= 8; x += 0.2) {
      const y = (x - 3) * (x - 3);
      if (y <= 6.5) {
        transformedPath += ` L ${centerX + x * scale} ${centerY - y * scale}`;
      }
    }
    transformLabel = 'g(x) = (x−3)² (shift right 3)';
    transformColor = '#D97D54';
  } else if (currentTransform === 'reflect') {
    // -x²
    transformedPath = `M ${centerX - 5 * scale} ${centerY + 25 * scale}`;
    for (let x = -5; x <= 5; x += 0.2) {
      const y = -(x * x);
      if (y >= -6.5) {
        transformedPath += ` L ${centerX + x * scale} ${centerY - y * scale}`;
      }
    }
    transformLabel = 'g(x) = −x² (reflect over x-axis)';
    transformColor = '#DC3545';
  } else if (currentTransform === 'stretch') {
    // 2x²
    transformedPath = `M ${centerX - 4 * scale} ${centerY - 32 * scale}`;
    for (let x = -4; x <= 4; x += 0.2) {
      const y = 2 * x * x;
      if (y <= 6.5) {
        transformedPath += ` L ${centerX + x * scale} ${centerY - y * scale}`;
      }
    }
    transformLabel = 'g(x) = 2x² (vertical stretch ×2)';
    transformColor = '#6F42C1';
  }

  if (transformedPath) {
    svg += `<path d="${transformedPath}" fill="none" stroke="${transformColor}" stroke-width="3"/>`;
    svg += `<text x="100" y="110" font-size="12" font-weight="600" fill="${transformColor}">${transformLabel}</text>`;
  }

  svg += `</svg>`;
  container.innerHTML = svg;
}

function applyTransformation(type) {
  currentTransform = type;
  createTransformationComparison('transformationDemo');
}

// Initialize all visualizations when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('numberLine')) createNumberLine('numberLine');
  if (document.getElementById('coordinatePlane')) createCoordinatePlane('coordinatePlane');
  if (document.getElementById('distanceMidpoint')) createDistanceMidpoint('distanceMidpoint');
  if (document.getElementById('verticalLineTest')) createVerticalLineTest('verticalLineTest');
  if (document.getElementById('parentFunctions')) createParentFunctions('parentFunctions');
  if (document.getElementById('transformationDemo')) createTransformationComparison('transformationDemo');
});

// Make responsive
window.addEventListener('resize', function() {
  if (document.getElementById('numberLine')) createNumberLine('numberLine');
  if (document.getElementById('coordinatePlane')) createCoordinatePlane('coordinatePlane');
  if (document.getElementById('distanceMidpoint')) createDistanceMidpoint('distanceMidpoint');
  if (document.getElementById('verticalLineTest')) createVerticalLineTest('verticalLineTest');
  if (document.getElementById('parentFunctions')) createParentFunctions('parentFunctions');
  if (document.getElementById('transformationDemo')) createTransformationComparison('transformationDemo');
});
