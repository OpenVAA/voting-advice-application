import { Flex } from '@strapi/design-system';
import { ReactElement } from 'react';
import { ApiResult } from 'src/api/utils/apiResult.type';
import { DataBase } from './DataBase';
import { IMPORTABLE_COLLECTIONS } from '../../../server/src/services/utils/importableCollections';
import { importData } from '../api/data';

/**
 * A component for accessing the `/openvaa-admin-tools/import-data` endpoint.
 */
export function ImportData(): ReactElement {
  const title = 'Import data';
  const submitLabel = 'Import';
  async function submitHandler(data: object): Promise<ApiResult> {
    const result = await importData(data);
    if (result.type !== 'success') return result;
    return {
      type: 'success',
      message: `Data imported successfully. Created: ${Object.entries(result.created ?? {})
        .map(([k, v]) => `${v} ${k}`)
        .join(' • ')}. Updated: ${Object.entries(result.updated ?? {})
        .map(([k, v]) => `${v} ${k}`)
        .join(' • ')}.`,
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
  return (
    <DataBase title={title} intro={intro} submitLabel={submitLabel} submitHandler={submitHandler} />
  );
}
