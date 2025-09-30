import { describe, expect, it } from 'vitest';
import { parsePagination } from '../../src/utils/pagination';

describe('parsePagination', () => {
  it('defaults to page 1 of 20', () => {
    expect(parsePagination()).toEqual({ page: 1, limit: 20 });
  });

  it('clamps the limit to 1..100 and the page to >= 1', () => {
    expect(parsePagination('0', '500')).toEqual({ page: 1, limit: 100 });
    expect(parsePagination('3', '0')).toEqual({ page: 3, limit: 1 });
  });
});
