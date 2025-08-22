import { translate } from '$lib/i18n';
import type { LocalizedQuestionArguments, QuestionArguments } from '@openvaa/app-shared';

export function translateQuestionArguments(
  data: Array<LocalizedQuestionArguments> | null,
  locale: string | null
): Array<QuestionArguments> {
  if (data && Array.isArray(data)) {
    return data
      .filter((v) => v && typeof v === 'object')
      .flatMap((arg) => {
        const { type, arguments: args, ...rest } = arg;
        return type && args && Array.isArray(args)
          ? {
              arguments: args.map(({ content, ...argRest }) => ({
                content: translate(content, locale),
                ...argRest
              })),
              type,
              ...rest
            }
          : [];
      });
  }

  return [];
}
