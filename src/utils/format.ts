export function truncateMiddle(value: string, start = 4, end = 4): string {
  if (!value) return '';
  if (value.length <= start + end) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

export function formatAddress(address: string, start = 4, end = 4): string {
  return truncateMiddle(address, start, end);
}