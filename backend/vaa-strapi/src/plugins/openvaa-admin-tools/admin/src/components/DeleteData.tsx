import { Flex } from '@strapi/design-system';
import { ReactElement } from 'react';
import { ApiResult } from 'src/api/utils/apiResult.type';
import { DataBase } from './DataBase';
import { IMPORTABLE_COLLECTIONS } from '../../../server/src/services/utils/importableCollections';
import { deleteData } from '../api/data';

/**
 * A component for accessing the `/openvaa-admin-tools/delete-data` endpoint.
 */
export function DeleteData(): ReactElement {
  const title = 'Delete data';
  const submitLabel = 'Delete';
  async function submitHandler(data: object): Promise<ApiResult> {
    const result = await deleteData(data);
    if (result.type !== 'success') return result;
    return {
      type: 'success',
      message: `Data deleted successfully. Deleted: ${Object.entries(result.deleted ?? {})
        .map(([k, v]) => `${v} ${k}`)
        .join(' • ')}.`,
    };
  }
  const intro = (
    <Flex direction="column" gap={3} alignItems="stretch">
      <p>
        Delete any data with an externalId. Any objects whose externalIds start with the provided
        case-sensitive prefixes will be deleted.
      </p>
      <p>
        The prefixes must be supplied for each affected collection, e.g.,{' '}
        <code>
          {'{'} "constituencies": "mock-" {'}'}
        </code>
        .
      </p>
      <p>If there are any errors during the deletion, no changes are made.</p>
      <p>
        Valid collection names are:{' '}
        {Object.keys(IMPORTABLE_COLLECTIONS)
          .map((n) => `'${n}'`)
          .join(' • ')}
        .
      </p>
      <p>
        To delete all mock data, use:{' '}
        <code>
          {'{'} "candidates": "mock-", "constituencies": "mock-", "constituencyGroups": "mock-",
          "elections": "mock-", "nominations": "mock-", "parties": "mock-", "questionTypes":
          "mock-", "questionCategories": "mock-", "questions": "mock-" {'}'}
        </code>
      </p>
    </Flex>
  );
  return (
    <DataBase title={title} intro={intro} submitLabel={submitLabel} submitHandler={submitHandler} />
  );
}
