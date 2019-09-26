import * as functions from 'firebase-functions';
import twoPService, { authHeaders } from './services/two-performant';
import firestoreService from './services/firestore';
import elasticService from './services/elastic';
import { Commission } from './serializers/commission';

const runtimeOpts = {
  timeoutSeconds: 300,
  memory: '256MB',
};

export const updatePrograms = functions
  //@ts-ignore
  .runWith(runtimeOpts)
  .pubsub.schedule('* 6 * * 1')
  .timeZone('Europe/Bucharest')
  .onRun(async (context: any) => {
    const programs = await twoPService.getPrograms();
    programs.sort((p1, p2) => p1.name.localeCompare(p2.name));

    console.log(`Retrieved ${programs.length} programs`);

    const updatePromises = [
      firestoreService.updatePrograms(programs),
      firestoreService.updateMeta(authHeaders, programs),
      elasticService.updateProgramsIndex(programs),
    ];

    return Promise.all(updatePromises).catch((e: Error) =>
      console.log(e.message),
    );
  });

export const updateCommissions = functions.https.onRequest(async (req, res) => {
  let commissions: Commission[] = [];
  try {
    commissions = await twoPService.getCommissions();
  } catch (error) {
    console.log(error.message);
    res.status(500).send(error.message);
  }

  return commissions;
});
