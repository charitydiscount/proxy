import * as functions from 'firebase-functions';
import twoPService from './services/two-performant';
import * as firestoreService from './services/firestore';
import elasticService from './services/elastic';
import * as controller from './controllers';

function getFunction(
  timeoutSeconds: number = 300,
  memory = functions.VALID_MEMORY_OPTIONS[1],
) {
  const runtimeOpts = {
    timeoutSeconds,
    memory,
  };
  return functions.runWith(runtimeOpts).region('europe-west1');
}

export const updatePrograms = getFunction()
  .pubsub.schedule('every monday 06:00')
  .timeZone('Europe/Bucharest')
  .onRun(async (context: any) => {
    const programs = await controller.getPrograms();

    console.log(`Retrieved ${programs.length} programs`);

    const twoPCode = controller.getAffiliateCodes()[0].code;
    const updatePromises = [
      firestoreService.updatePrograms(programs),
      firestoreService.updateMeta(twoPCode, programs),
      elasticService.updateProgramsIndex(programs),
    ];

    return Promise.all(updatePromises).catch((e: Error) =>
      console.log(e.message),
    );
  });

export const updatePendingCommissions = getFunction(540)
  .pubsub.schedule('every 24 hours')
  .timeZone('Europe/Bucharest')
  .onRun((context: any) => {
    return controller.updatePendingCommissions();
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
