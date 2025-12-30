// Utility functions

export const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), ms));

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('ko-KR');
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
