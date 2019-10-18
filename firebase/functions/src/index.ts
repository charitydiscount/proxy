import * as functions from 'firebase-functions';
import twoPService, { authHeaders } from './services/two-performant';
import firestoreService from './services/firestore';
import elasticService from './services/elastic';

const runtimeOpts = {
  timeoutSeconds: 300,
  memory: functions.VALID_MEMORY_OPTIONS[1],
};

function getFunction() {
  return functions.runWith(runtimeOpts).region('europe-west1');
}

export const updatePrograms = getFunction()
  .pubsub.schedule('every monday 06:00')
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

export const updateCommissions = getFunction()
  .pubsub.schedule('every 24 hours')
  .timeZone('Europe/Bucharest')
  .onRun(async (context: any) => {
    try {
      const commissions = await twoPService.getCommissions();
      return firestoreService
        .updateCommissions(commissions)
        .catch((e) => console.log(e.message));
    } catch (error) {
      console.log(error.message);
      return;
    }
  });

export const updateProducts = getFunction()
  .pubsub.schedule('every 24 hours')
  .timeZone('Europe/Bucharest')
  .onRun(async (context: any) => {
    try {
      const products = await twoPService.getProducts();
      console.log(`Retrieved ${products.length} products`);
      const updatePromises = [elasticService.updateProductsIndex(products)];

      return Promise.all(updatePromises).catch((e: Error) =>
        console.log(e.message),
      );
    } catch (error) {
      console.log(error.message);
      return;
    }
  });
