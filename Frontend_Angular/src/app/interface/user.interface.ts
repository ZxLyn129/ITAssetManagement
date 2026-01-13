export interface User {
  id?: string;
  userName: string;
  email: string;
  password?: string;
  role: number | string;
  isTerminated?: boolean;
}