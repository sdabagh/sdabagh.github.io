// Interactive Data Visualizations for Module 3: Probability Basics
// Pure JavaScript - no external dependencies

// Utility Functions
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

function combination(n, r) {
  return factorial(n) / (factorial(r) * factorial(n - r));
}

function permutation(n, r) {
  return factorial(n) / factorial(n - r);
}

// Chart 1: Probability Tree Diagram
// Interactive tree showing probability outcomes for coin flips
function createProbabilityTree(containerId) {
  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 700);
  const height = 500;

  let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

  // Title
  svg += `<text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" fill="#2D2D2D">Probability Tree: Two Coin Flips</text>`;
  svg += `<text x="${width/2}" y="45" text-anchor="middle" font-size="12" fill="#666">Each branch shows probability of that outcome</text>`;

  // Define coordinates for tree
  const startX = width / 2;
  const startY = 80;
  const level1Y = 180;
  const level2Y = 320;
  const branchSpacing = 120;

  // Root node
  svg += `<circle cx="${startX}" cy="${startY}" r="10" fill="#3A7CA5"/>`;
  svg += `<text x="${startX}" y="${startY - 20}" text-anchor="middle" font-size="12" font-weight="600" fill="#2D2D2D">Start</text>`;

  // First flip branches
  const flip1Left = startX - branchSpacing;
  const flip1Right = startX + branchSpacing;

  // Left branch (H)
  svg += `<line x1="${startX}" y1="${startY}" x2="${flip1Left}" y2="${level1Y}" stroke="#28A745" stroke-width="2"/>`;
  svg += `<text x="${(startX + flip1Left)/2 - 20}" y="${(startY + level1Y)/2}" font-size="11" fill="#28A745" font-weight="600">H (1/2)</text>`;
  svg += `<circle cx="${flip1Left}" cy="${level1Y}" r="10" fill="#28A745"/>`;
  svg += `<text x="${flip1Left}" y="${level1Y - 20}" text-anchor="middle" font-size="12" font-weight="600" fill="#2D2D2D">H</text>`;

  // Right branch (T)
  svg += `<line x1="${startX}" y1="${startY}" x2="${flip1Right}" y2="${level1Y}" stroke="#DC3545" stroke-width="2"/>`;
  svg += `<text x="${(startX + flip1Right)/2 + 20}" y="${(startY + level1Y)/2}" font-size="11" fill="#DC3545" font-weight="600">T (1/2)</text>`;
  svg += `<circle cx="${flip1Right}" cy="${level1Y}" r="10" fill="#DC3545"/>`;
  svg += `<text x="${flip1Right}" y="${level1Y - 20}" text-anchor="middle" font-size="12" font-weight="600" fill="#2D2D2D">T</text>`;

  // Second flip branches from left (H)
  const hhX = flip1Left - 80;
  const htX = flip1Left + 80;

  svg += `<line x1="${flip1Left}" y1="${level1Y}" x2="${hhX}" y2="${level2Y}" stroke="#28A745" stroke-width="2"/>`;
  svg += `<text x="${(flip1Left + hhX)/2 - 20}" y="${(level1Y + level2Y)/2}" font-size="10" fill="#28A745">H (1/2)</text>`;
  svg += `<circle cx="${hhX}" cy="${level2Y}" r="8" fill="#28A745"/>`;

  svg += `<line x1="${flip1Left}" y1="${level1Y}" x2="${htX}" y2="${level2Y}" stroke="#DC3545" stroke-width="2"/>`;
  svg += `<text x="${(flip1Left + htX)/2 + 20}" y="${(level1Y + level2Y)/2}" font-size="10" fill="#DC3545">T (1/2)</text>`;
  svg += `<circle cx="${htX}" cy="${level2Y}" r="8" fill="#DC3545"/>`;

  // Second flip branches from right (T)
  const thX = flip1Right - 80;
  const ttX = flip1Right + 80;

  svg += `<line x1="${flip1Right}" y1="${level1Y}" x2="${thX}" y2="${level2Y}" stroke="#28A745" stroke-width="2"/>`;
  svg += `<text x="${(flip1Right + thX)/2 - 20}" y="${(level1Y + level2Y)/2}" font-size="10" fill="#28A745">H (1/2)</text>`;
  svg += `<circle cx="${thX}" cy="${level2Y}" r="8" fill="#28A745"/>`;

  svg += `<line x1="${flip1Right}" y1="${level1Y}" x2="${ttX}" y2="${level2Y}" stroke="#DC3545" stroke-width="2"/>`;
  svg += `<text x="${(flip1Right + ttX)/2 + 20}" y="${(level1Y + level2Y)/2}" font-size="10" fill="#DC3545">T (1/2)</text>`;
  svg += `<circle cx="${ttX}" cy="${level2Y}" r="8" fill="#DC3545"/>`;

  // Final outcomes
  svg += `<text x="${hhX}" y="${level2Y + 25}" text-anchor="middle" font-size="11" font-weight="600" fill="#2D2D2D">HH</text>`;
  svg += `<text x="${hhX}" y="${level2Y + 40}" text-anchor="middle" font-size="10" fill="#666">P = 1/4</text>`;

  svg += `<text x="${htX}" y="${level2Y + 25}" text-anchor="middle" font-size="11" font-weight="600" fill="#2D2D2D">HT</text>`;
  svg += `<text x="${htX}" y="${level2Y + 40}" text-anchor="middle" font-size="10" fill="#666">P = 1/4</text>`;

  svg += `<text x="${thX}" y="${level2Y + 25}" text-anchor="middle" font-size="11" font-weight="600" fill="#2D2D2D">TH</text>`;
  svg += `<text x="${thX}" y="${level2Y + 40}" text-anchor="middle" font-size="10" fill="#666">P = 1/4</text>`;

  svg += `<text x="${ttX}" y="${level2Y + 25}" text-anchor="middle" font-size="11" font-weight="600" fill="#2D2D2D">TT</text>`;
  svg += `<text x="${ttX}" y="${level2Y + 40}" text-anchor="middle" font-size="10" fill="#666">P = 1/4</text>`;

  // Summary box
  svg += `<rect x="20" y="${height - 80}" width="240" height="60" fill="#f0f8ff" stroke="#3A7CA5" stroke-width="2" rx="4"/>`;
  svg += `<text x="30" y="${height - 60}" font-size="11" font-weight="600" fill="#2D2D2D">Multiplication Rule:</text>`;
  svg += `<text x="30" y="${height - 45}" font-size="10" fill="#666">P(HH) = P(H) × P(H) = 1/2 × 1/2 = 1/4</text>`;
  svg += `<text x="30" y="${height - 30}" font-size="10" fill="#666">All outcomes sum to 1</text>`;

  svg += `</svg>`;
  container.innerHTML = svg;
}

// Chart 2: Interactive Dice Probability Simulator
// Shows theoretical vs experimental probabilities
function createDiceSimulator(containerId) {
  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 700);
  const height = 450;

  // State
  let rolls = [0, 0, 0, 0, 0, 0]; // Count for each face
  let totalRolls = 0;

  function drawChart() {
    const padding = { top: 60, right: 20, bottom: 80, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const theoretical = 1/6;
    const barWidth = chartWidth / 7;

    let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

    // Title
    svg += `<text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" fill="#2D2D2D">Dice Roll Simulator</text>`;
    svg += `<text x="${width/2}" y="45" text-anchor="middle" font-size="12" fill="#666">Theoretical probability: 1/6 ≈ 0.167 for each face • Total rolls: ${totalRolls}</text>`;

    // Y-axis
    svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;
    svg += `<text x="20" y="${padding.top + chartHeight/2}" text-anchor="middle" transform="rotate(-90, 20, ${padding.top + chartHeight/2})" font-size="12" fill="#666">Probability</text>`;

    // Y-axis ticks
    for (let i = 0; i <= 5; i++) {
      const prob = i * 0.1;
      const y = height - padding.bottom - (prob / 0.5) * chartHeight;
      svg += `<line x1="${padding.left - 5}" y1="${y}" x2="${padding.left}" y2="${y}" stroke="#666" stroke-width="1"/>`;
      svg += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="10" fill="#666">${prob.toFixed(1)}</text>`;
    }

    // X-axis
    svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;

    // Theoretical probability line
    const theoreticalY = height - padding.bottom - (theoretical / 0.5) * chartHeight;
    svg += `<line x1="${padding.left}" y1="${theoreticalY}" x2="${width - padding.right}" y2="${theoreticalY}" stroke="#FFA500" stroke-width="2" stroke-dasharray="5,5"/>`;
    svg += `<text x="${width - padding.right - 80}" y="${theoreticalY - 5}" font-size="10" fill="#FFA500" font-weight="600">Theoretical (1/6)</text>`;

    // Bars
    for (let i = 0; i < 6; i++) {
      const x = padding.left + (i + 0.5) * barWidth + barWidth / 4;
      const experimental = totalRolls > 0 ? rolls[i] / totalRolls : 0;
      const barHeight = (experimental / 0.5) * chartHeight;
      const y = height - padding.bottom - barHeight;

      svg += `<rect x="${x}" y="${y}" width="${barWidth * 0.5}" height="${barHeight}" fill="#3A7CA5" opacity="0.8"/>`;
      svg += `<text x="${x + barWidth * 0.25}" y="${height - padding.bottom + 20}" text-anchor="middle" font-size="12" fill="#2D2D2D">${i + 1}</text>`;

      if (totalRolls > 0) {
        svg += `<text x="${x + barWidth * 0.25}" y="${y - 5}" text-anchor="middle" font-size="9" fill="#666">${experimental.toFixed(3)}</text>`;
      }
    }

    svg += `<text x="${width/2}" y="${height - padding.bottom + 50}" text-anchor="middle" font-size="12" fill="#666">Die Face</text>`;

    svg += `</svg>`;

    return svg;
  }

  // Initial render
  container.innerHTML = drawChart();

  // Add roll button
  const buttonDiv = document.createElement('div');
  buttonDiv.style.textAlign = 'center';
  buttonDiv.style.marginTop = '15px';

  const rollButton = document.createElement('button');
  rollButton.textContent = '🎲 Roll Die';
  rollButton.className = 'btn btn-primary';
  rollButton.style.marginRight = '10px';
  rollButton.onclick = () => {
    const result = Math.floor(Math.random() * 6);
    rolls[result]++;
    totalRolls++;
    container.innerHTML = drawChart();
  };

  const roll10Button = document.createElement('button');
  roll10Button.textContent = '🎲 Roll 10 Times';
  roll10Button.className = 'btn btn-accent';
  roll10Button.style.marginRight = '10px';
  roll10Button.onclick = () => {
    for (let i = 0; i < 10; i++) {
      const result = Math.floor(Math.random() * 6);
      rolls[result]++;
      totalRolls++;
    }
    container.innerHTML = drawChart();
  };

  const resetButton = document.createElement('button');
  resetButton.textContent = '🔄 Reset';
  resetButton.className = 'btn btn-outline';
  resetButton.onclick = () => {
    rolls = [0, 0, 0, 0, 0, 0];
    totalRolls = 0;
    container.innerHTML = drawChart();
  };

  buttonDiv.appendChild(rollButton);
  buttonDiv.appendChild(roll10Button);
  buttonDiv.appendChild(resetButton);
  container.appendChild(buttonDiv);
}

// Chart 3: Venn Diagram for Conditional Probability
// Visualizes P(A|B) = P(A and B) / P(B)
function createVennDiagram(containerId) {
  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 700);
  const height = 400;

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 80;

  let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

  // Title
  svg += `<text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" fill="#2D2D2D">Conditional Probability: P(A|B)</text>`;
  svg += `<text x="${width/2}" y="45" text-anchor="middle" font-size="12" fill="#666">Given B occurred, what's the probability A also occurred?</text>`;

  // Circle A (left)
  svg += `<circle cx="${centerX - 40}" cy="${centerY}" r="${radius}" fill="#3A7CA5" opacity="0.3" stroke="#3A7CA5" stroke-width="2"/>`;
  svg += `<text x="${centerX - 90}" y="${centerY - 60}" font-size="14" font-weight="600" fill="#3A7CA5">Event A</text>`;
  svg += `<text x="${centerX - 90}" y="${centerY - 42}" font-size="11" fill="#666">P(A) = 0.5</text>`;

  // Circle B (right)
  svg += `<circle cx="${centerX + 40}" cy="${centerY}" r="${radius}" fill="#28A745" opacity="0.3" stroke="#28A745" stroke-width="2"/>`;
  svg += `<text x="${centerX + 90}" y="${centerY - 60}" text-anchor="end" font-size="14" font-weight="600" fill="#28A745">Event B</text>`;
  svg += `<text x="${centerX + 90}" y="${centerY - 42}" text-anchor="end" font-size="11" fill="#666">P(B) = 0.6</text>`;

  // Intersection label
  svg += `<text x="${centerX}" y="${centerY + 5}" text-anchor="middle" font-size="12" font-weight="600" fill="#2D2D2D">A ∩ B</text>`;
  svg += `<text x="${centerX}" y="${centerY + 20}" text-anchor="middle" font-size="10" fill="#666">P(A and B) = 0.3</text>`;

  // Formula box
  svg += `<rect x="${width/2 - 150}" y="${height - 120}" width="300" height="90" fill="#e8f5e9" stroke="#28A745" stroke-width="2" rx="4"/>`;
  svg += `<text x="${width/2}" y="${height - 95}" text-anchor="middle" font-size="12" font-weight="600" fill="#2D2D2D">Conditional Probability Formula:</text>`;
  svg += `<text x="${width/2}" y="${height - 75}" text-anchor="middle" font-size="11" fill="#2D2D2D">P(A|B) = P(A and B) / P(B)</text>`;
  svg += `<text x="${width/2}" y="${height - 55}" text-anchor="middle" font-size="11" fill="#2D2D2D">P(A|B) = 0.3 / 0.6 = 0.5</text>`;
  svg += `<text x="${width/2}" y="${height - 38}" text-anchor="middle" font-size="10" fill="#666" font-style="italic">"Given B occurred, 50% chance A also occurred"</text>`;

  svg += `</svg>`;
  container.innerHTML = svg;
}

// Chart 4: Probability Distribution Visualizer
// Shows distribution with expected value calculation
function createDistributionVisualizer(containerId) {
  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 700);
  const height = 450;

  // Example: Number of heads in 3 coin flips
  const distribution = [
    { x: 0, prob: 0.125, label: '0 heads (TTT)' },
    { x: 1, prob: 0.375, label: '1 head (HTT, THT, TTH)' },
    { x: 2, prob: 0.375, label: '2 heads (HHT, HTH, THH)' },
    { x: 3, prob: 0.125, label: '3 heads (HHH)' }
  ];

  // Calculate expected value
  let expectedValue = 0;
  distribution.forEach(d => {
    expectedValue += d.x * d.prob;
  });

  const padding = { top: 60, right: 20, bottom: 100, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const barWidth = chartWidth / 5;
  const maxProb = Math.max(...distribution.map(d => d.prob));

  let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

  // Title
  svg += `<text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" fill="#2D2D2D">Probability Distribution: Heads in 3 Coin Flips</text>`;
  svg += `<text x="${width/2}" y="45" text-anchor="middle" font-size="12" fill="#666">Expected Value E(X) = ${expectedValue.toFixed(2)}</text>`;

  // Y-axis
  svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;
  svg += `<text x="20" y="${padding.top + chartHeight/2}" text-anchor="middle" transform="rotate(-90, 20, ${padding.top + chartHeight/2})" font-size="12" fill="#666">Probability P(X)</text>`;

  // Y-axis ticks
  for (let i = 0; i <= 4; i++) {
    const prob = i * 0.1;
    const y = height - padding.bottom - (prob / maxProb) * chartHeight;
    svg += `<line x1="${padding.left - 5}" y1="${y}" x2="${padding.left}" y2="${y}" stroke="#666" stroke-width="1"/>`;
    svg += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="10" fill="#666">${prob.toFixed(1)}</text>`;
  }

  // X-axis
  svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;
  svg += `<text x="${width/2}" y="${height - padding.bottom + 70}" text-anchor="middle" font-size="12" fill="#666">Number of Heads (X)</text>`;

  // Bars
  distribution.forEach((d, i) => {
    const x = padding.left + (i + 0.5) * barWidth;
    const barHeight = (d.prob / maxProb) * chartHeight;
    const y = height - padding.bottom - barHeight;

    // Highlight expected value
    const isNearExpected = Math.abs(d.x - expectedValue) < 0.5;
    const fillColor = isNearExpected ? '#FFA500' : '#3A7CA5';

    svg += `<rect x="${x}" y="${y}" width="${barWidth * 0.6}" height="${barHeight}" fill="${fillColor}" opacity="0.8"/>`;
    svg += `<text x="${x + barWidth * 0.3}" y="${height - padding.bottom + 20}" text-anchor="middle" font-size="12" fill="#2D2D2D">${d.x}</text>`;
    svg += `<text x="${x + barWidth * 0.3}" y="${y - 5}" text-anchor="middle" font-size="10" fill="#2D2D2D">${d.prob.toFixed(3)}</text>`;
  });

  // Expected value line
  const evX = padding.left + (expectedValue + 0.5) * barWidth;
  svg += `<line x1="${evX}" y1="${padding.top}" x2="${evX}" y2="${height - padding.bottom}" stroke="#DC3545" stroke-width="2" stroke-dasharray="5,5"/>`;
  svg += `<text x="${evX + 10}" y="${padding.top + 20}" font-size="11" fill="#DC3545" font-weight="600">E(X) = ${expectedValue.toFixed(2)}</text>`;

  // Calculation box
  svg += `<rect x="20" y="${height - 90}" width="280" height="70" fill="#f0f8ff" stroke="#3A7CA5" stroke-width="2" rx="4"/>`;
  svg += `<text x="30" y="${height - 70}" font-size="11" font-weight="600" fill="#2D2D2D">E(X) = Σ[x · P(X = x)]</text>`;
  svg += `<text x="30" y="${height - 55}" font-size="10" fill="#666">= 0(0.125) + 1(0.375) + 2(0.375) + 3(0.125)</text>`;
  svg += `<text x="30" y="${height - 40}" font-size="10" fill="#666">= 0 + 0.375 + 0.75 + 0.375</text>`;
  svg += `<text x="30" y="${height - 25}" font-size="10" fill="#666" font-weight="600">= ${expectedValue.toFixed(2)} heads on average</text>`;

  svg += `</svg>`;
  container.innerHTML = svg;
}

// Resize handling
window.addEventListener('resize', () => {
  if (document.getElementById('probabilityTree')) createProbabilityTree('probabilityTree');
  if (document.getElementById('diceSimulator')) createDiceSimulator('diceSimulator');
  if (document.getElementById('vennDiagram')) createVennDiagram('vennDiagram');
  if (document.getElementById('distributionVisualizer')) createDistributionVisualizer('distributionVisualizer');
});
