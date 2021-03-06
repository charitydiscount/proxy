import { Client } from '@elastic/elasticsearch';
import { config } from 'firebase-functions';
import { Program } from '../entities';
import { flatMap } from '../util/helpers';
import { Product } from '../serializers/product';

let elastic: Client;

/**
 * Update the search index with the provided programs (overrides existing index)
 * @param {Program[]} programs
 */
export async function updateProgramsIndex(programs: Program[]) {
  if (!elastic) {
    elastic = new Client({
      node: config().elastic.endpoint,
    });
  }

  const bulkBody = flatMap(
    (program: Program) => [
      { index: { _index: config().elastic.index_programs, _id: program.id } },
      program,
    ],
    programs,
  );

  try {
    const { body: bulkResponse } = await elastic.bulk({
      refresh: 'true',
      body: bulkBody,
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
            document: bulkBody[i * 2 + 1],
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
    index: config().elastic.index_programs,
  });
  console.log(count);
}

/**
 * Update the search index with the provided products (overrides existing index)
 * @param {Product[]} products
 */
export async function updateProductsIndex(products: Product[]) {
  if (!elastic) {
    elastic = new Client({
      node: config().elastic.endpoint,
    });
  }

  const bulkBody = flatMap(
    (product: Product) => [
      { index: { _index: config().elastic.index_products, _id: product.id } },
      product,
    ],
    products,
  );

  try {
    const { body: bulkResponse } = await elastic.bulk({
      refresh: 'true',
      body: bulkBody,
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
            document: bulkBody[i * 2 + 1],
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
    index: config().elastic.index_products,
  });
  console.log(count);
}

export default { updateProgramsIndex, updateProductsIndex };
