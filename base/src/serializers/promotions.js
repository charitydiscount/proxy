//@ts-check
function toPromotions(json, source) {
  return {
    promotions: getPromotions(json, source),
    metadata: {
      pagination: json.pagination,
    },
  };
}

function getPromotions(json, source) {
  if (!json.hasOwnProperty('advertiser_promotions')) {
    return [];
  }

  return json.advertiser_promotions.map((p) => {
    return {
      id: p.id,
      name: p.name,
      programId: p.program.id,
      campaignLogo: p.campaign_logo,
      promotionStart: p.promotion_start,
      promotionEnd: p.promotion_end,
      landingPageLink: p.landing_page_link,
      source: source,
    };
  });
}

module.exports = { toPromotions };
