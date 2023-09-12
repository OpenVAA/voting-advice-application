export type OnChangeEventDetail = {
  id: string;
  value: number;
  originalEvent: Event;
};

export type OnSkipEventDetail = {
  id: string;
  originalEvent: MouseEvent;
};
