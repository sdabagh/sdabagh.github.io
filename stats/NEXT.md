# Stats Without Walls: notes for Tuesday

Written at the end of the session of October 18 to 19, 2026. Everything built in that session is merged and live.

## Done on October 29: nursing-flavored examples and Ask routes (every field got one example per main dialog;
## Ask understands rate, readmission, intervention and risk phrasing). Left for later: the same inside the card wording.

## Idea to take up
- **Nursing-flavored examples and Ask routes.** The field setting already reorders the sample datasets and the six
  start-screen analyses (health and nursing: contingency table, logistic regression, survival analysis, paired t-test,
  McNemar, power and sample size) and adds one note about relative risk and the odds ratio. What it does not yet do is
  change the wording inside the dialogs or the Ask vocabulary. Next step: nursing phrasing in the dialog hints and
  examples, and Ask routes such as "did the infection rate drop" (two proportions), "time until readmission"
  (survival), "before and after the intervention" (paired t), "risk of the outcome" (relative risk on the
  contingency-table card). The same pattern then applies to the other fields.

## Done on October 29: the walkthrough sheet (`helping.html`, linked as Helping others). Still to do together: the hands-on hour itself.

## First thing Tuesday: a walkthrough for Safaa
- Safaa needs to know the app well enough to help others with it. Plan: a hands-on tour, one hour, in this order:
  the start screen and the student/researcher switch and the field; the Data menu with one messy file; Which test?
  and Ask; a t-test, an ANOVA and a regression on the class data, reading the card top to bottom (table, formula,
  worked numbers, APA line, conclusion); check my work; copy for Word and the R script; the Learn pages; the
  course profile and the share link. Then a two-page "helping someone with Stats Without Walls" sheet: the ten
  questions students ask most and where in the app each answer is.

## Decided on October 29
- The installable app is **coming soon**, not offered: `download.html` says so, the site link reads "App: coming soon", and the
  desktop installers are unlinked (release v1.3.0 stays on GitHub). Safaa wants the app fully working first; pricing (free, or free
  for students and a fee for researchers) is a later decision.

## Asked for on October 29 (Safaa)
- **Graphs for all inferential work.** Every inferential card (t tests, z tests, proportions, chi-square, ANOVA,
  regression, nonparametric, variance tests) should carry its related graph: the sampling distribution with the
  statistic and the shaded p-value or the interval drawn on it, plus the data graph that fits (box plots by group,
  histogram of differences, bar chart of observed against expected). Some cards already have one (tPlot, zPlot,
  box plots); the rest need theirs. Next batch.
- **Simulation when the conditions are not met.** Later: when a card's condition check fails (n small and skewed,
  counts under 10, an expected count under 5), the pink box offers the simulation route on the spot: a bootstrap
  interval for the estimate and a permutation test for the p-value, built from the same data and choices, with a
  sentence comparing the two answers. Bootstrap and Permutation already exist under Learn and Advanced; this wires
  them into the test cards as the fallback.

## Already lined up
- Ask answering in Spanish: done on October 29 (`lang-es-ask.js`, every route and glossary entry).
- The pricing decision for the store listings: see `LAUNCH.md`, section "Pricing".
- Store submissions themselves (Play via PWABuilder, iOS via PWABuilder or Capacitor): `LAUNCH.md`.

## Blocked here
- R in the browser (WebR): the cloud environment's network policy refuses the WebR and CRAN hosts.
