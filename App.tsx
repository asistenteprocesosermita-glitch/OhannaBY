
import React, { useState, useEffect, useCallback } from 'react';
import { Booking, ReservationType, Guest } from './types';
import { formatDateKey, getMonthName, getDaysInMonth, formatCurrency } from './utils/helpers';
import CalendarGrid from './components/CalendarGrid';
import BookingModal from './components/BookingModal';
import { calculateHospedajePrice } from './constants';

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('ohanna_bay_bookings');
    if (saved) {
      setBookings(JSON.parse(saved));
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('ohanna_bay_bookings', JSON.stringify(bookings));
  }, [bookings]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleAddBooking = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedBooking(null);
    setIsModalOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setSelectedDate(booking.startDate);
    setIsModalOpen(true);
  };

  const saveBooking = (booking: Booking) => {
    if (selectedBooking) {
      setBookings(prev => prev.map(b => b.id === booking.id ? booking : b));
    } else {
      setBookings(prev => [...prev, booking]);
    }
    setIsModalOpen(false);
  };

  const deleteBooking = (id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id));
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  return (
    <div className="min-h-screen pb-12 bg-slate-50">
      {/* Header */}
      <header className="bg-indigo-700 text-white p-4 md:p-6 shadow-lg mb-4 md:mb-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">OHANNA BAY</h1>
            <p className="text-xs md:text-sm opacity-90">Gestión de Reservas</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <a 
              href="https://calendar.google.com/calendar/embed?src=7780f7085d435f8d62c0d6f0368a29965149fb2d9134768cdb15cf4eddce53fb%40group.calendar.google.com&ctz=America%2FBogota"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] md:text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 border border-white/10"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              VER CALENDARIO PÚBLICO
            </a>
            <div className="flex items-center gap-2 md:gap-4 bg-white/10 p-1.5 md:p-2 rounded-lg">
            <button 
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="15 19l-7-7 7-7"/></svg>
            </button>
            <h2 className="text-sm md:text-xl font-semibold min-w-[120px] md:min-w-[150px] text-center">
              {getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}
            </h2>
            <button 
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>
    </header>

      <main className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8">
        {/* Quick Stats - Grid 2x2 on Mobile, 5 on Desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
            <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase">Reservas</p>
            <p className="text-lg md:text-2xl font-bold text-indigo-600">
              {bookings.filter(b => new Date(b.startDate + 'T00:00:00').getMonth() === currentDate.getMonth()).length}
            </p>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
            <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase">Hospedajes</p>
            <p className="text-lg md:text-2xl font-bold text-emerald-600">
              {bookings.filter(b => b.type === ReservationType.HOSPEDAJE && new Date(b.startDate + 'T00:00:00').getMonth() === currentDate.getMonth()).length}
            </p>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
            <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase">Pasadías</p>
            <p className="text-lg md:text-2xl font-bold text-sky-600">
              {bookings.filter(b => b.type === ReservationType.PASADIA && new Date(b.startDate + 'T00:00:00').getMonth() === currentDate.getMonth()).length}
            </p>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
            <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase">Saldos Reservas</p>
            <p className="text-lg md:text-2xl font-bold text-rose-600 truncate">
              {formatCurrency(bookings.reduce((acc, b) => acc + (new Date(b.startDate + 'T00:00:00').getMonth() === currentDate.getMonth() ? b.balance : 0), 0))}
            </p>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
            <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase">Aseo Pendiente</p>
            <p className="text-lg md:text-2xl font-bold text-amber-600 truncate">
              {formatCurrency(bookings.reduce((acc, b) => acc + (b.cleaningBalance || 0), 0))}
            </p>
          </div>
        </div>

        <CalendarGrid 
          currentDate={currentDate} 
          bookings={bookings} 
          onAddBooking={handleAddBooking}
          onEditBooking={handleEditBooking}
        />

        {/* Payment Methods Summary */}
        <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              Recaudación por Método ({getMonthName(currentDate.getMonth())})
            </h3>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Total Recaudado</p>
              <p className="text-xl font-black text-indigo-700">
                {formatCurrency(bookings.reduce((acc, b) => {
                  let bookingTotal = 0;
                  if (b.payments && b.payments.length > 0) {
                    bookingTotal = b.payments.reduce((sum, p) => {
                      const paymentDate = new Date(p.date + 'T00:00:00');
                      if (paymentDate.getMonth() === currentDate.getMonth() && paymentDate.getFullYear() === currentDate.getFullYear()) {
                        return sum + p.amount;
                      }
                      return sum;
                    }, 0);
                  } else if (b.deposit) {
                    const bookingDate = new Date(b.startDate + 'T00:00:00');
                    if (bookingDate.getMonth() === currentDate.getMonth() && bookingDate.getFullYear() === currentDate.getFullYear()) {
                      bookingTotal = b.deposit;
                    }
                  }
                  return acc + bookingTotal;
                }, 0))}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(() => {
              const methodTotals: Record<string, number> = {};
              let total = 0;
              
              bookings.forEach(b => {
                if (b.payments && b.payments.length > 0) {
                  b.payments.forEach(p => {
                    const paymentDate = new Date(p.date + 'T00:00:00');
                    if (paymentDate.getMonth() === currentDate.getMonth() && paymentDate.getFullYear() === currentDate.getFullYear()) {
                      methodTotals[p.method] = (methodTotals[p.method] || 0) + p.amount;
                      total += p.amount;
                    }
                  });
                } else if (b.deposit) {
                  const bookingDate = new Date(b.startDate + 'T00:00:00');
                  if (bookingDate.getMonth() === currentDate.getMonth() && bookingDate.getFullYear() === currentDate.getFullYear()) {
                    const method = b.paymentMethod || 'No especificado';
                    methodTotals[method] = (methodTotals[method] || 0) + b.deposit;
                    total += b.deposit;
                  }
                }
              });

              return Object.entries(methodTotals).sort((a, b) => b[1] - a[1]).map(([method, amount]) => (
                <div key={method} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">{method}</p>
                    <p className="text-lg font-bold text-slate-800">{formatCurrency(amount)}</p>
                  </div>
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-indigo-600 font-bold text-xs">
                      {total > 0 ? Math.round((amount / total) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </main>

      {isModalOpen && (
        <BookingModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={saveBooking}
          onDelete={deleteBooking}
          date={selectedDate}
          initialBooking={selectedBooking}
        />
      )}
    </div>
  );
};

export default App;
