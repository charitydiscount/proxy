import { Program } from '../entities';
import twoPService, { authHeaders } from '../services/two-performant';
import * as firestoreService from '../services/firestore';
import { toProgramEntity } from '../serializers/program';

export const getPrograms = async (): Promise<Program[]> => {
  const twoPPrograms = await twoPService.getPrograms();
  return twoPPrograms
    .map((twoPP) => {
      const program = toProgramEntity(twoPP);
      if (!twoPP.enableLeads) {
        program.defaultLeadCommissionAmount = null;
      }
      if (!twoPP.enableSales) {
        program.defaultSaleCommissionRate = null;
      }
      program.source = '2p';
      return program;
    })
    .sort((p1, p2) => p1.name.localeCompare(p2.name));
};

export const getAffiliateCodes = () => {
  return [
    {
      platform: '2p',
      code: authHeaders.uniqueCode,
    },
  ];
};

export const updateCommissions = async () => {
  try {
    const commissions = await twoPService.getPendingCommissions();
    // const lastPaidCommission = await firestoreService.getLastFinalCommissions()
    return firestoreService
      .updateCommissions(commissions)
      .catch((e) => console.log(e.message));
  } catch (error) {
    console.log(error.message);
    return;
  }
};
