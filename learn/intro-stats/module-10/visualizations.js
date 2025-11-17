// visualizations.js - Module 10: ANOVA Interactive Visualizations
// Pure JavaScript SVG visualizations for ANOVA concepts

// F-Distribution Visualization
function drawFDistribution(containerId) {
    const svg = document.getElementById(containerId);
    if (!svg) return;

    const width = 700;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    svg.setAttribute('width', width);
    svg.setAttribute('height', height);

    // Clear existing content
    svg.innerHTML = '';

    // Create plot group
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
    svg.appendChild(g);

    // F-distribution parameters
    const df1 = 3;
    const df2 = 20;
    const criticalF = 3.1; // Approximate F-critical for alpha=0.05

    // Generate F-distribution curve
    const points = [];
    const maxX = 8;
    const numPoints = 200;

    for (let i = 0; i <= numPoints; i++) {
        const x = (i / numPoints) * maxX;
        // Simplified F-distribution approximation for visualization
        const y = x > 0 ? Math.pow(x, (df1/2 - 1)) * Math.exp(-x/2) * 0.4 : 0;
        points.push({ x: x, y: y });
    }

    // Scale
    const maxY = Math.max(...points.map(p => p.y));
    const xScale = function(x) { return (x / maxX) * plotWidth; };
    const yScale = function(y) { return plotHeight - (y / maxY) * plotHeight; };

    // Draw axes
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', 0);
    xAxis.setAttribute('y1', plotHeight);
    xAxis.setAttribute('x2', plotWidth);
    xAxis.setAttribute('y2', plotHeight);
    xAxis.setAttribute('stroke', '#333');
    xAxis.setAttribute('stroke-width', '2');
    g.appendChild(xAxis);

    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', 0);
    yAxis.setAttribute('y1', 0);
    yAxis.setAttribute('x2', 0);
    yAxis.setAttribute('y2', plotHeight);
    yAxis.setAttribute('stroke', '#333');
    yAxis.setAttribute('stroke-width', '2');
    g.appendChild(yAxis);

    // Draw F-distribution curve
    let pathData = '';
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        pathData += (i === 0 ? 'M ' : 'L ') + xScale(p.x) + ' ' + yScale(p.y) + ' ';
    }

    const curve = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    curve.setAttribute('d', pathData);
    curve.setAttribute('fill', 'none');
    curve.setAttribute('stroke', '#2C5F7C');
    curve.setAttribute('stroke-width', '3');
    g.appendChild(curve);

    // Draw critical region
    const criticalPoints = points.filter(p => p.x >= criticalF);
    if (criticalPoints.length > 0) {
        let criticalPath = 'M ' + xScale(criticalF) + ' ' + yScale(0) + ' ';
        for (let i = 0; i < criticalPoints.length; i++) {
            const p = criticalPoints[i];
            criticalPath += 'L ' + xScale(p.x) + ' ' + yScale(p.y) + ' ';
        }
        criticalPath += 'L ' + xScale(maxX) + ' ' + yScale(0) + ' Z';

        const criticalRegion = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        criticalRegion.setAttribute('d', criticalPath);
        criticalRegion.setAttribute('fill', '#DC3545');
        criticalRegion.setAttribute('opacity', '0.3');
        g.appendChild(criticalRegion);
    }

    // Draw critical value line
    const criticalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    criticalLine.setAttribute('x1', xScale(criticalF));
    criticalLine.setAttribute('y1', 0);
    criticalLine.setAttribute('x2', xScale(criticalF));
    criticalLine.setAttribute('y2', plotHeight);
    criticalLine.setAttribute('stroke', '#DC3545');
    criticalLine.setAttribute('stroke-width', '2');
    criticalLine.setAttribute('stroke-dasharray', '5,5');
    g.appendChild(criticalLine);

    // Labels
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', plotWidth / 2);
    title.setAttribute('y', -5);
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-size', '14');
    title.setAttribute('font-weight', 'bold');
    title.textContent = 'F-Distribution (df1=' + df1 + ', df2=' + df2 + ')';
    g.appendChild(title);

    const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xLabel.setAttribute('x', plotWidth / 2);
    xLabel.setAttribute('y', plotHeight + 35);
    xLabel.setAttribute('text-anchor', 'middle');
    xLabel.setAttribute('font-size', '12');
    xLabel.textContent = 'F-statistic';
    g.appendChild(xLabel);

    const criticalLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    criticalLabel.setAttribute('x', xScale(criticalF) + 5);
    criticalLabel.setAttribute('y', 20);
    criticalLabel.setAttribute('font-size', '11');
    criticalLabel.setAttribute('fill', '#DC3545');
    criticalLabel.textContent = 'F-critical = ' + criticalF.toFixed(2);
    g.appendChild(criticalLabel);

    const alphaLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    alphaLabel.setAttribute('x', xScale(criticalF + 1));
    alphaLabel.setAttribute('y', plotHeight / 2);
    alphaLabel.setAttribute('font-size', '11');
    alphaLabel.setAttribute('fill', '#DC3545');
    alphaLabel.textContent = 'alpha = 0.05';
    g.appendChild(alphaLabel);
}

// Variance Comparison Visualization (Between vs Within)
function drawVarianceComparison(containerId) {
    const svg = document.getElementById(containerId);
    if (!svg) return;

    const width = 700;
    const height = 300;
    const margin = { top: 30, right: 30, bottom: 50, left: 50 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.innerHTML = '';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
    svg.appendChild(g);

    // Data for three groups with different means
    const groups = [
        { name: 'Group 1', mean: 50, data: [48, 49, 50, 51, 52], color: '#3A7CA5' },
        { name: 'Group 2', mean: 65, data: [63, 64, 65, 66, 67], color: '#28A745' },
        { name: 'Group 3', mean: 80, data: [78, 79, 80, 81, 82], color: '#D97D54' }
    ];

    const grandMean = groups.reduce(function(sum, g) { return sum + g.mean; }, 0) / groups.length;

    // Scale
    const xScale = function(i) { return (i + 0.5) * (plotWidth / groups.length); };
    const yMin = 40;
    const yMax = 90;
    const yScale = function(y) { return plotHeight - ((y - yMin) / (yMax - yMin)) * plotHeight; };

    // Draw axes
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', 0);
    xAxis.setAttribute('y1', plotHeight);
    xAxis.setAttribute('x2', plotWidth);
    xAxis.setAttribute('y2', plotHeight);
    xAxis.setAttribute('stroke', '#333');
    xAxis.setAttribute('stroke-width', '2');
    g.appendChild(xAxis);

    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', 0);
    yAxis.setAttribute('y1', 0);
    yAxis.setAttribute('x2', 0);
    yAxis.setAttribute('y2', plotHeight);
    yAxis.setAttribute('stroke', '#333');
    yAxis.setAttribute('stroke-width', '2');
    g.appendChild(yAxis);

    // Draw grand mean line
    const grandMeanLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    grandMeanLine.setAttribute('x1', 0);
    grandMeanLine.setAttribute('y1', yScale(grandMean));
    grandMeanLine.setAttribute('x2', plotWidth);
    grandMeanLine.setAttribute('y2', yScale(grandMean));
    grandMeanLine.setAttribute('stroke', '#DC3545');
    grandMeanLine.setAttribute('stroke-width', '2');
    grandMeanLine.setAttribute('stroke-dasharray', '5,5');
    g.appendChild(grandMeanLine);

    // Label grand mean
    const grandMeanLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    grandMeanLabel.setAttribute('x', plotWidth + 5);
    grandMeanLabel.setAttribute('y', yScale(grandMean) + 4);
    grandMeanLabel.setAttribute('font-size', '11');
    grandMeanLabel.setAttribute('fill', '#DC3545');
    grandMeanLabel.textContent = 'Grand Mean';
    g.appendChild(grandMeanLabel);

    // Draw each group
    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const x = xScale(i);
        const boxWidth = 80;

        // Draw data points (within-group variation)
        for (let j = 0; j < group.data.length; j++) {
            const value = group.data[j];
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x + (Math.random() - 0.5) * 40);
            circle.setAttribute('cy', yScale(value));
            circle.setAttribute('r', '4');
            circle.setAttribute('fill', group.color);
            circle.setAttribute('opacity', '0.7');
            g.appendChild(circle);
        }

        // Draw group mean line
        const meanLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        meanLine.setAttribute('x1', x - boxWidth/2);
        meanLine.setAttribute('y1', yScale(group.mean));
        meanLine.setAttribute('x2', x + boxWidth/2);
        meanLine.setAttribute('y2', yScale(group.mean));
        meanLine.setAttribute('stroke', group.color);
        meanLine.setAttribute('stroke-width', '3');
        g.appendChild(meanLine);

        // Draw arrow showing between-group variation
        const arrowY = yScale(group.mean);
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        arrow.setAttribute('x1', x);
        arrow.setAttribute('y1', arrowY);
        arrow.setAttribute('x2', x);
        arrow.setAttribute('y2', yScale(grandMean));
        arrow.setAttribute('stroke', '#FFC107');
        arrow.setAttribute('stroke-width', '2');
        arrow.setAttribute('opacity', '0.6');
        g.appendChild(arrow);

        // Group label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', x);
        label.setAttribute('y', plotHeight + 20);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '12');
        label.textContent = group.name;
        g.appendChild(label);
    }

    // Title
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', plotWidth / 2);
    title.setAttribute('y', -10);
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-size', '14');
    title.setAttribute('font-weight', 'bold');
    title.textContent = 'Between-Group vs Within-Group Variation';
    g.appendChild(title);

    // Legend
    const legendY = 20;

    // Within variation
    const withinCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    withinCircle.setAttribute('cx', 10);
    withinCircle.setAttribute('cy', legendY);
    withinCircle.setAttribute('r', '4');
    withinCircle.setAttribute('fill', '#3A7CA5');
    g.appendChild(withinCircle);

    const withinText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    withinText.setAttribute('x', 20);
    withinText.setAttribute('y', legendY + 4);
    withinText.setAttribute('font-size', '11');
    withinText.textContent = 'Within-group variation (spread of points)';
    g.appendChild(withinText);

    // Between variation
    const betweenLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    betweenLine.setAttribute('x1', 5);
    betweenLine.setAttribute('y1', legendY + 20);
    betweenLine.setAttribute('x2', 15);
    betweenLine.setAttribute('y2', legendY + 20);
    betweenLine.setAttribute('stroke', '#FFC107');
    betweenLine.setAttribute('stroke-width', '2');
    g.appendChild(betweenLine);

    const betweenText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    betweenText.setAttribute('x', 20);
    betweenText.setAttribute('y', legendY + 24);
    betweenText.setAttribute('font-size', '11');
    betweenText.textContent = 'Between-group variation (group means differ from grand mean)';
    g.appendChild(betweenText);
}

// Initialize visualizations when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVisualizations);
} else {
    initVisualizations();
}

function initVisualizations() {
    // Find all visualization containers and draw them
    if (document.getElementById('fDistribution')) {
        drawFDistribution('fDistribution');
    }
    if (document.getElementById('varianceComparison')) {
        drawVarianceComparison('varianceComparison');
    }
}

// Redraw on window resize
window.addEventListener('resize', function() {
    setTimeout(initVisualizations, 100);
});

console.log('ANOVA visualizations loaded');
