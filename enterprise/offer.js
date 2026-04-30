"use strict";

function generateOffer(lead) {
  const problem  = lead.issues
    ? `Your ${lead.business} has known issues: ${lead.issues}.`
    : lead.rating && lead.rating <= 3.5
      ? `Your ${lead.business} has a ${lead.rating}-star rating hurting customer trust.`
      : `Your ${lead.business} isn't converting visitors into customers effectively.`;

  const solution = lead.website
    ? "I'd rebuild your site to load faster, look cleaner, and convert visitors into actual clients."
    : "I'd build you a site that loads fast, looks sharp, and turns visitors into paying clients.";

  const offer = `${solution} No fluff — just results.`;

  return { problem, solution, offer };
}

module.exports = { generateOffer };
