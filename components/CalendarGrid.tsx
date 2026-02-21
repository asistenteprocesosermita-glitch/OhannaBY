
import React from 'react';
import { Booking, ReservationType } from '../types';
import { getDaysInMonth, formatDateKey, formatCurrency } from '../utils/helpers';
import { COLORS, calculateHospedajePrice } from '../constants';

interface CalendarGridProps {
  currentDate: Date;
  bookings: Booking[];
  onAddBooking: (date: string) => void;
  onEditBooking: (booking: Booking) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ currentDate, bookings, onAddBooking, onEditBooking }) => {
  const days = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  
  const firstDayOfMonth = days[0].getDay();
  const paddingDays = Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 });
  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
        {weekDays.map((day, idx) => (
          <div key={idx} className="p-2 md:p-3 text-center text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {paddingDays.map((_, i) => (
          <div key={`padding-${i}`} className="h-20 md:h-32 bg-slate-50/30 border border-slate-100" />
        ))}
        
        {days.map((date) => {
          const dateStr = formatDateKey(date);
          const dayBooking = bookings.find(b => {
            if (b.type === ReservationType.PASADIA) return b.startDate === dateStr;
            return dateStr >= b.startDate && dateStr < b.endDate;
          });

          const basePrice = calculateHospedajePrice(2, 0, date);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const isOccupied = !!dayBooking;

          return (
            <div 
              key={dateStr}
              onClick={() => !isOccupied ? onAddBooking(dateStr) : undefined}
              className={`min-h-[80px] md:min-h-[140px] p-1.5 md:p-2 border border-slate-100 relative group transition-colors flex flex-col ${isOccupied ? 'bg-slate-50/50 cursor-default' : 'hover:bg-slate-50 cursor-pointer'}`}
            >
              <div className="flex flex-col md:flex-row md:justify-between items-start mb-1 gap-0.5">
                <span className={`text-xs md:text-sm font-bold ${isWeekend ? 'text-indigo-600' : 'text-slate-500'}`}>
                  {date.getDate()}
                </span>
                {!isOccupied && (
                  <span className="text-[7px] md:text-[10px] text-slate-400 font-semibold truncate max-w-full">
                    {formatCurrency(basePrice)}
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-1 overflow-hidden">
                {dayBooking && (
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditBooking(dayBooking);
                    }}
                    className={`text-[7px] md:text-[11px] p-1 md:p-1.5 rounded-md border shadow-sm leading-tight transition-transform active:scale-95 cursor-pointer truncate flex flex-col gap-0.5 ${dayBooking.type === ReservationType.HOSPEDAJE ? COLORS.hospedaje : COLORS.pasadia}`}
                  >
                    <div className="font-black uppercase tracking-tighter md:tracking-normal truncate">
                      {dayBooking.type}
                    </div>
                    <div className="truncate opacity-90 font-medium">
                      {dayBooking.guests[0]?.name || 'Ocupado'}
                    </div>
                  </div>
                )}
              </div>

              {!isOccupied && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddBooking(dateStr);
                  }}
                  className="absolute bottom-1 right-1 p-1 bg-indigo-50 text-indigo-600 rounded-full opacity-0 group-hover:opacity-100 md:block hidden hover:bg-indigo-600 hover:text-white transition-all shadow-md"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                </button>
              )}
              
              {isOccupied && dayBooking?.startDate === dateStr && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 md:hidden shadow-sm" title="Inicio de reserva" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
