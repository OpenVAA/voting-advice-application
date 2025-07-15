import { Flex } from '@strapi/design-system';
import { DataBase } from './DataBase';
import { IMPORTABLE_COLLECTIONS } from '../../../server/src/services/utils/importableCollections';
import { importData } from '../api/data';
import type { ReactElement } from 'react';
import type { ApiResult } from 'src/api/utils/apiResult.type';

/**
 * A component for accessing the `/openvaa-admin-tools/import-data` endpoint.
 */
export function ImportData(): ReactElement {
  const submitLabel = 'Import';
  async function submitHandler(data: Record<string, unknown>): Promise<ApiResult> {
    const { type, cause, ...rest } = await importData(data);
    if (type !== 'success') return { type, cause };
    return {
      type: 'success',
      data: rest,
    };
  }
  const intro = (
    <Flex direction="column" gap={3} alignItems="stretch">
      <p>
        Import any data. If the data is supplied with documentIds or externalIds or it is a single
        collection type, any matching items will be updated instead of created. The data must be
        supplied as Arrays contained under collection-name keys, e.g.,{' '}
        <code>
          {'{'} "constituencies": [ {'{'} "externalId": "foo", "name" {'{'} "fi": "Foo", "sv": "Fåå"{' '}
          {'} } ] }'}
        </code>
        .
      </p>
      <p>
        The data is created in the order it is the json, so make sure any objects referenced by
        externalId are created before referencing them.
      </p>
      <p>
        Relations can be linked using documentIds or externalIds, e.g.,{' '}
        <code>
          {'{'} "parent": {'{'} "externalId": "foo" or ["foo", "bar"] {'} }'}
        </code>
        .
      </p>
      <p>If there are any errors during the import, no changes are made.</p>
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
