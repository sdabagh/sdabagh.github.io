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
  datasets, Open CSV file, Paste data, New data table) that run the Data menu items of the same name, and two buttons
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
