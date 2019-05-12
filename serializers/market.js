function toMarket(json) {
  return {
    programs: getPrograms(json),
    metadata: json.metadata,
  }
}

function getPrograms(json) {
  if (!json.hasOwnProperty('programs')) {
    return [];
  }

  return json.programs.map((p) => {
    return {
      uniqueCode: p.unique_code,
      name: p.name,
      logoPath: p.logo_path,
      mainUrl: p.main_url,
      defaultLeadCommissionAmount: p.default_lead_commission_amount,
      defaultSaleCommissionRate: p.default_sale_commission_rate,
      category: p.category.name,
      status: p.status
    }
  });
}

module.exports = { toMarket };
