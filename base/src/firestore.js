//@ts-check
const Firestore = require('@google-cloud/firestore');

const db = new Firestore.Firestore({
  projectId: 'charitydiscount',
  keyFilename: 'CharityDiscount.json',
});

async function copyCollection(sourceCollection, targetCollection) {
  const documents = await db.collection(sourceCollection).listDocuments();
  const firestoreBatch = db.batch();
  await asyncForEach(documents, async (doc) => {
    const docSnapshot = await doc.get();
    const docData = docSnapshot.data();
    if (!('status' in docData)) {
      return;
    }
    const newDocRef = db.collection(targetCollection).doc(docSnapshot.id);
    firestoreBatch.set(newDocRef, docData);
  });
  await firestoreBatch.commit();
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index]);
  }
}

module.exports = { copyCollection };
