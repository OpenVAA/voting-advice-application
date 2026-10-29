import { getCustomData } from '@openvaa/app-shared';
import type { AnyQuestionVariant } from '@openvaa/data';

/**
 * Whether the question has content for the extended-info popup: info text, info sections or arguments.
 * @param question - The question to check.
 * @returns `true` if the question has info text or at least one info section or argument group.
 */
export function hasExtendedInfo(question: AnyQuestionVariant): boolean {
  const { infoSections, arguments: args } = getCustomData(question);
  return !!question.info || !!infoSections?.length || !!args?.length;
}
