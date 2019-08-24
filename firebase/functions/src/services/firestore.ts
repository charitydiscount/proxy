const Firestore = require('@google-cloud/firestore');
import { Program } from '../serializers/market';
import { AuthHeaders } from './two-performant';

const db = new Firestore.Firestore({
  projectId: 'charitydiscount',
  keyFilename: 'CharityDiscount.json'
});

/**
 * Update the stored programs
 * @param {Object[]} programs
 */
export async function updatePrograms(programs: Program[]) {
  if (!Array.isArray(programs)) {
    return null;
  }

  try {
    await updateProgramsGeneral(programs);
    await updateFavoritePrograms(programs);
  } catch (e) {
    console.log(e);
    return 1;
  }

  console.log(`Saved ${programs.length} programs`);

  return 0;
}

/**
 * Update the overall metrics
 */
export async function updateMeta(auth: AuthHeaders, programs: Program[]) {
  if (!Array.isArray(programs)) {
    return null;
  }

  await updateAffiliateMeta(auth);
  await updateProgramsMeta(programs);

  return 0;
}

async function updateProgramsGeneral(programs: Program[]) {
  try {
    await deleteDocsOfCollection('shops');
  } catch (e) {
    console.log('Failed to delete general programs');
  }

  const batchSize = 50;
  for (let index = 0; index < programs.length; index += batchSize) {
    const docPrograms = programs.slice(index, index + batchSize);
    await db.collection('shops').add({
      batch: docPrograms,
      createdAt: Firestore.FieldValue.serverTimestamp()
    });
  }
}

async function deleteDocsOfCollection(collection: string) {
  const fireBatch = db.batch();
  const docsToDelete = await db.collection(collection).listDocuments();
  docsToDelete.forEach((doc: any) => {
    fireBatch.delete(doc);
  });
  return fireBatch.commit();
}

async function updateFavoritePrograms(programs: Program[]) {
  const favoritePrograms = await db.collection('favoritePrograms').get();
  if (favoritePrograms.empty) {
    return;
  }

  favoritePrograms.forEach((f: any) => {
    // @ts-ignore
    const updateNeeded = f.data.programs.reduce((prev, favProgram) => {
      if (prev === true) {
        return true;
      }
      const currentStatus = getProgramStatus(favProgram.uniqueCode, programs);

      if (favProgram.status !== currentStatus) {
        return true;
      }

      return false;
    });
    if (updateNeeded === true) {
      // @ts-ignore
      f.getDocumentReference().set(
        {
          // @ts-ignore
          programs: f.data.programs.map(favProgram => {
            return {
              ...favProgram,
              status: getProgramStatus(favProgram.uniqueCode, programs)
            };
          })
        },
        { merge: true }
      );
    }
  });
}

async function updateAffiliateMeta(auth: AuthHeaders) {
  return db
    .collection('meta')
    .doc('2performant')
    .set({ uniqueCode: auth.uniqueCode }, { merge: true });
}

async function updateProgramsMeta(programs: Program[]) {
  const categories = programs.map(p => p.category);
  const uniqueCategories = [...new Set(categories)];
  uniqueCategories.sort((c1, c2) => c1.localeCompare(c2));

  return db
    .collection('meta')
    .doc('programs')
    .set(
      {
        count: programs.length,
        categories: uniqueCategories
      },
      { merge: true }
    );
}

function getProgramStatus(uniqueCode: string, programs: Program[]) {
  const program = programs.find(p => p.uniqueCode === uniqueCode);
  if (program) {
    return program.status;
  } else {
    return 'removed';
  }
}

export default { updatePrograms, updateMeta };
