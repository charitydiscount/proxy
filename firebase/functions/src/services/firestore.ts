import Firestore = require('@google-cloud/firestore');
import { config } from 'firebase-functions';
import { FieldValue } from '@google-cloud/firestore';
import * as entity from '../entities';
import { Commission, toCommissionEntity } from '../serializers/commission';

const db = new Firestore.Firestore({
  projectId: 'charitydiscount',
  keyFilename: 'CharityDiscount.json',
});

/**
 * Update the stored programs
 * @param {object[]} programs
 */
export async function updatePrograms(programs: entity.Program[]) {
  if (!Array.isArray(programs)) {
    return;
  }

  await updateProgramsGeneral(programs);
  await updateFavoritePrograms(programs);

  console.log(`Saved ${programs.length} programs`);
}

/**
 * Update the overall metrics
 */
export async function updateMeta(
  uniqueCode: string,
  programs: entity.Program[],
) {
  if (!Array.isArray(programs)) {
    return;
  }

  await updateAffiliateMeta(uniqueCode);
  await updateProgramsMeta(programs);
}

async function updateProgramsGeneral(programs: entity.Program[]) {
  try {
    await deleteDocsOfCollection('shops');
  } catch (e) {
    console.log('Failed to delete general programs');
  }

  const batchSize = parseInt(config().firestore.programs_batch_size);
  for (let index = 0; index < programs.length; index += batchSize) {
    const docPrograms = programs.slice(index, index + batchSize);
    await db.collection('shops').add({
      batch: docPrograms,
      createdAt: Firestore.FieldValue.serverTimestamp(),
    });
  }
}

/**
 * Update the commissions
 * @param commissions
 */
export async function updateCommissions(commissions: Commission[]) {
  if (!Array.isArray(commissions)) {
    return;
  }

  const userCommissions: { [userId: string]: Commission[] } = {};
  commissions.forEach((userCommission) =>
    addUserCommission(userCommissions, userCommission),
  );

  const promises: Promise<any>[] = [];

  for (const userId in userCommissions) {
    const transactions: entity.Commission[] = userCommissions[userId].map(
      (userComm) => toCommissionEntity(userComm),
    );
    promises.push(
      db
        .collection('commissions')
        .doc(userId)
        .set(
          {
            userId,
            transactions: FieldValue.arrayUnion(...transactions),
          },
          { merge: true },
        ),
    );
  }

  return promises;
}

export const getLastFinalCommissions = async (
  userId: string,
  status: string,
): Promise<entity.Commission | null> => {
  const commissionsSnap = await db
    .collection('commissions')
    .doc(userId)
    .get();
  if (!commissionsSnap.exists) {
    return null;
  }

  const userCommissions: entity.Commission[] = commissionsSnap.data()!
    .transactions;

  return (
    userCommissions.find((commission) => commission.status === status) || null
  );
};

function addUserCommission(
  target: { [userId: string]: Commission[] },
  commission: Commission,
) {
  const userId = getUserForCommission(commission);
  if (target.hasOwnProperty(userId)) {
    target[userId].push(commission);
  } else {
    target[userId] = [commission];
  }

  return target;
}

function getUserForCommission(commission: Commission) {
  if (!commission.statsTags || commission.statsTags.length === 0) {
    return '';
  }

  return commission.statsTags.slice(1, commission.statsTags.length - 1);
}

async function deleteDocsOfCollection(collection: string) {
  const fireBatch = db.batch();
  const docsToDelete = await db.collection(collection).listDocuments();
  docsToDelete.forEach((doc: any) => {
    fireBatch.delete(doc);
  });
  return fireBatch.commit();
}

async function updateFavoritePrograms(programs: entity.Program[]) {
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
          programs: f.data.programs.map((favProgram) => {
            return {
              ...favProgram,
              status: getProgramStatus(favProgram.uniqueCode, programs),
            };
          }),
        },
        { merge: true },
      );
    }
  });
}

async function updateAffiliateMeta(uniqueCode: string) {
  return db
    .collection('meta')
    .doc('2performant')
    .set({ uniqueCode: uniqueCode }, { merge: true });
}

async function updateProgramsMeta(programs: entity.Program[]) {
  const categories = programs.map((p) => p.category);
  const uniqueCategories = [...new Set(categories)];
  uniqueCategories.sort((c1, c2) => c1.localeCompare(c2));

  return db
    .collection('meta')
    .doc('programs')
    .set(
      {
        count: programs.length,
        categories: uniqueCategories,
      },
      { merge: true },
    );
}

function getProgramStatus(uniqueCode: string, programs: entity.Program[]) {
  const program = programs.find((p) => p.uniqueCode === uniqueCode);
  if (program) {
    return program.status;
  } else {
    return 'removed';
  }
}
