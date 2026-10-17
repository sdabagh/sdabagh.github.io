# Real-world datasets added 2026-09-13

## sleepstudy.csv (180 rows, added 2026-10-17)
Belenky et al. (2003), the sleep-deprivation study shipped with the R package lme4 (Bates, Mächler, Bolker, Walker 2015).
18 subjects restricted to 3 hours of sleep a night; average reaction time (ms) on a psychomotor vigilance task each day for 10 days.
- subject (S308 to S372), day (0 to 9), reaction_ms
The running example of Advanced, Mixed-Effects Model. lme4 and lmerTest give, for reaction_ms ~ day + (1 | subject), REML:
intercept 251.405 (SE 9.747, df 22.81), day 10.467 (SE 0.804, t 13.02, df 161.0), subject variance 1378.2, residual 960.5,
REML criterion 1786.5; with a random slope (day | subject): SEs 6.825 and 1.546, df 17.0, variances 612.10 and 35.07,
correlation 0.066, residual 654.94, REML 1743.6. The app reproduces every one of these.

All public, all cleaned to plain text labels, blank = missing. Sources are cited so students can trace them.

## yrbs2023_teens_1500.csv (and _full.csv, 13,478 rows)
CDC Youth Risk Behavior Survey 2023, national high school sample (cdc.gov/yrbs). One row = one student.
A random 1,500 of the 13,478 students with complete answers on the core items. Weights removed, so treat as a sample, not national estimates.
- age_years, sex, grade, bmi
- marijuana_ever (Yes/No), marijuana_current (past 30 days), early_use_before_13, marijuana_first_use_age, marijuana_ever_times, marijuana_past30_days
- current_vape (days in past 30), current_alcohol_days
- sad_hopeless_12mo (Yes/No), considered_suicide, poor_mental_health_past30 (Never to Always)
- sleep_hours (school night), grade_letter (mostly A to F), bullied_at_school, concussions_12mo, social_media_use, sports_teams
Class questions: is marijuana use associated with grades, sleep, or feeling sad or hopeless? (two-way tables, chi-square, two proportions, two means on sleep). Observational: no causal claims.

## gss2018_beliefs_politics.csv (2,348 adults, 50 columns)
NORC General Social Survey 2018, via the gssr R package (gss.norc.org). Last year the astrology items were asked.
- read_horoscope (yes/no), astrology_is_scientific (very / sort of / not at all)
- science_score (0 to 9 correct on the GSS science quiz: earthsun, radioact, lasers, electron, viruses, condrift, hotcore, bigbang, evolved), science_answered
- party, political_views (extremely liberal to extremely conservative), pres16, gunlaw, cappun, cannabis_legal
- happy, health, life, trust, fear, satfin, mental_health_bad_days (past 30), tv_hours, socbar
- age, sex, race, degree, educ (years), region, marital, childs, wrkstat, hrs1, income_2000dollars, class, relig, attend, god, postlife, bible
Note: the astrology and science items were asked of a random subset, so about half the rows are blank there; that is by design, not an error.
Class questions: does belief in astrology relate to science knowledge, education, or political views? Does cannabis-legalization opinion differ by party? Mental health days by age or work status.

## gss2022_politics_wellbeing.csv (3,544 adults)
GSS 2022, same source. Politics (party, political_views, pres20, gunlaw, cappun, cannabis_legal) and wellbeing (happy, health, life, trust, satfin, mental_health_bad_days) with demographics. No astrology in 2022.

## big5_personality_1200.csv (1,200 respondents)
Open-Source Psychometrics Project, IPIP Big Five Factor Markers (openpsychometrics.org/_rawdata, c. 2012, 19,719 respondents; random 1,200 with complete answers, age 13 to 90).
- age, gender, country (ISO), english_native, handedness
- extraversion, neuroticism, agreeableness, conscientiousness, openness: mean of 10 items each, 1 to 5, reverse-keyed items flipped
Class questions: do traits differ by gender (two means, Welch); is neuroticism related to age (regression); trait distributions and normality (histogram, Q-Q).

## Cannabis and the developing brain: what is and is not here
The brain-imaging studies (the ABCD Study, 11,875 children, abcdstudy.org) are not openly downloadable; access needs a signed data use agreement with NIH. The YRBS file above covers the behavioral side (use, age of first use, sleep, grades, mood) in real teenagers. For the brain findings, cite the papers: Paul et al. 2021 JAMA Psychiatry (655 of 11,489 children prenatally exposed; associations with psychopathology and gray matter) and the ABCD cortical-thickness work; summary numbers from those papers can be used as given values in class problems.

## cadet_mile_times.csv (36 cadets, simulated, added 2026-09-14)
Teaching dataset for repeated measures: mile time in seconds at weeks 1, 4, 8, 12 for a Control and a Training group. Generated with a cadet-level random effect (ICC about 0.76) and a group-by-time interaction, so it shows sphericity failing, the Greenhouse-Geisser correction, and why pairing pays. Not real academy data.

## mauna_loa_co2_monthly.csv (monthly, January 2000 onward, added 2026-09-14)
NOAA Global Monitoring Laboratory, Mauna Loa monthly mean CO2 in parts per million (gml.noaa.gov/ccgg/trends). Columns: year, month, date (YYYY-MM), co2_ppm. Real data, public domain; cite NOAA GML. Teaching use: time plot, moving average, seasonal decomposition (period 12), autocorrelation, trend.

## big5_items_500.csv (500 respondents, 50 items, added 2026-09-14)
Same Open-Source Psychometrics source as big5_personality_1200, but the raw item responses (1 to 5) for the 50 IPIP items: E1 to E10 extraversion, N1 to N10 neuroticism, A1 to A10 agreeableness, C1 to C10 conscientiousness, O1 to O10 openness. Reverse-keyed items (E2, E4, E6, E8, E10, N2, N4, A1, A3, A5, A7, C2, C4, C6, C8, O2, O4, O6) are NOT flipped, so reliability and factor analysis show negative loadings where expected. Item wording in the codebook at openpsychometrics.org. Teaching use: Cronbach's alpha per scale, PCA and factor analysis recovering the five factors, k-means on trait scores.

## lung_cancer_survival.csv (227 patients, added 2026-09-14)
North Central Cancer Treatment Group lung cancer study (Loprinzi et al. 1994), distributed with R's survival package. Columns: patient, time_days (follow-up), died (Yes = death observed, No = censored), age, sex, ecog (performance score 0 good to 3 bad), weight_loss_lb (blank where unknown). Teaching use: Kaplan-Meier curves by sex, log-rank test, Cox regression on age, sex and ecog.

## darfur.csv (1,276 rows), added 2026-10-15
Survey of Darfurian refugees: Hazlett, C. (2020). Angry or weary? How violence impacts attitudes toward peace among
Darfurian refugees. Journal of Conflict Resolution, 64(5), 844 to 870. The copy distributed with the sensemakr package
(Cinelli and Hazlett 2020, GPL-3), unchanged. One row = one respondent.
- directlyharmed (1 = physically injured during the attacks), peacefactor (0 to 1, support for peace), wouldvote,
  peace_formerenemies, peace_jjindiv, peace_jjtribes, gos_soldier_execute
- age, farmer_dar, herder_dar, pastvoted, hhsize_darfur, female, village (486 villages)
The running example of Regression, Sensitivity to a lurking variable: peacefactor on directlyharmed, adjusting for age,
farmer_dar, herder_dar, pastvoted, hhsize_darfur, female and village, benchmarked against female. The app reproduces the
paper's Table 2: estimate 0.0973 (SE 0.0233, t 4.18 on 783 df), partial R2 2.2%, RV 13.9%, RV at alpha 0.05 7.6%, a
confounder as strong as female 0.0752 (SE 0.0219, t 3.44).
