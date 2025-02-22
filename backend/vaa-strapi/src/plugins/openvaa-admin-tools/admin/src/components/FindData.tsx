import { Flex } from '@strapi/design-system';
import { ReactElement } from 'react';
import { ApiResult } from 'src/api/utils/apiResult.type';
import { DataBase } from './DataBase';
import { IMPORTABLE_COLLECTIONS } from '../../../server/src/services/utils/importableCollections';
import { findData } from '../api/data';

/**
 * A component for accessing the `/openvaa-admin-tools/find-data` endpoint.
 */
export function FindData(): ReactElement {
  const submitLabel = 'Find';
  async function submitHandler(data: Record<string, unknown>): Promise<ApiResult> {
    const { type, cause, ...rest } = await findData(data);
    if (type !== 'success') return { type, cause };
    return {
      type: 'success',
      data: rest,
    };
  }
  const intro = (
    <Flex direction="column" gap={3} alignItems="stretch">
      <p>
        Find any data. Provide both the collection and the filters to apply, e.g.:
        <code>
          {'{'}
          "collection": "candidates", "filters": {'{'}
          "email": {'{'}
          "$contains": "example.com"
          {'}'}
          {'}'}
          {'}'}
        </code>
      </p>
      <p>
        Valid collection names are:{' '}
        {Object.keys(IMPORTABLE_COLLECTIONS)
          .map((n) => `'${n}'`)
          .join(' • ')}
        .
      </p>
    </Flex>
  );
  return <DataBase intro={intro} submitLabel={submitLabel} submitHandler={submitHandler} />;
}
