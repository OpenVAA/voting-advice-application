import { Flex } from '@strapi/design-system';
import { DataBase } from './DataBase';
import { IMPORTABLE_COLLECTIONS } from '../../../server/src/services/utils/importableCollections';
import { findData } from '../api/data';
import type { ReactElement } from 'react';
import type { ApiResult } from 'src/api/utils/apiResult.type';

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
        Find and export any data. Provide both the collection and the filters to apply as well as
        optional populate terms, e.g.:
        <code>
          {'{'}
          "collection": "candidates", "filters": {'{'}
          "email": {'{'}
          "$contains": "example.com"
          {'}'}
          {'}'}, "populate": {'{'}
          "nominations": true
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
      <p>
        NB. You must define <code>filters</code> even if it’s empty.
      </p>
    </Flex>
  );
  return <DataBase intro={intro} submitLabel={submitLabel} submitHandler={submitHandler} />;
}
