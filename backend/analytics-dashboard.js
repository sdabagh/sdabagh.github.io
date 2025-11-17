/**
 * Research Analytics Dashboard
 * For Safaa Dabagh's Dissertation Study
 * AI-Powered Cognitive Scaffolding for Statistics Education
 */

// Firebase Configuration (matches cloud-functions.js)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase (if not already initialized)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const functions = firebase.functions();
const auth = firebase.auth();

/**
 * Main Analytics Dashboard Class
 */
class AnalyticsDashboard {
    constructor() {
        this.data = null;
        this.filteredData = null;
        this.dateRange = {
            start: null,
            end: null
        };
        this.charts = {};
        this.currentFilters = {
            module: 'all',
            studyGroup: 'all',
            status: 'all'
        };
        this.realtimeListeners = [];
        this.autoRefreshInterval = null;

        this.init();
    }

    /**
     * Initialize the dashboard
     */
    async init() {
        // Check authentication
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log('Authenticated user:', user.email);
                await this.loadDashboard();
            } else {
                // Redirect to login or show auth UI
                console.warn('User not authenticated. Redirecting to login...');
                // TODO: Redirect to login page
                this.showError('Please sign in to view the dashboard');
            }
        });

        // Setup event listeners
        this.setupEventListeners();

        // Setup theme
        this.initTheme();
    }

    /**
     * Load dashboard data
     */
    async loadDashboard() {
        try {
            this.showLoading();
            await this.loadData();
            this.renderDashboard();
            this.setupRealtimeListeners();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showError(error.message);
            this.hideLoading();
        }
    }

    /**
     * Load data from Firebase Cloud Functions
     */
    async loadData() {
        try {
            console.log('Fetching analytics data...');

            // Call the Cloud Function
            const getAnalytics = functions.httpsCallable('getResearchAnalytics');
            const result = await getAnalytics({
                dataType: 'summary',
                filters: {
                    startDate: this.dateRange.start,
                    endDate: this.dateRange.end
                }
            });

            this.data = result.data;
            this.filteredData = this.data; // Initially, no filters applied

            console.log('Analytics data loaded:', this.data);
            this.updateLastUpdated();

            return this.data;
        } catch (error) {
            console.error('Error fetching analytics:', error);

            // For development: Use mock data if Cloud Function fails
            console.warn('Using mock data for development');
            this.data = this.generateMockData();
            this.filteredData = this.data;
            this.updateLastUpdated();

            return this.data;
        }
    }

    /**
     * Render the entire dashboard
     */
    renderDashboard() {
        this.renderOverviewCards();
        this.renderEngagementCharts();
        this.renderScaffoldingCharts();
        this.renderLearningOutcomesCharts();
        this.renderAIMetricsCharts();
        this.renderStudentsTable();

        // Show dashboard content
        document.getElementById('dashboardContent').style.display = 'block';
    }

    /**
     * Render overview statistic cards
     */
    renderOverviewCards() {
        const { overview } = this.filteredData;

        // Total Participants
        document.getElementById('totalParticipants').textContent =
            this.formatNumber(overview.totalParticipants);
        document.getElementById('participantsTrend').innerHTML =
            this.renderTrend(overview.participantsTrend, 'this week');

        // Total Interactions
        document.getElementById('totalInteractions').textContent =
            this.formatNumber(overview.totalInteractions);
        document.getElementById('interactionsTrend').innerHTML =
            this.renderTrend(overview.interactionsTrend, 'today');

        // Average Learning Gain
        document.getElementById('avgLearningGain').textContent =
            overview.avgLearningGain.toFixed(1) + '%';

        // Active Sessions
        document.getElementById('activeSessions').textContent =
            this.formatNumber(overview.activeSessions);
    }

    /**
     * Render engagement charts
     */
    renderEngagementCharts() {
        const { engagement } = this.filteredData;

        // Daily Active Users Chart
        this.destroyChart('dailyActiveUsersChart');
        this.charts.dailyActiveUsersChart = new Chart(
            document.getElementById('dailyActiveUsersChart'),
            {
                type: 'line',
                data: {
                    labels: engagement.dailyActive.labels,
                    datasets: [{
                        label: 'Active Users',
                        data: engagement.dailyActive.data,
                        borderColor: '#2C5F7C',
                        backgroundColor: 'rgba(44, 95, 124, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: this.getLineChartOptions()
            }
        );

        // Module Completion Rates Chart
        this.destroyChart('completionRatesChart');
        this.charts.completionRatesChart = new Chart(
            document.getElementById('completionRatesChart'),
            {
                type: 'bar',
                data: {
                    labels: engagement.completionRates.labels,
                    datasets: [{
                        label: 'Completion Rate (%)',
                        data: engagement.completionRates.data,
                        backgroundColor: '#D97D54'
                    }]
                },
                options: this.getBarChartOptions('Completion Rate (%)')
            }
        );

        // Study Group Distribution Chart
        this.destroyChart('studyGroupChart');
        this.charts.studyGroupChart = new Chart(
            document.getElementById('studyGroupChart'),
            {
                type: 'pie',
                data: {
                    labels: ['Pilot', 'Control', 'Treatment'],
                    datasets: [{
                        data: engagement.studyGroupDistribution,
                        backgroundColor: [
                            '#1976D2',
                            '#F57C00',
                            '#388E3C'
                        ]
                    }]
                },
                options: this.getPieChartOptions()
            }
        );
    }

    /**
     * Render scaffolding effectiveness charts
     */
    renderScaffoldingCharts() {
        const { scaffolding } = this.filteredData;

        // Scaffolding Level Distribution (Stacked Bar)
        this.destroyChart('scaffoldingLevelsChart');
        this.charts.scaffoldingLevelsChart = new Chart(
            document.getElementById('scaffoldingLevelsChart'),
            {
                type: 'bar',
                data: {
                    labels: scaffolding.levelDistribution.labels,
                    datasets: [
                        {
                            label: 'Level 1 (Minimal)',
                            data: scaffolding.levelDistribution.level1,
                            backgroundColor: '#E8F5E9'
                        },
                        {
                            label: 'Level 2 (Moderate)',
                            data: scaffolding.levelDistribution.level2,
                            backgroundColor: '#81C784'
                        },
                        {
                            label: 'Level 3 (High)',
                            data: scaffolding.levelDistribution.level3,
                            backgroundColor: '#388E3C'
                        }
                    ]
                },
                options: this.getStackedBarChartOptions()
            }
        );

        // Escalation/De-escalation Events
        this.destroyChart('escalationChart');
        this.charts.escalationChart = new Chart(
            document.getElementById('escalationChart'),
            {
                type: 'line',
                data: {
                    labels: scaffolding.escalationEvents.labels,
                    datasets: [
                        {
                            label: 'Escalations',
                            data: scaffolding.escalationEvents.escalations,
                            borderColor: '#DC3545',
                            backgroundColor: 'rgba(220, 53, 69, 0.1)',
                            tension: 0.4
                        },
                        {
                            label: 'De-escalations',
                            data: scaffolding.escalationEvents.deescalations,
                            borderColor: '#28A745',
                            backgroundColor: 'rgba(40, 167, 69, 0.1)',
                            tension: 0.4
                        }
                    ]
                },
                options: this.getLineChartOptions()
            }
        );

        // Proficiency vs Scaffolding Scatter Plot
        this.destroyChart('proficiencyScatterChart');
        this.charts.proficiencyScatterChart = new Chart(
            document.getElementById('proficiencyScatterChart'),
            {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Students',
                        data: scaffolding.proficiencyScatter,
                        backgroundColor: 'rgba(44, 95, 124, 0.6)',
                        borderColor: '#2C5F7C'
                    }]
                },
                options: this.getScatterChartOptions()
            }
        );
    }

    /**
     * Render learning outcomes charts
     */
    renderLearningOutcomesCharts() {
        const { learningOutcomes } = this.filteredData;

        // Pre vs Post Assessment Scores (Box Plot - using bar chart approximation)
        this.destroyChart('assessmentScoresChart');
        this.charts.assessmentScoresChart = new Chart(
            document.getElementById('assessmentScoresChart'),
            {
                type: 'bar',
                data: {
                    labels: learningOutcomes.assessmentScores.labels,
                    datasets: [
                        {
                            label: 'Pre-Assessment',
                            data: learningOutcomes.assessmentScores.preScores,
                            backgroundColor: '#FFC107'
                        },
                        {
                            label: 'Post-Assessment',
                            data: learningOutcomes.assessmentScores.postScores,
                            backgroundColor: '#28A745'
                        }
                    ]
                },
                options: this.getBarChartOptions('Average Score (%)')
            }
        );

        // Learning Gains by Module (Heat map - using bar chart with gradient)
        this.destroyChart('learningGainsChart');
        this.charts.learningGainsChart = new Chart(
            document.getElementById('learningGainsChart'),
            {
                type: 'bar',
                data: {
                    labels: learningOutcomes.learningGains.labels,
                    datasets: [
                        {
                            label: 'Pilot',
                            data: learningOutcomes.learningGains.pilot,
                            backgroundColor: '#1976D2'
                        },
                        {
                            label: 'Control',
                            data: learningOutcomes.learningGains.control,
                            backgroundColor: '#F57C00'
                        },
                        {
                            label: 'Treatment',
                            data: learningOutcomes.learningGains.treatment,
                            backgroundColor: '#388E3C'
                        }
                    ]
                },
                options: this.getBarChartOptions('Learning Gain (%)')
            }
        );

        // Quiz Pass Rates
        this.destroyChart('quizPassRatesChart');
        this.charts.quizPassRatesChart = new Chart(
            document.getElementById('quizPassRatesChart'),
            {
                type: 'bar',
                data: {
                    labels: learningOutcomes.quizPassRates.labels,
                    datasets: [{
                        label: 'Pass Rate (%)',
                        data: learningOutcomes.quizPassRates.data,
                        backgroundColor: '#17A2B8'
                    }]
                },
                options: this.getBarChartOptions('Pass Rate (%)')
            }
        );
    }

    /**
     * Render AI interaction metrics charts
     */
    renderAIMetricsCharts() {
        const { aiMetrics } = this.filteredData;

        // Average Response Time by Scaffolding Level
        this.destroyChart('responseTimeChart');
        this.charts.responseTimeChart = new Chart(
            document.getElementById('responseTimeChart'),
            {
                type: 'bar',
                data: {
                    labels: ['Level 1', 'Level 2', 'Level 3'],
                    datasets: [{
                        label: 'Avg Response Time (s)',
                        data: aiMetrics.responseTime,
                        backgroundColor: '#9C27B0'
                    }]
                },
                options: this.getBarChartOptions('Response Time (seconds)')
            }
        );

        // Help-Seeking Patterns
        this.destroyChart('helpSeekingChart');
        this.charts.helpSeekingChart = new Chart(
            document.getElementById('helpSeekingChart'),
            {
                type: 'doughnut',
                data: {
                    labels: aiMetrics.helpSeeking.labels,
                    datasets: [{
                        data: aiMetrics.helpSeeking.data,
                        backgroundColor: [
                            '#2C5F7C',
                            '#D97D54',
                            '#28A745',
                            '#FFC107',
                            '#DC3545'
                        ]
                    }]
                },
                options: this.getPieChartOptions()
            }
        );

        // Topic Difficulty Rankings
        this.destroyChart('topicDifficultyChart');
        this.charts.topicDifficultyChart = new Chart(
            document.getElementById('topicDifficultyChart'),
            {
                type: 'bar',
                data: {
                    labels: aiMetrics.topicDifficulty.labels,
                    datasets: [{
                        label: 'Difficulty Score',
                        data: aiMetrics.topicDifficulty.data,
                        backgroundColor: '#DC3545'
                    }]
                },
                options: {
                    ...this.getBarChartOptions('Difficulty Score'),
                    indexAxis: 'y' // Horizontal bar chart
                }
            }
        );
    }

    /**
     * Render students table
     */
    renderStudentsTable() {
        const { students } = this.filteredData;
        const tbody = document.getElementById('studentsTableBody');

        if (!students || students.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <div class="empty-state-icon">📊</div>
                        <p>No student data available</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = students.map(student => `
            <tr onclick="dashboard.showStudentDetails('${student.userId}')">
                <td>${student.userId.substring(0, 8)}...</td>
                <td>${student.email || 'Anonymous'}</td>
                <td><span class="badge badge-${student.studyGroup}">${student.studyGroup}</span></td>
                <td>${student.modulesCompleted} / ${student.totalModules}</td>
                <td>${student.learningGain >= 0 ? '+' : ''}${student.learningGain}%</td>
                <td>${this.formatDate(student.lastActive)}</td>
                <td><span class="badge badge-${student.status}">${student.status}</span></td>
                <td>
                    <button class="btn btn-secondary" onclick="event.stopPropagation(); dashboard.exportStudentData('${student.userId}')">
                        Export
                    </button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Show student details modal
     */
    async showStudentDetails(userId) {
        try {
            console.log('Loading details for student:', userId);

            // Call Cloud Function to get detailed student data
            const getStudentData = functions.httpsCallable('getStudentAnalytics');
            const result = await getStudentData({ userId });
            const student = result.data;

            // Populate modal
            const modalBody = document.getElementById('studentModalBody');
            modalBody.innerHTML = `
                <div class="student-detail-grid">
                    <div class="detail-card">
                        <div class="detail-label">Student ID</div>
                        <div class="detail-value">${student.userId.substring(0, 12)}...</div>
                    </div>
                    <div class="detail-card">
                        <div class="detail-label">Study Group</div>
                        <div class="detail-value">
                            <span class="badge badge-${student.studyGroup}">${student.studyGroup}</span>
                        </div>
                    </div>
                    <div class="detail-card">
                        <div class="detail-label">Total Interactions</div>
                        <div class="detail-value">${student.totalInteractions}</div>
                    </div>
                    <div class="detail-card">
                        <div class="detail-label">Learning Gain</div>
                        <div class="detail-value">${student.learningGain >= 0 ? '+' : ''}${student.learningGain}%</div>
                    </div>
                </div>

                <h4 style="margin: 2rem 0 1rem 0;">Module Progress</h4>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Module</th>
                                <th>Status</th>
                                <th>Pre Score</th>
                                <th>Post Score</th>
                                <th>Gain</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${student.moduleProgress.map(m => `
                                <tr>
                                    <td>${m.moduleName}</td>
                                    <td><span class="badge badge-${m.status}">${m.status}</span></td>
                                    <td>${m.preScore}%</td>
                                    <td>${m.postScore}%</td>
                                    <td>${m.gain >= 0 ? '+' : ''}${m.gain}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <h4 style="margin: 2rem 0 1rem 0;">Recent Interactions</h4>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Scaffolding Level</th>
                                <th>Topic</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${student.recentInteractions.slice(0, 10).map(i => `
                                <tr>
                                    <td>${this.formatDateTime(i.timestamp)}</td>
                                    <td>${i.type}</td>
                                    <td>Level ${i.scaffoldingLevel}</td>
                                    <td>${i.topic}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div style="margin-top: 2rem; text-align: center;">
                    <button class="btn btn-primary" onclick="dashboard.exportStudentData('${userId}')">
                        📊 Export Complete Student Data
                    </button>
                </div>
            `;

            // Show modal
            document.getElementById('studentModal').classList.add('active');
        } catch (error) {
            console.error('Error loading student details:', error);
            alert('Failed to load student details: ' + error.message);
        }
    }

    /**
     * Export student data
     */
    async exportStudentData(userId) {
        try {
            console.log('Exporting data for student:', userId);

            const exportUserData = functions.httpsCallable('exportUserData');
            const result = await exportUserData({ userId });

            // Download as JSON
            this.downloadJSON(result.data, `student_${userId}_data.json`);

            alert('Student data exported successfully!');
        } catch (error) {
            console.error('Error exporting student data:', error);
            alert('Failed to export student data: ' + error.message);
        }
    }

    /**
     * Export all data to CSV
     */
    exportToCSV() {
        try {
            const { students } = this.filteredData;

            // CSV headers
            let csv = 'Student ID,Email,Study Group,Modules Completed,Learning Gain,Last Active,Status\n';

            // CSV rows
            students.forEach(student => {
                csv += `${student.userId},${student.email || 'Anonymous'},${student.studyGroup},${student.modulesCompleted},${student.learningGain},${this.formatDate(student.lastActive)},${student.status}\n`;
            });

            // Download
            this.downloadCSV(csv, 'research_analytics.csv');

            console.log('CSV exported successfully');
        } catch (error) {
            console.error('Error exporting CSV:', error);
            alert('Failed to export CSV: ' + error.message);
        }
    }

    /**
     * Export all data to JSON
     */
    exportToJSON() {
        try {
            const exportData = {
                exportDate: new Date().toISOString(),
                dateRange: this.dateRange,
                filters: this.currentFilters,
                data: this.filteredData
            };

            this.downloadJSON(exportData, 'research_analytics.json');

            console.log('JSON exported successfully');
        } catch (error) {
            console.error('Error exporting JSON:', error);
            alert('Failed to export JSON: ' + error.message);
        }
    }

    /**
     * Download CSV file
     */
    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Download JSON file
     */
    downloadJSON(data, filename) {
        const content = JSON.stringify(data, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Apply date range filter
     */
    async applyDateRange() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (startDate) {
            this.dateRange.start = new Date(startDate);
        }
        if (endDate) {
            this.dateRange.end = new Date(endDate);
        }

        // Update data range display
        if (startDate && endDate) {
            document.getElementById('dataRange').textContent =
                `${this.formatDate(this.dateRange.start)} - ${this.formatDate(this.dateRange.end)}`;
        } else if (startDate) {
            document.getElementById('dataRange').textContent =
                `From ${this.formatDate(this.dateRange.start)}`;
        } else {
            document.getElementById('dataRange').textContent = 'All time';
        }

        // Reload data
        await this.loadDashboard();
    }

    /**
     * Apply filters to student table
     */
    applyFilters() {
        const searchTerm = document.getElementById('searchStudent').value.toLowerCase();
        const studyGroup = document.getElementById('filterStudyGroup').value;
        const status = document.getElementById('filterStatus').value;

        this.currentFilters = { searchTerm, studyGroup, status };

        // Filter students
        let filteredStudents = this.data.students;

        if (searchTerm) {
            filteredStudents = filteredStudents.filter(s =>
                s.userId.toLowerCase().includes(searchTerm) ||
                (s.email && s.email.toLowerCase().includes(searchTerm))
            );
        }

        if (studyGroup !== 'all') {
            filteredStudents = filteredStudents.filter(s => s.studyGroup === studyGroup);
        }

        if (status !== 'all') {
            filteredStudents = filteredStudents.filter(s => s.status === status);
        }

        // Update filtered data
        this.filteredData = {
            ...this.data,
            students: filteredStudents
        };

        // Re-render table
        this.renderStudentsTable();
    }

    /**
     * Setup real-time listeners for live data
     */
    setupRealtimeListeners() {
        // Listen to active sessions
        const unsubscribe = db.collection('sessions')
            .where('active', '==', true)
            .onSnapshot(snapshot => {
                const activeSessions = snapshot.size;
                document.getElementById('activeSessions').textContent = activeSessions;
            });

        this.realtimeListeners.push(unsubscribe);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Date range
        document.getElementById('applyDateRange').addEventListener('click', () => {
            this.applyDateRange();
        });

        // Export buttons
        document.getElementById('exportCSV').addEventListener('click', () => {
            this.exportToCSV();
        });

        document.getElementById('exportJSON').addEventListener('click', () => {
            this.exportToJSON();
        });

        // Refresh button
        document.getElementById('refreshData').addEventListener('click', () => {
            this.loadDashboard();
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Student filters
        document.getElementById('searchStudent').addEventListener('input', () => {
            this.applyFilters();
        });

        document.getElementById('filterStudyGroup').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('filterStatus').addEventListener('change', () => {
            this.applyFilters();
        });

        // Module filter
        document.getElementById('engagementModule').addEventListener('change', (e) => {
            // TODO: Filter engagement charts by module
            console.log('Module filter:', e.target.value);
        });

        // Modal close
        document.getElementById('closeStudentModal').addEventListener('click', () => {
            document.getElementById('studentModal').classList.remove('active');
        });

        // Close modal on background click
        document.getElementById('studentModal').addEventListener('click', (e) => {
            if (e.target.id === 'studentModal') {
                document.getElementById('studentModal').classList.remove('active');
            }
        });
    }

    /**
     * Initialize theme
     */
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    /**
     * Toggle dark/light theme
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);

        // Update charts for theme
        this.updateChartsForTheme(newTheme);
    }

    /**
     * Update theme toggle icon
     */
    updateThemeIcon(theme) {
        const icon = theme === 'dark' ? '☀️' : '🌙';
        document.getElementById('themeToggle').textContent = icon;
    }

    /**
     * Update charts for theme change
     */
    updateChartsForTheme(theme) {
        const textColor = theme === 'dark' ? '#E9ECEF' : '#2D2D2D';
        const gridColor = theme === 'dark' ? '#495057' : '#DEE2E6';

        Chart.defaults.color = textColor;
        Chart.defaults.borderColor = gridColor;

        // Update all charts
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.options.scales?.x && (chart.options.scales.x.ticks.color = textColor);
                chart.options.scales?.y && (chart.options.scales.y.ticks.color = textColor);
                chart.options.scales?.x && (chart.options.scales.x.grid.color = gridColor);
                chart.options.scales?.y && (chart.options.scales.y.grid.color = gridColor);
                chart.update();
            }
        });
    }

    /**
     * Destroy chart if it exists
     */
    destroyChart(chartId) {
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
            delete this.charts[chartId];
        }
    }

    /**
     * Chart.js options helpers
     */
    getLineChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        };
    }

    getBarChartOptions(yAxisLabel = '') {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: yAxisLabel !== '',
                        text: yAxisLabel
                    }
                }
            }
        };
    }

    getStackedBarChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        };
    }

    getPieChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            }
        };
    }

    getScatterChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Proficiency Score'
                    },
                    min: 0,
                    max: 100
                },
                y: {
                    title: {
                        display: true,
                        text: 'Scaffolding Level Needed'
                    },
                    min: 0,
                    max: 3
                }
            }
        };
    }

    /**
     * Utility: Format number with commas
     */
    formatNumber(num) {
        return num.toLocaleString();
    }

    /**
     * Utility: Format date
     */
    formatDate(date) {
        if (!date) return '--';
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    /**
     * Utility: Format date and time
     */
    formatDateTime(date) {
        if (!date) return '--';
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    /**
     * Utility: Render trend indicator
     */
    renderTrend(value, label) {
        if (value === 0) {
            return `<span class="trend-neutral">→ ${value} ${label}</span>`;
        }
        const arrow = value > 0 ? '↑' : '↓';
        const className = value > 0 ? 'trend-up' : 'trend-down';
        return `<span class="${className}">${arrow} ${Math.abs(value)} ${label}</span>`;
    }

    /**
     * Update last updated timestamp
     */
    updateLastUpdated() {
        const now = new Date();
        document.getElementById('lastUpdated').textContent =
            now.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
    }

    /**
     * Show loading state
     */
    showLoading() {
        document.getElementById('loadingState').style.display = 'flex';
        document.getElementById('errorState').style.display = 'none';
        document.getElementById('dashboardContent').style.display = 'none';
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        document.getElementById('loadingState').style.display = 'none';
    }

    /**
     * Show error message
     */
    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorState').style.display = 'block';
        document.getElementById('loadingState').style.display = 'none';
    }

    /**
     * Generate mock data for development
     */
    generateMockData() {
        return {
            overview: {
                totalParticipants: 156,
                participantsTrend: 12,
                totalInteractions: 3420,
                interactionsTrend: 87,
                avgLearningGain: 24.5,
                activeSessions: 8
            },
            engagement: {
                dailyActive: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    data: [45, 52, 48, 61, 55, 38, 42]
                },
                completionRates: {
                    labels: ['Module 1', 'Module 2', 'Module 3', 'Module 4'],
                    data: [92, 78, 65, 43]
                },
                studyGroupDistribution: [42, 58, 56]
            },
            scaffolding: {
                levelDistribution: {
                    labels: ['Module 1', 'Module 2', 'Module 3'],
                    level1: [45, 38, 42],
                    level2: [35, 42, 38],
                    level3: [20, 28, 32]
                },
                escalationEvents: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    escalations: [23, 31, 28, 25],
                    deescalations: [18, 24, 26, 22]
                },
                proficiencyScatter: [
                    { x: 45, y: 2.1 },
                    { x: 62, y: 1.8 },
                    { x: 78, y: 1.2 },
                    { x: 34, y: 2.6 },
                    { x: 89, y: 0.8 },
                    { x: 56, y: 1.9 },
                    { x: 71, y: 1.4 },
                    { x: 82, y: 1.0 }
                ]
            },
            learningOutcomes: {
                assessmentScores: {
                    labels: ['Module 1', 'Module 2', 'Module 3'],
                    preScores: [58, 54, 52],
                    postScores: [82, 76, 74]
                },
                learningGains: {
                    labels: ['Module 1', 'Module 2', 'Module 3'],
                    pilot: [22, 18, 20],
                    control: [18, 16, 15],
                    treatment: [26, 24, 25]
                },
                quizPassRates: {
                    labels: ['Module 1', 'Module 2', 'Module 3'],
                    data: [88, 82, 76]
                }
            },
            aiMetrics: {
                responseTime: [2.3, 3.1, 4.2],
                helpSeeking: {
                    labels: ['Conceptual', 'Procedural', 'Metacognitive', 'Motivational', 'Technical'],
                    data: [145, 98, 76, 52, 34]
                },
                topicDifficulty: {
                    labels: ['Hypothesis Testing', 'Confidence Intervals', 'Sampling Distributions', 'Descriptive Stats', 'Probability'],
                    data: [8.2, 7.5, 6.8, 4.3, 5.6]
                }
            },
            students: [
                {
                    userId: 'abc123def456ghi789',
                    email: 'student1@example.com',
                    studyGroup: 'treatment',
                    modulesCompleted: 3,
                    totalModules: 4,
                    learningGain: 28,
                    lastActive: new Date('2025-11-15'),
                    status: 'active'
                },
                {
                    userId: 'def456ghi789jkl012',
                    email: 'student2@example.com',
                    studyGroup: 'control',
                    modulesCompleted: 2,
                    totalModules: 4,
                    learningGain: 15,
                    lastActive: new Date('2025-11-14'),
                    status: 'active'
                },
                {
                    userId: 'ghi789jkl012mno345',
                    email: null,
                    studyGroup: 'pilot',
                    modulesCompleted: 4,
                    totalModules: 4,
                    learningGain: 32,
                    lastActive: new Date('2025-11-16'),
                    status: 'completed'
                }
            ]
        };
    }

    /**
     * Cleanup on page unload
     */
    cleanup() {
        // Remove real-time listeners
        this.realtimeListeners.forEach(unsubscribe => unsubscribe());

        // Clear auto-refresh
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }

        // Destroy all charts
        Object.keys(this.charts).forEach(chartId => {
            this.destroyChart(chartId);
        });
    }
}

// Initialize dashboard when DOM is ready
let dashboard;

document.addEventListener('DOMContentLoaded', () => {
    dashboard = new AnalyticsDashboard();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (dashboard) {
        dashboard.cleanup();
    }
});
