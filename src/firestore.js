//@ts-check
const Firestore = require('@google-cloud/firestore');

const db = new Firestore.Firestore({
  projectId: 'charitydiscount',
  keyFilename: 'CharityDiscount.json'
});

/**
 * Update the stored programs
 * @param {Object[]} programs
 */
async function updatePrograms(programs) {
  if (!Array.isArray(programs)) {
    return null;
  }

  try {
    await updateProgramsGeneral(programs);
    await updateProgramsPerCategory(programs);
    await updateFavoritePrograms(programs);
  } catch (e) {
    console.log(e);
    return 1;
  }

  return 0;
}

/**
 * Update the overall metrics
 * @param {Object[]} programs
 */
async function updateMeta(auth, programs) {
  if (!Array.isArray(programs)) {
    return null;
  }

  try {
    await updateAffiliateMeta(auth);
    await updateProgramsMeta(programs);
  } catch (e) {
    console.log(e);
    return 1;
  }

  return 0;
}

async function updateProgramsGeneral(programs) {
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

async function updateProgramsPerCategory(programs) {
  try {
    await deleteDocsOfCollection('categories');
  } catch (e) {
    console.log('Failed to delete categories');
  }

  let categories = {};
  programs.forEach(p => {
    if (categories.hasOwnProperty(p.category)) {
      categories[p.category].push(p);
    } else {
      categories[p.category] = [p];
    }
  });

  for (const key in categories) {
    if (categories.hasOwnProperty(key)) {
      await db.collection('categories').add({
        category: key,
        batch: categories[key],
        createdAt: Firestore.FieldValue.serverTimestamp()
      });
    }
  }
}

async function deleteDocsOfCollection(collection) {
  const fireBatch = db.batch();
  const docsToDelete = await db.collection(collection).listDocuments();
  docsToDelete.forEach(doc => {
    fireBatch.delete(doc);
  });
  return fireBatch.commit();
}

async function updateFavoritePrograms(programs) {
  const favoritePrograms = await db.collection('favoritePrograms').get();
  if (favoritePrograms.empty) {
    return 0;
  }

  favoritePrograms.forEach(f => {
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

async function updateAffiliateMeta(auth) {
  return db
    .collection('meta')
    .doc('2performant')
    .set({ uniqueCode: auth.uniqueCode }, { merge: true });
}

async function updateProgramsMeta(programs) {
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

function getProgramStatus(uniqueCode, programs) {
  const program = programs.find(p => p.uniqueCode === uniqueCode);
  if (program) {
    return program.status;
  } else {
    return 'removed';
  }
}

module.exports = { updatePrograms, updateMeta };