const fetch = require('node-fetch');
const convert = require('./serializers/market');
require('dotenv').config();

/**
 * Convert a shop link to 2Performant affiliate link
 * @param {String} url Base URL of the shop
 * @param {String} affiliateCode Affiliate code
 * @param {String} uniqueId Unique ID of the shop
 */
function convert2PToAffiliateUrl(url, affiliateCode, uniqueId) {
  const baseUrl =
    'https://event.2performant.com/events/click?ad_type=quicklink';
  const affCode = `aff_code=${affiliateCode}`;
  const unique = `unique=${uniqueId}`;
  const redirect = `redirect_to=${url}`;

  return `${baseUrl}&${affCode}&${unique}&${redirect}`;
}

/**
 * Retrieve the 2Performant authentication data
 */
async function get2PAuthHeaders() {
  const reqHeaders = { 'Content-Type': 'application/json' };
  const reqBody = {
    user: { email: process.env.TWOP_EMAIL, password: process.env.TWOP_PASS }
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
    return null;
  }

  const resBody = await twoPResponse.json();

  return {
    accessToken: twoPResponse.headers.get('access-token'),
    client: twoPResponse.headers.get('client'),
    uid: twoPResponse.headers.get('uid'),
    tokenType: twoPResponse.headers.get('token-type'),
    uniqueCode: resBody.user.unique_code
  };
}

/**
 * Get the 2Performant affiliate programs
 * @param {Object} auth
 */
async function get2PPrograms(auth) {
  const perPage = 200;
  let market = await get2PProgramsForPage(auth, 1, perPage);
  let programs = market.programs;
  const pages = market.metadata.pagination.pages;
  if (market.metadata.pagination.current_page === pages) {
    return programs;
  }

  for (
    let page = market.metadata.pagination.current_page;
    page < pages;
    page++
  ) {
    market = await get2PProgramsForPage(auth, page, perPage);
    programs = programs.concat(market.programs);
  }

  return programs;
}

async function get2PProgramsForPage(authData, page, perPage) {
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

  return convert.toMarket(respBody, '2p');
}

module.exports = { convert2PToAffiliateUrl, get2PAuthHeaders, get2PPrograms };
