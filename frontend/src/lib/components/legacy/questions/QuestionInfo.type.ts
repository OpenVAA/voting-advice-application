import type { ExpanderProps } from '$lib/components/expander';

export type QuestionInfoProps = Partial<ExpanderProps> & Required<Pick<LegacyQuestionProps, 'info'>>;
