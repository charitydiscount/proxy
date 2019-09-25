export interface ProductsResponse {
  products: Product[];
  metadata: Metadata;
}

export interface Metadata {
  productFeed: ProductFeed;
  facets: Facets;
  pagination: Pagination;
}

export interface Facets {
  search: Available;
  available: Available;
}

export interface Available {
  category: BrandElement[];
  brand: BrandElement[];
}

export interface BrandElement {
  value: string;
  count: number;
}

export interface Pagination {
  results: number;
  pages: number;
  currentPage: number;
}

export interface ProductFeed {
  id: number;
  updatedAt: Date;
  help: string;
  productsCount: number;
  name: string;
  program: Program;
}

export interface Program {
  id: number;
  name: string;
  uniqueCode: string;
}

export interface Product {
  id: number;
  title: string;
  category: string;
  subcategory: string;
  brand: string;
  uniqueCode: string;
  price: string;
  caption: string;
  structuredImageUrls: string[];
  url: string;
  description: string;
}
