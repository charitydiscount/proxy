import { config } from 'firebase-functions';
const fetch = require('node-fetch').default;
import marketConverter from '../serializers/market';

export interface AuthHeaders {
  accessToken: string,
  client: string,
  uid: string,
  tokenType: string,
  uniqueCode: string,
}

export let authHeaders: AuthHeaders;

/**
 * Retrieve the 2Performant authentication data
 */
async function get2PAuthHeaders(): Promise<AuthHeaders> {
  if (authHeaders) {
    return authHeaders;
  }

  const reqHeaders = { 'Content-Type': 'application/json' };
  const reqBody = {
    user: { email: config().twop.email, password: config().twop.pass }
  };

  const twoPResponse = await fetch(
    'https://api.2performant.com/users/sign_in',
    {
      method: 'post',
      headers: reqHeaders,
      body: JSON.stringify(reqBody)
    }
  );

  if (!twoPResponse.ok) {
    throw new Error('Failed auth request');
  }

  const resBody = await twoPResponse.json();

  authHeaders = {
    accessToken: twoPResponse.headers.get('access-token') || '',
    client: twoPResponse.headers.get('client') || '',
    uid: twoPResponse.headers.get('uid') || '',
    tokenType: twoPResponse.headers.get('token-type') || '',
    uniqueCode: resBody.user.unique_code
  };
  return authHeaders;
}

/**
 * Get the 2Performant affiliate programs
 * @param {Object} auth
 */
export async function get2PPrograms() {
  if (!authHeaders) {
    authHeaders = await get2PAuthHeaders();
  }

  const perPage = 200;
  let market = await get2PProgramsForPage(authHeaders, 1, perPage);
  let programs = market.programs;

  const totalPages = market.metadata.pagination.pages;
  const firstPage = market.metadata.pagination.current_page;

  for (let page = firstPage + 1; page <= totalPages; page++) {
    market = await get2PProgramsForPage(authHeaders, page, perPage);
    programs = programs.concat(market.programs);
  }

  return programs;
}

async function get2PProgramsForPage(authData: AuthHeaders, page: Number, perPage: Number) {
  const url = `https://api.2performant.com/affiliate/programs?filter[relation]=accepted&page=${page}&perpage=${perPage}`;
  const headers = {
    'access-token': authData.accessToken,
    client: authData.client,
    uid: authData.uid,
    'token-type': authData.tokenType,
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };
  const twoPResponse = await fetch(url, {
    method: 'get',
    headers
  });

  const respBody = await twoPResponse.json();

  return marketConverter(respBody, '2p');
}

export default { get2PPrograms };
