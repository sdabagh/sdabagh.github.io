# Tests for Stats Without Walls

Two kinds, both plain scripts that print `PASS`/`FAIL` lines and end with `ALL PASSED` or `n FAILED`.

- `checks/`: engine checks in Node, no browser. Each loads `stats/stats.js` and compares a method with R's published output on
  the same data (`lmm_check.js`: lme4 and lmerTest on sleepstudy; `glmm_check.js`: glmer on cbpp; `glm_check.js`: glm with an
  offset on MASS::ships) or with hand calculations and algebraic identities (`logit_check.js`, `svy_check.js`, `anova_check.js`,
  `xtx_check.js`).
- `browser/`: Playwright suites that drive the app in Chromium against a local static server: open a sample, fill a dialog,
  run, read the card, compare with the expected numbers; also Ask, the Script view, the guides' menu paths, the accessibility
  panel, small multiples, the update bar.

Run everything with `cd stats/tests && npm install && npx playwright install --with-deps chromium && bash run.sh`
(`--checks` or `--browser` for one kind; `--port` to change the server port). The GitHub Actions workflow
`.github/workflows/stats-tests.yml` runs the same on every pull request that touches `stats/`.

Every browser suite's `menu()` helper opens the dialog's folded "more options" sections first, because Playwright will not
select inside a closed `<details>`.
