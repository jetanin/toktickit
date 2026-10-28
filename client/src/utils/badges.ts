import type { CSSProperties } from 'react';

const statuses: Record<string, [string, string, string]> = {
  New: ['#DEEBFF', '#0747A6', '#B3D4FF'], Open: ['#E3FCEF', '#006644', '#ABF5D1'],
  'In Progress': ['#FFF0B3', '#172B4D', '#FFE380'], 'Waiting for Requester': ['#EAE6FF', '#403294', '#C0B6F2'],
  Resolved: ['#EAF6EF', '#006B3C', '#C3E6D5'], Closed: ['#F4F5F7', '#42526E', '#DFE1E6'],
  Reopened: ['#FFEBE6', '#BF2600', '#FFBDAD'], Cancelled: ['#F4F5F7', '#61756C', '#DFE1E6'],
};
const priorities: Record<string, [string, string, string]> = {
  Low: ['#EAF6EF', '#0B7A46', '#C3E6D5'], Medium: ['#FEF8E7', '#8A6D00', '#FCEBB8'],
  High: ['#FCE8E6', '#C5221F', '#F7BDB8'], Critical: ['#5A1A1A', '#FFFFFF', '#3D1010'],
};
export function badgeStyle(value: string, kind: 'status' | 'priority'): CSSProperties {
  const [backgroundColor, color, border] = (kind === 'status' ? statuses : priorities)[value] ?? ['#F4F5F7', '#42526E', '#DFE1E6'];
  return { backgroundColor, color, border: `1px solid ${border}` };
}
