const camelcaseKeys = require('camelcase-keys');

export interface CommissionsResponse {
  commissions: Commission[];
  metadata: Metadata;
}

export interface Commission {
  id: number;
  userID: number;
  actionid: number;
  amount: string;
  status: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  reason: null;
  statsTags: string;
  history: null;
  currency: string;
  workingCurrencyCode: string;
  programID: number;
  registeredInBudgetLock: boolean;
  amountInWorkingCurrency: string;
  actiontype: string;
  program: CommissionProgram;
  publicActionData: PublicActionData;
  publicClickData: PublicClickData;
}

export interface CommissionProgram {
  name: string;
  slug: string;
  paymentType: string;
  status: string;
  userLogin: string;
  logo: string;
}

export interface PublicActionData {
  createdAt: Date;
  updatedAt: Date;
  rate: null;
  amount: null;
  adType: string;
  adID: string;
  sourceIP: string;
  description: string;
}

export interface PublicClickData {
  createdAt: Date;
  sourceIP: string;
  url: string;
  redirectTo: string;
  statsTags: string;
  deviceType: string;
}

export interface Metadata {
  totals: Totals;
  pagination: Pagination;
  programs: ProgramElement[];
  facets: Facets;
}

export interface Facets {
  search: Available;
  available: Available;
}

export interface Available {
  status: RegistrationMonth[];
  registrationMonth: RegistrationMonth[];
}

export interface RegistrationMonth {
  value: string;
  count: number;
}

export interface Pagination {
  results: number;
  pages: number;
  currentPage: number;
}

export interface ProgramElement {
  name: string;
  id: number;
}

export interface Totals {
  amount: string;
  transactionAmount: null;
  results: number;
}

export function commissionsFromJson(json: any): CommissionsResponse {
  return camelcaseKeys(json, { deep: true });
}
