// Common TypeScript types

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}
