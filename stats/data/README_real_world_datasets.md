# Real-world datasets added 2026-09-13

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
