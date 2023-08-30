export enum QuestionType {
  Likert = 'Likert'
}

export interface QuestionProps {
  id: string;
  text: string;
  type: QuestionType;
  options: {key: number; label: string}[];
  category?: string;
  info?: string;
}

export type OnChangeEventDetail = {
  id: string;
  value: number;
  originalEvent: Event;
};

export type OnSkipEventDetail = {
  id: string;
  originalEvent: MouseEvent;
};
