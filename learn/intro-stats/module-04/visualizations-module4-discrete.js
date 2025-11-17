// Interactive Data Visualizations for Module 4: Discrete Probability Distributions
// Pure JavaScript - no external dependencies

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Factorial function
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

// Combination: C(n,k) = n! / (k!(n-k)!)
function combination(n, k) {
  if (k > n || k < 0) return 0;
  if (k === 0 || k === n) return 1;
  return factorial(n) / (factorial(k) * factorial(n - k));
}

// Binomial probability: P(X = k) = C(n,k) * p^k * (1-p)^(n-k)
function binomialProbability(n, k, p) {
  return combination(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

// Calculate probabilities for all values in binomial distribution
function calculateBinomialDistribution(n, p) {
  const probabilities = [];
  for (let k = 0; k <= n; k++) {
    probabilities.push({
      value: k,
      probability: binomialProbability(n, k, p)
    });
  }
  return probabilities;
}

// ============================================================================
// CHART 1: US HOUSEHOLD SIZE PROBABILITY DISTRIBUTION
// ============================================================================

function createHouseholdDistribution(containerId) {
  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 700);
  const height = 400;
  const padding = { top: 60, right: 40, bottom: 80, left: 60 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // US Household size data
  const data = [
    { size: '1', label: '1 person', prob: 0.28 },
    { size: '2', label: '2 people', prob: 0.34 },
    { size: '3', label: '3 people', prob: 0.15 },
    { size: '4', label: '4 people', prob: 0.13 },
    { size: '5+', label: '5+ people', prob: 0.10 }
  ];

  // Calculate expected value
  let expectedValue = 1 * 0.28 + 2 * 0.34 + 3 * 0.15 + 4 * 0.13 + 5 * 0.10;

  const maxProb = Math.max(...data.map(d => d.prob));
  const barWidth = chartWidth / (data.length * 1.5);

  let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

  // Title
  svg += `<text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" fill="#2D2D2D">US Household Size Distribution</text>`;
  svg += `<text x="${width/2}" y="45" text-anchor="middle" font-size="12" fill="#666">Probability of different household sizes</text>`;

  // Y-axis label
  svg += `<text x="15" y="${height/2}" text-anchor="middle" font-size="11" fill="#666" transform="rotate(-90 15 ${height/2})">Probability</text>`;

  // X-axis
  svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;

  // Y-axis
  svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;

  // Y-axis ticks and labels
  for (let i = 0; i <= 5; i++) {
    const prob = i / 5;
    const y = height - padding.bottom - (prob / maxProb) * chartHeight;
    svg += `<line x1="${padding.left - 5}" y1="${y}" x2="${padding.left}" y2="${y}" stroke="#666" stroke-width="1"/>`;
    svg += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="10" fill="#666">${prob.toFixed(1)}</text>`;
  }

  // Draw bars
  data.forEach((item, index) => {
    const barHeight = (item.prob / maxProb) * chartHeight;
    const x = padding.left + index * (chartWidth / data.length) + (chartWidth / (data.length * 2)) - barWidth / 2;
    const y = height - padding.bottom - barHeight;

    // Bar
    svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#3A7CA5" opacity="0.8" stroke="#2C5F7C" stroke-width="2">
      <title>${item.label}: ${(item.prob * 100).toFixed(1)}%</title>
    </rect>`;

    // Value label on top of bar
    svg += `<text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" font-size="11" font-weight="600" fill="#2C5F7C">${(item.prob * 100).toFixed(0)}%</text>`;

    // X-axis label
    svg += `<text x="${x + barWidth/2}" y="${height - padding.bottom + 20}" text-anchor="middle" font-size="11" fill="#666">${item.size}</text>`;
  });

  // Expected value indicator
  const expectedValueX = padding.left + expectedValue / 5.5 * chartWidth;
  svg += `<line x1="${expectedValueX}" y1="${padding.top}" x2="${expectedValueX}" y2="${height - padding.bottom}" stroke="#D97D54" stroke-width="3" stroke-dasharray="5,5" opacity="0.7"/>`;
  svg += `<text x="${expectedValueX}" y="${padding.top - 5}" text-anchor="middle" font-size="12" font-weight="600" fill="#D97D54">E(X) = ${expectedValue.toFixed(2)}</text>`;

  // Legend
  svg += `<text x="${padding.left}" y="${height - 15}" font-size="11" fill="#666" font-style="italic">💡 Dashed line shows expected value (average household size)</text>`;

  svg += `</svg>`;
  container.innerHTML = svg;
}

// ============================================================================
// CHART 2: EXPECTED VALUE VISUALIZER WITH SLIDERS
// ============================================================================

function createExpectedValueVisualizer(containerId) {
  const container = document.getElementById(containerId);

  // Create HTML structure with sliders
  container.innerHTML = `
    <div style="background: white; padding: 20px; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #2C5F7C;">Expected Value Visualizer</h3>
      <p style="color: #666; margin-bottom: 20px;">Adjust the probabilities and watch how the expected value changes</p>

      <div style="margin-bottom: 30px;">
        <div style="margin-bottom: 15px;">
          <label style="font-weight: 600; color: #333;">Value X = 1: <span id="x1val">0.2</span> probability</label><br>
          <input type="range" id="x1slider" min="0" max="100" value="20" style="width: 100%; max-width: 300px;">
        </div>

        <div style="margin-bottom: 15px;">
          <label style="font-weight: 600; color: #333;">Value X = 2: <span id="x2val">0.3</span> probability</label><br>
          <input type="range" id="x2slider" min="0" max="100" value="30" style="width: 100%; max-width: 300px;">
        </div>

        <div style="margin-bottom: 20px;">
          <label style="font-weight: 600; color: #333;">Value X = 3: <span id="x3val">0.5</span> probability</label><br>
          <input type="range" id="x3slider" min="0" max="100" value="50" style="width: 100%; max-width: 300px;">
        </div>

        <div style="background: #f0f8ff; padding: 15px; border-radius: 4px; border-left: 4px solid #3A7CA5;">
          <p style="margin: 0; font-size: 14px; color: #666;">
            <strong>Total Probability:</strong> <span id="totalprob">1.00</span>
            <br><strong>Expected Value E(X):</strong> <span id="evresult" style="font-size: 18px; color: #2C5F7C; font-weight: 700;">2.30</span>
          </p>
        </div>
      </div>

      <div id="evChart" style="margin-top: 20px;"></div>
    </div>
  `;

  function updateExpectedValueChart() {
    const p1 = parseFloat(document.getElementById('x1slider').value) / 100;
    const p2 = parseFloat(document.getElementById('x2slider').value) / 100;
    const p3 = parseFloat(document.getElementById('x3slider').value) / 100;

    // Normalize probabilities to sum to 1
    const total = p1 + p2 + p3;
    const prob1 = p1 / total;
    const prob2 = p2 / total;
    const prob3 = p3 / total;

    // Update labels
    document.getElementById('x1val').textContent = prob1.toFixed(3);
    document.getElementById('x2val').textContent = prob2.toFixed(3);
    document.getElementById('x3val').textContent = prob3.toFixed(3);
    document.getElementById('totalprob').textContent = (prob1 + prob2 + prob3).toFixed(2);

    // Calculate expected value
    const ev = 1 * prob1 + 2 * prob2 + 3 * prob3;
    document.getElementById('evresult').textContent = ev.toFixed(2);

    // Draw chart
    const chartContainer = document.getElementById('evChart');
    const width = Math.min(chartContainer.offsetWidth, 700);
    const height = 300;
    const padding = { top: 30, right: 30, bottom: 60, left: 50 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxProb = Math.max(prob1, prob2, prob3);
    const barWidth = chartWidth / (3 * 1.5);

    let svg = `<svg width="${width}" height="${height}" style="background: #f9f9f9; border-radius: 4px;">`;

    // Axes
    svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#999" stroke-width="1.5"/>`;
    svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#999" stroke-width="1.5"/>`;

    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const prob = i / 5 * maxProb;
      const y = height - padding.bottom - (prob / maxProb) * chartHeight;
      svg += `<line x1="${padding.left - 5}" y1="${y}" x2="${padding.left}" y2="${y}" stroke="#999" stroke-width="1"/>`;
      svg += `<text x="${padding.left - 10}" y="${y + 3}" text-anchor="end" font-size="9" fill="#666">${prob.toFixed(2)}</text>`;
    }

    // Draw bars
    const values = [
      { x: 1, prob: prob1, color: '#28A745' },
      { x: 2, prob: prob2, color: '#3A7CA5' },
      { x: 3, prob: prob3, color: '#D97D54' }
    ];

    values.forEach((item, index) => {
      const barHeight = (item.prob / maxProb) * chartHeight;
      const xPos = padding.left + index * (chartWidth / 3) + (chartWidth / (3 * 2)) - barWidth / 2;
      const y = height - padding.bottom - barHeight;

      svg += `<rect x="${xPos}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${item.color}" opacity="0.8" stroke="#333" stroke-width="2">
        <title>X = ${item.x}: P = ${item.prob.toFixed(3)}</title>
      </rect>`;

      svg += `<text x="${xPos + barWidth/2}" y="${y - 5}" text-anchor="middle" font-size="10" font-weight="600" fill="#333">${(item.prob * 100).toFixed(0)}%</text>`;
      svg += `<text x="${xPos + barWidth/2}" y="${height - padding.bottom + 20}" text-anchor="middle" font-size="11" font-weight="600" fill="#333">X=${item.x}</text>`;
    });

    // Expected value line
    const evX = padding.left + (ev - 1) / 2 * chartWidth;
    svg += `<line x1="${evX}" y1="${padding.top}" x2="${evX}" y2="${height - padding.bottom}" stroke="#D97D54" stroke-width="3" stroke-dasharray="5,5" opacity="0.7"/>`;
    svg += `<text x="${evX}" y="${padding.top - 5}" text-anchor="middle" font-size="11" font-weight="600" fill="#D97D54">E(X)=${ev.toFixed(2)}</text>`;

    svg += `</svg>`;
    chartContainer.innerHTML = svg;
  }

  // Event listeners
  document.getElementById('x1slider').addEventListener('input', updateExpectedValueChart);
  document.getElementById('x2slider').addEventListener('input', updateExpectedValueChart);
  document.getElementById('x3slider').addEventListener('input', updateExpectedValueChart);

  updateExpectedValueChart();
}

// ============================================================================
// CHART 3: BINOMIAL DISTRIBUTION SIMULATOR
// ============================================================================

function createBinomialSimulator(containerId) {
  const container = document.getElementById(containerId);

  container.innerHTML = `
    <div style="background: white; padding: 20px; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #2C5F7C;">Binomial Distribution Simulator</h3>
      <p style="color: #666; margin-bottom: 20px;">Adjust n and p to see how the binomial distribution changes</p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
        <div>
          <label style="font-weight: 600; color: #333;">Number of Trials (n):</label><br>
          <input type="range" id="nslider" min="5" max="100" value="20" style="width: 100%; max-width: 250px;">
          <div style="font-size: 14px; color: #666; margin-top: 5px;">n = <span id="nval">20</span></div>
        </div>

        <div>
          <label style="font-weight: 600; color: #333;">Probability of Success (p):</label><br>
          <input type="range" id="pslider" min="0" max="100" value="50" style="width: 100%; max-width: 250px;">
          <div style="font-size: 14px; color: #666; margin-top: 5px;">p = <span id="pval">0.50</span></div>
        </div>
      </div>

      <div style="background: #fff9e6; padding: 15px; border-radius: 4px; border-left: 4px solid #FFA500; margin-bottom: 20px;">
        <p style="margin: 5px 0; font-size: 14px;">
          <strong>E(X):</strong> <span id="binev" style="font-weight: 700;">10.00</span> |
          <strong>Var(X):</strong> <span id="binvar" style="font-weight: 700;">5.00</span> |
          <strong>SD(X):</strong> <span id="binsd" style="font-weight: 700;">2.24</span>
        </p>
        <p style="margin: 5px 0; font-size: 13px; color: #666;" id="normcheck"></p>
      </div>

      <div id="binomialChart" style="margin-top: 20px;"></div>
    </div>
  `;

  function updateBinomialChart() {
    const n = parseInt(document.getElementById('nslider').value);
    const p = parseFloat(document.getElementById('pslider').value) / 100;

    document.getElementById('nval').textContent = n;
    document.getElementById('pval').textContent = p.toFixed(2);

    // Calculate statistics
    const ev = n * p;
    const variance = n * p * (1 - p);
    const sd = Math.sqrt(variance);

    document.getElementById('binev').textContent = ev.toFixed(2);
    document.getElementById('binvar').textContent = variance.toFixed(2);
    document.getElementById('binsd').textContent = sd.toFixed(2);

    // Check normal approximation condition
    const npCheck = n * p;
    const nqCheck = n * (1 - p);
    const normalOK = npCheck >= 10 && nqCheck >= 10;
    const normCheckText = normalOK
      ? `✓ Normal approximation OK (np=${npCheck.toFixed(0)} ≥ 10, n(1-p)=${nqCheck.toFixed(0)} ≥ 10)`
      : `✗ Normal approximation NOT suitable (np=${npCheck.toFixed(0)}, n(1-p)=${nqCheck.toFixed(0)})`;
    document.getElementById('normcheck').textContent = normCheckText;

    // Calculate distribution
    const distribution = calculateBinomialDistribution(n, p);

    // Draw chart
    const chartContainer = document.getElementById('binomialChart');
    const width = Math.min(chartContainer.offsetWidth, 700);
    const height = 350;
    const padding = { top: 30, right: 30, bottom: 60, left: 50 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxProb = Math.max(...distribution.map(d => d.probability));
    const barWidth = Math.max(3, chartWidth / (n + 1));

    let svg = `<svg width="${width}" height="${height}" style="background: #f9f9f9; border-radius: 4px;">`;

    // Axes
    svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#999" stroke-width="1.5"/>`;
    svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#999" stroke-width="1.5"/>`;

    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const prob = i / 5 * maxProb;
      const y = height - padding.bottom - (prob / maxProb) * chartHeight;
      svg += `<line x1="${padding.left - 5}" y1="${y}" x2="${padding.left}" y2="${y}" stroke="#999" stroke-width="1"/>`;
      svg += `<text x="${padding.left - 10}" y="${y + 3}" text-anchor="end" font-size="9" fill="#666">${prob.toFixed(3)}</text>`;
    }

    // X-axis label
    svg += `<text x="${width/2}" y="${height - 15}" text-anchor="middle" font-size="11" fill="#666">Number of Successes (X)</text>`;

    // Draw bars
    distribution.forEach((item) => {
      const barHeight = (item.probability / maxProb) * chartHeight;
      const xPos = padding.left + (item.value / (n + 1)) * chartWidth - barWidth / 2;
      const y = height - padding.bottom - barHeight;

      // Color by standard deviations from mean
      let barColor = '#3A7CA5';
      const zscore = (item.value - ev) / sd;
      if (Math.abs(zscore) > 2) barColor = '#DC3545';
      else if (Math.abs(zscore) > 1) barColor = '#FFA500';

      svg += `<rect x="${xPos}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${barColor}" opacity="0.8" stroke="#333" stroke-width="0.5">
        <title>X=${item.value}: P=${item.probability.toFixed(4)}</title>
      </rect>`;
    });

    // Expected value line
    const evX = padding.left + (ev / (n + 1)) * chartWidth;
    svg += `<line x1="${evX}" y1="${padding.top}" x2="${evX}" y2="${height - padding.bottom}" stroke="#D97D54" stroke-width="3" stroke-dasharray="5,5" opacity="0.7"/>`;
    svg += `<text x="${evX}" y="${padding.top - 5}" text-anchor="middle" font-size="11" font-weight="600" fill="#D97D54">μ=${ev.toFixed(1)}</text>`;

    svg += `</svg>`;
    chartContainer.innerHTML = svg;
  }

  document.getElementById('nslider').addEventListener('input', updateBinomialChart);
  document.getElementById('pslider').addEventListener('input', updateBinomialChart);

  updateBinomialChart();
}

// ============================================================================
// CHART 4: BINOMIAL VS NORMAL COMPARISON
// ============================================================================

function createBinomialNormalComparison(containerId) {
  const container = document.getElementById(containerId);

  container.innerHTML = `
    <div style="background: white; padding: 20px; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #2C5F7C;">Binomial vs Normal Distribution</h3>
      <p style="color: #666; margin-bottom: 20px;">Watch how the binomial approaches normal as n increases (p = 0.5)</p>

      <div style="margin-bottom: 20px;">
        <label style="font-weight: 600; color: #333;">Number of Trials (n):</label><br>
        <input type="range" id="ncompslider" min="10" max="200" value="20" step="10" style="width: 100%; max-width: 300px;">
        <div style="font-size: 14px; color: #666; margin-top: 5px;">n = <span id="ncompval">20</span></div>
      </div>

      <div style="background: #f0f8ff; padding: 15px; border-radius: 4px; border-left: 4px solid #3A7CA5; margin-bottom: 20px;">
        <p style="margin: 5px 0; font-size: 13px;">
          <strong>Blue bars:</strong> Binomial distribution | <strong>Red curve:</strong> Normal approximation
        </p>
        <p style="margin: 5px 0; font-size: 13px;" id="normgoodness"></p>
      </div>

      <div id="comparisonChart" style="margin-top: 20px;"></div>
    </div>
  `;

  // Normal density function (simplified)
  function normalDensity(x, mean, sd) {
    const exponent = -0.5 * Math.pow((x - mean) / sd, 2);
    return (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
  }

  function updateComparisonChart() {
    const n = parseInt(document.getElementById('ncompslider').value);
    const p = 0.5;

    document.getElementById('ncompval').textContent = n;

    // Statistics
    const ev = n * p;
    const variance = n * p * (1 - p);
    const sd = Math.sqrt(variance);

    // Check normal approximation
    const npCheck = n * p;
    const normGoodness = npCheck >= 10
      ? `✓ Good fit (np=${npCheck.toFixed(0)} ≥ 10)`
      : `△ Moderate fit (np=${npCheck.toFixed(0)})`;
    document.getElementById('normgoodness').textContent = normGoodness;

    // Calculate binomial distribution
    const distribution = calculateBinomialDistribution(n, p);

    // Draw chart
    const chartContainer = document.getElementById('comparisonChart');
    const width = Math.min(chartContainer.offsetWidth, 700);
    const height = 350;
    const padding = { top: 30, right: 30, bottom: 60, left: 50 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxProb = Math.max(...distribution.map(d => d.probability));
    const barWidth = chartWidth / (n + 2);

    let svg = `<svg width="${width}" height="${height}" style="background: #f9f9f9; border-radius: 4px;">`;

    // Axes
    svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#999" stroke-width="1.5"/>`;
    svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#999" stroke-width="1.5"/>`;

    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const prob = i / 5 * maxProb;
      const y = height - padding.bottom - (prob / maxProb) * chartHeight;
      svg += `<line x1="${padding.left - 5}" y1="${y}" x2="${padding.left}" y2="${y}" stroke="#999" stroke-width="1"/>`;
      svg += `<text x="${padding.left - 10}" y="${y + 3}" text-anchor="end" font-size="9" fill="#666">${prob.toFixed(3)}</text>`;
    }

    // Draw binomial bars
    distribution.forEach((item) => {
      const barHeight = (item.probability / maxProb) * chartHeight;
      const xPos = padding.left + (item.value / n) * chartWidth - barWidth / 2;
      const y = height - padding.bottom - barHeight;

      svg += `<rect x="${xPos}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#3A7CA5" opacity="0.7" stroke="#2C5F7C" stroke-width="0.5">
        <title>X=${item.value}: P=${item.probability.toFixed(4)}</title>
      </rect>`;
    });

    // Draw normal approximation curve
    let curvePath = '';
    const points = 100;
    for (let i = 0; i <= points; i++) {
      const xVal = i / points * n;
      const normalProb = normalDensity(xVal, ev, sd);
      const xPos = padding.left + (xVal / n) * chartWidth;
      const y = height - padding.bottom - (normalProb / maxProb) * chartHeight;

      if (i === 0) {
        curvePath = `M ${xPos} ${y}`;
      } else {
        curvePath += ` L ${xPos} ${y}`;
      }
    }

    svg += `<path d="${curvePath}" stroke="#DC3545" stroke-width="2.5" fill="none" opacity="0.8"/>`;

    // Expected value line
    const evX = padding.left + (ev / n) * chartWidth;
    svg += `<line x1="${evX}" y1="${padding.top}" x2="${evX}" y2="${height - padding.bottom}" stroke="#28A745" stroke-width="2" stroke-dasharray="3,3" opacity="0.7"/>`;

    // SD bands
    for (let sd_mult = 1; sd_mult <= 2; sd_mult++) {
      const bandColor = sd_mult === 1 ? '#FFC107' : '#FF6B6B';
      const bandOpacity = 0.15;

      const x1 = padding.left + ((ev - sd_mult * sd) / n) * chartWidth;
      const x2 = padding.left + ((ev + sd_mult * sd) / n) * chartWidth;

      svg += `<rect x="${Math.min(x1, x2)}" y="${padding.top}" width="${Math.abs(x2 - x1)}" height="${chartHeight}" fill="${bandColor}" opacity="${bandOpacity}"/>`;
    }

    svg += `</svg>`;
    chartContainer.innerHTML = svg;
  }

  document.getElementById('ncompslider').addEventListener('input', updateComparisonChart);
  updateComparisonChart();
}
