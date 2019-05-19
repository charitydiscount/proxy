function toMarket(json, source) {
  return {
    programs: getPrograms(json, source),
    metadata: json.metadata
  };
}

function getPrograms(json, source) {
  if (!json.hasOwnProperty('programs')) {
    return [];
  }

  return json.programs.map(p => {
    return {
      id: p.id,
      uniqueCode: p.unique_code,
      name: p.name,
      logoPath: p.logo_path,
      mainUrl: p.main_url,
      defaultLeadCommissionAmount: p.default_lead_commission_amount,
      defaultLeadCommissionType: p.default_lead_commission_type,
      defaultSaleCommissionRate: p.default_sale_commission_rate,
      defaultSaleCommissionType: p.default_sale_commission_type,
      currency: p.currency,
      category: p.category.name,
      status: p.status,
      source: source
    };
  });
}

module.exports = { toMarket };
