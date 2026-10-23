export const LIMITS = {
  embedTitle: 256,
  embedDescription: 4096,
  fieldName: 256,
  fieldValue: 1024,
  embedFooter: 2048,
  embedAuthor: 256,
  embedTotal: 6000,
  embedFields: 25,
  buttonLabel: 80,
  customId: 100,
  selectLabel: 100,
  selectDescription: 100,
  selectOptions: 25,
  modalTitle: 45,
  modalLabel: 45,
  modalInputs: 5,
  modalPlaceholder: 100,
  modalValue: 4000,
} as const;

export class UiLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UiLimitError';
  }
}

export function truncate(text: string, max: number): string {
  if (max <= 0) return '';
  if (text.length <= max) return text;
  if (max <= 3) return text.slice(0, max);
  return `${text.slice(0, max - 3)}...`;
}
