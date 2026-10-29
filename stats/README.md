# Stats Without Walls

Free statistical tool for all levels, browser-only. Open `stats/index.html` on the site; no install, no account, no data leaves the browser.

Three pages, one menu bar: the data page (table on the left, Analyses and Graphs on the right; on a phone or an iPad in portrait the table sits above the results), the distrACTION page (`#distraction`: inputs card and live result cards, no table) and the Learn page (`#learn`: the demonstrations that need no data). Both extra pages have a Back to data button and work with the browser's Back button. The app opens with an empty table. The browser remembers the user's own data (a file; pasted, typed or simulated data; a stacked or sampled table; a sample dataset once it has been changed), with its filter and hand-set types, plus the decimal setting and the panel width. An untouched sample dataset, results and distrACTION inputs are not remembered.

Menus, option names and result tables (Exploration, T-Tests, ANOVA, Regression, Frequencies, distrACTION) match the course instructions as written. On top of that, StatCrunch-style conveniences: Filters, Compute, Transform, sort by clicking a header, summary-statistic input on the t, z, proportion and chi-square tests, a two-proportion z test, chi-square and F calculators, a sampling distribution simulator, session save and load, and offline use as an installable app (PWA).

What it does: load a CSV (or paste, or a sample dataset), edit cells in place; descriptives, frequency and two-way tables; bar, pie, histogram, dotplot, boxplot, scatterplot; one mean (t, or z when sigma is given), one proportion (z with exact binomial; Wald, plus four, Agresti-Coull, Wilson or exact interval), two means (Welch), paired, two proportions, one-way ANOVA with Tukey, chi-square goodness of fit and independence, correlation and regression with residual plot, confidence and prediction intervals; one and two variance tests; Levene's test; binomial, Poisson, geometric, hypergeometric, discrete uniform, custom discrete (mean, SD and probabilities from x and P(x)), normal, uniform, exponential, t, chi-square and F calculators, each with the events at most, less than, at least, more than, equal to, between (inclusive or strict) and quantile, plus t*, p-value and critical-value choices for t, chi-square and F, all updating live as inputs change; sample size for a margin of error and power; data tools to bin, stack, simulate and sample; Learn applets for mean versus median, regression influence and guessing r (each value or point can be typed as well as clicked). Every inference card gives the formula, the statistic, the p-value, a decision at alpha, a written conclusion, and a condition check.

House rules baked in: means use t with df (the z test is there only for problems that give sigma, and its card says so); p-value approach; tests for a standard deviation live under Advanced, not in the first-course menus; z procedures for proportions require the success-failure check.

Files: `index.html` (layout and styles), `app.js` (menus, pages, dialogs, result cards), `stats.js` (engine), `sw.js` (offline cache; bump `CACHE` and the `?v=` numbers in `index.html` with every release), `vendor/` (jStat 1.9.6 for distributions, Plotly cartesian 2.35.2 for plots), `data/` (sample datasets from the SMC, LMU and POPP courses).

Verified 2026-09-12 against R (and the jmv package) on the class datasets: one-sample t, proportion test, Welch, paired, two proportions, ANOVA F and Tukey p-values, chi-square, regression coefficients and slope interval all agree to four decimals.

## Learn menu, four classroom demonstrations (added 2026-09-22)

Built after a POPP class where the law of large numbers had to be demonstrated in StatCrunch because
this app could not do it. All four run with no data loaded, so they work on the projector in a room
where nobody has a file open.

- **Coin flips and the law of large numbers.** One, two or three coins, one die, two dice, or any p.
  Shows the first fifty outcomes, the proportion after 10, 25, 50, 100, 250 trials and so on, and the
  running proportion settling toward p. The second plot is the one that does the teaching: the count
  drifts further and further from the expected count while the proportion settles, which is why
  "19 percent, so 2 of the next 10" and "tails is due" are both wrong.
- **The Central Limit Theorem.** Several sample sizes compared on one set of axes, with a table of the
  simulated SD against sigma / sqrt(n) and the skewness falling as n grows. Separates the three things
  that happen at once: center fixed, spread shrinking by sqrt(n), shape turning normal.
- **What a confidence interval means.** Many samples, one interval each, plotted against a true value
  that never moves, with the actual capture rate reported against the stated level. Uses t with n - 1
  df for a mean, and warns when n p or n (1 - p) drops under 10 for a proportion.
- **What a p-value is.** Forces H0 true, draws thousands of samples, counts the ones at least as
  extreme. For a proportion it prints simulated, exact binomial and z formula p side by side and
  explains the gap rather than hiding it.

Verified 2026-09-22 in the browser. CLT: simulated SDs 7.79, 3.62, 1.462, 0.8015 against theory
8.05, 3.60, 1.469, 0.8048 at n = 1, 5, 30, 100, skewness falling 1.87 to 0.20. Confidence intervals:
96 of 100 at the 95 percent level for a mean; 187 of 200 at n = 15 for a proportion, correctly below
the stated level with the success-failure warning shown. p-values checked against Python: 26 of 40
gives exact 0.0807 and z 0.0578 (the app prints both and flags the gap), 230 of 400 gives exact 0.0031
and z 0.0027 (the app says the approximation is fine there).

Service worker cache bumped to sww-v36 so installed copies pick the new version up.

## Changelog

### 2026-10-29: the simulation route when a condition fails

- When a condition check comes out pink, the card runs a bootstrap percentile interval and a permutation p-value
  (binomial simulation for one proportion) from the same data and choices, puts them next to the formula answer, says
  whether they agree, and draws the simulated values with the observed one: one-sample, independent and paired t
  (test and interval), one and two proportions, contingency tables (permutation chi-square), one-way ANOVA
  (permutation F, with a new group-size condition) and linear regression (bootstrap slope, with a new n condition).
  Seeded (2,000 resamples), raw data only. The Ask tip on a small-sample card points to it. Browser test
  `simroute.js`. Cache `sww-v89`, scripts `?v=91`.

### 2026-10-29: a graph on every inferential card

- Chi-square and F curves (`chiPlot`, `fPlot`) join the t and z curves: contingency tables (plus row-percentage
  bars), goodness of fit, one-way ANOVA (Fisher's or Welch's df), two-way and repeated-measures ANOVA (one curve per
  F row), Kruskal-Wallis (plus box plots), Friedman, McNemar (plus the discordant pairs), the variance tests, the
  Cochran-Armitage trend test (z), Mann-Whitney and Wilcoxon (z), and the slope's t curve on the regression card.
  Every interval-only card draws its interval (`ciPlot`): the bar, the estimate as a dot, the reference value as a
  dashed line. Browser test `infplots.js`; `verify.js` expects three regression plots. Cache `sww-v88`, scripts `?v=90`.

### 2026-10-29: Ask answers in Spanish

- `lang-es-ask.js`: the Spanish title and answer of every Ask route and glossary entry (127), used when the
  interface is Spanish; the connectives (Also possible, To run it, In plain words, the Methods Guide links), the
  Open buttons and the needs-data line are Spanish too, and the "Leído como" note no longer says the answers are in
  English. The query map learned clinical Spanish (tasa de infección, reingreso, intervención, riesgo relativo, razón
  de momios, grupo de control, atención habitual). Browser test `askes.js`. Cache `sww-v87`, scripts `?v=89`.

### 2026-10-29: examples from the field, Ask in nursing words

- Each field (health and nursing, business, social science, biology, engineering, public safety) carries one example
  sentence per main test dialog, shown under the first box when that field is chosen; the general field shows none.
- Ask routes for clinical phrasing: a rate that dropped or differed (two proportions), time until readmission
  (survival), before and after the intervention (paired t), the risk of the outcome in the exposed group (relative
  risk and odds ratio on the contingency-table card), intervention group versus usual care (independent t); a
  glossary entry on relative risk versus the odds ratio. Browser test `field.js`. Cache `sww-v86`, scripts `?v=88`.

### 2026-10-29: helping sheet

- The site link **Download the app** is now **App: coming soon**: `download.html` no longer offers the browser
  install steps or the desktop installers (the v1.3.0 release stays on GitHub, unlinked) until the app is checked in real
  classes and the pricing is decided. The browser version remains free and current.
- `helping.html`: a printable two-page sheet for whoever helps others use the app (a one-hour tour in the order
  to learn it, and the ten questions students ask most with where each answer is). Linked from the site links,
  the Guide (Start here) and here. Cache `sww-v85`.

### 2026-10-29: confidence interval without a test

- A **Perform** choice at the top of every test dialog that gives an interval (one sample t and z, independent and paired
  t, two sample z, one and two proportions, one and two variances): **Hypothesis test** (the interval is reported with
  it, as before) or **Confidence interval only**. The second hides the test value, the hypothesis and alpha, needs no
  value to test against, and gives an interval card: n, estimate, SE, t* or z*, margin of error, the interval at the
  level typed, formula, worked numbers, APA line, a reading sentence. The R script then carries no `mu =` or `p =`.
- Sample size is **n** everywhere (labels, result headers, messages); population size N stays N. Browser test
  `perform.js`. Cache `sww-v84`, scripts `?v=87`.

### 2026-10-28: any confidence level

- The confidence level is typed, not picked from 90, 95 and 99: a **Confidence level (percent)** box in every dialog that
  gives an interval (a proportion such as 0.95 works too; 50 to 99.99 accepted, a message under the box otherwise). The
  value is turned into a proportion once, when the dialog runs, so the engine, the R script, the restore and the share
  link see 0.98; the edit dialog shows 98 again. The course profile takes any level. The distrACTION t* calculator takes
  a percent too. Browser test `conflevel.js`. Cache `sww-v83`, scripts `?v=86`.

### 2026-10-25: copy for Word

- **copy for Word** under every table and in every card's tools puts HTML on the clipboard (with a plain-text twin):
  a table in APA style (rules above, below and under the header, numbers right aligned, italic title), or the whole
  card (title, tables, formula, APA line, conclusion, the worked numbers under Method, a graph as a PNG picture via
  Plotly.toImage). Uses the async clipboard with ClipboardItem and falls back to a selection copy. Browser test
  `word.js` reads the clipboard back. Cache `sww-v82`, scripts `?v=85`.

### 2026-10-24 (later): degenerate data says so in words

- Every engine function was probed with degenerate inputs (constant data, single values, one level, all ties, perfect
  fits, zero cells, empty weights): nothing hangs, but the cards printed NaN and one case crashed. Now the t-tests,
  ANOVA, regression, correlation, Mann-Whitney, Kruskal-Wallis, the chi-square table, PCA, EFA and Cronbach's alpha
  check first and say which column, group or value is the problem. `fmt` prints a NaN as n/a and an infinity as ∞,
  `fmtP` prints n/a, and a card with an n/a cell carries one line explaining the usual causes. Browser test
  `degenerate.js`. Cache `sww-v81`, scripts `?v=84`.

### 2026-10-24: files as spreadsheets export them

- The CSV reader detects the delimiter (comma, semicolon, tab, pipe) from the first line and drops a byte-order mark; a
  semicolon file with decimal commas used to collapse into one column. On a file, a paste or an Excel sheet (never a
  sample dataset or a table the app built) the load tidies and names on an "Opened" card: decimal commas to points,
  currency signs, thousands separators and percent signs removed, duplicate column names suffixed `_2`. The type guess
  looks past NA, N/A, NaN, null, None, ".", "-", "?" and Excel error tokens (the cells keep them), and counts only
  decimal or scientific notation as numeric (`0x10` is text). Browser test `messy.js` with eight files. Cache
  `sww-v80`, scripts `?v=83`.

### 2026-10-23 (later): ready for the app stores; large files

- **Large files.** Above 4,000 rows the data table renders its first 300 rows and pages the rest in on scroll, on a button and under the
  arrow keys, with one delegated edit listener instead of one per cell. The kept-row index and column reads are cached
  for the length of one task. A 50,000-row CSV now opens in 0.4 s (was 25 s), Descriptives takes 0.7 s (was 17 s) and the
  independent t-test 0.5 s (was 161 s: `col(v.g)[i]` recomputed the filter for every row). Browser test `bigdata.js`.
- **Error bar.** A script error or unhandled rejection shows above the results with the build number; benign
  ResizeObserver notices are ignored.
- **Stores.** `manifest.json` gains an id, language, categories, orientation, a maskable icon entry and three screenshots
  (`store/`), plus a Play feature graphic. `privacy.html` is the policy page the stores ask for, linked from the header,
  the guide and the download page, and precached. iOS home-screen metas and `viewport-fit=cover` with safe-area padding.
  `LAUNCH.md` is the checklist for wrapping and submitting. Browser test `launch.js`. Cache `sww-v79`, scripts `?v=82`.

### 2026-10-23: Spanish interface

- **Results › Language / Idioma**, or the **Español** button in the header, shows the menus, dialogs, field labels, groups,
  hints, buttons and the page shell in Spanish (`lang-es.js`, about 840 strings). Every internal key stays English:
  result cards, formulas, APA lines, the R script, saved sessions, share links and course profiles are identical in both
  languages. Ask maps Spanish words and phrases to the English its routing knows ("comparar dos grupos", "antes y
  después", "¿qué es un valor p?") and says how it read the question; answers stay English for now. A browser set to
  Spanish opens in Spanish on the first visit; the choice is kept on the device. Service worker cache `sww-v78`, scripts
  `?v=81`. Browser test `lang.js`.

### 2026-10-22 (later): check my work

- Every result card has a **check my work** button: it lists the card's numbers, the student types the ones they worked out
  by hand, and each is marked as a match within the rounding typed or a miss with the most likely reason (flipped sign, one
  tail instead of two, SD over n instead of n − 1, SE without √n, percent against proportion, squared or square-rooted,
  rounding too early, or simply far off). The verdict table sits on the card and is replaced on a second check. Ask
  explains it; the user guide describes it. Service worker cache `sww-v77`, scripts `?v=80`.

### 2026-10-22: Excel files open directly; Ask forgives typos

- **Data, Open CSV or Excel file** now takes .xlsx workbooks and reads them in the browser with no library: shared, inline and
  rich-text strings, cached formula values, TRUE/FALSE, dates by the cell's number format (serial numbers become YYYY-MM-DD,
  1904 date system respected), and a sheet picker when a workbook has several sheets with data. Nothing is uploaded. The old
  .xls format gets a message to save as .xlsx or CSV.
- **Ask forgives typos**: a word it does not know is replaced by the closest word in its own vocabulary (one edit for short
  words, two for long ones, a swapped pair counts as one) and the answer starts with "I read that as ...". "befor and after",
  "annova", "corelation" and "logisitc regresion" now land. Service worker cache `sww-v76`, scripts `?v=79`.

### 2026-10-21 (later): mediation, and marginal means after two-way ANOVA

- **Regression, Mediation (indirect effect through a mediator)**: paths a, b, c′ and c by OLS with covariates, the indirect
  effect a × b with Sobel's test and a percentile bootstrap interval (seeded, 2000 resamples by default, as the mediation
  package's boot = TRUE), the share mediated, a histogram of the bootstrap distribution, and the causal assumptions stated.
  Checked by identity (c = c′ + a × b exactly; Sobel by hand).
- **Two-Way ANOVA** prints **estimated marginal means** for each factor (emmeans' equal-weights definition, SEs from the
  model) with Tukey-adjusted pairwise comparisons, and says when the interaction makes them misleading. With balanced data
  they equal the raw marginal means (checked). The Script view adds the emmeans and mediation::mediate lines; Ask routes
  both; the Methods Guide has a mediation section and a marginal-means step. Engine: `S.emm2`, `S.mediation`. Service
  worker cache `sww-v75`, scripts `?v=78`.

### 2026-10-21: survey weights

- **Advanced, Survey estimates with weights (design-based)**: weighted means and proportions with Taylor-linearized standard
  errors under weights, strata and clusters (R's svydesign and svymean, with-replacement approximation, no finite-population
  correction), the unweighted values beside them, the design effect and effective sample size, Kish's weights-only design
  effect, a warning for single-cluster strata. Checked by hand against the textbook stratified-sample formula and the Kish
  approximation. The Script view writes the svydesign and svymean lines; Ask routes the vocabulary; the Methods Guide has a
  design row. Engine: `S.svymean`. Service worker cache `sww-v74`, scripts `?v=77`.

### 2026-10-20 (night): mixed-effects logistic and Poisson regression (glmer)

- **Advanced, Mixed-Effects Model for yes/no or counts (glmer)**: a random intercept per cluster for a yes/no outcome (one row
  per case, or successes out of trials) or a count with an exposure offset. lme4's Laplace approximation (nAGQ = 1): the
  conditional modes by Newton's method per cluster, the Laplace deviance, Nelder-Mead over (theta, beta), standard errors
  from the Hessian of the deviance as lme4's vcov does. Odds or rate ratios with intervals, variance and SD, the ICC on the
  latent scale, a boundary-corrected likelihood-ratio test for the random intercept, cluster effects with a caterpillar plot,
  formula, worked numbers, APA line.
- Verified against R on lme4's `cbpp` (ships as a sample, fetched from the Rdatasets mirror): estimates −1.3983, −0.9919,
  −1.1282, −1.5797, herd variance 0.4123, deviance 184.1, AIC 194.1 and BIC 204.2 all reproduced to three decimals; the
  standard errors come out 0.6 to 1.3 percent above glmer's. Ask routes the vocabulary (glmer, mixed logistic, patients within
  hospitals); the Methods Guide and the user guide describe it; the Script view writes the glmer call. Engine: `S.glmm`.
  Service worker cache `sww-v73`, scripts `?v=76`.

### 2026-10-20 (later): logistic regression diagnostics

- **Logistic Regression** now judges the model the way a reviewer does. Discrimination: the ROC curve, the AUC with a
  Hanley-McNeil interval and a benchmark line, a classification table at the chosen cutoff and at Youden's best cut
  (sensitivity, specificity, precision, NPV, accuracy). Calibration: the Hosmer-Lemeshow test (ResourceSelection's grouping:
  deciles of the fitted values, df = g − 2) with a decile table and plot. The pseudo R² family (McFadden, Cox-Snell,
  Nagelkerke, Tjur), an optional deviance-residuals plot, an events-per-predictor check and a separation warning. The APA
  line carries χ², Nagelkerke R², AUC and the Hosmer-Lemeshow result; the Script view adds the pROC, ResourceSelection and
  DescTools lines. Checked by identity (AUC equals the Mann-Whitney count; the classification counts add up; Nagelkerke from
  its formula); an R comparison on the same data is the next step once R runs in the browser. Engine: `S.roc`,
  `S.classify`, `S.hoslem`, `S.pseudoR2`, `S.devResid`. Service worker cache `sww-v72`, scripts `?v=75`.

### 2026-10-20: calmer dialogs, the accessibility panel, and an update bar

- **Essentials first.** Dialog sections that most runs never touch (More appearance, Model terms, Checks, Model comparison,
  Percentages, Cells, Comparative Measures, Prediction, Additional Options) are folded under a dashed
  "more options" heading. A section opens by itself when a card is edited and one of its fields was changed from the default,
  and stays open once opened (remembered per computer). The graph dialogs keep title, axis labels and color visible and fold
  the rest.
- **Accessibility panel in the app**: the course pages' toolbar (`accessibility.js`) now runs in the app too, bottom left:
  dark mode (with a dark theme for cards, tables, dialogs, Ask and new graphs), larger text, the Lexend font (loaded only when
  switched on), reading ruler, read aloud. Reading mode, which has no meaning in the app, is hidden.
- **"A new version is ready" bar.** When the service worker installs a release while the app is open, a green bar offers
  Reload now; a tab left open checks for a release every hour. Ask explains the panel. Service worker cache `sww-v71`,
  scripts `?v=74`.

### 2026-10-19 (night): Ask never answers with silence

- Ask opens its panel if a question arrives while it is closed, shows any error it hits while answering (with the build
  number) instead of saying nothing, and its welcome line names the build, so a stale cached copy is easy to spot.
  Service worker cache `sww-v70`, scripts `?v=73`.

### 2026-10-19 (later): closing the gaps with R, 5 of 5: the script view

- **Results, Script: every step, with the R code**: every analysis and graph on the page, oldest first, with the choices made
  in each dialog (labels, not field names), and for each the R call that does the same, from `t.test`, `aov`, `lm`, `glm`,
  `MASS::glm.nb`, `lmerTest::lmer`, `chisq.test`, `prop.test`, `binom.test`, `wilcox.test`, `psych::fa`, `survival::coxph`
  to `ggplot2` with `facet_wrap`, `pivot_longer`, `left_join` and `group_by`; packages are named in full. Downloads: the steps
  as text and a ready-to-run `.R` file that begins by reading the data. Each card now remembers its dialog's title and field
  labels for this. Ask routes "r code", "script", "what did I do", "methods section". Service worker cache `sww-v69`,
  scripts `?v=72`.

### 2026-10-19: closing the gaps with R, 4 of 5: graphics control

- The **Appearance** section of every graph dialog (bar, histogram, dotplot, boxplot, scatter) now gives what ggplot2's labs,
  scale_*, theme and facet_wrap give: a palette for groups (Okabe-Ito colorblind safe, viridis, grayscale, pastel), **small
  multiples** (one panel per level of a categorical column on shared axes; the dialog is run once per level with the rows
  restricted and the panels tiled), legend position, minimal or classic theme, font size, axis ranges, log scales and
  reference lines (`y = 3.0`, `x = 70 (cutoff)`). Every graph downloads as **SVG** as well as PNG. Ask knows the vocabulary
  (facet, colorblind, log scale, reference line, publication quality). Service worker cache `sww-v68`, scripts `?v=71`.

### 2026-10-18 (night): closing the gaps with R, 3 of 5: data wrangling

- Five new Data items, each card ending with the tidyr or dplyr line that does the same in R: **Reshape: wide to long**
  (pivot_longer, with ID columns kept), **Reshape: long to wide** (pivot_wider, duplicates reported or resolved by first,
  mean or count), **Merge with another table (join)** (left, inner or full, keys with different names, a pasted table or a
  sample; match counts reported; the class data join the Exam 1 file on Student_ID = StudentID), **Group by and summarize**
  (n, mean, SD, median, min, max, sum, blanks by one or two grouping columns, optionally as the new table) and **Clean rows**
  (NA codes to blanks, trimmed spaces, duplicates, blanks in chosen columns, empty rows, each counted). Ask routes the
  vocabulary (gather, melt, spread, vlookup, aggregate, drop_na) and explains long against wide layouts; both guides
  describe the items. Service worker cache `sww-v67`, scripts `?v=70`.

### 2026-10-18 (later): closing the gaps with R, 2 of 5: offsets, interactions, reference levels

- **Model terms** on Multiple Linear Regression, Logistic Regression and Count Regression: squared terms; interactions typed
  as `a * b` for any pair of columns (numeric by numeric gives one product column; numeric by categorical one slope
  difference per level; categorical by categorical one column per pair of levels), any number of them, with a warning when
  a main effect is missing, as R's `a * b` would include it; and **reference levels** for categorical predictors (R's
  `relevel`), typed as `Year = Freshman`.
- **Exposure offsets** in Count Regression: pick a time-at-risk or population column and log(exposure) enters the Poisson
  and negative binomial models with a fixed coefficient of 1, so the model is for a rate (R's `offset(log(exposure))`).
  Rows with a zero or blank exposure are left out and the card says how many.
- Verified against R: on the `ships` data (MASS) the app reproduces `glm(incidents ~ type + year + period +
  offset(log(service)), poisson)` to four decimals on every coefficient and standard error, with residual deviance 38.695 on
  25 df and null deviance 146.328 on 33 df. Interactions were checked by identity: a numeric by categorical interaction
  gives the same slopes as separate regressions in each group, and a saturated logistic model with a categorical by
  categorical interaction reproduces the cell log odds. The ships data ship as a sample. Ask and both guides describe the
  new options. Engine: `S.poisson` and `S.negbin` take `opts.offset`. Service worker cache `sww-v66`, scripts `?v=69`.

### 2026-10-18: one proportion z test on the menu

- **Frequencies, One proportion: z test**: the z test for a single proportion now has its own menu item (it used to be a
  tick box inside the binomial test). The card leads with SE₀, z, the p-value and the worked numbers, checks the conditions
  (n p₀ and n(1 − p₀) both at least 10) and says plainly when they fail, and shows the exact binomial p-value underneath as
  a check. The binomial test item is unchanged. Ask, the Which-test wizard and both guides point to it.
- **Ask answers questions.** Until now Ask only routed ("compare two groups" opens the t test). It now answers what things
  mean, in plain words, with a Learn demo where one exists and a link into the Methods Guide: the p-value, α, H₀ and Hₐ,
  Type I and II errors, power, confidence intervals, SD against SE, z-scores, mean against median, skew, IQR and boxplots,
  outliers, which graph, sampling distributions and the CLT, parameters and statistics, degrees of freedom, t or z, tails,
  significance against importance, d and η², R², r, correlation and causation, slope and intercept, residuals, assumptions,
  VIF, dummy variables, interactions, odds ratios, rate ratios and overdispersion, AIC and BIC, likelihood-ratio tests, ML
  and REML, fixed and random effects and the ICC, Satterthwaite df, F and post hoc tests, Levene and Welch, normality
  checks, nonparametric tests, paired against independent, expected counts, bootstrap, permutation and Bayesian ideas,
  probability rules, the binomial setting, the normal curve, percentiles, margin of error, sampling methods and bias,
  experiments and confounding, variable types, survival terms, Cronbach's alpha, factors and loadings, choosing k, the
  robustness value, and the app itself. **"Explain my result"** reads the newest card back: its APA line, conclusion and
  warnings, with a note on what the p-value does and does not say. A question gets the answer first and then, at most, one
  way to run it; a request still gets the method first. Service worker cache `sww-v65`, scripts `?v=68`.

### 2026-10-17 (night): mixed-effects models

- **Advanced, Mixed-Effects Model (nested or repeated data)**: lme4's linear mixed model in the browser. A numeric outcome,
  fixed-effect predictors (numeric and categorical), one grouping factor, an optional correlated random slope. REML (default)
  or ML by the profiled deviance of Bates et al. (2015), Nelder-Mead over the relative covariance factor. Fixed effects with
  Satterthwaite df and p (lmerTest's method: twice the inverse Hessian of the deviance in theta and sigma, the variance of each
  coefficient differentiated numerically). Random-effect variances, SDs and correlation; ICC from the empty model; marginal and
  conditional R² (Nakagawa); AIC, BIC; a boundary-corrected likelihood-ratio test against the model without random effects;
  cluster effects (BLUPs) with a caterpillar plot; residual plot; formula, worked numbers, APA line, conclusion.
- Verified against R: on `sleepstudy` the app matches lme4 and lmerTest to four decimals on both the random-intercept and the
  random-slope model under REML and ML (estimates, SEs, df 22.81 / 161.0 and 17.0 / 17.0, variances, correlation, REML
  criterion 1786.47 and 1743.63, ML deviance 1794.08 and 1751.94). The dataset ships as a sample.
- Ask knows the vocabulary (nested, clustered, multilevel, hierarchical, longitudinal, random effects); the Methods Guide has a
  section and a design row for clustered and longitudinal studies; the social-science and biology fields list the model.
  Engine: `S.lmm`. Service worker cache `sww-v63`, scripts `?v=66`.

### 2026-10-17 (later): Ask, a helper in plain words

- **Ask** (data bar) opens a small panel. A question in plain words ("compare two groups", "before and after", "is there
  a relationship", "predict a yes or no", "my counts are small", "how many people do I need", "what columns do I have")
  is matched against a knowledge base of about 45 entries built from the Methods Guide: the answer names the method, says
  why in two sentences, offers *Open* buttons that run the right dialog, a rank-based alternative where one exists, and a
  link to the steps in the guide. "What columns do I have" lists the loaded data by type. A question that matches nothing
  gets example chips, the Which test? wizard and the guide.
- **Tips**: after a result lands, the card's warnings are read and the next step is suggested once per card (Fisher's
  exact for an expected count under 5, the rank test for a small or skewed sample, the exact binomial when a count is
  under 10, the extrapolation caveat, reverse-keyed items, negative binomial for overdispersion). With the panel closed
  the button reads "Ask · 1 tip".
- Rule based and offline: nothing typed leaves the browser, which keeps the app's promise. Escape closes the panel; it
  never opens over a dialog. Service worker cache `sww-v62`, scripts `?v=65`.

### 2026-10-17: student or researcher, and a field

- **Who is using the app** (start screen, the button in the data bar, and Results): *Student* or *Researcher*, plus a
  field: General, Health and nursing, Business and finance, Social science and education, Biology and life sciences,
  Engineering and quality, Public safety and criminal justice. Remembered on the device (`sww_mode`).
- **Researcher** keeps every card and every menu. The card is reordered at build time: tables, the APA line and the
  conclusion first, the formula and worked numbers folded under *Method*; 3 decimals unless the user set decimals or a
  course profile. Switching back to Student restores the full card for new results.
- **Field**: the field's sample datasets come first in Data, Sample datasets (labelled with the field), and the start
  screen lists the six analyses the field reaches for first, each a button that opens the dialog, with a one-line
  pointer (for example, that relative risk and the odds ratio live on the Contingency Tables card).
  Service worker cache `sww-v59`, scripts `?v=62`.
- **Methods Guide** (`stats/methods.html`, linked from the app header, the start screen and the user guide): every
  method by research question (describe, compare, relate, predict, change over time, scales, structure, time to event,
  planning, causal questions), each with when to use it, the data layout, the exact menu path and options, what to read
  on the card, how to report it, and the alternative when assumptions fail; a start-from-your-question table, a
  by-study-design table, a reporting checklist and a glossary. Two editions on one page, Student and Professional,
  switched at the top and remembered; the professional edition opens by default for the Researcher mode. Every menu
  path is checked against the app's menu table. Service worker cache `sww-v60`, scripts `?v=63`.

### 2026-10-16 (evening): Fisher's exact test takes a direction

- **One-sided Fisher's exact test.** Frequencies, Contingency Tables: Independent Samples has a new Fisher's Hₐ choice
  (Fisher's Ha under Notation: words) under Tests, shown when Fisher's exact test (2 by 2) is ticked: two-sided (the two
  rows differ, as before), greater (row 1 has a larger share of the first column, P(X ≥ a), right tailed) or less (a
  smaller share, P(X ≤ a), left tailed). The card names the rows and the column: Ana with 8 makes and 2 misses against
  Ben with 3 makes and 7 misses gives "Hₐ: Ana has a larger share of make than Ben (right tailed). Exact p-value 0.0349."
  (two-sided 0.0698, less 0.9973). The results table keeps its title, Fisher's exact test (2 by 2), and gains an Hₐ
  column. A typed table of counts now keeps the rows and columns in the order typed; before, a 0 in the first cell moved
  that column to the end, so "the first column" would have been the wrong one. A label typed after a comma and a space no
  longer keeps the space. Checked against R's fisher.test on 4,200 cases, all three alternatives: every 2 by 2 table with
  cells from 0, 1, 2, 3, 5 and 8 (zeros and empty rows included), large counts such as 120, 80, 95, 105 and up to 2,600 a
  cell, unbalanced rows such as 1, 0, 500, 600, and 80 random tables. All agree to 4 decimals; the largest relative
  difference is 2.0E-10.
  Service worker cache `sww-v58`, scripts `?v=61`.

### 2026-10-16 (later): notation in symbols

- Formulas, worked numbers, APA lines, hypothesis sentences, table captions, headers and row labels, and dialog labels now
  print the textbook's symbols: x̄, ȳ, d̄, p̂, ŷ, σ, μ, α, β, λ, ρ, θ, η², ω², R², χ², H₀, Hₐ, ±, ≠, ≤, ≥, −, ×, Σ, √,
  squares as superscripts, subscripts on b₀, b₁, μ₁, σ₂, n₁, p₂. One layer (`sym`) does it at print time; the app's
  source still composes text in words, so every existing string keeps working and `copy as CSV` carries the symbols.
- Sentences take only the symbol rules; "3 times as likely" and "the sum of the ranks" stay English. A data column named
  alpha, mu, beta or p1 keeps its name wherever it is printed.
- **Results, Notation: symbols or words** switches back to words for Read Aloud and screen readers; the choice is
  remembered and applies to new results. Menu names, dialog titles and card titles are unchanged, so course profiles and
  the printed companion guides still match.
  Service worker cache `sww-v57`, scripts `?v=60`.

### 2026-10-16: goodness of fit has an explicit Expected choice

- **N Outcomes: chi-square Goodness of fit**: a new *Expected* selector, *Equally likely (every level the same)* by
  default, or *Proportions or counts I type*. The text box for typed values appears only for the second choice, and
  leaving it blank is an error instead of a silent fallback to equal. The formula line and the conclusion now say
  which null was used (each level 1 / k, with E = n / k, or the stated proportions).
  Service worker cache `sww-v56`, scripts `?v=59`.

### 2026-10-15 (late): the ANOVA menu holds the family; ANCOVA, MANOVA and Friedman added

- **ANOVA menu**: One-Way ANOVA, Two-Way ANOVA, ANCOVA, Repeated Measures and Mixed ANOVA, MANOVA, then Kruskal-Wallis
  and Friedman. Two-Way and Repeated Measures moved here from Advanced; Kruskal-Wallis stays under Nonparametric as well,
  and Friedman is listed in both.
- **ANCOVA** (new): one factor plus covariates. Type II sums of squares by model comparison, partial eta squared,
  adjusted means at the covariate means with standard errors from the coefficient covariance, Holm-adjusted pairwise
  comparisons of adjusted means, the homogeneity-of-slopes check, and the scatterplot with parallel fitted lines.
  Verified against a NumPy fit on the class data (GPA by Year adjusting for Hours_Study: F for Year 1.678 on (3, 35),
  for Hours_Study 2.553 on (1, 35), slope -0.0143, adjusted means 3.409, 3.593, 3.755, 3.488, slopes interaction F 0.080).
- **MANOVA** (new): one factor, several outcomes. H and E matrices, the eigenvalues of E^-1 H by the symmetric route
  (Cholesky, Jacobi), Pillai's trace, Wilks' lambda, Hotelling-Lawley and Roy with the F approximations of R's
  summary.manova, follow-up ANOVAs with a Bonferroni line, a standardized profile plot. Verified against R on iris:
  Pillai 1.1919, F 53.47 on (8, 290); Wilks 0.02344, F 199.15 on (8, 288); Hotelling-Lawley 32.477, F 580.5; Roy 32.192,
  F 1167.0 on (4, 145).
- **Friedman** (new): ranks within rows with the tie correction, Kendall's W, Holm-adjusted pairwise Wilcoxon
  signed-rank tests, box plots. Verified on a hand-worked table (chi-square 4.5 on 2 df, p 0.1054, W 0.5625).
- Engine: `S.ancova`, `S.manova`, `S.friedman`, `S.holm`; `S.ols` now returns `covb`, the coefficient covariance.
  Service worker cache `sww-v55`, scripts `?v=58`.

### 2026-10-15 (night): a filter no longer makes a sample dataset the user's own

- Reported right after the merge: the app opened with the class data again. A filter counted as a change since
  2026-10-14, so a filtered sample was remembered as the user's own, and the share link and Restore apply filters all
  the time (a share link of a filtered sample even embedded the table and the receiver got it as their own data). A
  filter, like a sort, is a view of the data and never makes a sample the student's own now: the filter box, Data,
  Filters and a restore keep the origin; a share link of a filtered sample names the sample instead of embedding it.
  A remembered copy under a sample's name is compared with the sample file whatever origin it was stored with, so a
  copy that is exactly the sample (a filter aside) is forgotten on the next open. Guide and the Sample datasets hint
  updated. Service worker cache `sww-v54`, scripts `?v=57`.
- Verified headlessly: load the class data, filter, reload: the table is empty and nothing is remembered; a share
  link of the filtered sample says it names the sample dataset; the three suites still pass.

### 2026-10-15 (evening): sensitivity to a lurking variable (Cinelli-Hazlett benchmark), Darfur sample dataset

- **Regression, Sensitivity to a lurking variable.** The omitted-variable-bias sensitivity analysis of Cinelli and
  Hazlett (2020), the benchmark used in Chad Hazlett's causal inference course, as a card in the first-course register.
  Outcome, treatment, numeric and categorical covariates (dummy coded; a village fixed effect with 485 dummies is fine),
  a benchmark covariate and the multiples to try. Reports the estimate, SE, t and df of the treatment, its partial R2
  with the outcome, the robustness value RV_q and RV_{q,alpha}; for the benchmark, its own partial R2s with the
  treatment and the outcome (a categorical benchmark uses the group partial R2 from the nested F), and for each
  multiple the bounded R2s, adjusted estimate, SE, t and interval; a contour plot of the adjusted estimate with the
  zero line and the benchmark points; the formula, worked numbers, a plain-English reading (the floor set by the
  partial R2, which multiple would make it not significant or change its sign), an APA-style sentence and the citation.
- Engine: `S.partialR2`, `S.groupPartialR2`, `S.robustness`, `S.ovbAdjust`, `S.ovbBound`; `S.ols` takes
  `{ light: true }` to skip VIFs and influence diagnostics (each VIF is another inversion).
- Sample dataset `darfur.csv` (Hazlett 2020, as distributed with sensemakr): the paper's example.
- Verified in the browser against the paper's Table 2 and a NumPy reference: estimate 0.0973, SE 0.0233, t 4.18 on
  783 df, partial R2 2.2%, RV 13.9%, RV at alpha 0.05 7.6%; 1x female: R2 with treatment 0.9%, with outcome 12.5%,
  adjusted estimate 0.0752, SE 0.0219, t 3.44; 2x 0.0529; 3x 0.0304. Service worker cache `sww-v53`, scripts `?v=56`.

### 2026-10-15 (later): share link, "Which test?" wizard, course profiles

The three review suggestions left open that morning.

- **Share link.** Results, Share link packs the setup into the address after `#s=`: the dataset (a sample's name, or a
  table of the user's own inside the link when its JSON is under 60,000 characters), the filter, the choices behind every
  card on the Analyses and Graphs tabs, and the course profile if one is set. The dialog shows the link and Copy link
  puts it on the clipboard and leaves a card holding it (a note card: not kept for a restore, not part of the next link).
  Opening a link shows the bar above the tabs ("Open the shared setup? 3 analyses on STATC1000_Class_Data, with the
  table inside the link") with Open and Not now; nothing runs until Open. The setup is read with the session-file checks
  (names and cells forced to text, the filter kept only when it is a plain formula, cards matched to menu items by name)
  and re-run the way Restore re-runs the last session, so graphs and edit buttons come back. The hash is dropped from the
  address once answered. Nothing is sent anywhere.
- **Which test?** First item of the T-Tests menu and a button beside the filter box. Three questions (what was measured:
  a number, a yes or no, a category; one group against a value, two groups, three or more, or a relationship; paired or
  independent; the other variable a number or a category) name the test in a box that follows the answers, with one
  sentence on why, and Open it opens that dialog. Nineteen routes, from the one-sample t to McNemar and logistic
  regression. With no data loaded, Note it leaves a card naming the test.
- **Course profile.** Results, Course profile: a name, the two-sample t offered first (Welch's or pooled), the quartile
  rule, decimal places, the alpha and confidence level offered first, and which menus show (Data and Results always).
  Apply uses it on this computer (remembered; the name shows above the table, the Welch label names the profile); the
  same dialog downloads it as a `.sww-profile.json` file or copies a link that sets it; Open a profile file reads the
  file; Remove restores the app's defaults. A share link made with a profile set carries the profile. Unknown values
  in a file or link fall back to the defaults.
- Dialogs gained a `note` field (a box of text that follows the other answers), used by the wizard.
- Service worker cache `sww-v52`, scripts `?v=55`. Verified headlessly in Chrome: a share link of the class data with
  three analyses reopens in a fresh browser with the table, the filter and the three cards in order; a link carrying a
  40-row table of the user's own reopens with the rows; the wizard names the paired t, the two-proportion z, the
  chi-square table and McNemar for the matching answers and opens the paired dialog; a profile hiding Advanced and
  choosing pooled t hides the menu and unticks Welch, survives a reload, and is removed cleanly.

### 2026-10-15: review fixes: filter freeze, dialog defaults, restore after a reload, worked numbers, APA line, table and graph export

From an outside walkthrough of build 53 (every statistic recomputed in SciPy and found to match; the findings were all
interface). In the order the review listed them:

- **A filter with `and` no longer locks the tab.** `and`, `or` in any case, a single `&` or `|`, and a lone `=` are
  accepted in a filter or a Compute formula (changed only outside text in quotes). A filter that cannot be read says so
  under the box, in red, with the typed text kept so it can be fixed, and all rows stay in use; the Data, Filters dialog
  shows the same message under its field. It was an `alert()` raised from the box's change event, and a blocking dialog
  there could lock the tab in Chrome. The box and the dialog hint now mention `and` and `or`.
- **Dialogs open on two different variables.** Two boxes offering the same columns (dependent variable and covariate in
  Linear Regression, rows and columns in Contingency Tables, the two variables of a Paired T-Test, x and y of a
  scatterplot) default to the first and second column, so Run never regresses Age on Age.
- **Summary-statistics boxes show only when "from summary statistics" is chosen**, and the column boxes only for "from a
  column": the one-sample and independent t-tests, both z-tests, the variance tests (sample 2 only for the two-sample
  test, the claimed SD only for the one-sample test), the binomial test, goodness of fit, contingency tables, two
  proportions, McNemar and Cochran-Armitage. The CLT demonstration shows its column box only when the population is a column.
- **Descriptives explains the quartile rule only when quartiles are on the card** (quartiles, IQR, fences or other
  percentiles ticked) or a box plot uses them (the note then says so).
- **The empty Graphs tab says what goes there**: graphs from the Graph menu; a plot ticked inside an analysis stays with
  its card under Analyses.
- **A box plot's axis covers its outliers**: the value axis runs from a labelled tick at or below the minimum to one at or
  above the maximum (Commute_Minutes now ends at 80, with 68 and 70 inside the axis), in Descriptives, Graph, Boxplot,
  the independent t-test and ANOVA plots.
- **Linear Regression reports r with its sign** (the slope's sign), labelled r and r squared, with a note that other
  software prints an unsigned R.
- **One chart style.** The Plotly toolbar is gone from every graph (dragging still zooms, a double click resets); under
  each graph a **download PNG** button saves it at twice the screen resolution.
- **Results survive a reload.** The choices behind every card on the Analyses and Graphs tabs are stored as the cards are
  made, with the name of the data. After a reload a bar above the tabs offers "Restore your last session?" with the
  count, the dataset and the time; Restore opens the same data (an untouched sample dataset is fetched again, so the
  "opens empty" rule of 2026-10-14 is unchanged unless the student asks) and runs the same analyses, so graphs and edit
  buttons come back; No thanks forgets them. A card that can no longer run (a column that is gone) is reported, not
  silently dropped. A session file still works as before.
- **Widen table** next to the filter box folds the results pane away so all eighteen columns show; the next result, or
  Show results, brings it back. (The bar between the panels could already be dragged; it was easy to miss.)
- The Welch checkbox says "the default here", not "the default in this course".
- **Phone layout checked** headlessly at 390 px: no horizontal overflow on the data page with a result card open or on
  the distrACTION page.

From the review's suggestions:

- **Show the numbers in the formula**: under the formula line of the one-sample, independent (Welch and pooled) and
  paired t-tests, both z-tests, ANOVA, linear regression, goodness of fit and contingency tables, a closed toggle opens
  the same formula with the actual values in it, worked through to the statistic, the df, the interval and the effect
  size (t = (3.517 minus 3.5318) / sqrt(0.3455^2 / 23 + 0.2588^2 / 17) = -0.0148 / 0.0955 = -0.155).
- **Report it as (APA style)**: one line under the same cards, t(37.98) = −0.15, p = .878, d = −0.05, 95% CI [−0.21, 0.18],
  with p and r without a leading zero and a real minus sign.
- **copy as CSV** and **copy as Markdown** under every table (CSV cells quoted when they need it; a Markdown table with
  right-aligned number columns), and download PNG under every graph. Copy text still skips the buttons.
- Not done, noted for later: a shareable state link, a "which test?" wizard, course profiles.

Service worker cache `sww-v51`, scripts `?v=54`. Verified headlessly in Chrome on the class data: `and`, `&&`, `&` keep
the same 9 rows, `or`, `|` and `=` the same 16; a bad filter gives the message and no alert; regression of GPA on
Hours_Study prints r = -0.1753 beside the negative slope; Welch t for GPA by Pet_Owner -0.155 on 37.98 df, p = 0.8776,
the worked line ending in the same t; box plot of Commute_Minutes on an axis from 0 to 80 in steps of 20; five cards
restored after a reload in their order with six plots; no console errors.

### 2026-10-14: empty table on open, distrACTION and Learn on their own pages, more events, calmer layout

- **Opens empty.** An untouched sample dataset is no longer remembered, so a student never opens the app to last week's
  class data. The user's own data is still remembered and the bar says "remembered from your last visit". A sample dataset
  counts as the user's own once it changes (an edited cell, a computed, recoded, z-score or binned column, a renamed or
  deleted column, a filter, a type set by hand), and Stack columns and Random sample of rows make a table of the user's own;
  before, all of these were lost on reload. Sorting alone does not count. An old remembered copy (or an old session file)
  under a sample's name is forgotten only when it is exactly the untouched sample; a copy the student changed is kept.
  Save session also stores the hand-set column types. The empty table shows "No data yet" with four buttons (Sample
  datasets, Open CSV or Excel file, Paste data, New data table) that run the Data menu items of the same name, and two buttons
  that open distrACTION and Learn.
- **distrACTION page.** Every distrACTION item opens a page without the data table (`#distraction`): inputs card left
  (top on narrow screens), result cards right. A calculator opens with its answer worked out from the starting values.
  Results update live as the parameters, the Compute list, x1 or x2 change, with no Run needed. Run keeps the card (it
  shows "Kept" for a moment) and the next change starts a new card; a second Run with nothing changed makes no copy. edit
  reloads a card's values into the inputs card and marks it "Editing this result". x2 shows only for between. An empty
  input gives a grey note under the inputs and an impossible one a red message, and the card fades with the label "Out of
  date: see the message under the inputs"; never an alert. Change distribution switches calculators; Clear this page has
  an Undo clear.
- **More events.** Every distribution now offers less than, at most, more than, at least, equal to, between inclusive,
  between strict and quantile (discrete calculators gained the strict and quantile choices; normal, uniform and exponential
  gained less than, more than, equal to and strict between; t, chi-square and F gained all of them). The original option
  labels are unchanged word for word. Discrete events are exact; continuous cards say that < and <= give the same area and
  P(X = a) = 0. Every card leads with the answer in large type: for an event, the event in symbols, words and percent,
  with a plot title naming the shaded event; for t*, a p-value, a critical value, a sample size or power, that number;
  for "none, just the mean and SD", the mean and SD (nothing shaded, and the plot title says so).
  A probability too small to show prints as "< 0.0001" (never a bare 0), with the calculator form (3.17E-5) in words.
  Binomial uses R's method (Loader's saddle point), so it is right for any n; above n = 100 the graph and Full table show
  where the probability is.
- **Learn page.** The nine demonstrations that need no data open on `#learn` (the sampling distribution simulator and
  Bayesian included, since both run from built-in or typed numbers); bootstrap and permutation, which need a data file,
  stay with the table. Advanced, Bayesian Inference still opens with the table.
- **Layout.** 16 px body text, 44 px tap targets, one primary button colour, the menu tab of the open page underlined,
  dropdowns placed on screen (they ran off the right edge at 1024 px and below the screen for Advanced), sticky header
  row and row numbers in the table, no sideways page scroll at 1280, 1024, 768 or 390 px. On a phone the menu bar wraps
  onto three rows, so every menu shows; the plot toolbar is hidden on touch screens.
- **Keyboard and screen readers.** Native dialogs (Escape closes, focus returns), Skip to content, menus by arrow keys, the
  data table as one Tab stop with arrow keys and Enter inside it, a third click on a column name to restore the first
  order, a navy focus ring, and an announcer that reads only the distrACTION answer line.
- **Drift fixed.** Decimal places dialog and the guide said 3 was the default; the app has always used 4. The guide said
  results are remembered between visits; they never were. The guide said only four Learn items run without data; nine do.
  The guide's first run used a three-level grouping variable, and its write-up examples quoted numbers the class data do
  not give; both now use the class data as it is. This README said "no inference about a variance"; Advanced has
  variance tests.
- **Blank boxes.** The t, z, two-proportion, McNemar and power dialogs in summary mode, and Linear Regression or Wilcoxon
  with the same column picked twice, give a message instead of a card full of NaN.
- **Found in the last full check.** Chi-square and F, p-value for a huge statistic (chi-square 100 on df 3) printed a bare
  0; the upper tail is now worked out from its own side, so it prints "< 0.0001" with 1.55E-21 in words (the words also
  say "an F variable" now). One-way Repeated Measures with no between factor: the Random-intercept view took the Subjects
  mean square as the error, so it showed subject variance 0 and ICC 0; it now matches R's lmer (cadet mile times: 188.54,
  98.42, ICC 0.657). That one was in the live version too. The negative binomial LR test against Poisson is never below 0.
  The Multiple Regression dialog says the most frequent level is the reference, as the code and the guide do. On a phone
  a long graph title wraps onto a second line inside the graph, and histogram counts sit on white labels in front of the
  mean and median lines.
- **The exact binomial test matches R.** The two-sided p adds every outcome as unlikely as the one observed, the same
  rule as R and jamovi (before, it doubled the smaller tail): 23 of 40 with p0 0.6 now gives 0.7493, not 0.8637.
  One-sided p-values and results with p0 = 0.5 (the sign test, McNemar's exact p) were already the same as R. The
  Binomial test, the sign test and Learn, What a p-value is use it; that demo counts a simulated sample as extreme by the
  same rule, so its simulated p still estimates the exact one. Checked against R's binom.test on 1,683 cases (n from 5
  to 3000, p0 from 0.1 to 0.9, all three alternatives; n 10,000 and 100,000; McNemar and the sign test), largest relative
  difference 2.4E-13.
- **Any text is safe.** A column name, a level label, a cell, a file name or a typed graph title that looks like HTML
  shows as typed and never runs: card text escapes it, every graph string is escaped once in plotDiv, and a graph title is
  measured in a separate, inert document. The October 14 build read the title in the page, so a column name such as
  `score<img src=x onerror=...>` ran when a titled graph was drawn. The live version did not do that, but it had the same
  problem in card sentences (a level label named by a t test, the small-group warning), in a quote inside a typed title
  reopened by edit, and in session files. Opening a session file now brings in its cards without scripts, handlers or
  outside addresses, and applies its filter only when it is made of column names, numbers, text in quotes and operators.
- **Group by a numeric column.** Group by in the Graph menu (Color by for the scatter plot, Split by in Descriptives, Group
  in the Exploration scatterplot) takes a numeric column with 10 or fewer values as groups, in numeric order. With more
  values (GPA has 34), or with an ID column, a message under the box asks for a categorical grouping variable and points
  to Bin into classes. Before, Boxplot drew broken boxes (one-person groups) and QQ Plot stopped with "Cannot read
  properties of null"; that was in the live version too. A box of one value now draws as a line, and QQ Plot notes a
  group with fewer than 3 values instead of plotting it.
- Results, Save session and Export include the distrACTION and Learn results. A card opened from a session file can be
  copied and removed, but has no edit button.
- **A session file is treated as untrusted.** Its filter is kept only when it is a plain formula (the same token check the
  engine runs before compiling any formula: column names, numbers, text in quotes, the listed functions and operators, and
  nothing else, so no comment, bracket, dot or line break can sneak code into `new Function`); otherwise the student is told
  and all rows stay in use. Its result cards are rebuilt from an allowed shape only: the text and table tags the app's own
  cards use, each with only the attributes they use. Anything that could run or fetch (a script or frame, a link or picture,
  an `on...`, `src`, `href` or positioning `style`, an `id` that could stand in for a page element, a custom element) is
  dropped; a plain wrapper is unwrapped so the words survive. A table remembered by an older build is read the same way, and
  a `#hash` that is not a known page (even a built-in property name) opens the data page. Column names, cells and the data
  name from a file are forced to text, so a malformed file cannot crash the table.
- **Sampling distribution simulator**, population set to a column: if the column has no numbers for a mean or median, a
  message under the Column box says so; for a sample proportion, a blank or mistyped success level gets its message under
  the Success level box. Each message shows once, under the box it is about, and no plot is drawn (it drew a NaN path
  before). The Success level box shows only when the statistic is a sample proportion.
- **A typed level is checked under its box.** Two proportions, z test made a card with z = NaN and p = NaN (and a broken
  graph) when the success level was not in the data, for example `yes` for `Yes`, or was left blank. Now every box where a
  level is typed (Two proportions, the Binomial test's Level to test, McNemar's yes level, Cochran-Armitage's success level
  and group order, Bootstrap's level for a proportion, Bayesian's success level, Logistic Regression's level to model as 1,
  Survival's event level) says under itself "Levels of X: ... Type one of them exactly", naming the right spelling when
  only the capitals differ, and Run makes no card until it matches. A blank box that needs a level is asked for once the
  student has touched the dialog, with the levels listed. Two proportions and Cochran-Armitage also give a message, not a
  NaN card, when no row (or every row) is a success. Service worker cache `sww-v50`, scripts `?v=53`.
- Verified headlessly in Chrome against R: Binomial(4, 1/6) P(X < 1) 0.4823, P(X <= 1) 0.8681, P(X = 1) 0.3858,
  P(X > 3) 0.0008, P(X >= 3) 0.0162, P(1 <= X <= 3) 0.517, P(1 < X < 3) 0.1157; Normal(64, 2.5) P(X <= 67) and
  P(X < 67) 0.8849, P(X > 67) 0.1151, 90th percentile 67.2039; Uniform(2, 8) P(X <= 5) 0.5; Poisson(3) P(X < 2) 0.1991 and
  90th percentile 5; Geometric(0.2) P(X <= 3) 0.488; Hypergeometric(50, 10, 5) P(X >= 2) 0.2581; t(20) P(X <= 2.086) 0.975;
  chi-square(3) P(X >= 7.815) and F(2, 30) P(X > 3.316) 0.05. Academy fitness Descriptives unchanged (mile week 1 mean
  578.4167, SD 53.6724; push-ups week 1 mean 35.1, SD 8.3152).
- Not changed: the desktop app (download page, version 1.3.0, October 1, 2026) is a separate build and does not have
  these changes yet; the download page and the guide say so.
