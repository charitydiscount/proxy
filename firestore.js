const Firestore = require('@google-cloud/firestore');

const db = new Firestore({
  projectId: 'charitydiscount',
  keyFilename: 'CharityDiscount.json',
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
    //TODO: Update favorite shops of the users
  } catch (e) {
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
  let pushPromises = [];
  for (let index = 0; index < programs.length; index += batchSize) {
    const docPrograms = programs.slice(index, index + batchSize);
    pushPromises.push(db.collection('shops').add({
      batch: docPrograms,
      createdAt: Firestore.FieldValue.serverTimestamp()
    }));
  }
  return Promise.all(pushPromises);
}

async function updateProgramsPerCategory(programs) {
  try {
    await deleteDocsOfCollection('categories');
  } catch (e) {
    console.log('Failed to delete categories');
  }

  let categories = {};
  programs.forEach((p) => {
    if (categories.hasOwnProperty(p.category)) {
      categories[p.category].push(p);
    } else {
      categories[p.category] = [p];
    }
  });

  let pushPromises = [];
  for (const key in categories) {
    if (categories.hasOwnProperty(key)) {
      pushPromises.push(db.collection('categories').add({
        category: key,
        batch: categories[key],
        createdAt: Firestore.FieldValue.serverTimestamp()
      }));
    }
  }

  return Promise.all(pushPromises);
}

async function deleteDocsOfCollection(collection) {
  const fireBatch = db.batch();
  const docsToDelete = await db.collection(collection).listDocuments();
  docsToDelete.forEach((doc) => {
    fireBatch.delete(doc);
  })
  return fireBatch.commit();
}

module.exports = { updatePrograms };
