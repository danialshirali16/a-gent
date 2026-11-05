export const previewComponents = [
  { id: 'button', label: 'Button' },
  { id: 'input', label: 'Input & Textarea' },
  { id: 'field', label: 'Field' },
  { id: 'select', label: 'Select & Combobox' },
  { id: 'checkbox', label: 'Checkbox & Switch' },
  { id: 'tabs', label: 'Tabs & Segmented' },
  { id: 'tooltip', label: 'Tooltip' },
  { id: 'menu', label: 'Dropdown & Menu' },
  { id: 'popover', label: 'Popover' },
  { id: 'dialog', label: 'Dialog & Confirmation' },
  { id: 'badge', label: 'Badge & Status' },
  { id: 'avatar', label: 'Avatar & Agent mark' },
  { id: 'alert', label: 'Alert & Toast' },
  { id: 'card', label: 'Card & List row' },
  { id: 'search', label: 'Search field' },
  { id: 'composer', label: 'Composer & Attachment' },
  { id: 'message', label: 'Message & Activity' },
  { id: 'sidebar', label: 'Sidebar & Rail' },
] as const;

export type PreviewComponentId = typeof previewComponents[number]['id'];

export function isPreviewComponent(value: string | null): value is PreviewComponentId {
  return !!value && previewComponents.some(component => component.id === value);
}
