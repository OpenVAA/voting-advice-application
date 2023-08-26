export interface QuestionProps {
  id: string;
  text: string;
  options: {value: number; label: string}[];
  topic?: string;
  info?: string;
}
