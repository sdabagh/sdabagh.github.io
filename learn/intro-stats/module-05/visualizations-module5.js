// Interactive Data Visualizations for Module 5: Sampling Distributions
// Pure JavaScript - no external dependencies

// Utility Functions
function normalPDF(x, mu, sigma) {
  const coefficient = 1 / (sigma * Math.sqrt(2 * Math.PI));
  const exponent = -Math.pow(x - mu, 2) / (2 * Math.pow(sigma, 2));
  return coefficient * Math.exp(exponent);
}

function normalCDF(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

function erf(x) {
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

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((sq, n) => sq + Math.pow(n - m, 2), 0) / arr.length);
}

// Chart 1: Sampling Distribution Simulator (Roll Dice)
// Shows how sample means cluster around population mean
function createSamplingSimulator(containerId) {
  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 800);
  const height = 500;

  const padding = { top: 80, right: 30, bottom: 80, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Population: fair die (1-6)
  const population = [1, 2, 3, 4, 5, 6];
  const popMean = 3.5;
  const popSD = Math.sqrt(35/12); // Exact SD for uniform 1-6

  let sampleMeans = [];
  let numSamples = 0;
  let sampleSize = 5;

  function drawChart() {
    let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

    // Title
    svg += `<text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" fill="#2D2D2D">Sampling Distribution Simulator: Rolling Dice</text>`;
    svg += `<text x="${width/2}" y="45" text-anchor="middle" font-size="12" fill="#666">Population: Fair die (1-6), μ = 3.5, σ = ${popSD.toFixed(2)}</text>`;
    svg += `<text x="${width/2}" y="60" text-anchor="middle" font-size="11" fill="#666">Sample size: ${sampleSize} | Samples collected: ${numSamples}</text>`;

    // Draw histogram of sample means
    if (sampleMeans.length > 0) {
      const binWidth = 0.2;
      const bins = {};
      const minVal = 1;
      const maxVal = 6;

      // Create bins
      for (let val = minVal; val <= maxVal; val += binWidth) {
        bins[val.toFixed(1)] = 0;
      }

      // Fill bins
      sampleMeans.forEach(m => {
        const binKey = (Math.floor(m / binWidth) * binWidth).toFixed(1);
        if (bins[binKey] !== undefined) bins[binKey]++;
      });

      const maxCount = Math.max(...Object.values(bins), 1);
      const xScale = chartWidth / (maxVal - minVal);
      const yScale = chartHeight / maxCount;

      // Draw bars
      Object.keys(bins).forEach(binKey => {
        const x = parseFloat(binKey);
        const count = bins[binKey];
        const barX = padding.left + (x - minVal) * xScale;
        const barHeight = count * yScale;
        const barY = height - padding.bottom - barHeight;
        const barWidth = binWidth * xScale * 0.9;

        svg += `<rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="#3A7CA5" opacity="0.7"/>`;
      });

      // Overlay theoretical normal curve if enough samples
      if (numSamples >= 30) {
        const theoreticalSE = popSD / Math.sqrt(sampleSize);
        const points = [];

        for (let x = minVal; x <= maxVal; x += 0.1) {
          const y = normalPDF(x, popMean, theoreticalSE) * sampleMeans.length * binWidth;
          points.push({ x, y });
        }

        const pathData = points.map((p, i) => {
          const x = padding.left + (p.x - minVal) * xScale;
          const y = height - padding.bottom - p.y * yScale;
          return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        }).join(' ');

        svg += `<path d="${pathData}" fill="none" stroke="#D97D54" stroke-width="3"/>`;
        svg += `<text x="${width - 100}" y="${padding.top + 20}" font-size="11" fill="#D97D54">— Normal Curve</text>`;
      }

      // Stats display
      const observedMean = mean(sampleMeans);
      const observedSD = stdDev(sampleMeans);
      const expectedSE = popSD / Math.sqrt(sampleSize);

      svg += `<text x="${width - padding.right - 180}" y="${height - 10}" font-size="11" fill="#333">Observed: x̄ = ${observedMean.toFixed(2)}, SD = ${observedSD.toFixed(2)}</text>`;
      svg += `<text x="${width - padding.right - 180}" y="${height - 25}" font-size="11" fill="#333">Expected: μₓ̄ = ${popMean.toFixed(2)}, SE = ${expectedSE.toFixed(2)}</text>`;
    }

    // X-axis
    svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;
    svg += `<text x="${width/2}" y="${height - 40}" text-anchor="middle" font-size="12" fill="#666">Sample Mean (x̄)</text>`;

    // X-axis labels
    for (let i = 1; i <= 6; i++) {
      const x = padding.left + ((i - 1) / (6 - 1)) * chartWidth;
      svg += `<line x1="${x}" y1="${height - padding.bottom}" x2="${x}" y2="${height - padding.bottom + 5}" stroke="#666"/>`;
      svg += `<text x="${x}" y="${height - padding.bottom + 20}" text-anchor="middle" font-size="10" fill="#666">${i}</text>`;
    }

    // Y-axis
    svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;
    svg += `<text x="20" y="${height/2}" text-anchor="middle" font-size="12" fill="#666" transform="rotate(-90, 20, ${height/2})">Frequency</text>`;

    svg += `</svg>`;
    container.innerHTML = svg;
  }

  function takeSample() {
    const sample = [];
    for (let i = 0; i < sampleSize; i++) {
      sample.push(population[Math.floor(Math.random() * population.length)]);
    }
    sampleMeans.push(mean(sample));
    numSamples++;
    drawChart();
  }

  function reset() {
    sampleMeans = [];
    numSamples = 0;
    drawChart();
  }

  function changeSampleSize(newSize) {
    sampleSize = parseInt(newSize);
    reset();
  }

  // Initial draw
  drawChart();

  // Create controls
  const controls = document.createElement('div');
  controls.style.cssText = 'text-align: center; margin-top: 15px;';
  controls.innerHTML = `
    <button onclick="takeSample_${containerId}()" style="background: #3A7CA5; color: white; border: none; padding: 10px 20px; margin: 5px; border-radius: 5px; cursor: pointer; font-size: 14px;">Take 1 Sample</button>
    <button onclick="takeManySamples_${containerId}(10)" style="background: #2C5F7C; color: white; border: none; padding: 10px 20px; margin: 5px; border-radius: 5px; cursor: pointer; font-size: 14px;">Take 10 Samples</button>
    <button onclick="takeManySamples_${containerId}(100)" style="background: #2C5F7C; color: white; border: none; padding: 10px 20px; margin: 5px; border-radius: 5px; cursor: pointer; font-size: 14px;">Take 100 Samples</button>
    <button onclick="reset_${containerId}()" style="background: #999; color: white; border: none; padding: 10px 20px; margin: 5px; border-radius: 5px; cursor: pointer; font-size: 14px;">Reset</button>
    <br>
    <label style="margin: 10px; font-size: 14px;">Sample Size:
      <select onchange="changeSampleSize_${containerId}(this.value)" style="padding: 5px; font-size: 14px;">
        <option value="2">2</option>
        <option value="5" selected>5</option>
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="30">30</option>
      </select>
    </label>
  `;
  container.parentNode.appendChild(controls);

  // Global functions for buttons
  window[`takeSample_${containerId}`] = takeSample;
  window[`takeManySamples_${containerId}`] = function(n) {
    for (let i = 0; i < n; i++) takeSample();
  };
  window[`reset_${containerId}`] = reset;
  window[`changeSampleSize_${containerId}`] = changeSampleSize;
}

// Chart 2: Central Limit Theorem Visualizer
// Shows population distribution and resulting sampling distribution
function createCLTVisualizer(containerId) {
  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 800);
  const height = 600;

  const padding = { top: 60, right: 30, bottom: 60, left: 60 };
  const chartHeight = (height - padding.top - padding.bottom - 40) / 2;
  const chartWidth = width - padding.left - padding.right;

  let populationType = 'uniform';
  let sampleSize = 30;

  // Population distributions
  const populations = {
    uniform: {
      name: 'Uniform (0-10)',
      values: Array.from({length: 1000}, () => Math.random() * 10),
      mu: 5,
      sigma: Math.sqrt(100/12)
    },
    skewed: {
      name: 'Right-Skewed',
      values: Array.from({length: 1000}, () => {
        const exp = -Math.log(Math.random()) * 2;
        return Math.min(exp, 10);
      }),
      mu: 2,
      sigma: 2
    },
    normal: {
      name: 'Normal',
      values: Array.from({length: 1000}, () => {
        // Box-Muller transform
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return 5 + z * 2;
      }),
      mu: 5,
      sigma: 2
    }
  };

  function drawChart() {
    const pop = populations[populationType];

    // Generate sample means
    const sampleMeans = [];
    for (let i = 0; i < 500; i++) {
      const sample = [];
      for (let j = 0; j < sampleSize; j++) {
        sample.push(pop.values[Math.floor(Math.random() * pop.values.length)]);
      }
      sampleMeans.push(mean(sample));
    }

    const expectedSE = pop.sigma / Math.sqrt(sampleSize);

    let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

    // Title
    svg += `<text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" fill="#2D2D2D">Central Limit Theorem Visualizer</text>`;
    svg += `<text x="${width/2}" y="45" text-anchor="middle" font-size="12" fill="#666">Population: ${pop.name} | Sample Size: n = ${sampleSize}</text>`;

    // Top chart: Population distribution
    svg += `<text x="${padding.left}" y="${padding.top + 15}" font-size="13" font-weight="600" fill="#2C5F7C">Population Distribution</text>`;

    const popBins = createHistogram(pop.values, 30);
    const popYScale = chartHeight / Math.max(...popBins.map(b => b.count));
    const xMin = 0;
    const xMax = 10;
    const xScale = chartWidth / (xMax - xMin);

    popBins.forEach(bin => {
      const barX = padding.left + (bin.x - xMin) * xScale;
      const barHeight = bin.count * popYScale;
      const barY = padding.top + 30 + (chartHeight - barHeight);
      const barWidth = (bin.width * xScale) * 0.9;

      svg += `<rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="#3A7CA5" opacity="0.6"/>`;
    });

    // Population stats
    svg += `<text x="${width - 150}" y="${padding.top + 50}" font-size="11" fill="#333">μ = ${pop.mu.toFixed(2)}</text>`;
    svg += `<text x="${width - 150}" y="${padding.top + 65}" font-size="11" fill="#333">σ = ${pop.sigma.toFixed(2)}</text>`;

    // Bottom chart: Sampling distribution
    const middleY = padding.top + 30 + chartHeight + 40;
    svg += `<text x="${padding.left}" y="${middleY + 15}" font-size="13" font-weight="600" fill="#2C5F7C">Sampling Distribution of x̄</text>`;

    const sampleBins = createHistogram(sampleMeans, 30);
    const sampleYScale = chartHeight / Math.max(...sampleBins.map(b => b.count));

    sampleBins.forEach(bin => {
      const barX = padding.left + (bin.x - xMin) * xScale;
      const barHeight = bin.count * sampleYScale;
      const barY = middleY + 30 + (chartHeight - barHeight);
      const barWidth = (bin.width * xScale) * 0.9;

      svg += `<rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="#28A745" opacity="0.6"/>`;
    });

    // Overlay normal curve
    const points = [];
    for (let x = xMin; x <= xMax; x += 0.1) {
      const y = normalPDF(x, pop.mu, expectedSE) * sampleMeans.length * (xMax - xMin) / 30;
      points.push({ x, y });
    }

    const pathData = points.map((p, i) => {
      const x = padding.left + (p.x - xMin) * xScale;
      const y = middleY + 30 + (chartHeight - p.y * sampleYScale);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');

    svg += `<path d="${pathData}" fill="none" stroke="#D97D54" stroke-width="3"/>`;

    // Sampling distribution stats
    const observedMean = mean(sampleMeans);
    const observedSD = stdDev(sampleMeans);
    svg += `<text x="${width - 150}" y="${middleY + 50}" font-size="11" fill="#333">Observed x̄ = ${observedMean.toFixed(2)}</text>`;
    svg += `<text x="${width - 150}" y="${middleY + 65}" font-size="11" fill="#333">Observed SE = ${observedSD.toFixed(2)}</text>`;
    svg += `<text x="${width - 150}" y="${middleY + 80}" font-size="11" fill="#D97D54">Expected SE = ${expectedSE.toFixed(2)}</text>`;

    // X-axis for both charts
    const y1 = padding.top + 30 + chartHeight;
    const y2 = middleY + 30 + chartHeight;

    [y1, y2].forEach(y => {
      svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#666" stroke-width="2"/>`;
      for (let i = 0; i <= 10; i += 2) {
        const x = padding.left + (i / 10) * chartWidth;
        svg += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 5}" stroke="#666"/>`;
        svg += `<text x="${x}" y="${y + 20}" text-anchor="middle" font-size="10" fill="#666">${i}</text>`;
      }
    });

    svg += `</svg>`;
    container.innerHTML = svg;
  }

  function createHistogram(data, numBins) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / numBins;
    const bins = [];

    for (let i = 0; i < numBins; i++) {
      const binStart = min + i * binWidth;
      const count = data.filter(v => v >= binStart && v < binStart + binWidth).length;
      bins.push({ x: binStart, width: binWidth, count });
    }

    return bins;
  }

  // Initial draw
  drawChart();

  // Controls
  const controls = document.createElement('div');
  controls.style.cssText = 'text-align: center; margin-top: 15px;';
  controls.innerHTML = `
    <label style="margin: 10px; font-size: 14px;">Population Shape:
      <select onchange="changePopulation_${containerId}(this.value)" style="padding: 5px; font-size: 14px;">
        <option value="uniform" selected>Uniform</option>
        <option value="skewed">Right-Skewed</option>
        <option value="normal">Normal</option>
      </select>
    </label>
    <label style="margin: 10px; font-size: 14px;">Sample Size:
      <select onchange="changeSampleSize_${containerId}(this.value)" style="padding: 5px; font-size: 14px;">
        <option value="5">5</option>
        <option value="10">10</option>
        <option value="30" selected>30</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>
    </label>
    <button onclick="redraw_${containerId}()" style="background: #3A7CA5; color: white; border: none; padding: 10px 20px; margin: 5px; border-radius: 5px; cursor: pointer; font-size: 14px;">Regenerate</button>
  `;
  container.parentNode.appendChild(controls);

  window[`changePopulation_${containerId}`] = function(val) {
    populationType = val;
    drawChart();
  };

  window[`changeSampleSize_${containerId}`] = function(val) {
    sampleSize = parseInt(val);
    drawChart();
  };

  window[`redraw_${containerId}`] = drawChart;
}

// Chart 3: Sample Size Effect on Standard Error
// Interactive slider to see how SE changes with n
function createSampleSizeEffect(containerId) {
  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 700);
  const height = 450;

  const padding = { top: 80, right: 40, bottom: 80, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const sigma = 20; // Population SD
  let n = 25;

  function drawChart() {
    const SE = sigma / Math.sqrt(n);

    let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

    // Title
    svg += `<text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" fill="#2D2D2D">Effect of Sample Size on Standard Error</text>`;
    svg += `<text x="${width/2}" y="45" text-anchor="middle" font-size="12" fill="#666">Population: σ = ${sigma}</text>`;
    svg += `<text x="${width/2}" y="60" text-anchor="middle" font-size="12" fill="#666">Current: n = ${n}, SE = ${SE.toFixed(2)}</text>`;

    // Plot SE vs n curve
    const nMin = 1;
    const nMax = 100;
    const nScale = chartWidth / (nMax - nMin);

    const maxSE = sigma / Math.sqrt(nMin);
    const yScale = chartHeight / maxSE;

    const points = [];
    for (let i = nMin; i <= nMax; i++) {
      const se = sigma / Math.sqrt(i);
      points.push({ n: i, se });
    }

    // Draw curve
    const pathData = points.map((p, i) => {
      const x = padding.left + (p.n - nMin) * nScale;
      const y = height - padding.bottom - p.se * yScale;
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');

    svg += `<path d="${pathData}" fill="none" stroke="#3A7CA5" stroke-width="3"/>`;

    // Highlight current point
    const currentX = padding.left + (n - nMin) * nScale;
    const currentY = height - padding.bottom - SE * yScale;
    svg += `<circle cx="${currentX}" cy="${currentY}" r="6" fill="#D97D54"/>`;
    svg += `<line x1="${currentX}" y1="${currentY}" x2="${currentX}" y2="${height - padding.bottom}" stroke="#D97D54" stroke-width="1" stroke-dasharray="5,5"/>`;

    // Reference lines
    const halfSE = SE / 2;
    if (halfSE >= 0) {
      const halfSEy = height - padding.bottom - halfSE * yScale;
      svg += `<line x1="${padding.left}" y1="${halfSEy}" x2="${width - padding.right}" y2="${halfSEy}" stroke="#999" stroke-width="1" stroke-dasharray="3,3"/>`;
      svg += `<text x="${padding.left - 5}" y="${halfSEy - 5}" text-anchor="end" font-size="10" fill="#999">SE/2 = ${halfSE.toFixed(2)}</text>`;

      // Show what n gives half SE
      const nForHalfSE = Math.pow(sigma / halfSE, 2);
      if (nForHalfSE <= nMax) {
        const xForHalfSE = padding.left + (nForHalfSE - nMin) * nScale;
        svg += `<circle cx="${xForHalfSE}" cy="${halfSEy}" r="4" fill="#999" opacity="0.5"/>`;
        svg += `<text x="${xForHalfSE}" y="${height - padding.bottom + 35}" text-anchor="middle" font-size="9" fill="#999">n = ${Math.ceil(nForHalfSE)}</text>`;
      }
    }

    // Axes
    svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;
    svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;

    // X-axis labels
    svg += `<text x="${width/2}" y="${height - 35}" text-anchor="middle" font-size="12" fill="#666">Sample Size (n)</text>`;
    for (let i = 0; i <= 100; i += 20) {
      const x = padding.left + (i - nMin) * nScale;
      svg += `<line x1="${x}" y1="${height - padding.bottom}" x2="${x}" y2="${height - padding.bottom + 5}" stroke="#666"/>`;
      svg += `<text x="${x}" y="${height - padding.bottom + 20}" text-anchor="middle" font-size="10" fill="#666">${i}</text>`;
    }

    // Y-axis labels
    svg += `<text x="25" y="${height/2}" text-anchor="middle" font-size="12" fill="#666" transform="rotate(-90, 25, ${height/2})">Standard Error (SE)</text>`;
    for (let i = 0; i <= 20; i += 5) {
      const y = height - padding.bottom - (i / 20) * maxSE * yScale;
      svg += `<line x1="${padding.left - 5}" y1="${y}" x2="${padding.left}" y2="${y}" stroke="#666"/>`;
      svg += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="10" fill="#666">${i}</text>`;
    }

    // Formula display
    svg += `<text x="${width - 150}" y="${padding.top + 30}" font-size="12" fill="#333">SE = σ / √n</text>`;
    svg += `<text x="${width - 150}" y="${padding.top + 50}" font-size="12" fill="#333">SE = ${sigma} / √${n}</text>`;
    svg += `<text x="${width - 150}" y="${padding.top + 70}" font-size="12" fill="#D97D54">SE = ${SE.toFixed(2)}</text>`;

    svg += `</svg>`;
    container.innerHTML = svg;
  }

  // Initial draw
  drawChart();

  // Slider control
  const controls = document.createElement('div');
  controls.style.cssText = 'text-align: center; margin-top: 15px;';
  controls.innerHTML = `
    <label style="display: block; margin: 10px; font-size: 14px;">
      Sample Size (n): <span id="nValue_${containerId}">${n}</span>
      <br>
      <input type="range" min="1" max="100" value="${n}"
        oninput="updateN_${containerId}(this.value)"
        style="width: 400px; max-width: 90%; margin-top: 10px;">
    </label>
    <p style="font-size: 13px; color: #666; margin-top: 15px;">
      💡 <strong>Try it:</strong> Move the slider to see how SE changes with sample size.
      Notice: To cut SE in half, you need 4× the sample size!
    </p>
  `;
  container.parentNode.appendChild(controls);

  window[`updateN_${containerId}`] = function(val) {
    n = parseInt(val);
    document.getElementById(`nValue_${containerId}`).textContent = n;
    drawChart();
  };
}

// Chart 4: Proportion Sampling Distribution
// Shows sampling distribution of p̂
function createProportionDistribution(containerId) {
  const container = document.getElementById(containerId);
  const width = Math.min(container.offsetWidth, 700);
  const height = 450;

  const padding = { top: 80, right: 30, bottom: 80, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  let p = 0.4;
  let n = 100;

  function drawChart() {
    const SE = Math.sqrt(p * (1 - p) / n);
    const np = n * p;
    const nq = n * (1 - p);
    const normalOK = np >= 10 && nq >= 10;

    let svg = `<svg width="${width}" height="${height}" style="background: white; border-radius: 8px;">`;

    // Title
    svg += `<text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" fill="#2D2D2D">Sampling Distribution of Sample Proportion (p̂)</text>`;
    svg += `<text x="${width/2}" y="45" text-anchor="middle" font-size="12" fill="#666">Population proportion: p = ${p.toFixed(2)} | Sample size: n = ${n}</text>`;
    svg += `<text x="${width/2}" y="60" text-anchor="middle" font-size="11" fill="${normalOK ? '#28A745' : '#DC3545'}">np = ${np.toFixed(1)}, n(1-p) = ${nq.toFixed(1)} ${normalOK ? '✓ Normal approx OK' : '✗ Normal approx NOT OK'}</text>`;

    // Draw normal curve if conditions met
    if (normalOK) {
      const xMin = Math.max(0, p - 4 * SE);
      const xMax = Math.min(1, p + 4 * SE);
      const xScale = chartWidth / (xMax - xMin);

      const points = [];
      for (let x = xMin; x <= xMax; x += (xMax - xMin) / 200) {
        const y = normalPDF(x, p, SE);
        points.push({ x, y });
      }

      const yMax = Math.max(...points.map(pt => pt.y)) * 1.1;
      const yScale = chartHeight / yMax;

      // Draw curve
      const pathData = points.map((pt, i) => {
        const x = padding.left + (pt.x - xMin) * xScale;
        const y = height - padding.bottom - pt.y * yScale;
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      }).join(' ');

      svg += `<path d="${pathData}" fill="none" stroke="#3A7CA5" stroke-width="3"/>`;

      // Shade middle 95%
      const lower = Math.max(xMin, p - 1.96 * SE);
      const upper = Math.min(xMax, p + 1.96 * SE);

      const shadePoints = points.filter(pt => pt.x >= lower && pt.x <= upper);
      const shadePath = shadePoints.map((pt, i) => {
        const x = padding.left + (pt.x - xMin) * xScale;
        const y = height - padding.bottom - pt.y * yScale;
        return i === 0 ? `M ${x} ${height - padding.bottom}` : `L ${x} ${y}`;
      }).join(' ') + ` L ${padding.left + (upper - xMin) * xScale} ${height - padding.bottom} Z`;

      svg += `<path d="${shadePath}" fill="#90caf9" opacity="0.3"/>`;

      // Labels for 95% region
      const lowerX = padding.left + (lower - xMin) * xScale;
      const upperX = padding.left + (upper - xMin) * xScale;
      svg += `<text x="${lowerX}" y="${height - padding.bottom + 35}" text-anchor="middle" font-size="10" fill="#666">${lower.toFixed(3)}</text>`;
      svg += `<text x="${upperX}" y="${height - padding.bottom + 35}" text-anchor="middle" font-size="10" fill="#666">${upper.toFixed(3)}</text>`;
      svg += `<text x="${(lowerX + upperX) / 2}" y="${padding.top + 100}" text-anchor="middle" font-size="11" fill="#3A7CA5">Middle 95%</text>`;

      // Mean line
      const meanX = padding.left + (p - xMin) * xScale;
      svg += `<line x1="${meanX}" y1="${padding.top}" x2="${meanX}" y2="${height - padding.bottom}" stroke="#D97D54" stroke-width="2" stroke-dasharray="5,5"/>`;
      svg += `<text x="${meanX + 10}" y="${padding.top + 20}" font-size="11" fill="#D97D54">p = ${p.toFixed(2)}</text>`;

      // X-axis
      svg += `<line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;
      svg += `<text x="${width/2}" y="${height - 40}" text-anchor="middle" font-size="12" fill="#666">Sample Proportion (p̂)</text>`;

      // X-axis ticks
      const numTicks = 5;
      for (let i = 0; i <= numTicks; i++) {
        const val = xMin + i * (xMax - xMin) / numTicks;
        const x = padding.left + i * chartWidth / numTicks;
        svg += `<line x1="${x}" y1="${height - padding.bottom}" x2="${x}" y2="${height - padding.bottom + 5}" stroke="#666"/>`;
        svg += `<text x="${x}" y="${height - padding.bottom + 20}" text-anchor="middle" font-size="10" fill="#666">${val.toFixed(2)}</text>`;
      }

      // Y-axis
      svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#666" stroke-width="2"/>`;
      svg += `<text x="20" y="${height/2}" text-anchor="middle" font-size="12" fill="#666" transform="rotate(-90, 20, ${height/2})">Probability Density</text>`;

      // Stats display
      svg += `<text x="${width - 150}" y="${padding.top + 20}" font-size="11" fill="#333">μₚ̂ = p = ${p.toFixed(2)}</text>`;
      svg += `<text x="${width - 150}" y="${padding.top + 35}" font-size="11" fill="#333">SE = √(p(1-p)/n)</text>`;
      svg += `<text x="${width - 150}" y="${padding.top + 50}" font-size="11" fill="#333">SE = ${SE.toFixed(4)}</text>`;
    } else {
      // Display message that normal approximation doesn't work
      svg += `<text x="${width/2}" y="${height/2 - 20}" text-anchor="middle" font-size="14" fill="#DC3545">Normal approximation not appropriate!</text>`;
      svg += `<text x="${width/2}" y="${height/2 + 5}" text-anchor="middle" font-size="12" fill="#666">Need np ≥ 10 AND n(1-p) ≥ 10</text>`;
      svg += `<text x="${width/2}" y="${height/2 + 25}" text-anchor="middle" font-size="12" fill="#666">Try increasing n or changing p</text>`;
    }

    svg += `</svg>`;
    container.innerHTML = svg;
  }

  // Initial draw
  drawChart();

  // Controls
  const controls = document.createElement('div');
  controls.style.cssText = 'text-align: center; margin-top: 15px;';
  controls.innerHTML = `
    <label style="margin: 10px; font-size: 14px;">
      Population Proportion (p): <span id="pValue_${containerId}">${p.toFixed(2)}</span>
      <br>
      <input type="range" min="0.05" max="0.95" step="0.05" value="${p}"
        oninput="updateP_${containerId}(this.value)"
        style="width: 300px; max-width: 80%; margin-top: 5px;">
    </label>
    <label style="margin: 10px; font-size: 14px;">Sample Size (n):
      <select onchange="updateN_${containerId}(this.value)" style="padding: 5px; font-size: 14px;">
        <option value="20">20</option>
        <option value="50">50</option>
        <option value="100" selected>100</option>
        <option value="200">200</option>
        <option value="500">500</option>
      </select>
    </label>
    <p style="font-size: 13px; color: #666; margin-top: 10px;">
      💡 <strong>Explore:</strong> Try different values of p and n. Notice when normal approximation works!
    </p>
  `;
  container.parentNode.appendChild(controls);

  window[`updateP_${containerId}`] = function(val) {
    p = parseFloat(val);
    document.getElementById(`pValue_${containerId}`).textContent = p.toFixed(2);
    drawChart();
  };

  window[`updateN_${containerId}`] = function(val) {
    n = parseInt(val);
    drawChart();
  };
}

// Initialize all charts when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('samplingSimulator')) {
    createSamplingSimulator('samplingSimulator');
  }
  if (document.getElementById('cltVisualizer')) {
    createCLTVisualizer('cltVisualizer');
  }
  if (document.getElementById('sampleSizeEffect')) {
    createSampleSizeEffect('sampleSizeEffect');
  }
  if (document.getElementById('proportionDistribution')) {
    createProportionDistribution('proportionDistribution');
  }
});
