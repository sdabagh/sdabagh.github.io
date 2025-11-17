/**
 * Module 11: Simple Linear Regression - Interactive Visualizations
 * Pure JavaScript SVG visualizations with no external dependencies
 */

// Helper function to create SVG elements
function createSVGElement(type, attributes) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', type);
    for (let key in attributes) {
        element.setAttribute(key, attributes[key]);
    }
    return element;
}

// Sample data generator
function generateRegressionData(n, slope, intercept, noise, seed = 42) {
    const data = [];
    let random = seed;

    // Simple linear congruential generator for reproducible randomness
    const lcg = () => {
        random = (random * 1664525 + 1013904223) % 4294967296;
        return random / 4294967296;
    };

    for (let i = 0; i < n; i++) {
        const x = 2 + (i * 8 / (n - 1)); // x from 2 to 10
        const y = intercept + slope * x + (lcg() - 0.5) * noise;
        data.push({ x, y });
    }

    return data;
}

// Calculate regression statistics
function calculateRegression(data) {
    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.x, 0);
    const sumY = data.reduce((sum, d) => sum + d.y, 0);
    const meanX = sumX / n;
    const meanY = sumY / n;

    let sumXY = 0, sumX2 = 0, sumY2 = 0;
    data.forEach(d => {
        sumXY += (d.x - meanX) * (d.y - meanY);
        sumX2 += (d.x - meanX) ** 2;
        sumY2 += (d.y - meanY) ** 2;
    });

    const r = sumXY / Math.sqrt(sumX2 * sumY2);
    const slope = sumXY / sumX2;
    const intercept = meanY - slope * meanX;

    // Calculate residuals and standard error
    const residuals = data.map(d => {
        const predicted = intercept + slope * d.x;
        return d.y - predicted;
    });

    const sumSquaredResiduals = residuals.reduce((sum, r) => sum + r * r, 0);
    const se = Math.sqrt(sumSquaredResiduals / (n - 2));

    return { slope, intercept, r, r2: r * r, se, meanX, meanY };
}

// Scatter plot with regression line
function createScatterPlotExample(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = Math.min(container.clientWidth || 600, 600);
    const height = 400;
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // Generate sample data
    const data = generateRegressionData(12, 3.75, 58.5, 5);
    const stats = calculateRegression(data);

    // Create SVG
    const svg = createSVGElement('svg', { width, height });

    // Title
    const title = createSVGElement('text', {
        x: width / 2,
        y: 20,
        'text-anchor': 'middle',
        'font-size': '14',
        'font-weight': 'bold',
        fill: '#2C5F7C'
    });
    title.textContent = 'Study Hours vs Test Scores';
    svg.appendChild(title);

    // Create scales
    const xMin = 0, xMax = 12;
    const yMin = 50, yMax = 100;
    const xScale = x => margin.left + (x - xMin) / (xMax - xMin) * plotWidth;
    const yScale = y => height - margin.bottom - (y - yMin) / (yMax - yMin) * plotHeight;

    // Draw axes
    const xAxis = createSVGElement('line', {
        x1: margin.left, y1: yScale(yMin),
        x2: margin.left + plotWidth, y2: yScale(yMin),
        stroke: '#333', 'stroke-width': 2
    });
    svg.appendChild(xAxis);

    const yAxis = createSVGElement('line', {
        x1: xScale(xMin), y1: margin.top,
        x2: xScale(xMin), y2: yScale(yMin),
        stroke: '#333', 'stroke-width': 2
    });
    svg.appendChild(yAxis);

    // X-axis label
    const xLabel = createSVGElement('text', {
        x: width / 2,
        y: height - 10,
        'text-anchor': 'middle',
        'font-size': '12',
        fill: '#333'
    });
    xLabel.textContent = 'Study Hours';
    svg.appendChild(xLabel);

    // Y-axis label
    const yLabel = createSVGElement('text', {
        x: 15,
        y: height / 2,
        'text-anchor': 'middle',
        'font-size': '12',
        fill: '#333',
        transform: `rotate(-90, 15, ${height / 2})`
    });
    yLabel.textContent = 'Test Score';
    svg.appendChild(yLabel);

    // Draw tick marks and labels
    for (let x = 0; x <= 10; x += 2) {
        const tick = createSVGElement('line', {
            x1: xScale(x), y1: yScale(yMin),
            x2: xScale(x), y2: yScale(yMin) + 5,
            stroke: '#333', 'stroke-width': 1
        });
        svg.appendChild(tick);

        const label = createSVGElement('text', {
            x: xScale(x),
            y: yScale(yMin) + 20,
            'text-anchor': 'middle',
            'font-size': '10',
            fill: '#333'
        });
        label.textContent = x;
        svg.appendChild(label);
    }

    for (let y = 50; y <= 100; y += 10) {
        const tick = createSVGElement('line', {
            x1: xScale(xMin), y1: yScale(y),
            x2: xScale(xMin) - 5, y2: yScale(y),
            stroke: '#333', 'stroke-width': 1
        });
        svg.appendChild(tick);

        const label = createSVGElement('text', {
            x: xScale(xMin) - 10,
            y: yScale(y) + 4,
            'text-anchor': 'end',
            'font-size': '10',
            fill: '#333'
        });
        label.textContent = y;
        svg.appendChild(label);
    }

    // Draw regression line
    const y1 = stats.intercept + stats.slope * xMin;
    const y2 = stats.intercept + stats.slope * xMax;
    const line = createSVGElement('line', {
        x1: xScale(xMin), y1: yScale(y1),
        x2: xScale(xMax), y2: yScale(y2),
        stroke: '#D97D54', 'stroke-width': 2
    });
    svg.appendChild(line);

    // Draw data points
    data.forEach(d => {
        const circle = createSVGElement('circle', {
            cx: xScale(d.x),
            cy: yScale(d.y),
            r: 5,
            fill: '#2C5F7C',
            stroke: 'white',
            'stroke-width': 2
        });
        svg.appendChild(circle);
    });

    // Add equation text
    const equation = createSVGElement('text', {
        x: margin.left + 10,
        y: margin.top + 20,
        'font-size': '12',
        fill: '#D97D54',
        'font-weight': 'bold'
    });
    equation.textContent = `ŷ = ${stats.intercept.toFixed(1)} + ${stats.slope.toFixed(2)}x`;
    svg.appendChild(equation);

    const rText = createSVGElement('text', {
        x: margin.left + 10,
        y: margin.top + 40,
        'font-size': '11',
        fill: '#2C5F7C'
    });
    rText.textContent = `r = ${stats.r.toFixed(3)}, r² = ${stats.r2.toFixed(3)}`;
    svg.appendChild(rText);

    container.appendChild(svg);
}

// Correlation patterns visualization
function createCorrelationPatterns(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const patterns = [
        { r: 0.95, title: 'Strong Positive (r≈0.95)', slope: 4, noise: 3 },
        { r: -0.90, title: 'Strong Negative (r≈-0.90)', slope: -4, noise: 3 },
        { r: 0.05, title: 'No Correlation (r≈0)', slope: 0, noise: 15 }
    ];

    const width = Math.min(container.clientWidth || 600, 600);
    const smallWidth = width / 3 - 10;
    const height = 180;
    const margin = { top: 30, right: 10, bottom: 30, left: 10 };

    const containerDiv = document.createElement('div');
    containerDiv.style.display = 'flex';
    containerDiv.style.justifyContent = 'space-around';
    containerDiv.style.flexWrap = 'wrap';

    patterns.forEach((pattern, index) => {
        const data = generateRegressionData(15, pattern.slope, 50, pattern.noise, 42 + index);

        const svg = createSVGElement('svg', { width: smallWidth, height });

        // Title
        const title = createSVGElement('text', {
            x: smallWidth / 2,
            y: 15,
            'text-anchor': 'middle',
            'font-size': '11',
            'font-weight': 'bold',
            fill: '#2C5F7C'
        });
        title.textContent = pattern.title;
        svg.appendChild(title);

        // Scales
        const xMin = 2, xMax = 10, yMin = 0, yMax = 100;
        const plotWidth = smallWidth - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;
        const xScale = x => margin.left + (x - xMin) / (xMax - xMin) * plotWidth;
        const yScale = y => height - margin.bottom - (y - yMin) / (yMax - yMin) * plotHeight;

        // Axes
        svg.appendChild(createSVGElement('line', {
            x1: margin.left, y1: yScale(yMin),
            x2: smallWidth - margin.right, y2: yScale(yMin),
            stroke: '#999', 'stroke-width': 1
        }));

        svg.appendChild(createSVGElement('line', {
            x1: xScale(xMin), y1: margin.top,
            x2: xScale(xMin), y2: yScale(yMin),
            stroke: '#999', 'stroke-width': 1
        }));

        // Data points
        data.forEach(d => {
            svg.appendChild(createSVGElement('circle', {
                cx: xScale(d.x),
                cy: yScale(d.y),
                r: 3,
                fill: '#2C5F7C',
                opacity: 0.7
            }));
        });

        containerDiv.appendChild(svg);
    });

    container.appendChild(containerDiv);
}

// Regression line visualization
function createRegressionLineViz(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = Math.min(container.clientWidth || 600, 600);
    const height = 400;
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };

    const data = generateRegressionData(10, 3.75, 58.5, 4);
    const stats = calculateRegression(data);

    const svg = createSVGElement('svg', { width, height });

    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const xMin = 0, xMax = 12, yMin = 50, yMax = 100;
    const xScale = x => margin.left + (x - xMin) / (xMax - xMin) * plotWidth;
    const yScale = y => height - margin.bottom - (y - yMin) / (yMax - yMin) * plotHeight;

    // Draw axes and labels (similar to scatter plot)
    svg.appendChild(createSVGElement('line', {
        x1: margin.left, y1: yScale(yMin),
        x2: margin.left + plotWidth, y2: yScale(yMin),
        stroke: '#333', 'stroke-width': 2
    }));

    svg.appendChild(createSVGElement('line', {
        x1: xScale(xMin), y1: margin.top,
        x2: xScale(xMin), y2: yScale(yMin),
        stroke: '#333', 'stroke-width': 2
    }));

    // Regression line
    const y1 = stats.intercept + stats.slope * xMin;
    const y2 = stats.intercept + stats.slope * xMax;
    svg.appendChild(createSVGElement('line', {
        x1: xScale(xMin), y1: yScale(y1),
        x2: xScale(xMax), y2: yScale(y2),
        stroke: '#D97D54', 'stroke-width': 3, opacity: 0.7
    }));

    // Data points
    data.forEach(d => {
        svg.appendChild(createSVGElement('circle', {
            cx: xScale(d.x),
            cy: yScale(d.y),
            r: 6,
            fill: '#2C5F7C',
            stroke: 'white',
            'stroke-width': 2
        }));
    });

    // Equation
    const eq = createSVGElement('text', {
        x: margin.left + 10,
        y: margin.top + 10,
        'font-size': '14',
        fill: '#D97D54',
        'font-weight': 'bold'
    });
    eq.textContent = `ŷ = ${stats.intercept.toFixed(1)} + ${stats.slope.toFixed(2)}x`;
    svg.appendChild(eq);

    container.appendChild(svg);
}

// Residuals visualization
function createResidualsViz(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = Math.min(container.clientWidth || 600, 600);
    const height = 400;
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };

    const data = generateRegressionData(8, 3.75, 58.5, 6);
    const stats = calculateRegression(data);

    const svg = createSVGElement('svg', { width, height });

    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const xMin = 0, xMax = 12, yMin = 50, yMax = 100;
    const xScale = x => margin.left + (x - xMin) / (xMax - xMin) * plotWidth;
    const yScale = y => height - margin.bottom - (y - yMin) / (yMax - yMin) * plotHeight;

    // Axes
    svg.appendChild(createSVGElement('line', {
        x1: margin.left, y1: yScale(yMin),
        x2: margin.left + plotWidth, y2: yScale(yMin),
        stroke: '#333', 'stroke-width': 2
    }));

    svg.appendChild(createSVGElement('line', {
        x1: xScale(xMin), y1: margin.top,
        x2: xScale(xMin), y2: yScale(yMin),
        stroke: '#333', 'stroke-width': 2
    }));

    // Regression line
    const y1 = stats.intercept + stats.slope * xMin;
    const y2 = stats.intercept + stats.slope * xMax;
    svg.appendChild(createSVGElement('line', {
        x1: xScale(xMin), y1: yScale(y1),
        x2: xScale(xMax), y2: yScale(y2),
        stroke: '#D97D54', 'stroke-width': 2
    }));

    // Draw residual lines and points
    data.forEach(d => {
        const predicted = stats.intercept + stats.slope * d.x;

        // Residual line
        svg.appendChild(createSVGElement('line', {
            x1: xScale(d.x), y1: yScale(d.y),
            x2: xScale(d.x), y2: yScale(predicted),
            stroke: d.y > predicted ? '#28a745' : '#dc3545',
            'stroke-width': 2,
            'stroke-dasharray': '3,3'
        }));

        // Actual point
        svg.appendChild(createSVGElement('circle', {
            cx: xScale(d.x),
            cy: yScale(d.y),
            r: 5,
            fill: '#2C5F7C',
            stroke: 'white',
            'stroke-width': 2
        }));

        // Predicted point on line
        svg.appendChild(createSVGElement('circle', {
            cx: xScale(d.x),
            cy: yScale(predicted),
            r: 3,
            fill: '#D97D54'
        }));
    });

    // Legend
    const legend = createSVGElement('text', {
        x: margin.left + 10,
        y: margin.top + 10,
        'font-size': '11',
        fill: '#666'
    });
    legend.textContent = 'Dashed lines show residuals (actual - predicted)';
    svg.appendChild(legend);

    container.appendChild(svg);
}

// Residual plots - good vs bad
function createResidualPlotsViz(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = Math.min(container.clientWidth || 600, 600);
    const smallWidth = width / 2 - 10;
    const height = 200;
    const margin = { top: 30, right: 20, bottom: 40, left: 50 };

    const containerDiv = document.createElement('div');
    containerDiv.style.display = 'flex';
    containerDiv.style.justifyContent = 'space-around';
    containerDiv.style.gap = '20px';

    // Good residual plot
    const goodSVG = createSVGElement('svg', { width: smallWidth, height });
    const goodTitle = createSVGElement('text', {
        x: smallWidth / 2, y: 15,
        'text-anchor': 'middle',
        'font-size': '12',
        'font-weight': 'bold',
        fill: '#28a745'
    });
    goodTitle.textContent = '✓ Good: Random Scatter';
    goodSVG.appendChild(goodTitle);

    // Bad residual plot
    const badSVG = createSVGElement('svg', { width: smallWidth, height });
    const badTitle = createSVGElement('text', {
        x: smallWidth / 2, y: 15,
        'text-anchor': 'middle',
        'font-size': '12',
        'font-weight': 'bold',
        fill: '#dc3545'
    });
    badTitle.textContent = '✗ Bad: Curved Pattern';
    badSVG.appendChild(badTitle);

    const plotWidth = smallWidth - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const xScale = x => margin.left + x * plotWidth;
    const yScale = y => height - margin.bottom - (y + 1) / 2 * plotHeight;

    // Good plot - random residuals
    for (let i = 0; i < 20; i++) {
        const x = i / 20;
        const y = (Math.sin(i * 7) + Math.cos(i * 11)) * 0.3;
        goodSVG.appendChild(createSVGElement('circle', {
            cx: xScale(x), cy: yScale(y),
            r: 3, fill: '#2C5F7C', opacity: 0.7
        }));
    }

    // Bad plot - curved residuals
    for (let i = 0; i < 20; i++) {
        const x = i / 20;
        const y = Math.sin(x * Math.PI * 2) * 0.5 + (Math.random() - 0.5) * 0.1;
        badSVG.appendChild(createSVGElement('circle', {
            cx: xScale(x), cy: yScale(y),
            r: 3, fill: '#2C5F7C', opacity: 0.7
        }));
    }

    // Axes for both
    [goodSVG, badSVG].forEach(svg => {
        svg.appendChild(createSVGElement('line', {
            x1: margin.left, y1: yScale(0),
            x2: smallWidth - margin.right, y2: yScale(0),
            stroke: '#999', 'stroke-width': 1, 'stroke-dasharray': '3,3'
        }));

        svg.appendChild(createSVGElement('line', {
            x1: margin.left, y1: margin.top,
            x2: margin.left, y2: height - margin.bottom,
            stroke: '#333', 'stroke-width': 1
        }));

        svg.appendChild(createSVGElement('line', {
            x1: margin.left, y1: height - margin.bottom,
            x2: smallWidth - margin.right, y2: height - margin.bottom,
            stroke: '#333', 'stroke-width': 1
        }));
    });

    containerDiv.appendChild(goodSVG);
    containerDiv.appendChild(badSVG);
    container.appendChild(containerDiv);
}

// Confidence band visualization
function createConfidenceBandViz(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = Math.min(container.clientWidth || 600, 600);
    const height = 400;
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };

    const data = generateRegressionData(15, 2, 50, 5);
    const stats = calculateRegression(data);

    const svg = createSVGElement('svg', { width, height });
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const xMin = 0, xMax = 12, yMin = 40, yMax = 80;
    const xScale = x => margin.left + (x - xMin) / (xMax - xMin) * plotWidth;
    const yScale = y => height - margin.bottom - (y - yMin) / (yMax - yMin) * plotHeight;

    // Draw confidence band (simplified)
    const bandPoints = [];
    for (let x = xMin; x <= xMax; x += 0.5) {
        const y = stats.intercept + stats.slope * x;
        const dist = Math.abs(x - stats.meanX);
        const margin_error = stats.se * (0.3 + dist * 0.05); // Simplified SE
        bandPoints.push({ x, yUpper: y + margin_error, yLower: y - margin_error });
    }

    // Upper and lower bounds
    let pathUpper = `M ${xScale(bandPoints[0].x)} ${yScale(bandPoints[0].yUpper)}`;
    let pathLower = `M ${xScale(bandPoints[0].x)} ${yScale(bandPoints[0].yLower)}`;

    bandPoints.forEach(p => {
        pathUpper += ` L ${xScale(p.x)} ${yScale(p.yUpper)}`;
        pathLower += ` L ${xScale(p.x)} ${yScale(p.yLower)}`;
    });

    // Filled confidence band
    const bandPath = pathUpper + ' ' + pathLower.split(' ').reverse().join(' ') + ' Z';
    svg.appendChild(createSVGElement('path', {
        d: bandPath,
        fill: '#3A7CA5',
        opacity: 0.2
    }));

    // Regression line
    const y1 = stats.intercept + stats.slope * xMin;
    const y2 = stats.intercept + stats.slope * xMax;
    svg.appendChild(createSVGElement('line', {
        x1: xScale(xMin), y1: yScale(y1),
        x2: xScale(xMax), y2: yScale(y2),
        stroke: '#2C5F7C', 'stroke-width': 2
    }));

    // Axes
    svg.appendChild(createSVGElement('line', {
        x1: margin.left, y1: yScale(yMin),
        x2: margin.left + plotWidth, y2: yScale(yMin),
        stroke: '#333', 'stroke-width': 2
    }));

    svg.appendChild(createSVGElement('line', {
        x1: xScale(xMin), y1: margin.top,
        x2: xScale(xMin), y2: yScale(yMin),
        stroke: '#333', 'stroke-width': 2
    }));

    // Data points
    data.forEach(d => {
        svg.appendChild(createSVGElement('circle', {
            cx: xScale(d.x), cy: yScale(d.y),
            r: 4, fill: '#2C5F7C',
            stroke: 'white', 'stroke-width': 1
        }));
    });

    container.appendChild(svg);
}

// Interval comparison visualization
function createIntervalComparisonViz(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = Math.min(container.clientWidth || 600, 600);
    const height = 400;
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };

    const data = generateRegressionData(15, 2, 50, 4);
    const stats = calculateRegression(data);

    const svg = createSVGElement('svg', { width, height });
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const xMin = 0, xMax = 12, yMin = 40, yMax = 80;
    const xScale = x => margin.left + (x - xMin) / (xMax - xMin) * plotWidth;
    const yScale = y => height - margin.bottom - (y - yMin) / (yMax - yMin) * plotHeight;

    // Calculate bands
    const createBand = (multiplier) => {
        const points = [];
        for (let x = xMin; x <= xMax; x += 0.5) {
            const y = stats.intercept + stats.slope * x;
            const dist = Math.abs(x - stats.meanX);
            const margin_error = stats.se * multiplier * (0.3 + dist * 0.05);
            points.push({ x, yUpper: y + margin_error, yLower: y - margin_error });
        }
        return points;
    };

    const confBand = createBand(1);
    const predBand = createBand(1.8);

    // Draw prediction band (wider, red)
    let predPath = `M ${xScale(predBand[0].x)} ${yScale(predBand[0].yUpper)}`;
    predBand.forEach(p => predPath += ` L ${xScale(p.x)} ${yScale(p.yUpper)}`);
    predBand.reverse().forEach(p => predPath += ` L ${xScale(p.x)} ${yScale(p.yLower)}`);
    predPath += ' Z';

    svg.appendChild(createSVGElement('path', {
        d: predPath,
        fill: '#dc3545',
        opacity: 0.15
    }));

    // Draw confidence band (narrower, blue)
    let confPath = `M ${xScale(confBand[0].x)} ${yScale(confBand[0].yUpper)}`;
    confBand.forEach(p => confPath += ` L ${xScale(p.x)} ${yScale(p.yUpper)}`);
    confBand.reverse().forEach(p => confPath += ` L ${xScale(p.x)} ${yScale(p.yLower)}`);
    confPath += ' Z';

    svg.appendChild(createSVGElement('path', {
        d: confPath,
        fill: '#2C5F7C',
        opacity: 0.25
    }));

    // Regression line
    const y1 = stats.intercept + stats.slope * xMin;
    const y2 = stats.intercept + stats.slope * xMax;
    svg.appendChild(createSVGElement('line', {
        x1: xScale(xMin), y1: yScale(y1),
        x2: xScale(xMax), y2: yScale(y2),
        stroke: '#2C5F7C', 'stroke-width': 2
    }));

    // Axes
    svg.appendChild(createSVGElement('line', {
        x1: margin.left, y1: yScale(yMin),
        x2: margin.left + plotWidth, y2: yScale(yMin),
        stroke: '#333', 'stroke-width': 2
    }));

    svg.appendChild(createSVGElement('line', {
        x1: xScale(xMin), y1: margin.top,
        x2: xScale(xMin), y2: yScale(yMin),
        stroke: '#333', 'stroke-width': 2
    }));

    // Data points
    data.forEach(d => {
        svg.appendChild(createSVGElement('circle', {
            cx: xScale(d.x), cy: yScale(d.y),
            r: 4, fill: '#2C5F7C',
            stroke: 'white', 'stroke-width': 1
        }));
    });

    // Legend
    const legend1 = createSVGElement('text', {
        x: margin.left + 10, y: margin.top + 10,
        'font-size': '11', fill: '#2C5F7C', 'font-weight': 'bold'
    });
    legend1.textContent = 'Blue = Confidence band (narrower)';
    svg.appendChild(legend1);

    const legend2 = createSVGElement('text', {
        x: margin.left + 10, y: margin.top + 25,
        'font-size': '11', fill: '#dc3545', 'font-weight': 'bold'
    });
    legend2.textContent = 'Red = Prediction band (wider)';
    svg.appendChild(legend2);

    container.appendChild(svg);
}

// Initialize all visualizations on window load
window.addEventListener('load', function() {
    // These will be called from individual lesson pages
    console.log('Module 11 visualizations loaded');
});
