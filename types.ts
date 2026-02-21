
export enum ReservationType {
  HOSPEDAJE = 'Hospedaje',
  PASADIA = 'Pasadía'
}

export interface Guest {
  name: string;
  document: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
}

export interface Payment {
  id: string;
  amount: number;
  method: string;
  date: string;
}

export interface Booking {
  id: string;
  startDate: string; // ISO string YYYY-MM-DD
  endDate: string;   // ISO string YYYY-MM-DD
  type: ReservationType;
  numPeople: number;
  numChildren: number;
  guests: Guest[];
  totalPrice: number;
  discount: number;
  deposit: number; // Abono total (suma de payments)
  balance: number; // Saldo
  expenses: Expense[];
  payments: Payment[];
  paymentMethod?: string; // Principal o primer método
  schedule?: string; // Para Pasadía
  isHoliday?: boolean;
  cleaningTotal: number;
  cleaningDeposit: number;
  cleaningBalance: number;
}
