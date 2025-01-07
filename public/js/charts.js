class GitHubCharts {
    constructor(options = {}) {
        this.config = {
            colors: {
                neonBlue: "#00f3ff",
                neonPurple: "#b24bff",
                neonGreen: "#4bff82",
                darkBlue: "#001e3c",
                glassBg: "rgba(0, 30, 60, 0.3)",
                cardBorder: "rgba(255, 255, 255, 0.1)",
                shadowColor: "rgba(0, 243, 255, 0.2)",
            },
            ...options
        };

        this.charts = new Map();
        this.resizeObserver = null;
        this.initializeResizeObserver();
    }

    initializeResizeObserver() {
        this.resizeObserver = new ResizeObserver(entries => {
            entries.forEach(entry => {
                const chart = this.charts.get(entry.target.id);
                if (chart) chart.resize();
            });
        });
    }

    initialize(data) {
        this.destroyCharts();
        const languages = data.stats.languages;
        const stars = data.repositories
            .sort((a, b) => b.stars - a.stars)
            .slice(0, 10);

        this.createLanguageChart(languages);
        this.createStarsChart(stars);
        this.setupThemeListeners();
    }

    createLanguageChart(languages) {
        const canvas = this.createCanvas('languageChart');
        const sortedLanguages = Object.entries(languages)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8);

        const chart = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: sortedLanguages.map(([lang]) => lang),
                datasets: [{
                    data: sortedLanguages.map(([, count]) => count),
                    backgroundColor: this.generateGradients(canvas.getContext('2d'), sortedLanguages.length),
                    borderWidth: 2,
                    borderColor: this.config.colors.cardBorder
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: 'white',
                            font: {
                                size: 12,
                                family: "'Arial', sans-serif"
                            },
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: this.config.colors.glassBg,
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: this.config.colors.cardBorder,
                        borderWidth: 1,
                        cornerRadius: 10,
                        displayColors: true,
                        padding: 15,
                        callbacks: {
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.raw / total) * 100).toFixed(1);
                                return `${context.label}: ${percentage}%`;
                            }
                        }
                    }
                }
            }
        });

        this.charts.set('languageChart', chart);
        this.resizeObserver.observe(canvas);
    }

    createStarsChart(starsData) {
        const canvas = this.createCanvas('starsChart');
        const ctx = canvas.getContext('2d');

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: starsData.map(repo => repo.name),
                datasets: [{
                    label: 'GitHub Stars',
                    data: starsData.map(repo => repo.stars),
                    backgroundColor: this.createGradient(ctx, this.config.colors.neonBlue),
                    borderColor: this.config.colors.neonBlue,
                    borderWidth: 1,
                    borderRadius: 5
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: this.config.colors.glassBg,
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: this.config.colors.cardBorder,
                        borderWidth: 1,
                        cornerRadius: 10,
                        padding: 15,
                        callbacks: {
                            label: (context) => `${context.raw.toLocaleString()} stars`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: this.config.colors.cardBorder,
                            borderColor: this.config.colors.cardBorder
                        },
                        ticks: {
                            color: 'white',
                            font: { size: 12 },
                            callback: value => value.toLocaleString()
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: {
                            color: 'white',
                            font: { size: 12 }
                        }
                    }
                }
            }
        });

        this.charts.set('starsChart', chart);
        this.resizeObserver.observe(canvas);
    }

    createCanvas(id) {
        const container = document.getElementById('charts-container');
        const wrapper = document.createElement('div');
        wrapper.className = 'chart-wrapper glass-card hover-lift';
        
        const canvas = document.createElement('canvas');
        canvas.id = id;
        
        const existingWrapper = container.querySelector(`#${id}`);
        if (existingWrapper) {
            container.removeChild(existingWrapper.parentElement);
        }
        
        wrapper.appendChild(canvas);
        container.appendChild(wrapper);
        return canvas;
    }

    createGradient(ctx, color) {
        const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        gradient.addColorStop(0, `${color}99`);
        gradient.addColorStop(1, `${color}11`);
        return gradient;
    }

    generateGradients(ctx, count) {
        const baseColors = [
            this.config.colors.neonBlue,
            this.config.colors.neonPurple,
            this.config.colors.neonGreen
        ];

        return Array.from({ length: count }, (_, i) => {
            const baseColor = baseColors[i % baseColors.length];
            return this.createGradient(ctx, baseColor);
        });
    }

    setupThemeListeners() {
        const updateChartTheme = (isDark) => {
            Chart.defaults.color = isDark ? '#ffffff' : '#000000';
            this.charts.forEach(chart => chart.update());
        };
        
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', e => updateChartTheme(e.matches));
        updateChartTheme(mediaQuery.matches);
    }

    destroyCharts() {
        this.charts.forEach(chart => {
            this.resizeObserver.unobserve(chart.canvas);
            chart.destroy();
        });
        this.charts.clear();
    }
}


window.GitHubCharts = GitHubCharts;
