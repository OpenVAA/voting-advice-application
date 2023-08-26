export interface QuestionProps {
  id: string;
  text: string;
  options: {key: number; label: string}[];
  category?: string;
  info?: string;
}
