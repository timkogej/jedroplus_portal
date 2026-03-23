export const formatDate = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00');
  const formatted = new Intl.DateTimeFormat('sl-SI', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00');
  const formatted = new Intl.DateTimeFormat('sl-SI', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};
