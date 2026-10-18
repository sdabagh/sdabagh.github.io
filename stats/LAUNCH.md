# Stats Without Walls: app-store launch checklist

The app is a static PWA at https://learnwithoutwalls.com/stats/ (GitHub Pages, custom domain). Both stores take a
wrapped PWA; nothing in the app changes for the stores. This file lists what is already in place, what to do, and the
decisions that are yours.

## In the repo already

- `manifest.json`: name, short name, id, description, categories, standalone display, theme and background colors,
  192 and 512 icons (the 512 also declared maskable: the bars sit inside the safe zone), three screenshots, orientation.
- `sw.js`: offline after the first visit (precaches every app file, the vendor libraries and the sample datasets).
- `privacy.html`: the privacy policy both stores ask for. Use the URL https://learnwithoutwalls.com/stats/privacy.html.
- `store/`: `phone-1.png`, `phone-2.png` (1080 × 1920), `desktop-1.png` (1280 × 800), `feature-graphic.png` (1024 × 500,
  Play's banner). Retake them after a visual change: `stats/tests/...` has no screenshot job; the Playwright snippet that
  made them is in the changelog's session, or ask for a rerun.
- iOS home-screen metas and safe-area padding for notched phones.
- An error bar: a script fault shows with the build number instead of a blank page (store reviewers click everything).
- Tests: `stats/tests/run.sh` runs the engine checks and 36 browser suites; `launch.js` checks the store items above.

## Google Play (Android): Trusted Web Activity

1. Open https://www.pwabuilder.com, enter https://learnwithoutwalls.com/stats/index.html, and build the **Android**
   package. Package id suggestion: `com.learnwithoutwalls.stats`. Keep "signing key: create new" the first time and
   **download and keep the key**; a lost key means a new listing later.
2. PWABuilder gives an `assetlinks.json`. Commit it to this repository at `.well-known/assetlinks.json` (repository
   root, so it serves at https://learnwithoutwalls.com/.well-known/assetlinks.json). Without it the app opens with a
   browser bar. GitHub Pages serves the folder as is.
3. Play Console: a developer account ($25 once). Create the app, upload the `.aab`, fill the listing from `store/`
   (icon 512, feature graphic, the two phone screenshots and the desktop one as a tablet screenshot), privacy policy URL
   above, content rating questionnaire (education, no user content, no ads), **Data safety: "No data collected, no
   data shared"** (true: see privacy.html), target audience (if you say it is for under-13s, Play's Families policy
   applies; "13 and over" or "everyone, not designed for children" avoids that).
4. Internal testing track first (any Google account you list), then production. Review takes hours to a few days.

## Apple App Store (iOS): a thin native shell

Apple does not take a bare PWA. Two ways, both keep the web app as is:

- **PWABuilder iOS package** (simplest): same site as above, build the **iOS** package, open it in Xcode on a Mac,
  set your team, archive, upload with Xcode or Transporter.
- **Capacitor** (more control, more upkeep): `npm init @capacitor/app`, point `server.url` at the site or copy the
  `stats/` folder into the app, add the iOS platform, open in Xcode.

Then: Apple Developer Program ($99 a year). App Store Connect: listing, screenshots (take 6.7-inch and 6.5-inch phone
sizes from the same Playwright flow, 1290 × 2796 and 1284 × 2778; iPad 2048 × 2732 if you list iPad), privacy policy
URL, **App Privacy: "Data not collected"**, age rating. Guideline 4.2 (minimum functionality) is the one wrapped web
apps fail; this app runs offline, has no sign-in and does real work, which is what reviewers look for. Guideline 5.1.1:
no account is asked for, good.

## Pricing: free for students, a fee for researchers

The honest constraint: the app is a static site with no server and no accounts, so nothing in the web version can tell
a student from a researcher, and the web version stays free and complete. Three shapes that work with that:

1. **Everything free, both stores, no in-app purchase.** No backend, no store fees, no support load. Add a "support
   this project" link on the download page if you want contributions. Simplest, and consistent with the site.
2. **A paid listing for researchers.** Publish the same app twice: "Stats Without Walls" free and "Stats Without Walls
   for Researchers" at a one-time price (a second package id and a second listing). The paid one can open in researcher
   mode and carry the Advanced menu unlocked by a build flag. Payment is handled by the store (15–30% cut); no backend.
   Weakness: the free web version has the same features, so the fee is really for the native package and to support
   the work. Say so in the listing.
3. **One listing with an in-app purchase that unlocks the Advanced menu.** Needs the store billing library inside the
   wrapper (Play Billing / StoreKit), a local "unlocked" flag the web app reads, and a restore-purchases button. More
   engineering and the web version still has everything free. Not worth it unless the native app differs from the web.

If you want the fee to mean something, the thing researchers pay for has to exist only in the paid package: for
example the desktop app with R script export to file, or priority support. Decide that first; the store mechanics
follow from it.

## Before you press submit

- `bash stats/tests/run.sh` green.
- Open the live site in Chrome's DevTools, Application tab: manifest shows no warnings, service worker active, the
  install prompt appears.
- Lighthouse PWA audit on the live URL passes "installable".
- Bump `CACHE` in `sw.js` and the `?v=` on the script tags for any change (the update bar then tells users).
