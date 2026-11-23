# Makes the four small causal sample datasets with real variable names, deterministically (numpy seed 2026).
# Run from stats/: python3 tests/checks/causal_data.py   (writes data/causal_*.csv)
import numpy as np, csv, os
# one random stream per dataset, so a change to one example never moves the others
seed = lambda name, default: np.random.default_rng(int(os.environ.get(name, default)))
rng_bikes, rng_tut, rng_rd, rng_bus = seed("SEED_BIKES", 2026), seed("SEED_TUT", 2035), seed("SEED_RD", 2026), seed("SEED_BUS", 2026)
out = os.path.join(os.path.dirname(__file__), "..", "..", "data")
def write(name, header, rows):
    with open(os.path.join(out, name), "w", newline="") as f:
        w = csv.writer(f); w.writerow(header); w.writerows(rows)

# 1. Bike lanes: busy streets get lanes more often and have more crashes; within a street type a lane lowers crashes.
rows = []
for i in range(40):
    busy = i < 26
    lane = rng_bikes.random() < (0.75 if busy else 0.25)
    base = 9.0 if busy else 3.0
    crashes = max(0, round(base - (2.5 if lane else 0) + rng_bikes.normal(0, 1.2), 1))
    rows.append([f"S{i+1:03d}", "busy" if busy else "quiet", "yes" if lane else "no", crashes])
write("causal_bike_lanes.csv", ["street_id", "street_type", "bike_lane", "crashes_per_year"], rows)

# 2. Tutoring: a lottery offers tutoring (instrument); family income and prior GPA raise both uptake and scores;
# tutoring itself adds 6 points. passed is a yes/no outcome for the bounds tool.
rows = []
for i in range(120):
    income = round(float(np.clip(rng_tut.normal(62, 22), 15, 160)), 1)      # thousands of dollars
    gpa = round(float(np.clip(rng_tut.normal(2.9, 0.5), 1.2, 4.0)), 2)
    offer = rng_tut.random() < 0.5
    p_tut = 1 / (1 + np.exp(-(-3.2 + 0.02 * income + 0.6 * gpa + (2.6 if offer else 0))))
    tut = rng_tut.random() < p_tut
    score = 40 + 0.15 * income + 8 * gpa + (6 if tut else 0) + rng_tut.normal(0, 6)
    score = round(float(np.clip(score, 30, 100)), 1)
    rows.append([f"T{i+1:03d}", "yes" if offer else "no", "yes" if tut else "no", income, gpa, score, "yes" if score >= 70 else "no"])
write("causal_tutoring.csv", ["student_id", "lottery_offer", "tutoring", "family_income", "prior_gpa", "test_score", "passed"], rows)

# 3. Scholarship at a GPA cutoff of 3.0 (sharp): credits completed rise smoothly with GPA and jump 6 at the cutoff.
rows = []
for i in range(200):
    gpa = round(float(np.clip(rng_rd.normal(3.0, 0.45), 1.8, 4.0)), 2)
    sch = gpa >= 3.0
    credits = 18 + 6 * (gpa - 3.0) + (6 if sch else 0) + rng_rd.normal(0, 3)
    rows.append([f"R{i+1:03d}", gpa, "yes" if sch else "no", round(float(credits), 1)])
write("causal_scholarship_rd.csv", ["student_id", "hs_gpa", "scholarship", "credits_completed"], rows)

# 4. Bus routes before and after a new schedule on half the routes: parallel trends, a gain of 80 riders a day.
rows = []
for i in range(20):
    new = i < 10
    level = rng_bus.normal(900 if new else 820, 60)
    before = level + rng_bus.normal(0, 20); after = level + 40 + (80 if new else 0) + rng_bus.normal(0, 20)
    rows.append([f"B{i+1:02d}", "new schedule" if new else "old schedule", "before", round(float(before))])
    rows.append([f"B{i+1:02d}", "new schedule" if new else "old schedule", "after", round(float(after))])
write("causal_bus_routes.csv", ["route_id", "route_group", "period", "riders_per_day"], rows)
print("written")
