import { Flex } from '@strapi/design-system';
import { DataBase } from './DataBase';
import { IMPORTABLE_COLLECTIONS } from '../../../server/src/services/utils/importableCollections';
import { deleteData } from '../api/data';
import type { ReactElement } from 'react';
import type { ApiResult } from 'src/api/utils/apiResult.type';

/**
 * A component for accessing the `/openvaa-admin-tools/delete-data` endpoint.
 */
export function DeleteData(): ReactElement {
  const submitLabel = 'Delete';
  async function submitHandler(data: Record<string, unknown>): Promise<ApiResult> {
    const { type, cause, ...rest } = await deleteData(data);
    if (type !== 'success') return { type, cause };
    return {
      type: 'success',
      data: rest,
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
          {'{'} "alliances": "mock-", "candidates": "mock-", "constituencies": "mock-",
          "constituencyGroups": "mock-", "elections": "mock-", "nominations": "mock-", "parties":
          "mock-", "questionTypes": "mock-", "questionCategories": "mock-", "questions": "mock-"{' '}
          {'}'}
        </code>
      </p>
    </Flex>
  );
  return <DataBase intro={intro} submitLabel={submitLabel} submitHandler={submitHandler} />;
}
