import { Data } from '@strapi/strapi';
import { apiPost } from './utils/apiPost';
import type {
  DeleteDataResult,
  FindDataResult,
  ImportDataResult,
  RegistrationStatus,
} from '../../../server/src/services/data.type';

export async function importData(data: Record<string, unknown>): Promise<ImportDataResult> {
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

export async function deleteData(data: Record<string, unknown>): Promise<DeleteDataResult> {
  const response = await apiPost('/openvaa-admin-tools/delete-data', {
    data,
  }).catch((e) => e);
  let error: string | undefined;
  let deleted: Record<string, number> | undefined;
  if (response instanceof Error) {
    error = response.message;
  } else if (!response.ok) {
    error = 'There was an error deleting the data';
  } else {
    const data: DeleteDataResult = await response.json();
    const { type, cause } = data;
    if (type !== 'success') error = cause ?? 'There was an error deleting the data';
    else ({ deleted } = data);
  }
  return error ? { type: 'failure', cause: error } : { type: 'success', deleted };
}

export async function findData(args: Record<string, unknown>): Promise<FindDataResult> {
  const response = await apiPost('/openvaa-admin-tools/find-data', args).catch((e) => e);
  let error: string | undefined;
  let data: Array<Data.Entity> | undefined;
  if (response instanceof Error) {
    error = response.message;
  } else if (!response.ok) {
    error = 'There was an error finding the data';
  } else {
    const result: FindDataResult = await response.json();
    const { type, cause } = result;
    if (type !== 'success') error = cause ?? 'There was an error finding the data';
    else ({ data } = result);
  }
  return error ? { type: 'failure', cause: error } : { type: 'success', data };
}

export async function findCandidates(args: {
  registrationStatus: RegistrationStatus;
  constituency?: string;
}): Promise<FindDataResult> {
  const response = await apiPost('/openvaa-admin-tools/find-candidates', args).catch((e) => e);
  let error: string | undefined;
  let data: Array<Data.Entity> | undefined;
  if (response instanceof Error) {
    error = response.message;
  } else if (!response.ok) {
    error = 'There was an error finding the candidates';
  } else {
    const result: FindDataResult = await response.json();
    const { type, cause } = result;
    if (type !== 'success') error = cause ?? 'There was an error finding the candidates';
    else ({ data } = result);
  }
  return error ? { type: 'failure', cause: error } : { type: 'success', data };
}
