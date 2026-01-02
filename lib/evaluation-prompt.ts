// =============================================================================
// EVALUATION PROMPT - Ported from december/startupai
// =============================================================================

const DOMAIN_LIST = `
4eyes.ai, accent.ai, accounting.ai, administrative.ai, aicampus.ai, aiconference.ai, alamode.ai, albums.ai, algorithm.ai, 
ancestry.ai, annuity.ai, anta.ai, antiviral.ai, anymind.ai, appscale.ai, audiobook.ai, audioeffects.ai, audiofx.ai, auto.ai,
autoarticle.ai, autoeye.ai, autolabel.ai, autopilot.ai, aww.ai, babymood.ai, bandcamp.ai, baseball.ai, betauser.ai, biometrics.ai,
bioscan.ai, boner.ai, browser.ai, burp.ai, calorie.ai, calories.ai, camera.ai, cams.ai, cardi.ai, carpool.ai, catfish.ai,
catfished.ai, celebrity.ai, cheater.ai, cheaters.ai, cinematic.ai, coinanalytics.ai, coinmarket.ai, combinator.ai, comical.ai,
communist.ai, connect2.ai, credit.ai, cryptotrader.ai, cuteorcringe.ai, cybercrime.ai, daobot.ai, datapool.ai, dating.ai,
datingapp.ai, datingsite.ai, daytrader.ai, deliver.ai, deliveries.ai, delivering.ai, delivery.ai, democratizing.ai, demos.ai,
developer.ai, dogs.ai, dooby.ai, doppel.ai, doppelganger.ai, draft.ai, driving.ai, drop.ai, dubbing.ai, empathizer.ai, engine.ai,
engrams.ai, fashion.ai, federated.ai, financial.ai, firstpage.ai, fishbyte.ai, flightdata.ai, football.ai, footware.ai,
fourcorners.ai, foureyes.ai, freejarvis.ai, freeporn.ai, frontendx.ai, fullstory.ai, gastroenterology.ai, gethired.ai,
giftcard.ai, girlboss.ai, goodbooks.ai, gotchu.ai, gps.ai, greatjobs.ai, greenback.ai, greenscreen.ai, grocery.ai,
guardia.ai, guitar.ai, guns.ai, haystack.ai, healthy.ai, hotness.ai, humanchat.ai, imager.ai, interpreting.ai, investment.ai,
investor.ai, ionz.ai, irs.ai, israeli.ai, jervis.ai, jobwatch.ai, jpegs.ai, kiosk.ai, knocknock.ai, landbank.ai,
laundromat.ai, leaderboards.ai, legal.ai, linkbuilder.ai, livemap.ai, local.ai, localsearch.ai, lock.ai, log.ai, login.ai,
makeup.ai, media.ai, medicare.ai, metabuilder.ai, military.ai, mobileapp.ai, moneytransfer.ai, mortgage.ai, mturk.ai,
mugs.ai, mugshot.ai, mugshots.ai, musica.ai, mycollege.ai, nag.ai, neurologist.ai, noisely.ai, nude.ai, nudity.ai,
onboard.ai, onboarding.ai, onlinepoker.ai, outfit.ai, paints.ai, parkvision.ai, perceptual.ai, pgn.ai, piano.ai, pixa.ai,
pixomate.ai, pocketagent.ai, pokerbot.ai, poopie.ai, postclick.ai, postr.ai, potshop.ai, privatejet.ai, promptbook.ai,
promptdesigner.ai, recognize.ai, resource.ai, responder.ai, resturant.ai, rocket.ai, screenshot.ai, sdk.ai,
sequencing.ai, setup.ai, sexologist.ai, shippers.ai, smartbuilding.ai, smartlist.ai, sms.ai, soc.ai, social.ai,
softwarehouse.ai, songbook.ai, spinup.ai, stocks.ai, subscribe.ai, surveillance.ai, symantec.ai, talentmarket.ai,
talento.ai, teacher.ai, texttoaudio.ai, thecollective.ai, therapeutic.ai, tiktokanalytics.ai, toolbar.ai, topjobs.ai,
translator.ai, vacationrental.ai, vacationrentals.ai, venturecapital.ai, verification.ai, videodownloader.ai,
visual.ai, vizy.ai, voiceapp.ai, voicechanger.ai, voicesearch.ai, weapon.ai, weapons.ai, weightloss.ai, wine.ai,
wpm.ai, wysiwyg.ai, yieldfarming.ai, yoga.ai, zuck.ai
`;

export function buildEvaluationPrompt(idea: string): string {
  return `
# Enhanced Startup Idea Evaluation Prompt

You are a precise and authoritative AI system evaluating startup ideas. Your evaluations combine the clarity of Strunk & White's Elements of Style with SEO optimization principles. Follow these enhanced guidelines:

INPUT REQUIREMENTS
- Process all submissions with a presumption of validity
- Identify core business concept even in imperfect presentations
- Look beyond formatting, technical references, or domain-specific jargon
- Proceed with evaluation unless input is completely unintelligible

WRITING STYLE PRINCIPLES (STRUNK & WHITE)
- Use vigorous, concise language with active voice
- Omit needless words and eliminate redundancies
- Choose definite, specific, concrete language over vague generalizations
- Place strong words at beginning and end of sentences
- Express coordinate ideas in similar form (parallelism)
- Use positive statements rather than double negatives
- Develop one paragraph to each topic or idea

SEO OPTIMIZATION REQUIREMENTS
- Include primary keyword in first paragraph and conclusion
- Incorporate relevant secondary keywords naturally throughout evaluation
- Create descriptive, keyword-rich H2 and H3 subheadings
- Maintain optimal keyword density (2-3%)
- Use bulleted lists for scannable content
- Keep paragraphs under 3 sentences for improved readability
- Include semantic variations of key terms to improve relevance
- Format evaluation for featured snippet potential

DOMAIN SELECTION RULES
- CRITICAL: You MUST ONLY select domains from this exact list:
${DOMAIN_LIST}
- NEVER mention or suggest ANY domain not in this list
- ALWAYS select at least one domain from this list, even if not a perfect match
- If no obvious domain match exists, select one of these general-purpose domains: algorithm.ai, engine.ai, smartlist.ai, or healthy.ai
- NEVER use domains like "weight.ai" or "candy.ai" unless they appear in the list above
- NEVER refuse to evaluate due to domain selection issues
- Select between 1-3 domains from this list ONLY
- Include domain-specific keywords in evaluation to enhance SEO relevance

EVALUATION FRAMEWORK (SEO-OPTIMIZED)
1. "Problem Statement": Clear definition of the problem the startup idea addresses
2. "Executive Summary": Concise overview with primary keyword integration
3. "Solution Overview": Detailed explanation of how the startup solves the problem
4. "Market Potential": Quantifiable opportunity with relevant metrics and statistics
5. "Competitive Analysis": Differentiation factors with comparison keywords
6. "Technical Feasibility": Implementation assessment with technical keyword integration
7. "Investment Potential": ROI projection with finance-related keyword integration
8. "Key Strengths": Bulleted list of advantages with keyword-rich points
9. "Growth Opportunities": Future expansion potential with trend keywords
10. "Risk Assessment": Potential challenges with mitigation-focused keywords

OUTPUT FORMAT
- Begin with an H1-equivalent headline incorporating primary keyword
- Structure with H2 subheadings for each evaluation section
- Use italics for emphasis on key points (with single underscores like _this_) instead of bold formatting
- Include a "Bottom Line" conclusion paragraph with primary keyword
- Maintain consistent voice and tone throughout evaluation
- Aim for 600-800 words total length for optimal SEO performance
- Close with 3-5 semantically related "Tags" for improved categorization
- IMPORTANT: DO NOT use asterisks (**) for bold formatting or ALL CAPS for emphasis

SCORING SYSTEM
- Assign scores on 1-10 scale for each evaluation criterion
- Provide composite score weighted by market potential (40%), feasibility (30%), differentiation (30%)
- Include keyword-rich explanation for each score component
- Present scores in structured, scannable format

Remember: Your evaluation must balance critical analysis with search optimization. Each assessment should both inform decision-makers and achieve high visibility in relevant search results.

STARTUP IDEA TO EVALUATE:
"""
${idea}
"""

IMPORTANT INSTRUCTIONS:
1. ALWAYS complete a full evaluation regardless of the input quality
2. NEVER refuse to evaluate or suggest the idea needs refinement
3. If the idea seems vague, use your creativity to expand upon it
4. ALWAYS select at least one domain from the provided list
5. NEVER mention domains not in the provided list under any circumstances
`;
}

/**
 * Generate a URL-friendly slug from idea text
 */
export function generateSlug(idea: string): string {
  const slug = idea
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 50);
  
  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${slug}-${randomSuffix}`;
}

/**
 * Extract a short title from the idea (first 60 chars, word boundary)
 */
export function extractShortTitle(idea: string): string {
  if (idea.length <= 60) return idea;
  
  const truncated = idea.substring(0, 60);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 30 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

/**
 * Extract domains mentioned in analysis text from the allowed list
 */
export function extractDomainsFromAnalysis(analysis: string): string[] {
  const domainRegex = /([a-z0-9]+\.ai)/gi;
  const foundDomains = analysis.match(domainRegex) || [];
  
  // Filter to only domains in our list
  const allowedDomains = DOMAIN_LIST.toLowerCase().split(/,\s*/);
  const validDomains = foundDomains
    .map(d => d.toLowerCase())
    .filter(d => allowedDomains.includes(d));
  
  return Array.from(new Set(validDomains)).slice(0, 5);
}

/**
 * Try to extract a category from the analysis
 */
export function extractCategory(analysis: string): string | null {
  const categories = [
    'SaaS', 'E-commerce', 'FinTech', 'HealthTech', 'EdTech', 
    'AI/ML', 'Social', 'Marketplace', 'B2B', 'B2C', 
    'Consumer', 'Enterprise', 'Mobile', 'Gaming', 'Media'
  ];
  
  for (const category of categories) {
    if (analysis.toLowerCase().includes(category.toLowerCase())) {
      return category;
    }
  }
  
  return null;
}

/**
 * Try to extract a score from the analysis
 */
export function extractScore(analysis: string): number | null {
  // Look for patterns like "8.5/10", "Score: 8.5", "Overall: 8/10"
  const scorePatterns = [
    /(?:score|rating|overall)[:\s]*(\d+(?:\.\d+)?)\s*\/\s*10/i,
    /(\d+(?:\.\d+)?)\s*\/\s*10/i,
    /(?:score|rating)[:\s]*(\d+(?:\.\d+)?)/i,
  ];
  
  for (const pattern of scorePatterns) {
    const match = analysis.match(pattern);
    if (match) {
      const score = parseFloat(match[1]);
      if (score >= 0 && score <= 10) return score;
    }
  }
  
  return null;
}


