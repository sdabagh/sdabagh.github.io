/**
 * Interactive Visualizations for Module 2: Linear & Quadratic Functions
 * Pure JavaScript SVG visualization library
 * No external dependencies required
 */

class LinearQuadraticVisualizations {
    constructor() {
        this.colors = {
            primary: '#2C5F7C',
            accent: '#D97D54',
            success: '#28A745',
            info: '#17A2B8',
            warning: '#FFC107',
            grid: '#E0E0E0',
            axis: '#333333',
            point: '#D97D54',
            line: '#2C5F7C'
        };
    }

    /**
     * Create linear function graph: y = mx + b
     * Shows slope and y-intercept visually
     */
    createLinearGraph(containerId, slope, yIntercept, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const width = options.width || 600;
        const height = options.height || 400;
        const padding = 50;

        // Create SVG
        const svg = this.createSVG(width, height);
        container.innerHTML = '';
        container.appendChild(svg);

        // Set up coordinate system
        const xMin = options.xMin || -10;
        const xMax = options.xMax || 10;
        const yMin = options.yMin || -10;
        const yMax = options.yMax || 10;

        const xScale = (x) => padding + ((x - xMin) / (xMax - xMin)) * (width - 2 * padding);
        const yScale = (y) => height - padding - ((y - yMin) / (yMax - yMin)) * (height - 2 * padding);

        // Draw grid
        this.drawGrid(svg, xMin, xMax, yMin, yMax, xScale, yScale, width, height, padding);

        // Draw axes
        this.drawAxes(svg, xMin, xMax, yMin, yMax, xScale, yScale, width, height, padding);

        // Draw linear function
        const x1 = xMin;
        const y1 = slope * x1 + yIntercept;
        const x2 = xMax;
        const y2 = slope * x2 + yIntercept;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', xScale(x1));
        line.setAttribute('y1', yScale(y1));
        line.setAttribute('x2', xScale(x2));
        line.setAttribute('y2', yScale(y2));
        line.setAttribute('stroke', this.colors.primary);
        line.setAttribute('stroke-width', '3');
        svg.appendChild(line);

        // Highlight y-intercept
        if (yIntercept >= yMin && yIntercept <= yMax) {
            const interceptPoint = this.createPoint(xScale(0), yScale(yIntercept), this.colors.accent, 6);
            svg.appendChild(interceptPoint);

            // Add label
            const label = this.createText(xScale(0) + 10, yScale(yIntercept) - 10,
                `y-intercept: (0, ${yIntercept})`, this.colors.accent);
            svg.appendChild(label);
        }

        // Show slope triangle (rise over run)
        if (options.showSlope) {
            this.drawSlopeTriangle(svg, slope, yIntercept, xScale, yScale);
        }

        // Add equation label
        const equation = `y = ${slope}x ${yIntercept >= 0 ? '+' : ''} ${yIntercept}`;
        const eqLabel = this.createText(width - 200, 30, equation, this.colors.primary, '16px');
        eqLabel.setAttribute('font-weight', 'bold');
        svg.appendChild(eqLabel);

        return svg;
    }

    /**
     * Create interactive linear slope demonstration
     * Users can see how changing slope affects the line
     */
    createInteractiveSlopeDemo(containerId, initialSlope, yIntercept) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Create controls
        const controls = document.createElement('div');
        controls.style.marginBottom = '20px';
        controls.innerHTML = `
            <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
                <div>
                    <label for="slopeSlider" style="font-weight: 600;">Slope (m): <span id="slopeValue">${initialSlope}</span></label>
                    <input type="range" id="slopeSlider" min="-5" max="5" step="0.5" value="${initialSlope}"
                           style="width: 200px; margin-left: 10px;">
                </div>
                <div>
                    <label for="interceptSlider" style="font-weight: 600;">Y-Intercept (b): <span id="interceptValue">${yIntercept}</span></label>
                    <input type="range" id="interceptSlider" min="-10" max="10" step="1" value="${yIntercept}"
                           style="width: 200px; margin-left: 10px;">
                </div>
            </div>
        `;

        const graphDiv = document.createElement('div');
        graphDiv.id = `${containerId}_graph`;

        container.innerHTML = '';
        container.appendChild(controls);
        container.appendChild(graphDiv);

        // Initial graph
        let currentSlope = initialSlope;
        let currentIntercept = yIntercept;
        this.createLinearGraph(`${containerId}_graph`, currentSlope, currentIntercept, {showSlope: true});

        // Add event listeners
        document.getElementById('slopeSlider').addEventListener('input', (e) => {
            currentSlope = parseFloat(e.target.value);
            document.getElementById('slopeValue').textContent = currentSlope;
            this.createLinearGraph(`${containerId}_graph`, currentSlope, currentIntercept, {showSlope: true});
        });

        document.getElementById('interceptSlider').addEventListener('input', (e) => {
            currentIntercept = parseFloat(e.target.value);
            document.getElementById('interceptValue').textContent = currentIntercept;
            this.createLinearGraph(`${containerId}_graph`, currentSlope, currentIntercept, {showSlope: true});
        });
    }

    /**
     * Draw slope triangle showing rise/run
     */
    drawSlopeTriangle(svg, slope, yIntercept, xScale, yScale) {
        const x1 = 2;
        const y1 = slope * x1 + yIntercept;
        const x2 = x1 + 2;  // Run = 2
        const y2 = slope * x2 + yIntercept;
        const rise = y2 - y1;

        // Draw triangle
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M ${xScale(x1)},${yScale(y1)} L ${xScale(x2)},${yScale(y1)} L ${xScale(x2)},${yScale(y2)} Z`;
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', this.colors.accent);
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-dasharray', '4');
        svg.appendChild(path);

        // Labels
        const riseText = this.createText(xScale(x2) + 10, yScale((y1 + y2) / 2),
            `rise = ${rise.toFixed(1)}`, this.colors.accent, '12px');
        svg.appendChild(riseText);

        const runText = this.createText(xScale((x1 + x2) / 2) - 20, yScale(y1) + 20,
            'run = 2', this.colors.accent, '12px');
        svg.appendChild(runText);

        const slopeText = this.createText(xScale(x1) - 80, yScale(y1) + 30,
            `slope = ${slope}`, this.colors.primary, '14px');
        slopeText.setAttribute('font-weight', 'bold');
        svg.appendChild(slopeText);
    }

    /**
     * Create quadratic function graph: y = a(x - h)² + k
     * Shows parabola with vertex and axis of symmetry
     */
    createQuadraticGraph(containerId, a, h, k, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const width = options.width || 600;
        const height = options.height || 400;
        const padding = 50;

        // Create SVG
        const svg = this.createSVG(width, height);
        container.innerHTML = '';
        container.appendChild(svg);

        // Set up coordinate system
        const xMin = options.xMin || -10;
        const xMax = options.xMax || 10;
        const yMin = options.yMin || -10;
        const yMax = options.yMax || 10;

        const xScale = (x) => padding + ((x - xMin) / (xMax - xMin)) * (width - 2 * padding);
        const yScale = (y) => height - padding - ((y - yMin) / (yMax - yMin)) * (height - 2 * padding);

        // Draw grid
        this.drawGrid(svg, xMin, xMax, yMin, yMax, xScale, yScale, width, height, padding);

        // Draw axes
        this.drawAxes(svg, xMin, xMax, yMin, yMax, xScale, yScale, width, height, padding);

        // Draw parabola
        const points = [];
        const step = (xMax - xMin) / 200;
        for (let x = xMin; x <= xMax; x += step) {
            const y = a * Math.pow(x - h, 2) + k;
            if (y >= yMin && y <= yMax) {
                points.push(`${xScale(x)},${yScale(y)}`);
            }
        }

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${points.join(' L ')}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', this.colors.primary);
        path.setAttribute('stroke-width', '3');
        svg.appendChild(path);

        // Highlight vertex
        if (h >= xMin && h <= xMax && k >= yMin && k <= yMax) {
            const vertex = this.createPoint(xScale(h), yScale(k), this.colors.accent, 6);
            svg.appendChild(vertex);

            const label = this.createText(xScale(h) + 10, yScale(k) - 10,
                `Vertex: (${h}, ${k})`, this.colors.accent);
            svg.appendChild(label);
        }

        // Draw axis of symmetry
        if (options.showAxisOfSymmetry) {
            const axisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            axisLine.setAttribute('x1', xScale(h));
            axisLine.setAttribute('y1', yScale(yMin));
            axisLine.setAttribute('x2', xScale(h));
            axisLine.setAttribute('y2', yScale(yMax));
            axisLine.setAttribute('stroke', this.colors.info);
            axisLine.setAttribute('stroke-width', '2');
            axisLine.setAttribute('stroke-dasharray', '5,5');
            svg.appendChild(axisLine);

            const axisLabel = this.createText(xScale(h) + 10, yScale(yMax) + 30,
                `x = ${h}`, this.colors.info);
            svg.appendChild(axisLabel);
        }

        // Add equation label
        const equation = `y = ${a}(x ${h >= 0 ? '-' : '+'} ${Math.abs(h)})² ${k >= 0 ? '+' : ''} ${k}`;
        const eqLabel = this.createText(width - 250, 30, equation, this.colors.primary, '16px');
        eqLabel.setAttribute('font-weight', 'bold');
        svg.appendChild(eqLabel);

        return svg;
    }

    /**
     * Create interactive quadratic transformation demo
     * Shows how a, h, and k affect the parabola
     */
    createInteractiveQuadraticDemo(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Create controls
        const controls = document.createElement('div');
        controls.style.marginBottom = '20px';
        controls.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                <div>
                    <label style="font-weight: 600;">a (vertical stretch): <span id="aValue">1</span></label><br>
                    <input type="range" id="aSlider" min="-3" max="3" step="0.25" value="1" style="width: 100%;">
                </div>
                <div>
                    <label style="font-weight: 600;">h (horizontal shift): <span id="hValue">0</span></label><br>
                    <input type="range" id="hSlider" min="-5" max="5" step="0.5" value="0" style="width: 100%;">
                </div>
                <div>
                    <label style="font-weight: 600;">k (vertical shift): <span id="kValue">0</span></label><br>
                    <input type="range" id="kSlider" min="-8" max="8" step="0.5" value="0" style="width: 100%;">
                </div>
            </div>
        `;

        const graphDiv = document.createElement('div');
        graphDiv.id = `${containerId}_graph`;

        container.innerHTML = '';
        container.appendChild(controls);
        container.appendChild(graphDiv);

        // Initial graph
        let a = 1, h = 0, k = 0;
        this.createQuadraticGraph(`${containerId}_graph`, a, h, k, {showAxisOfSymmetry: true});

        // Add event listeners
        document.getElementById('aSlider').addEventListener('input', (e) => {
            a = parseFloat(e.target.value);
            if (a === 0) a = 0.25; // Prevent division by zero
            document.getElementById('aValue').textContent = a;
            this.createQuadraticGraph(`${containerId}_graph`, a, h, k, {showAxisOfSymmetry: true});
        });

        document.getElementById('hSlider').addEventListener('input', (e) => {
            h = parseFloat(e.target.value);
            document.getElementById('hValue').textContent = h;
            this.createQuadraticGraph(`${containerId}_graph`, a, h, k, {showAxisOfSymmetry: true});
        });

        document.getElementById('kSlider').addEventListener('input', (e) => {
            k = parseFloat(e.target.value);
            document.getElementById('kValue').textContent = k;
            this.createQuadraticGraph(`${containerId}_graph`, a, h, k, {showAxisOfSymmetry: true});
        });
    }

    /**
     * Visualize solving quadratic by graphing
     * Shows roots as x-intercepts
     */
    createQuadraticSolutionGraph(containerId, a, b, c) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Convert to vertex form
        const h = -b / (2 * a);
        const k = a * h * h + b * h + c;

        const width = 600;
        const height = 400;
        const padding = 50;

        // Create SVG
        const svg = this.createSVG(width, height);
        container.innerHTML = '';
        container.appendChild(svg);

        // Calculate roots using quadratic formula
        const discriminant = b * b - 4 * a * c;
        let roots = [];
        if (discriminant >= 0) {
            const root1 = (-b + Math.sqrt(discriminant)) / (2 * a);
            const root2 = (-b - Math.sqrt(discriminant)) / (2 * a);
            roots = [root1, root2];
        }

        // Adjust view to show roots
        let xMin = Math.min(h - 5, ...(roots.length > 0 ? roots : [h - 5]));
        let xMax = Math.max(h + 5, ...(roots.length > 0 ? roots : [h + 5]));
        xMin = Math.floor(xMin) - 1;
        xMax = Math.ceil(xMax) + 1;

        const yMin = Math.min(k - 5, -2);
        const yMax = Math.max(k + 5, 10);

        const xScale = (x) => padding + ((x - xMin) / (xMax - xMin)) * (width - 2 * padding);
        const yScale = (y) => height - padding - ((y - yMin) / (yMax - yMin)) * (height - 2 * padding);

        // Draw grid
        this.drawGrid(svg, xMin, xMax, yMin, yMax, xScale, yScale, width, height, padding);

        // Draw axes
        this.drawAxes(svg, xMin, xMax, yMin, yMax, xScale, yScale, width, height, padding);

        // Draw parabola
        const points = [];
        const step = (xMax - xMin) / 200;
        for (let x = xMin; x <= xMax; x += step) {
            const y = a * x * x + b * x + c;
            if (y >= yMin && y <= yMax) {
                points.push(`${xScale(x)},${yScale(y)}`);
            }
        }

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${points.join(' L ')}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', this.colors.primary);
        path.setAttribute('stroke-width', '3');
        svg.appendChild(path);

        // Highlight roots (x-intercepts)
        if (roots.length > 0) {
            roots.forEach((root, index) => {
                if (root >= xMin && root <= xMax) {
                    const rootPoint = this.createPoint(xScale(root), yScale(0), this.colors.success, 6);
                    svg.appendChild(rootPoint);

                    const label = this.createText(
                        xScale(root) - (index === 0 ? 40 : -10),
                        yScale(0) + 25,
                        `x = ${root.toFixed(2)}`,
                        this.colors.success
                    );
                    svg.appendChild(label);
                }
            });
        }

        // Vertex
        if (h >= xMin && h <= xMax && k >= yMin && k <= yMax) {
            const vertex = this.createPoint(xScale(h), yScale(k), this.colors.accent, 6);
            svg.appendChild(vertex);

            const label = this.createText(xScale(h) + 10, yScale(k) - 10,
                `Vertex: (${h.toFixed(2)}, ${k.toFixed(2)})`, this.colors.accent);
            svg.appendChild(label);
        }

        // Add equation label
        const equation = `y = ${a}x² ${b >= 0 ? '+' : ''}${b}x ${c >= 0 ? '+' : ''}${c}`;
        const eqLabel = this.createText(20, 30, equation, this.colors.primary, '16px');
        eqLabel.setAttribute('font-weight', 'bold');
        svg.appendChild(eqLabel);

        // Solution info
        const solutionText = discriminant < 0
            ? 'No real solutions'
            : discriminant === 0
                ? `One solution: x = ${roots[0].toFixed(2)}`
                : `Two solutions: x = ${roots[0].toFixed(2)}, x = ${roots[1].toFixed(2)}`;

        const solLabel = this.createText(20, 55, solutionText, this.colors.success, '14px');
        solLabel.setAttribute('font-weight', 'bold');
        svg.appendChild(solLabel);

        return svg;
    }

    /**
     * Create scatter plot with line of best fit
     * Useful for modeling lessons
     */
    createScatterPlotWithLine(containerId, dataPoints, slope, intercept, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const width = options.width || 600;
        const height = options.height || 400;
        const padding = 60;

        const svg = this.createSVG(width, height);
        container.innerHTML = '';
        container.appendChild(svg);

        // Find data range
        const xValues = dataPoints.map(p => p.x);
        const yValues = dataPoints.map(p => p.y);
        const xMin = options.xMin || Math.min(...xValues) - 1;
        const xMax = options.xMax || Math.max(...xValues) + 1;
        const yMin = options.yMin || Math.min(...yValues) - 1;
        const yMax = options.yMax || Math.max(...yValues) + 1;

        const xScale = (x) => padding + ((x - xMin) / (xMax - xMin)) * (width - 2 * padding);
        const yScale = (y) => height - padding - ((y - yMin) / (yMax - yMin)) * (height - 2 * padding);

        // Draw grid
        this.drawGrid(svg, xMin, xMax, yMin, yMax, xScale, yScale, width, height, padding);

        // Draw axes
        this.drawAxes(svg, xMin, xMax, yMin, yMax, xScale, yScale, width, height, padding);

        // Draw line of best fit
        const y1 = slope * xMin + intercept;
        const y2 = slope * xMax + intercept;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', xScale(xMin));
        line.setAttribute('y1', yScale(y1));
        line.setAttribute('x2', xScale(xMax));
        line.setAttribute('y2', yScale(y2));
        line.setAttribute('stroke', this.colors.info);
        line.setAttribute('stroke-width', '2');
        svg.appendChild(line);

        // Draw data points
        dataPoints.forEach(point => {
            const circle = this.createPoint(xScale(point.x), yScale(point.y), this.colors.accent, 5);
            svg.appendChild(circle);
        });

        // Add axis labels if provided
        if (options.xLabel) {
            const xLabel = this.createText(width / 2, height - 10, options.xLabel, this.colors.axis, '14px');
            xLabel.setAttribute('text-anchor', 'middle');
            svg.appendChild(xLabel);
        }

        if (options.yLabel) {
            const yLabel = this.createText(15, height / 2, options.yLabel, this.colors.axis, '14px');
            yLabel.setAttribute('text-anchor', 'middle');
            yLabel.setAttribute('transform', `rotate(-90, 15, ${height / 2})`);
            svg.appendChild(yLabel);
        }

        return svg;
    }

    // ========== HELPER FUNCTIONS ==========

    createSVG(width, height) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.style.border = '1px solid #e0e0e0';
        svg.style.borderRadius = '8px';
        svg.style.background = 'white';
        return svg;
    }

    drawGrid(svg, xMin, xMax, yMin, yMax, xScale, yScale, width, height, padding) {
        // Vertical grid lines
        for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', xScale(x));
            line.setAttribute('y1', padding);
            line.setAttribute('x2', xScale(x));
            line.setAttribute('y2', height - padding);
            line.setAttribute('stroke', this.colors.grid);
            line.setAttribute('stroke-width', '1');
            svg.appendChild(line);
        }

        // Horizontal grid lines
        for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', padding);
            line.setAttribute('y1', yScale(y));
            line.setAttribute('x2', width - padding);
            line.setAttribute('y2', yScale(y));
            line.setAttribute('stroke', this.colors.grid);
            line.setAttribute('stroke-width', '1');
            svg.appendChild(line);
        }
    }

    drawAxes(svg, xMin, xMax, yMin, yMax, xScale, yScale, width, height, padding) {
        // X-axis
        if (yMin <= 0 && yMax >= 0) {
            const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            xAxis.setAttribute('x1', padding);
            xAxis.setAttribute('y1', yScale(0));
            xAxis.setAttribute('x2', width - padding);
            xAxis.setAttribute('y2', yScale(0));
            xAxis.setAttribute('stroke', this.colors.axis);
            xAxis.setAttribute('stroke-width', '2');
            svg.appendChild(xAxis);

            // X-axis labels
            for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
                if (x === 0) continue;
                const label = this.createText(xScale(x), yScale(0) + 20, x.toString(), this.colors.axis, '12px');
                label.setAttribute('text-anchor', 'middle');
                svg.appendChild(label);
            }
        }

        // Y-axis
        if (xMin <= 0 && xMax >= 0) {
            const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            yAxis.setAttribute('x1', xScale(0));
            yAxis.setAttribute('y1', padding);
            yAxis.setAttribute('x2', xScale(0));
            yAxis.setAttribute('y2', height - padding);
            yAxis.setAttribute('stroke', this.colors.axis);
            yAxis.setAttribute('stroke-width', '2');
            svg.appendChild(yAxis);

            // Y-axis labels
            for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
                if (y === 0) continue;
                const label = this.createText(xScale(0) - 25, yScale(y) + 5, y.toString(), this.colors.axis, '12px');
                label.setAttribute('text-anchor', 'middle');
                svg.appendChild(label);
            }
        }

        // Origin label
        if (xMin <= 0 && xMax >= 0 && yMin <= 0 && yMax >= 0) {
            const origin = this.createText(xScale(0) - 15, yScale(0) + 20, '0', this.colors.axis, '12px');
            origin.setAttribute('text-anchor', 'middle');
            svg.appendChild(origin);
        }
    }

    createPoint(x, y, color, radius = 4) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', color);
        return circle;
    }

    createText(x, y, content, color, fontSize = '12px') {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y);
        text.setAttribute('fill', color);
        text.setAttribute('font-size', fontSize);
        text.textContent = content;
        return text;
    }
}

// Initialize visualizations when DOM is loaded
let vizLib;
document.addEventListener('DOMContentLoaded', () => {
    vizLib = new LinearQuadraticVisualizations();
});
