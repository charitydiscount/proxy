import * as functions from 'firebase-functions';
import twoPService, { authHeaders } from './services/two-performant';
import firestoreService from './services/firestore';
import elasticService from './services/elastic';

const runtimeOpts = {
  timeoutSeconds: 300,
  memory: '256MB',
}

export const updatePrograms = functions
  //@ts-ignore
  .runWith(runtimeOpts)
  .https
  .onRequest(async (request: any, response: any) => {
    console.log(request.method);
    if (request.method !== 'PUT') {
      response.sendStatus(400);
      return;
    }

    const programs = await twoPService.get2PPrograms();
    programs.sort((p1, p2) => p1.name.localeCompare(p2.name));

    try {
      await firestoreService.updatePrograms(programs);
      await firestoreService.updateMeta(authHeaders, programs);
      await elasticService.updateSearchIndex(programs);
    } catch (e) {
      console.log(e);
      response.sendStatus(500);
      return;
    }

    response.sendStatus(200);
  });
