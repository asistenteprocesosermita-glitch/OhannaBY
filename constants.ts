
import { ReservationType } from './types';

export const COLORS = {
  hospedaje: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  pasadia: 'bg-sky-100 text-sky-800 border-sky-200',
  holiday: 'bg-rose-50 border-rose-100'
};

export const ADDITIONAL_RATES = {
  WEEKEND_HOLIDAY: 70000,
  WEEKDAY: 56000
};

export const CHILD_RATE = 40000;

export const calculateHospedajePrice = (
  numPeople: number, 
  numChildren: number,
  date: Date, 
  isHoliday: boolean = false
): number => {
  const day = date.getDay(); // 0 es Domingo, 6 es Sábado
  const isSpecialDay = day === 6 || day === 0 || isHoliday;
  
  let basePrice = 0;
  const effectivePeopleForBase = Math.min(numPeople, 6);
  
  if (effectivePeopleForBase <= 2) {
    basePrice = (day === 6 || isHoliday) ? 450000 : 380000;
  } else {
    const pricesWeek = { 3: 430000, 4: 500000, 5: 570000, 6: 640000 };
    const pricesWeekend = { 3: 520000, 4: 590000, 5: 660000, 6: 730000 };
    basePrice = (day === 6 || isHoliday) 
      ? pricesWeekend[effectivePeopleForBase as keyof typeof pricesWeekend] 
      : pricesWeek[effectivePeopleForBase as keyof typeof pricesWeek];
  }

  // Adicionales (más de 6 personas)
  const extraPeople = Math.max(0, numPeople - 6);
  const extraRate = isSpecialDay ? ADDITIONAL_RATES.WEEKEND_HOLIDAY : ADDITIONAL_RATES.WEEKDAY;
  
  return basePrice + (extraPeople * extraRate) + (numChildren * CHILD_RATE);
};

export const calculatePasadiaPrice = (
  numPeople: number, 
  numChildren: number,
  date: Date, 
  isHoliday: boolean = false
): number => {
  const day = date.getDay();
  const isWeekendOrHoliday = day === 0 || day === 6 || isHoliday;
  
  let basePrice = isWeekendOrHoliday ? 400000 : 280000;
  let extraRate = isWeekendOrHoliday ? ADDITIONAL_RATES.WEEKEND_HOLIDAY : ADDITIONAL_RATES.WEEKDAY;
  
  let total = basePrice;
  if (numPeople > 6) {
    total += (numPeople - 6) * extraRate;
  }
  
  total += numChildren * CHILD_RATE;
  
  return total;
};

export const DEFAULT_DEPOSIT_REIMBURSABLE = 150000;
