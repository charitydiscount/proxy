import { Client } from '@elastic/elasticsearch';
import { config } from 'firebase-functions';
import { Program } from '../serializers/market'

let elastic: Client;

/**
 * Update the search index with the provided programs (overrides existing index)
 * @param {Program[]} programs
 */
export async function updateSearchIndex(programs: Program[]) {
  if (!elastic) {
    elastic = new Client({
      node: config().elastic.endpoint,
      auth: {
        username: config().elastic.user || '',
        password: config().elastic.pass || ''
      }
    });
  }

  const flatMap = (f: Function, arr: Array<any>) => arr.reduce((x, y) => [...x, ...f(y)], []);
  const bulkBody = flatMap(
    (program: Program) => [
      { index: { _index: config().elastic.index_programs, _id: program.id } },
      program
    ],
    programs
  );

  try {
    const { body: bulkResponse } = await elastic.bulk({
      // @ts-ignore
      refresh: true,
      body: bulkBody
    });

    if (bulkResponse.errors) {
      const erroredDocuments: any[] = [];
      bulkResponse.items.forEach((action: any, i: number) => {
        const operation = Object.keys(action)[0];
        if (action[operation].error) {
          erroredDocuments.push({
            status: action[operation].status,
            error: action[operation].error,
            operation: bulkBody[i * 2],
            document: bulkBody[i * 2 + 1]
          });
        }
      });
      console.log(erroredDocuments);
    }
  } catch (e) {
    console.log(e);
    return;
  }

  const { body: count } = await elastic.count({
    index: config().elastic.index_programs
  });
  console.log(count);
}

export default { updateSearchIndex };
