/**
 * List of .ai domains available for claim
 * Ported from startupai
 */

const domainListRaw = `
4eyes.ai, accent.ai, accounting.ai, administrative.ai, aicampus.ai, aiconference.ai, alamode.ai, albums.ai, algorithm.ai, 
ancestry.ai, annuity.ai, anta.ai, antiviral.ai, anymind.ai, appscale.ai, audiobook.ai, audioeffects.ai, audiofx.ai, auto.ai,
autoarticle.ai, autoeye.ai, autolabel.ai, autopilot.ai, aww.ai, babymood.ai, bandcamp.ai, baseball.ai, betauser.ai, biometrics.ai,
bioscan.ai, browser.ai, calorie.ai, calories.ai, camera.ai, cams.ai, cardi.ai, carpool.ai, catfish.ai,
catfished.ai, celebrity.ai, cinematic.ai, coinanalytics.ai, coinmarket.ai, combinator.ai, comical.ai,
connect2.ai, credit.ai, cryptotrader.ai, cybercrime.ai, daobot.ai, datapool.ai, dating.ai,
datingapp.ai, datingsite.ai, daytrader.ai, deliver.ai, deliveries.ai, delivering.ai, delivery.ai, democratizing.ai, demos.ai,
developer.ai, dogs.ai, doppel.ai, doppelganger.ai, draft.ai, driving.ai, drop.ai, dubbing.ai, empathizer.ai, engine.ai,
engrams.ai, fashion.ai, federated.ai, financial.ai, firstpage.ai, fishbyte.ai, flightdata.ai, football.ai, footware.ai,
fourcorners.ai, foureyes.ai, freejarvis.ai, frontendx.ai, fullstory.ai, gastroenterology.ai, gethired.ai,
giftcard.ai, girlboss.ai, goodbooks.ai, gotchu.ai, gps.ai, greatjobs.ai, greenback.ai, greenscreen.ai, grocery.ai,
guardia.ai, guitar.ai, haystack.ai, healthy.ai, humanchat.ai, imager.ai, interpreting.ai, investment.ai,
investor.ai, ionz.ai, jervis.ai, jobwatch.ai, jpegs.ai, kiosk.ai, knocknock.ai, landbank.ai,
laundromat.ai, leaderboards.ai, legal.ai, linkbuilder.ai, livemap.ai, local.ai, localsearch.ai, lock.ai, log.ai, login.ai,
makeup.ai, media.ai, medicare.ai, metabuilder.ai, military.ai, mobileapp.ai, moneytransfer.ai, mortgage.ai, mturk.ai,
mugs.ai, mugshot.ai, mugshots.ai, musica.ai, mycollege.ai, nag.ai, neurologist.ai, noisely.ai,
onboard.ai, onboarding.ai, onlinepoker.ai, outfit.ai, paints.ai, parkvision.ai, perceptual.ai, pgn.ai, piano.ai, pixa.ai,
pixomate.ai, pocketagent.ai, pokerbot.ai, postclick.ai, postr.ai, privatejet.ai, promptbook.ai,
promptdesigner.ai, recognize.ai, resource.ai, responder.ai, resturant.ai, rocket.ai, screenshot.ai, sdk.ai,
sequencing.ai, setup.ai, shippers.ai, smartbuilding.ai, smartlist.ai, sms.ai, soc.ai, social.ai,
softwarehouse.ai, songbook.ai, spinup.ai, stocks.ai, surveillance.ai, symantec.ai, talentmarket.ai,
talento.ai, teacher.ai, texttoaudio.ai, thecollective.ai, therapeutic.ai, tiktokanalytics.ai, toolbar.ai, topjobs.ai,
translator.ai, vacationrental.ai, vacationrentals.ai, venturecapital.ai, verification.ai, videodownloader.ai,
visual.ai, vizy.ai, voiceapp.ai, voicechanger.ai, voicesearch.ai, weightloss.ai, wine.ai,
wpm.ai, wysiwyg.ai, yieldfarming.ai, yoga.ai
`;

/**
 * Parsed array of domain names (without .ai suffix for matching)
 */
export const domains: string[] = domainListRaw
  .split(",")
  .map((d) => d.trim())
  .filter((d) => d.length > 0)
  .map((d) => d.replace(".ai", ""));

/**
 * Full domain names with .ai suffix
 */
export const fullDomains: string[] = domains.map((d) => `${d}.ai`);

/**
 * Domain categories for better matching
 */
export const domainCategories: Record<string, string[]> = {
  finance: [
    "accounting",
    "annuity",
    "credit",
    "cryptotrader",
    "daytrader",
    "financial",
    "greenback",
    "investment",
    "investor",
    "moneytransfer",
    "mortgage",
    "stocks",
    "venturecapital",
    "yieldfarming",
  ],
  health: [
    "calorie",
    "calories",
    "gastroenterology",
    "healthy",
    "medicare",
    "neurologist",
    "therapeutic",
    "weightloss",
    "yoga",
  ],
  social: [
    "dating",
    "datingapp",
    "datingsite",
    "social",
    "connect2",
    "humanchat",
  ],
  media: [
    "albums",
    "audiobook",
    "audioeffects",
    "audiofx",
    "bandcamp",
    "camera",
    "cams",
    "cinematic",
    "dubbing",
    "greenscreen",
    "musica",
    "piano",
    "guitar",
    "songbook",
    "texttoaudio",
    "videodownloader",
    "voiceapp",
    "voicechanger",
    "voicesearch",
  ],
  developer: [
    "algorithm",
    "appscale",
    "developer",
    "frontendx",
    "metabuilder",
    "mobileapp",
    "promptbook",
    "promptdesigner",
    "sdk",
    "softwarehouse",
    "wysiwyg",
  ],
  business: [
    "administrative",
    "gethired",
    "greatjobs",
    "jobwatch",
    "talentmarket",
    "talento",
    "topjobs",
    "onboard",
    "onboarding",
  ],
  logistics: [
    "deliver",
    "deliveries",
    "delivering",
    "delivery",
    "carpool",
    "driving",
    "flightdata",
    "gps",
    "shippers",
  ],
  retail: [
    "fashion",
    "giftcard",
    "grocery",
    "kiosk",
    "local",
    "localsearch",
    "outfit",
    "wine",
  ],
  ai: [
    "aicampus",
    "aiconference",
    "anymind",
    "autopilot",
    "autolabel",
    "engine",
    "recognize",
    "visual",
  ],
};

