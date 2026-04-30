"use strict";
const { read, write } = require("./logger");

const HASHTAGS = {
  "cleaning company":          "#CleaningBusiness #LocalService #SmallBusiness",
  "landscaping":               "#Landscaping #LawnCare #OutdoorLiving",
  "auto repair":               "#AutoRepair #CarCare #MechanicLife",
  "restaurant":                "#Restaurant #FoodBusiness #LocalEats",
  "local service business":    "#LocalBusiness #ServiceBusiness #GrowYourBusiness",
};

function run() {
  const content = read("content.json");
  if (!content?.ideas?.length) {
    console.log("[posterAgent] no content to post yet");
    write("posts.json", []);
    return;
  }

  const tags = HASHTAGS[content.niche] ?? "#LocalBusiness #Marketing";
  const posts = content.ideas.map((idea, i) => ({
    platform: idea.format === "YouTube" ? "YouTube" : idea.format === "TikTok" ? "TikTok" : "Instagram",
    caption:  `${idea.hook}\n\n${idea.title}\n\n${tags}`,
    status:   "draft",
    ts:       new Date().toISOString(),
  }));

  write("posts.json", posts);
  console.log("[posterAgent] ✓ prepared", posts.length, "post drafts");
}

module.exports = { run };
if (require.main === module) run();
