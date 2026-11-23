# Stats Without Walls, Causal menu: the same reference numbers in R.
# Run from the stats folder:   Rscript tests/checks/causal_reference.R
# Base R does everything but the diagram checks; dagitty is used when installed (install.packages("dagitty")).
# Prints each quantity next to the stored reference (tests/checks/data/causal_reference.json, written by the
# Python script) and PASS or FAIL per block. The app's engine was checked against that JSON by causal_check.js.
options(digits = 10, warn = 1)
here <- function(p) file.path("tests", "checks", p)
dat <- function(f) read.csv(file.path("data", f), stringsAsFactors = FALSE)
ref <- NULL
if (requireNamespace("jsonlite", quietly = TRUE)) ref <- jsonlite::fromJSON(here(file.path("data", "causal_reference.json")), simplifyVector = TRUE)
fails <- 0
near <- function(a, b, tol = 1e-6) all(abs(as.numeric(a) - as.numeric(b)) <= tol)
show <- function(name, got, want = NULL, tol = 1e-6) {
  if (is.null(want)) { cat(sprintf("     %-46s %s\n", name, paste(signif(got, 8), collapse = ", "))); return(invisible()) }
  okk <- near(got, want, tol); if (!okk) fails <<- fails + 1
  cat(sprintf("%s %-46s R: %s | reference: %s\n", if (okk) "PASS" else "FAIL", name, paste(signif(got, 8), collapse = ", "), paste(signif(as.numeric(want), 8), collapse = ", ")))
}
cat("Stats Without Walls, Causal menu: R checks\n")
if (is.null(ref)) cat("(jsonlite not installed: numbers are printed without the reference comparison)\n")

# ---- standardization: bike lanes by street type
b <- dat("causal_bike_lanes.csv"); t <- b$bike_lane == "yes"; y <- b$crashes_per_year; s <- b$street_type
crude <- mean(y[t]) - mean(y[!t]); w <- prop.table(table(s)); m1 <- tapply(y[t], s[t], mean); m0 <- tapply(y[!t], s[!t], mean)
std <- sum(w * m1[names(w)]) - sum(w * m0[names(w)])
cat("\n== Standardization (bike lanes)\n"); show("crude difference", crude, ref$standardize$crude); show("standardized difference", std, ref$standardize$std)

# ---- propensity scores, IPW, matching: tutoring
d <- dat("causal_tutoring.csv"); d$t <- as.numeric(d$tutoring == "yes"); d$z <- as.numeric(d$lottery_offer == "yes"); d$pass <- as.numeric(d$passed == "yes")
ps <- glm(t ~ family_income + prior_gpa, data = d, family = binomial); e <- fitted(ps); tr <- d$t == 1
wgt <- ifelse(tr, 1 / e, 1 / (1 - e))
ate <- weighted.mean(d$test_score[tr], wgt[tr]) - weighted.mean(d$test_score[!tr], wgt[!tr])
att <- mean(d$test_score[tr]) - weighted.mean(d$test_score[!tr], (e / (1 - e))[!tr])
smd <- function(x, wa = NULL, wb = NULL) { sdp <- sqrt((var(x[tr]) + var(x[!tr])) / 2); ma <- if (is.null(wa)) mean(x[tr]) else weighted.mean(x[tr], wa); mb <- if (is.null(wb)) mean(x[!tr]) else weighted.mean(x[!tr], wb); (ma - mb) / sdp }
cat("\n== Propensity model, glm(tutoring ~ family_income + prior_gpa, binomial)\n")
show("coefficients", coef(ps), ref$ipw$coef); show("standard errors", sqrt(diag(vcov(ps))), ref$ipw$se); show("first five scores", e[1:5], ref$ipw$ps_first5)
cat("== Inverse probability weighting\n")
show("crude difference", mean(d$test_score[tr]) - mean(d$test_score[!tr]), ref$ipw$crude); show("ATE (Hajek)", ate, ref$ipw$ate); show("ATT", att, ref$ipw$att)
show("SMD before (income, gpa)", c(smd(d$family_income), smd(d$prior_gpa)), ref$ipw$smd_before); show("SMD after weighting", c(smd(d$family_income, wgt[tr], wgt[!tr]), smd(d$prior_gpa, wgt[tr], wgt[!tr])), ref$ipw$smd_after)
cat("== Matching, 1 to 1 nearest neighbour on the score, with replacement\n")
i1 <- which(tr); i0 <- which(!tr); j <- sapply(i1, function(i) i0[which.min(abs(e[i0] - e[i]))]); diffs <- d$test_score[i1] - d$test_score[j]
show("ATT (matched)", mean(diffs), ref$match$att); show("paired SE", sd(diffs) / sqrt(length(diffs)), ref$match$se); show("distinct controls used", length(unique(j)), ref$match$controlsUsed)
if (requireNamespace("MatchIt", quietly = TRUE)) { m <- MatchIt::matchit(t ~ family_income + prior_gpa, data = d, method = "nearest", distance = "glm", replace = TRUE); md <- MatchIt::match.data(m); cat(sprintf("     MatchIt (same design): ATT from lm with weights = %.4f\n", coef(lm(test_score ~ t, data = md, weights = weights))[2])) }

# ---- instrumental variables
cat("\n== Instrumental variables\n")
z1 <- d$z == 1; wald <- (mean(d$test_score[z1]) - mean(d$test_score[!z1])) / (mean(d$t[z1]) - mean(d$t[!z1]))
show("Wald ratio", wald, ref$iv$wald$ratio)
tsls <- function(f2, f1) { fs <- lm(f1, data = d); d$that <- fitted(fs); X <- model.matrix(update(f2, . ~ . - t + that), d); Xa <- model.matrix(f2, d); bhat <- solve(crossprod(X), crossprod(X, d$test_score)); u <- d$test_score - Xa %*% bhat; s2 <- sum(u^2) / (nrow(X) - ncol(X)); list(b = as.numeric(bhat), se = sqrt(diag(s2 * solve(crossprod(X)))), F = summary(fs)$coefficients["z", "t value"]^2) }
r0 <- tsls(test_score ~ t, t ~ z); r2 <- tsls(test_score ~ t + family_income + prior_gpa, t ~ z + family_income + prior_gpa)
show("2SLS, no covariates: coefficients", r0$b, ref$iv$tsls0$b); show("2SLS, no covariates: SE", r0$se, ref$iv$tsls0$se); show("first-stage F, no covariates", r0$F, ref$iv$tsls0$firstF)
show("2SLS with covariates: coefficients", r2$b, ref$iv$tsls2$b); show("2SLS with covariates: SE", r2$se, ref$iv$tsls2$se); show("first-stage F with covariates", r2$F, ref$iv$tsls2$firstF)
if (requireNamespace("AER", quietly = TRUE)) { iv <- AER::ivreg(test_score ~ t + family_income + prior_gpa | z + family_income + prior_gpa, data = d); show("AER::ivreg coefficients", coef(iv), ref$iv$tsls2$b); show("AER::ivreg SE", sqrt(diag(vcov(iv))), ref$iv$tsls2$se) }

# ---- difference in differences
cat("\n== Difference in differences (bus routes)\n")
bus <- dat("causal_bus_routes.csv"); bus$g <- as.numeric(bus$route_group == "new schedule"); bus$p <- as.numeric(bus$period == "after")
f <- lm(riders_per_day ~ g * p, data = bus); co <- summary(f)$coefficients["g:p", ]
show("DiD estimate (g:p)", co["Estimate"], ref$did$coef); show("SE", co["Std. Error"], ref$did$se); show("t", co["t value"], ref$did$t); show("p", co["Pr(>|t|)"], ref$did$p)

# ---- sharp regression discontinuity
cat("\n== Regression discontinuity (scholarship at GPA 3.0)\n")
rd <- dat("causal_scholarship_rd.csv"); rd$dist <- rd$hs_gpa - 3
R <- subset(rd, dist >= 0 & dist <= 0.5); L <- subset(rd, dist < 0 & dist >= -0.5); fR <- lm(credits_completed ~ dist, R); fL <- lm(credits_completed ~ dist, L)
show("jump, bandwidth 0.5", coef(fR)[1] - coef(fL)[1], ref$rdd$jump); show("SE", sqrt(summary(fR)$coefficients[1, 2]^2 + summary(fL)$coefficients[1, 2]^2), ref$rdd$se); show("rows (treated, untreated)", c(nrow(R), nrow(L)), c(ref$rdd$nT, ref$rdd$nC))
R2 <- subset(rd, dist >= 0); L2 <- subset(rd, dist < 0); fR2 <- lm(credits_completed ~ dist, R2); fL2 <- lm(credits_completed ~ dist, L2)
show("jump, whole range", coef(fR2)[1] - coef(fL2)[1], ref$rdd_all$jump)

# ---- Manski bounds
cat("\n== Manski bounds (passed by tutoring)\n")
p1 <- mean(d$t); m1 <- mean(d$pass[tr]); m0 <- mean(d$pass[!tr])
show("effect bounds", c(p1 * m1 - ((1 - p1) * m0 + p1), p1 * m1 + (1 - p1) - (1 - p1) * m0), ref$manski$ate)

# ---- DAGs with dagitty
cat("\n== Causal diagrams\n")
if (requireNamespace("dagitty", quietly = TRUE)) {
  q <- function(s) if (grepl("^[A-Za-z_][A-Za-z0-9_]*$", s)) s else paste0('"', s, '"')
  dagOf <- function(lines, latent = character(0)) { arrows <- unlist(lapply(lines, function(l) { p <- trimws(strsplit(l, "->")[[1]]); paste(q(p[-length(p)]), "->", q(p[-1])) })); dagitty::dagitty(paste("dag {", paste(c(paste(q(latent), "[latent]"), arrows), collapse = "; "), "}")) }
  nq <- 0
  for (nm in names(ref$dag)) { g <- ref$dag[[nm]]; G <- dagOf(g$lines); ds <- g$dsep
    if (!is.null(ds)) for (k in seq_len(nrow(ds))) { z <- unlist(ds$z[k]); got <- dagitty::dseparated(G, ds$x[k], ds$y[k], if (length(z)) z else c()); nq <- nq + 1; show(sprintf("%s: %s and %s given {%s}", nm, ds$x[k], ds$y[k], paste(z, collapse = ", ")), as.numeric(got), as.numeric(ds$separated[k]), 0) }
    bd <- g$backdoor
    if (!is.null(bd)) for (k in seq_len(nrow(bd))) { un <- unlist(bd$unobserved[k]); G2 <- dagOf(g$lines, un); sets <- dagitty::adjustmentSets(G2, exposure = bd$t[k], outcome = bd$y[k], type = "minimal")
      got <- sort(sapply(sets, function(s) paste(sort(as.character(s)), collapse = "+"))); want <- sort(sapply(bd$minimal[[k]], function(s) paste(sort(unlist(s)), collapse = "+")))
      okk <- identical(as.character(got), as.character(want)); if (!okk) fails <- fails + 1
      cat(sprintf("%s %-46s dagitty minimal sets: {%s} | reference: {%s}\n", if (okk) "PASS" else "FAIL", sprintf("%s: adjust %s -> %s, unobserved {%s}", nm, bd$t[k], bd$y[k], paste(un, collapse = ", ")), paste(got, collapse = "}, {"), paste(want, collapse = "}, {"))) }
  }
  cat(sprintf("     %d d-separation queries checked against dagitty\n", nq))
} else cat("     dagitty not installed: install.packages(\"dagitty\") to check the diagrams; the Python reference used networkx.\n")

cat(sprintf("\n%s\n", if (fails) paste(fails, "FAILED") else "ALL PASSED"))
