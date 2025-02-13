import { apiPost } from './utils/apiPost';
import type {
  DeleteDataResult,
  ImportDataResult,
} from '../../../server/src/services/utils/data.type';

export async function importData(data: object): Promise<ImportDataResult> {
  const response = await apiPost('/openvaa-admin-tools/import-data', {
    data,
  }).catch((e) => e);
  let error: string | undefined;
  let created: Record<string, number> | undefined;
  let updated: Record<string, number> | undefined;
  if (response instanceof Error) {
    error = response.message;
  } else if (!response.ok) {
    error = 'There was an error importing the data';
  } else {
    const data: ImportDataResult = await response.json();
    const { type, cause } = data;
    if (type !== 'success') error = cause ?? 'There was an error importing the data';
    else ({ created, updated } = data);
  }
  return error ? { type: 'failure', cause: error } : { type: 'success', created, updated };
}

export async function deleteData(data: object): Promise<DeleteDataResult> {
  const response = await apiPost('/openvaa-admin-tools/delete-data', {
    data,
  }).catch((e) => e);
  let error: string | undefined;
  let deleted: Record<string, number> | undefined;
  if (response instanceof Error) {
    error = response.message;
  } else if (!response.ok) {
    error = 'There was an error deletingh the data';
  } else {
    const data: DeleteDataResult = await response.json();
    const { type, cause } = data;
    if (type !== 'success') error = cause ?? 'There was an error deleting the data';
    else ({ deleted } = data);
  }
  return error ? { type: 'failure', cause: error } : { type: 'success', deleted };
}
