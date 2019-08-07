import logging
import json

from os import environ
from flask import Flask, jsonify
from google.appengine.api import urlfetch
from google.appengine.api import memcache

app = Flask(__name__)
perPage = 30


@app.route('/programs/<int:program_id>/promotions', methods=['GET'])
def getProgramPromotions(program_id):
    promotions = memcache.get(str(program_id))
    if promotions is not None:
        return jsonify(promotions)

    authData = get2PAuthHeaders()
    if authData is None:
        return app.response_class(response='',
                                  status=401,
                                  mimetype='application/json')

    promotionData = get2PPromotionDataForPage(authData, 1, perPage)

    totalPages = promotionData['metadata']['pagination']['pages']
    firstPage = promotionData['metadata']['pagination']['current_page']

    promotions = list(
        map(lambda p: p['programId'] == program_id,
            promotionData['promotions']))

    if firstPage == totalPages:
        memcache.add(str(program_id), promotions, 3600)
        return promotions

    for page in range(firstPage, totalPages):
        promotionData = get2PPromotionDataForPage(authData, page, perPage)
        promotions.append(
            list(
                map(lambda p: p['programId'] == program_id,
                    promotionData['promotions'])))

    memcache.add(str(program_id), promotions, 3600)
    return jsonify(promotions)


def get2PAuthHeaders():
    authHeaders = memcache.get('authHeaders')
    if authHeaders is not None:
        return authHeaders

    reqHeaders = {'Content-Type': 'application/json'}
    reqBody = json.dumps({
        'user': {
            'email': environ.get('TWOP_EMAIL'),
            'password': environ.get('TWOP_PASS')
        }
    })
    url = 'https://api.2performant.com/users/sign_in'

    try:
        twoPResponse = urlfetch.fetch(url=url,
                                      headers=reqHeaders,
                                      payload=reqBody,
                                      method=urlfetch.POST)

        if twoPResponse.status_code != 200:
            return None
    except urlfetch.Error:
        logging.exception('Failed to fetch the authentication data')

    response = json.loads(twoPResponse.content)

    authHeaders = {
        'accessToken': twoPResponse.headers.get('access-token'),
        'client': twoPResponse.headers.get('client'),
        'uid': twoPResponse.headers.get('uid'),
        'tokenType': twoPResponse.headers.get('token-type'),
        'uniqueCode': response['user']['unique_code']
    }
    memcache.add('authHeaders', authHeaders)
    return authHeaders


def get2PPromotionDataForPage(authData, page, perPage):
    url = 'https://api.2performant.com/affiliate/advertiser_promotions?filter[affrequest_status]=accepted&page={page}&perpage={perPage}'

    headers = {
        'access-token': authData['accessToken'],
        'client': authData['client'],
        'uid': authData['uid'],
        'token-type': authData['tokenType'],
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }

    try:
        twoPResponse = urlfetch.fetch(url=url,
                                      headers=headers,
                                      method=urlfetch.GET)

        if twoPResponse.status_code != 200:
            return None
    except urlfetch.Error:
        logging.exception('Failed to fetch the promotions')

    return parsePromotionsResponse(twoPResponse.content, '2p')


def parsePromotionsResponse(jsonData, source):
    responseDict = json.loads(jsonData)
    return {
        'promotions': getPromotions(responseDict, source),
        'metadata': {
            'pagination': responseDict['pagination']
        }
    }


def getPromotions(responseDict, source):
    if not 'advertiser_promotions' in responseDict:
        return {}

    return map(
        lambda p: {
            'id': p['id'],
            'name': p['name'],
            'programId': p['program']['id'],
            'campaignLogo': p['campaign_logo'],
            'promotionStart': p['promotion_start'],
            'promotionEnd': p['promotion_end'],
            'landingPageLink': p['landing_page_link'],
            'source': source
        }, responseDict['advertiser_promotions'])
