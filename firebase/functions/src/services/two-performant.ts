import { config } from 'firebase-functions';
import fetch = require('node-fetch');
import {
  commissionsFromJson,
  Commission,
  CommissionsResponse,
} from '../serializers/commission';
import {
  productsFromJson,
  productFeedsFromJson,
  Product,
  ProductFeed,
} from '../serializers/product';
import { asyncForEach, sleep } from '../util/helpers';
import { programsFromJson } from '../serializers/program';

export interface AuthHeaders {
  accessToken: string;
  client: string;
  uid: string;
  tokenType: string;
  uniqueCode: string;
}

export let authHeaders: AuthHeaders;

const itemsPerPage = 40;

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

  const twoPResponse = await fetch.default(
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
 * @param {object} auth
 */
export async function getPrograms() {
  if (!authHeaders) {
    authHeaders = await getAuthHeaders();
  }

  let market = await getProgramsForPage(authHeaders, 1, itemsPerPage);
  let programs = market.programs;

  const totalPages = market.metadata.pagination.pages;
  const firstPage = market.metadata.pagination.currentPage;

  for (let page = firstPage + 1; page <= totalPages; page++) {
    market = await getProgramsForPage(authHeaders, page, itemsPerPage);
    programs = programs.concat(market.programs);
  }

  // programs.forEach((p) => (p.source = '2p'));
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
        itemsPerPage,
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
export async function getPendingCommissions(): Promise<Commission[]> {
  const commissions = await getAllEntities(
    getCommissionsForPage,
    'commissions',
    '&filter[status]=pending&sort[date]=desc',
  );
  commissions.push(
    ...(await getAllEntities(
      getCommissionsForPage,
      'commissions',
      'filter[status]=accepted&sort[date]=desc',
    )),
  );
  return commissions;
}

export async function getFinalCommissions(
  lastPaidCommission: Commission | undefined = undefined,
  lastRejectedCommission: Commission | undefined = undefined,
): Promise<Commission[]> {
  const commissions = await getAllEntities(
    getCommissionsForPage,
    'commissions',
    '&filter[status]=paid&sort[date]=desc',
    (pageResponse: CommissionsResponse) =>
      lastPaidCommission !== undefined &&
      !!pageResponse.commissions.find(
        (comm) => comm.id === lastPaidCommission.id,
      ),
  );
  commissions.push(
    ...(await getAllEntities(
      getCommissionsForPage,
      'commissions',
      '&filter[status]=rejected&sort[date]=desc',
      (pageResponse: CommissionsResponse) =>
        lastRejectedCommission !== undefined &&
        !!pageResponse.commissions.find(
          (comm) => comm.id === lastRejectedCommission.id,
        ),
    )),
  );
  return commissions;
}

async function getAllEntities(
  pageRetriever: Function,
  relevantKey: string,
  params: string | undefined = undefined,
  stopWhen: Function | undefined = undefined,
): Promise<any[]> {
  if (!authHeaders) {
    authHeaders = await getAuthHeaders();
  }

  let responseForPage = await pageRetriever(
    authHeaders,
    1,
    itemsPerPage,
    params,
  );
  let entities = responseForPage[relevantKey];

  if (stopWhen !== undefined && stopWhen(responseForPage) === true) {
    return entities;
  }

  const totalPages = responseForPage.metadata.pagination.pages;
  const firstPage = responseForPage.metadata.pagination.currentPage;

  for (let page = firstPage + 1; page <= totalPages; page++) {
    responseForPage = await pageRetriever(
      authHeaders,
      page,
      itemsPerPage,
      params,
    );
    entities = entities.concat(responseForPage[relevantKey]);
    if (stopWhen !== undefined && stopWhen(responseForPage) === true) {
      break;
    }
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

  return programsFromJson(respBody);
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
  params: string,
): Promise<CommissionsResponse> {
  const url = `https://api.2performant.com/affiliate/commissions?page=${page}&perpage=${perPage}${params}`;
  const twoPResponse = await fetchTwoP(url, authData);
  if (twoPResponse.status === 429) {
    await sleep(5 * 61 * 1000);
    return await getCommissionsForPage(authData, page, perPage, params);
  } else {
    const respBody = await twoPResponse.json();
    return commissionsFromJson(respBody);
  }
}

function fetchTwoP(url: string, authData: AuthHeaders) {
  const headers = {
    'access-token': authData.accessToken,
    client: authData.client,
    uid: authData.uid,
    'token-type': authData.tokenType,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  return fetch.default(url, {
    method: 'get',
    headers,
  });
}

export default {
  getPrograms,
  getProducts,
  getPendingCommissions,
  getFinalCommissions,
};
