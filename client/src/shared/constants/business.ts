export const BUSINESS_TYPES = [
  { value: 'nursery', label: 'Nursery' },
  { value: 'farm', label: 'Farm' },
  { value: 'tools', label: 'Agricultural Tools Shop' },
  { value: 'services', label: 'Agricultural Services' },
  { value: 'other', label: 'Other' },
] as const;

export type BusinessTypeValue = (typeof BUSINESS_TYPES)[number]['value'];
