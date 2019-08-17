export interface Program {
  id: number,
  uniqueCode: string,
  name: string,
  logoPath: string,
  mainUrl: string,
  defaultLeadCommissionAmount: number,
  defaultLeadCommissionType: string,
  defaultSaleCommissionRate: number,
  defaultSaleCommissionType: string,
  currency: string,
  category: string,
  status: string,
  source: string,
}

interface Metadata {
  pagination: {
    results: number,
    pages: number,
    current_page: number
  }
}

function toMarket(json: any, source: string): { programs: Program[], metadata: Metadata } {
  return {
    programs: getPrograms(json, source),
    metadata: json.metadata
  };
}

function getPrograms(json: any, source: string): Program[] {
  if (!json.hasOwnProperty('programs')) {
    return [];
  }

  return json.programs.map((p: any) => {
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

export default toMarket;
