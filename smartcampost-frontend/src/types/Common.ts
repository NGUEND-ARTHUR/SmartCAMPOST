export interface PageResponse<T> {
  content: T[];
  number: number; // current page (0-based)
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}
