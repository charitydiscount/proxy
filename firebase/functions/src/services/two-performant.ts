import { config } from 'firebase-functions';
const fetch = require('node-fetch').default;
import marketConverter from '../serializers/market';
import { commissionsFromJson, Commission } from '../serializers/commission';
import {
  productsFromJson,
  productFeedsFromJson,
  Product,
  ProductFeed,
} from '../serializers/product';
import { asyncForEach } from '../util/helpers';

export interface AuthHeaders {
  accessToken: string;
  client: string;
  uid: string;
  tokenType: string;
  uniqueCode: string;
}

export let authHeaders: AuthHeaders;

const perPage = 50;

/**
 * Retrieve the 2Performant authentication data
 */
async function getAuthHeaders(): Promise<AuthHeaders> {
  if (authHeaders) {
    return authHeaders;
  }

  const reqHeaders = { 'Content-Type': 'application/json' };
  const reqBody = {
    user: { email: config().twop.email, password: config().twop.pass },
  };

  const twoPResponse = await fetch(
    'https://api.2performant.com/users/sign_in',
    {
      method: 'post',
      headers: reqHeaders,
      body: JSON.stringify(reqBody),
    },
  );

  if (!twoPResponse.ok) {
    throw new Error(`Failed auth request: ${twoPResponse.statusText}`);
  }

  const resBody = await twoPResponse.json();

  authHeaders = {
    accessToken: twoPResponse.headers.get('access-token') || '',
    client: twoPResponse.headers.get('client') || '',
    uid: twoPResponse.headers.get('uid') || '',
    tokenType: twoPResponse.headers.get('token-type') || '',
    uniqueCode: resBody.user.unique_code,
  };
  return authHeaders;
}

/**
 * Get the 2Performant affiliate programs
 * @param {Object} auth
 */
export async function getPrograms() {
  if (!authHeaders) {
    authHeaders = await getAuthHeaders();
  }

  let market = await getProgramsForPage(authHeaders, 1, perPage);
  let programs = market.programs;

  const totalPages = market.metadata.pagination.pages;
  const firstPage = market.metadata.pagination.currentPage;

  for (let page = firstPage + 1; page <= totalPages; page++) {
    market = await getProgramsForPage(authHeaders, page, perPage);
    programs = programs.concat(market.programs);
  }

  return programs;
}

/**
 * Get the 2Performant affiliate products
 */
export async function getProducts(): Promise<Product[]> {
  const productFeeds = (await getAllEntities(
    getProductFeedsForPage,
    'productFeeds',
  )) as ProductFeed[];

  const mostProductsFeeds = productFeeds.reduce(
    (acc, currentFeed, currentIndex, array) => {
      const isNewProgram =
        acc.find(
          (feed) => feed.program.uniqueCode === currentFeed.program.uniqueCode,
        ) === undefined;

      if (isNewProgram) {
        const feedWithMostProducts = array
          .filter(
            (feed) =>
              feed.program.uniqueCode === currentFeed.program.uniqueCode,
          )
          .reduce((previousFeed, currentFeedForProgram) =>
            previousFeed.productsCount > currentFeedForProgram.productsCount
              ? previousFeed
              : currentFeedForProgram,
          );

        return acc.concat([feedWithMostProducts]);
      }
      return acc;
    },
    <ProductFeed[]>[],
  );

  let products = <Product[]>[];

  if (!authHeaders) {
    authHeaders = await getAuthHeaders();
  }
  await asyncForEach(
    mostProductsFeeds.slice(0, 10),
    async (feed: ProductFeed) => {
      const productsForFeed = await getProductsForPage(
        authHeaders,
        1,
        40,
        feed.id,
      );
      products = products.concat(productsForFeed.products);
    },
  );

  return products;
}

/**
 * Get the 2Performant affiliate commissions
 */
export async function getCommissions(): Promise<Commission[]> {
  const commissions = await getAllEntities(
    getCommissionsForPage,
    'commissions',
  );
  return commissions;
}

async function getAllEntities(
  pageRetriever: Function,
  relevantKey: string,
): Promise<any[]> {
  if (!authHeaders) {
    authHeaders = await getAuthHeaders();
  }

  let responseForPage = await pageRetriever(authHeaders, 1, perPage);
  let entities = responseForPage[relevantKey];

  const totalPages = responseForPage.metadata.pagination.pages;
  const firstPage = responseForPage.metadata.pagination.currentPage;

  for (let page = firstPage + 1; page <= totalPages; page++) {
    responseForPage = await pageRetriever(authHeaders, page, perPage);
    entities = entities.concat(responseForPage[relevantKey]);
  }

  return entities;
}

async function getProgramsForPage(
  authData: AuthHeaders,
  page: number,
  perPage: number,
) {
  const url = `https://api.2performant.com/affiliate/programs?filter[relation]=accepted&page=${page}&perpage=${perPage}`;
  const twoPResponse = await fetchTwoP(url, authData);
  const respBody = await twoPResponse.json();

  return marketConverter(respBody, '2p');
}

async function getProductFeedsForPage(
  authData: AuthHeaders,
  page: number,
  perPage: number,
) {
  const url = `https://api.2performant.com/affiliate/product_feeds?page=${page}&perpage=${perPage}`;
  const twoPResponse = await fetchTwoP(url, authData);
  const respBody = await twoPResponse.json();

  return productFeedsFromJson(respBody);
}

async function getProductsForPage(
  authData: AuthHeaders,
  page: number,
  perPage: number,
  productFeed: number,
) {
  const url = `https://api.2performant.com/affiliate/product_feeds/${productFeed}/products?page=${page}&perpage=${perPage}`;
  const twoPResponse = await fetchTwoP(url, authData);
  const respBody = await twoPResponse.json();

  return productsFromJson(respBody);
}

async function getCommissionsForPage(
  authData: AuthHeaders,
  page: number,
  perPage: number,
) {
  const url = `https://api.2performant.com/affiliate/commissions?page=${page}&perpage=${perPage}`;
  const twoPResponse = await fetchTwoP(url, authData);
  const respBody = await twoPResponse.json();

  return commissionsFromJson(respBody);
}

function fetchTwoP(url: string, authData: AuthHeaders): Promise<any> {
  const headers = {
    'access-token': authData.accessToken,
    client: authData.client,
    uid: authData.uid,
    'token-type': authData.tokenType,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  return fetch(url, {
    method: 'get',
    headers,
  });
}

export default { getPrograms, getProducts, getCommissions };
