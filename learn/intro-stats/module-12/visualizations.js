// Module 12: Chi-Square Tests - Interactive Visualizations
// Pure JavaScript SVG visualizations (no external dependencies)

/**
 * Chi-Square Distribution Visualization
 * Shows multiple chi-square curves with different degrees of freedom
 */
function drawChiSquareDistribution(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = Math.min(700, container.clientWidth || 700);
    const height = 400;
    const margin = { top: 40, right: 120, bottom: 60, left: 60 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.style.border = '1px solid #E0E0E0';
    svg.style.borderRadius = '4px';

    // Chi-square distribution approximation
    function chiSquarePDF(x, df) {
        if (x <= 0) return 0;
        if (df === 1) return Math.exp(-x/2) / (Math.sqrt(2 * Math.PI * x));
        if (df === 2) return 0.5 * Math.exp(-x/2);
        // Gamma function approximation for general case
        const k = df / 2;
        const term1 = Math.pow(x, k - 1) * Math.exp(-x/2);
        const term2 = Math.pow(2, k) * gammaApprox(k);
        return term1 / term2;
    }

    function gammaApprox(z) {
        // Stirling's approximation
        if (z === 0.5) return Math.sqrt(Math.PI);
        if (z === 1) return 1;
        if (z === 1.5) return 0.5 * Math.sqrt(Math.PI);
        if (z === 2) return 1;
        return Math.sqrt(2 * Math.PI / z) * Math.pow(z / Math.E, z);
    }

    // Scales
    const xMax = 20;
    const xScale = (x) => margin.left + (x / xMax) * plotWidth;
    const yMax = 0.5;
    const yScale = (y) => margin.top + plotHeight - (y / yMax) * plotHeight;

    // Draw axes
    const axesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // X-axis
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', margin.left);
    xAxis.setAttribute('y1', yScale(0));
    xAxis.setAttribute('x2', margin.left + plotWidth);
    xAxis.setAttribute('y2', yScale(0));
    xAxis.setAttribute('stroke', '#2D2D2D');
    xAxis.setAttribute('stroke-width', '2');
    axesGroup.appendChild(xAxis);

    // Y-axis
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', margin.left);
    yAxis.setAttribute('y1', margin.top);
    yAxis.setAttribute('x2', margin.left);
    yAxis.setAttribute('y2', yScale(0));
    yAxis.setAttribute('stroke', '#2D2D2D');
    yAxis.setAttribute('stroke-width', '2');
    axesGroup.appendChild(yAxis);

    // X-axis labels
    for (let i = 0; i <= 20; i += 5) {
        const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tick.setAttribute('x1', xScale(i));
        tick.setAttribute('y1', yScale(0));
        tick.setAttribute('x2', xScale(i));
        tick.setAttribute('y2', yScale(0) + 5);
        tick.setAttribute('stroke', '#2D2D2D');
        axesGroup.appendChild(tick);

        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', xScale(i));
        label.setAttribute('y', yScale(0) + 20);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '12');
        label.textContent = i;
        axesGroup.appendChild(label);
    }

    // Axis titles
    const xTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xTitle.setAttribute('x', margin.left + plotWidth / 2);
    xTitle.setAttribute('y', height - 10);
    xTitle.setAttribute('text-anchor', 'middle');
    xTitle.setAttribute('font-size', '14');
    xTitle.setAttribute('font-weight', 'bold');
    xTitle.textContent = 'χ² value';
    axesGroup.appendChild(xTitle);

    const yTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yTitle.setAttribute('x', 20);
    yTitle.setAttribute('y', margin.top + plotHeight / 2);
    yTitle.setAttribute('text-anchor', 'middle');
    yTitle.setAttribute('font-size', '14');
    yTitle.setAttribute('font-weight', 'bold');
    yTitle.setAttribute('transform', `rotate(-90, 20, ${margin.top + plotHeight / 2})`);
    yTitle.textContent = 'Probability Density';
    axesGroup.appendChild(yTitle);

    svg.appendChild(axesGroup);

    // Draw distributions
    const dfValues = [1, 3, 5, 10];
    const colors = ['#DC3545', '#FFC107', '#28A745', '#2196F3'];

    dfValues.forEach((df, idx) => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let pathData = '';

        const numPoints = 200;
        for (let i = 0; i <= numPoints; i++) {
            const x = (i / numPoints) * xMax;
            const y = chiSquarePDF(x, df);
            const px = xScale(x);
            const py = yScale(Math.min(y, yMax));

            if (i === 0) {
                pathData += `M ${px} ${py}`;
            } else {
                pathData += ` L ${px} ${py}`;
            }
        }

        path.setAttribute('d', pathData);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', colors[idx]);
        path.setAttribute('stroke-width', '2.5');
        svg.appendChild(path);

        // Legend
        const legendY = margin.top + 20 + idx * 25;
        const legendLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        legendLine.setAttribute('x1', width - 100);
        legendLine.setAttribute('y1', legendY);
        legendLine.setAttribute('x2', width - 70);
        legendLine.setAttribute('y2', legendY);
        legendLine.setAttribute('stroke', colors[idx]);
        legendLine.setAttribute('stroke-width', '2.5');
        svg.appendChild(legendLine);

        const legendText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        legendText.setAttribute('x', width - 65);
        legendText.setAttribute('y', legendY + 4);
        legendText.setAttribute('font-size', '13');
        legendText.textContent = `df = ${df}`;
        svg.appendChild(legendText);
    });

    // Title
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', width / 2);
    title.setAttribute('y', 25);
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-size', '16');
    title.setAttribute('font-weight', 'bold');
    title.setAttribute('fill', '#2C5F7C');
    title.textContent = 'Chi-Square Distribution by Degrees of Freedom';
    svg.appendChild(title);

    container.appendChild(svg);
}

/**
 * Interactive Contingency Table Calculator
 * Allows users to enter data and see expected frequencies and chi-square calculation
 */
function drawContingencyTable(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const html = `
        <div style="padding: 1.5rem; background: #F8F9FA; border-radius: 8px;">
            <h4 style="margin-top: 0; color: #2C5F7C;">2×2 Contingency Table Calculator</h4>
            <p style="font-size: 0.9rem; color: #5A5A5A;">Enter observed frequencies to calculate expected values and χ²</p>

            <table style="width: 100%; max-width: 500px; margin: 1rem auto; border-collapse: collapse;">
                <tr>
                    <th style="background: #2C5F7C; color: white; padding: 0.5rem; border: 1px solid #DDD;"></th>
                    <th style="background: #2C5F7C; color: white; padding: 0.5rem; border: 1px solid #DDD;">Column 1</th>
                    <th style="background: #2C5F7C; color: white; padding: 0.5rem; border: 1px solid #DDD;">Column 2</th>
                    <th style="background: #E0E0E0; padding: 0.5rem; border: 1px solid #DDD; font-weight: bold;">Row Total</th>
                </tr>
                <tr>
                    <th style="background: #2C5F7C; color: white; padding: 0.5rem; border: 1px solid #DDD;">Row 1</th>
                    <td style="padding: 0.5rem; border: 1px solid #DDD; text-align: center;">
                        <input type="number" id="cell11" value="30" min="0" style="width: 60px; padding: 0.25rem; text-align: center;" onchange="calculateContingency()">
                    </td>
                    <td style="padding: 0.5rem; border: 1px solid #DDD; text-align: center;">
                        <input type="number" id="cell12" value="20" min="0" style="width: 60px; padding: 0.25rem; text-align: center;" onchange="calculateContingency()">
                    </td>
                    <td id="row1total" style="background: #E0E0E0; padding: 0.5rem; border: 1px solid #DDD; text-align: center; font-weight: bold;">50</td>
                </tr>
                <tr>
                    <th style="background: #2C5F7C; color: white; padding: 0.5rem; border: 1px solid #DDD;">Row 2</th>
                    <td style="padding: 0.5rem; border: 1px solid #DDD; text-align: center;">
                        <input type="number" id="cell21" value="10" min="0" style="width: 60px; padding: 0.25rem; text-align: center;" onchange="calculateContingency()">
                    </td>
                    <td style="padding: 0.5rem; border: 1px solid #DDD; text-align: center;">
                        <input type="number" id="cell22" value="40" min="0" style="width: 60px; padding: 0.25rem; text-align: center;" onchange="calculateContingency()">
                    </td>
                    <td id="row2total" style="background: #E0E0E0; padding: 0.5rem; border: 1px solid #DDD; text-align: center; font-weight: bold;">50</td>
                </tr>
                <tr>
                    <th style="background: #E0E0E0; padding: 0.5rem; border: 1px solid #DDD; font-weight: bold;">Col Total</th>
                    <td id="col1total" style="background: #E0E0E0; padding: 0.5rem; border: 1px solid #DDD; text-align: center; font-weight: bold;">40</td>
                    <td id="col2total" style="background: #E0E0E0; padding: 0.5rem; border: 1px solid #DDD; text-align: center; font-weight: bold;">60</td>
                    <td id="grandtotal" style="background: #D0D0D0; padding: 0.5rem; border: 1px solid #DDD; text-align: center; font-weight: bold;">100</td>
                </tr>
            </table>

            <div id="resultsDisplay" style="margin-top: 1.5rem; padding: 1rem; background: white; border-radius: 6px; border: 2px solid #2C5F7C;">
                <h4 style="margin-top: 0; color: #2C5F7C;">Results</h4>
                <div id="resultsContent"></div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Initial calculation
    setTimeout(() => calculateContingency(), 100);
}

function calculateContingency() {
    const cell11 = parseFloat(document.getElementById('cell11')?.value || 0);
    const cell12 = parseFloat(document.getElementById('cell12')?.value || 0);
    const cell21 = parseFloat(document.getElementById('cell21')?.value || 0);
    const cell22 = parseFloat(document.getElementById('cell22')?.value || 0);

    const row1 = cell11 + cell12;
    const row2 = cell21 + cell22;
    const col1 = cell11 + cell21;
    const col2 = cell12 + cell22;
    const grand = row1 + row2;

    // Update totals
    if (document.getElementById('row1total')) document.getElementById('row1total').textContent = row1;
    if (document.getElementById('row2total')) document.getElementById('row2total').textContent = row2;
    if (document.getElementById('col1total')) document.getElementById('col1total').textContent = col1;
    if (document.getElementById('col2total')) document.getElementById('col2total').textContent = col2;
    if (document.getElementById('grandtotal')) document.getElementById('grandtotal').textContent = grand;

    if (grand === 0) return;

    // Calculate expected frequencies
    const e11 = (row1 * col1) / grand;
    const e12 = (row1 * col2) / grand;
    const e21 = (row2 * col1) / grand;
    const e22 = (row2 * col2) / grand;

    // Calculate chi-square
    const chiSq11 = Math.pow(cell11 - e11, 2) / e11;
    const chiSq12 = Math.pow(cell12 - e12, 2) / e12;
    const chiSq21 = Math.pow(cell21 - e21, 2) / e21;
    const chiSq22 = Math.pow(cell22 - e22, 2) / e22;
    const totalChiSq = chiSq11 + chiSq12 + chiSq21 + chiSq22;

    const df = 1; // (2-1)(2-1) = 1

    // Check condition
    const minExpected = Math.min(e11, e12, e21, e22);
    const conditionMet = minExpected >= 5;

    // Display results
    const resultsContent = document.getElementById('resultsContent');
    if (resultsContent) {
        resultsContent.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <strong>Expected Frequencies:</strong>
                <ul style="margin: 0.5rem 0; font-size: 0.9rem;">
                    <li>E(1,1) = (${row1} × ${col1}) / ${grand} = ${e11.toFixed(2)}</li>
                    <li>E(1,2) = (${row1} × ${col2}) / ${grand} = ${e12.toFixed(2)}</li>
                    <li>E(2,1) = (${row2} × ${col1}) / ${grand} = ${e21.toFixed(2)}</li>
                    <li>E(2,2) = (${row2} × ${col2}) / ${grand} = ${e22.toFixed(2)}</li>
                </ul>
            </div>
            <div style="margin-bottom: 1rem;">
                <strong>Chi-Square Calculation:</strong>
                <p style="margin: 0.5rem 0; font-size: 0.9rem;">χ² = ${chiSq11.toFixed(3)} + ${chiSq12.toFixed(3)} + ${chiSq21.toFixed(3)} + ${chiSq22.toFixed(3)}</p>
                <p style="margin: 0.5rem 0; font-size: 1.1rem;"><strong>χ² = ${totalChiSq.toFixed(3)}</strong></p>
            </div>
            <div style="margin-bottom: 1rem;">
                <strong>Degrees of Freedom:</strong> df = (2-1)(2-1) = ${df}
            </div>
            <div style="padding: 0.75rem; background: ${conditionMet ? '#E8F5E9' : '#FFE4E1'}; border-radius: 4px; border-left: 4px solid ${conditionMet ? '#28A745' : '#DC3545'};">
                <strong>Condition Check:</strong> All expected frequencies ≥ 5?
                <p style="margin: 0.25rem 0; font-size: 0.9rem;">${conditionMet ? '✓ YES - Test is valid' : '✗ NO - Smallest E = ' + minExpected.toFixed(2) + ' (condition violated)'}</p>
            </div>
        `;
    }
}

/**
 * Interactive Decision Tree
 * Helps students choose the right chi-square test
 */
function drawDecisionTree(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const html = `
        <div style="padding: 1.5rem; background: #F8F9FA; border-radius: 8px;">
            <h4 style="margin-top: 0; color: #2C5F7C;">Interactive Decision Tree</h4>
            <p style="font-size: 0.9rem; color: #5A5A5A;">Answer the questions to find the right chi-square test</p>

            <div id="question1" style="margin: 1.5rem 0;">
                <p style="font-weight: bold; color: #2C5F7C;">1. Do you have categorical data (counts/frequencies)?</p>
                <button onclick="decisionAnswer('q1', 'yes')" style="margin: 0.5rem 0.5rem 0.5rem 0; padding: 0.5rem 1.5rem; background: #2C5F7C; color: white; border: none; border-radius: 4px; cursor: pointer;">Yes</button>
                <button onclick="decisionAnswer('q1', 'no')" style="margin: 0.5rem; padding: 0.5rem 1.5rem; background: #DC3545; color: white; border: none; border-radius: 4px; cursor: pointer;">No</button>
            </div>

            <div id="question2" style="margin: 1.5rem 0; display: none;">
                <p style="font-weight: bold; color: #2C5F7C;">2. How many categorical variables?</p>
                <button onclick="decisionAnswer('q2', 'one')" style="margin: 0.5rem; padding: 0.5rem 1.5rem; background: #2C5F7C; color: white; border: none; border-radius: 4px; cursor: pointer;">One Variable</button>
                <button onclick="decisionAnswer('q2', 'two')" style="margin: 0.5rem; padding: 0.5rem 1.5rem; background: #2C5F7C; color: white; border: none; border-radius: 4px; cursor: pointer;">Two Variables</button>
            </div>

            <div id="question3" style="margin: 1.5rem 0; display: none;">
                <p style="font-weight: bold; color: #2C5F7C;">3. How many samples?</p>
                <button onclick="decisionAnswer('q3', 'one')" style="margin: 0.5rem; padding: 0.5rem 1.5rem; background: #2C5F7C; color: white; border: none; border-radius: 4px; cursor: pointer;">One Sample</button>
                <button onclick="decisionAnswer('q3', 'multiple')" style="margin: 0.5rem; padding: 0.5rem 1.5rem; background: #2C5F7C; color: white; border: none; border-radius: 4px; cursor: pointer;">Multiple Samples</button>
            </div>

            <div id="decisionResult" style="margin: 2rem 0; padding: 1.5rem; background: white; border-radius: 6px; border-left: 4px solid #28A745; display: none;">
                <h4 style="margin-top: 0; color: #28A745;">Recommended Test:</h4>
                <p id="testName" style="font-size: 1.2rem; font-weight: bold; color: #2C5F7C;"></p>
                <p id="testDescription" style="margin: 0.5rem 0; color: #5A5A5A;"></p>
                <button onclick="resetDecisionTree()" style="margin-top: 1rem; padding: 0.5rem 1.5rem; background: #6C757D; color: white; border: none; border-radius: 4px; cursor: pointer;">Start Over</button>
            </div>

            <div id="notChiSquare" style="margin: 2rem 0; padding: 1.5rem; background: #FFE4E1; border-radius: 6px; border-left: 4px solid #DC3545; display: none;">
                <h4 style="margin-top: 0; color: #DC3545;">Not a Chi-Square Test</h4>
                <p>You have quantitative data, not categorical. Consider using:</p>
                <ul>
                    <li><strong>t-test</strong> - comparing means of two groups</li>
                    <li><strong>ANOVA</strong> - comparing means of 3+ groups</li>
                    <li><strong>Regression</strong> - modeling relationships between variables</li>
                </ul>
                <button onclick="resetDecisionTree()" style="margin-top: 1rem; padding: 0.5rem 1.5rem; background: #6C757D; color: white; border: none; border-radius: 4px; cursor: pointer;">Start Over</button>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// Global state for decision tree
let decisionState = { q1: null, q2: null, q3: null };

function decisionAnswer(question, answer) {
    decisionState[question] = answer;

    if (question === 'q1') {
        if (answer === 'no') {
            document.getElementById('notChiSquare').style.display = 'block';
            document.getElementById('question2').style.display = 'none';
            document.getElementById('question3').style.display = 'none';
            document.getElementById('decisionResult').style.display = 'none';
        } else {
            document.getElementById('notChiSquare').style.display = 'none';
            document.getElementById('question2').style.display = 'block';
        }
    } else if (question === 'q2') {
        if (answer === 'one') {
            document.getElementById('question3').style.display = 'block';
        } else {
            // Two variables → Independence (assuming one sample)
            showDecisionResult('Chi-Square Test of Independence',
                'Use this test to determine if two categorical variables are related or independent. You have one sample classified by two variables.');
        }
    } else if (question === 'q3') {
        if (decisionState.q2 === 'one' && answer === 'one') {
            showDecisionResult('Chi-Square Goodness of Fit Test',
                'Use this test to determine if your sample data fits an expected distribution. You have one sample with one variable.');
        } else if (decisionState.q2 === 'one' && answer === 'multiple') {
            showDecisionResult('Chi-Square Test of Homogeneity',
                'Use this test to compare distributions across multiple populations. You have multiple samples with one variable measured in each.');
        }
    }
}

function showDecisionResult(testName, description) {
    document.getElementById('testName').textContent = testName;
    document.getElementById('testDescription').textContent = description;
    document.getElementById('decisionResult').style.display = 'block';
    document.getElementById('question3').style.display = 'none';
}

function resetDecisionTree() {
    decisionState = { q1: null, q2: null, q3: null };
    document.getElementById('question2').style.display = 'none';
    document.getElementById('question3').style.display = 'none';
    document.getElementById('decisionResult').style.display = 'none';
    document.getElementById('notChiSquare').style.display = 'none';
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.drawChiSquareDistribution = drawChiSquareDistribution;
    window.drawContingencyTable = drawContingencyTable;
    window.drawDecisionTree = drawDecisionTree;
    window.calculateContingency = calculateContingency;
    window.decisionAnswer = decisionAnswer;
    window.resetDecisionTree = resetDecisionTree;
}
