// import * as functions from 'firebase-functions';
// import * as firestoreService from './services/firestore';
// import elasticService from './services/elastic';
// import * as controller from './controllers';

// function getFunction(
//   timeoutSeconds: number = 300,
//   memory: typeof functions.VALID_MEMORY_OPTIONS[number] = functions
//     .VALID_MEMORY_OPTIONS[1],
// ) {
//   const runtimeOpts = {
//     timeoutSeconds,
//     memory,
//   };
//   return functions.runWith(runtimeOpts).region('europe-west1');
// }

// export const updatePrograms = getFunction()
//   .pubsub.schedule('every monday 06:00')
//   .timeZone('Europe/Bucharest')
//   .onRun(async (context: any) => {
//     const programs = await controller.getPrograms();

//     console.log(`Retrieved ${programs.length} programs`);

//     const twoPCode = controller.getAffiliateCodes()[0].code;
//     const updatePromises = [
//       firestoreService.updatePrograms(programs),
//       firestoreService.updateMeta(twoPCode, programs),
//       elasticService.updateProgramsIndex(programs),
//     ];

//     return Promise.all(updatePromises).catch((e: Error) =>
//       console.log(e.message),
//     );
//   });

// export const updatePendingCommissions = getFunction(540)
//   .pubsub.schedule('every 24 hours')
//   .timeZone('Europe/Bucharest')
//   .onRun((context: any) => {
//     return controller.updatePendingCommissions();
//   });
