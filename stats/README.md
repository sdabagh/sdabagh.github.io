# Stats Without Walls

Free statistical tool for all levels, browser-only. Open `stats/index.html` on the site; no install, no account, no data leaves the browser.

Menus, option names and result tables (Exploration, T-Tests, ANOVA, Regression, Frequencies, distrACTION) match the course instructions as written. On top of that, StatCrunch-style conveniences: Filters, Compute, Transform, sort by clicking a header, summary-statistic input on every test, a two-proportion z test, chi-square and F calculators, a sampling distribution simulator, session save and load, and offline use as an installable app (PWA).

What it does: load a CSV (or paste, or a sample dataset), edit cells in place; descriptives, frequency and two-way tables; bar, pie, histogram, dotplot, boxplot, scatterplot; one mean (t), one proportion (z with exact binomial), two means (Welch), paired, two proportions, one-way ANOVA with Tukey, chi-square goodness of fit and independence, correlation and regression with residual plot; binomial, normal, t, and sample-size calculators. Every inference card gives the formula, the statistic, the p-value, a decision at alpha, a written conclusion, and a condition check.

House rules baked in: means use t with df (sigma is never given); p-value approach; no inference about a variance; z procedures for proportions require the success-failure check.

Files: `index.html` (layout), `app.js` (menus, dialogs, result cards), `stats.js` (engine), `vendor/` (jStat 1.9.6 for distributions, Plotly cartesian 2.35.2 for plots), `data/` (sample datasets from the SMC, LMU and POPP courses).

Verified 2026-09-12 against R (and the jmv package) on the class datasets: one-sample t, proportion test, Welch, paired, two proportions, ANOVA F and Tukey p-values, chi-square, regression coefficients and slope interval all agree to four decimals.
