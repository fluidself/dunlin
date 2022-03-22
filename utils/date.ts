export function dateCompare(d1: string, d2: string) {
  return new Date(d1).getTime() - new Date(d2).getTime();
}

export const getReadableDatetime = (dateStr: string | number) => {
  return new Date(dateStr).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};
