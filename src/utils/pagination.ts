export function parsePagination(inputPage?: string, inputLimit?: string) {
  const page = Math.max(1, parseInt(inputPage || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(inputLimit || '20', 10)));
  return { page, limit };
}
