import type { Id } from '@openvaa/core';

/**
 * Formats a number or string id into a valid `Id` or `null`
 * @param id
 */
export function formatId(id: string | number): Id;
export function formatId(id: null | undefined): null;
export function formatId(id: string | number | null | undefined): Id | null;
export function formatId(id: string | number | null | undefined): Id | null {
  return id == null ? null : `${id}`;
}
