
import React, { useState, useEffect } from 'react';
import { Booking, ReservationType, Guest, Expense, Payment } from '../types';
import { formatDateKey, formatCurrency } from '../utils/helpers';
import { calculateHospedajePrice, calculatePasadiaPrice } from '../constants';
import ShareActions from './ShareActions';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: Booking) => void;
  onDelete: (id: string) => void;
  date: string | null;
  initialBooking: Booking | null;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onSave, onDelete, date, initialBooking }) => {
  const [type, setType] = useState<ReservationType>(initialBooking?.type || ReservationType.HOSPEDAJE);
  const [startDate, setStartDate] = useState<string>(initialBooking?.startDate || date || '');
  const [endDate, setEndDate] = useState<string>(initialBooking?.endDate || '');
  const [numPeople, setNumPeople] = useState<number>(initialBooking?.numPeople || 2);
  const [numChildren, setNumChildren] = useState<number>(initialBooking?.numChildren || 0);
  const [discount, setDiscount] = useState<number>(initialBooking?.discount || 0);
  const [paymentMethod, setPaymentMethod] = useState<string>(initialBooking?.paymentMethod || 'Efectivo');
  const [cleaningTotal, setCleaningTotal] = useState<number>(initialBooking?.cleaningTotal || 0);
  const [cleaningDeposit, setCleaningDeposit] = useState<number>(initialBooking?.cleaningDeposit || 0);
  const [guests, setGuests] = useState<Guest[]>(initialBooking?.guests || [{ name: '', document: '' }]);
  const [payments, setPayments] = useState<Payment[]>(initialBooking?.payments || (initialBooking?.deposit ? [{ id: 'legacy', amount: initialBooking.deposit, method: initialBooking.paymentMethod || 'Efectivo', date: initialBooking.startDate }] : []));
  const [isHoliday, setIsHoliday] = useState<boolean>(initialBooking?.isHoliday || false);
  const [schedule, setSchedule] = useState<string>(initialBooking?.schedule || "9:00 AM - 5:30 PM");
  const [expenses, setExpenses] = useState<Expense[]>(initialBooking?.expenses || []);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  useEffect(() => {
    if (!initialBooking && type === ReservationType.HOSPEDAJE && startDate && !endDate) {
      const nextDay = new Date(startDate + 'T00:00:00');
      nextDay.setDate(nextDay.getDate() + 1);
      setEndDate(formatDateKey(nextDay));
    } else if (type === ReservationType.PASADIA) {
      setEndDate(startDate);
    }
  }, [type, startDate, initialBooking]);

  useEffect(() => {
    if (!startDate || !endDate) return;
    
    let total = 0;
    if (type === ReservationType.HOSPEDAJE) {
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');
      let current = new Date(start);
      while (current < end) {
        total += calculateHospedajePrice(numPeople, numChildren, current, isHoliday);
        current.setDate(current.getDate() + 1);
      }
    } else {
      total = calculatePasadiaPrice(numPeople, numChildren, new Date(startDate + 'T00:00:00'), isHoliday);
    }
    setTotalPrice(total);
  }, [type, numPeople, numChildren, startDate, endDate, isHoliday]);

  const deposit = payments.reduce((acc, p) => acc + p.amount, 0);
  const balance = totalPrice - discount - deposit;
  const cleaningBalance = cleaningTotal - cleaningDeposit;

  const getDaysCount = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    if (type === ReservationType.PASADIA) return 1;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysCount = getDaysCount();

  const handleAddGuest = () => setGuests([...guests, { name: '', document: '' }]);
  const handleGuestChange = (index: number, field: keyof Guest, value: string) => {
    const newGuests = [...guests];
    newGuests[index][field] = value;
    setGuests(newGuests);
  };
  const handleRemoveGuest = (index: number) => setGuests(guests.filter((_, i) => i !== index));

  const handleAddExpense = () => setExpenses([...expenses, { id: Date.now().toString(), description: '', amount: 0 }]);
  const handleExpenseChange = (id: string, field: keyof Expense, value: string | number) => {
    setExpenses(expenses.map(e => e.id === id ? { ...e, [field]: value } : e));
  };
  const handleRemoveExpense = (id: string) => setExpenses(expenses.filter(e => e.id !== id));

  const handleAddPayment = () => setPayments([...payments, { id: Date.now().toString(), amount: 0, method: 'Efectivo', date: formatDateKey(new Date()) }]);
  const handlePaymentChange = (id: string, field: keyof Payment, value: string | number) => {
    setPayments(payments.map(p => p.id === id ? { ...p, [field]: value } : p));
  };
  const handleRemovePayment = (id: string) => setPayments(payments.filter(p => p.id !== id));

  const handleSave = () => {
    if (!startDate || !endDate) {
      alert("Por favor selecciona las fechas");
      return;
    }
    const booking: Booking = {
      id: initialBooking?.id || Date.now().toString(),
      startDate,
      endDate,
      type,
      numPeople,
      numChildren,
      guests,
      totalPrice,
      discount,
      deposit,
      balance,
      expenses,
      payments,
      paymentMethod: payments[0]?.method || 'Efectivo',
      schedule,
      isHoliday,
      cleaningTotal,
      cleaningDeposit,
      cleaningBalance
    };
    onSave(booking);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-800">
              {initialBooking ? 'Editar Reserva' : 'Nueva Reserva'}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Ohanna Bay</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Tipo</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value as ReservationType)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={ReservationType.HOSPEDAJE}>Hospedaje</option>
                <option value={ReservationType.PASADIA}>Pasadía</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Personas</label>
              <input 
                type="number" 
                min="1" 
                value={numPeople} 
                onChange={(e) => setNumPeople(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Niños</label>
              <input 
                type="number" 
                min="0" 
                value={numChildren} 
                onChange={(e) => setNumChildren(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Ingreso</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
              />
            </div>
            {type === ReservationType.HOSPEDAJE && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Salida</label>
                <input 
                  type="date" 
                  value={endDate} 
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 p-2 bg-rose-50 rounded-lg">
            <input 
              type="checkbox" 
              id="isHoliday" 
              checked={isHoliday} 
              onChange={(e) => setIsHoliday(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <label htmlFor="isHoliday" className="text-[11px] md:text-xs font-bold text-rose-700 uppercase">¿Es temporada festiva / Sábado?</label>
          </div>

          {type === ReservationType.PASADIA && (
            <div className="bg-sky-50 p-3 rounded-xl">
              <label className="block text-xs font-bold text-sky-800 mb-2 uppercase">Horario Pasadía</label>
              <div className="grid grid-cols-1 gap-2">
                <label className="flex items-center gap-3 p-2 bg-white rounded-lg border border-sky-100 cursor-pointer">
                  <input type="radio" checked={schedule === "9:00 AM - 5:30 PM"} onChange={() => setSchedule("9:00 AM - 5:30 PM")} className="text-sky-600" />
                  <span className="text-xs font-medium">9:00 AM - 5:30 PM</span>
                </label>
                <label className="flex items-center gap-3 p-2 bg-white rounded-lg border border-sky-100 cursor-pointer">
                  <input type="radio" checked={schedule === "2:00 PM - 10:30 PM"} onChange={() => setSchedule("2:00 PM - 10:30 PM")} className="text-sky-600" />
                  <span className="text-xs font-medium">2:00 PM - 10:30 PM</span>
                </label>
              </div>
            </div>
          )}

          <div className="bg-indigo-600 p-4 rounded-2xl shadow-md text-white space-y-3">
            <div className="flex justify-between items-center border-b border-indigo-400 pb-2">
              <span className="text-[10px] font-bold uppercase opacity-80">Valor Subtotal</span>
              <span className="font-bold text-xl">{formatCurrency(totalPrice)}</span>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[9px] font-bold uppercase opacity-80 mb-1">Descuento</label>
                <input 
                  type="number" 
                  value={discount} 
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white font-bold outline-none text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-[9px] font-bold uppercase opacity-80">Abonos Realizados</label>
                <button onClick={handleAddPayment} className="text-[9px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded font-bold uppercase transition-colors">
                  + Nuevo Abono
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {payments.map((p) => (
                  <div key={p.id} className="grid grid-cols-12 gap-2 items-center bg-white/5 p-2 rounded-lg border border-white/10">
                    <div className="col-span-3">
                      <input 
                        type="number" 
                        value={p.amount} 
                        onChange={(e) => handlePaymentChange(p.id, 'amount', Number(e.target.value))}
                        className="w-full bg-transparent border-b border-white/20 text-white font-bold outline-none text-[10px] p-1"
                        placeholder="Monto"
                      />
                    </div>
                    <div className="col-span-4">
                      <select 
                        value={p.method} 
                        onChange={(e) => handlePaymentChange(p.id, 'method', e.target.value)}
                        className="w-full bg-transparent text-white font-bold outline-none text-[10px] p-1"
                      >
                        <option value="Nequi Hernan" className="text-slate-800">Nequi Hernan</option>
                        <option value="Nequi Lady" className="text-slate-800">Nequi Lady</option>
                        <option value="Davivienda" className="text-slate-800">Davivienda</option>
                        <option value="DaviPlata" className="text-slate-800">DaviPlata</option>
                        <option value="Efectivo" className="text-slate-800">Efectivo</option>
                        <option value="Otro" className="text-slate-800">Otro</option>
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input 
                        type="date" 
                        value={p.date} 
                        onChange={(e) => handlePaymentChange(p.id, 'date', e.target.value)}
                        className="w-full bg-transparent text-white font-bold outline-none text-[9px] p-1 border-b border-white/20"
                      />
                    </div>
                    <div className="col-span-2 text-right">
                      <button onClick={() => handleRemovePayment(p.id)} className="text-rose-300 hover:text-rose-100 p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && (
                  <p className="text-[10px] text-center opacity-50 py-2 italic">Sin abonos registrados</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-indigo-400">
              <div>
                <label className="block text-[9px] font-bold uppercase opacity-80 mb-1">Total Abonado</label>
                <div className="p-2 bg-white/10 rounded-lg font-bold text-sm text-white">
                  {formatCurrency(deposit)}
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase opacity-80 mb-1">Por Cobrar</label>
                <div className={`p-2 bg-white/20 rounded-lg font-bold text-sm ${balance > 0 ? 'text-rose-200' : 'text-emerald-200'}`}>
                  {formatCurrency(balance)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-100 p-4 rounded-2xl space-y-3">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gestión de Aseo</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-600 uppercase mb-1">Total Acordado</label>
                <input 
                  type="number" 
                  value={cleaningTotal} 
                  onChange={(e) => setCleaningTotal(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-600 uppercase mb-1">Abonado</label>
                <input 
                  type="number" 
                  value={cleaningDeposit} 
                  onChange={(e) => setCleaningDeposit(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-600 uppercase mb-1">Saldo pendiente a pagar</label>
                <div className="p-2 bg-slate-200 border border-slate-300 rounded-lg text-xs font-bold text-slate-700">
                  {formatCurrency(cleaningBalance)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <span className="text-xs font-bold text-indigo-800 uppercase">Duración:</span>
            <span className="text-sm font-black text-indigo-900">
              {daysCount} {type === ReservationType.HOSPEDAJE ? (daysCount === 1 ? 'Día Hospedaje' : 'Días Hospedaje') : (daysCount === 1 ? 'Día Pasadía' : 'Días Pasadía')}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Huéspedes</h3>
              <button onClick={handleAddGuest} className="text-[10px] bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 font-bold transition-colors uppercase">
                + Añadir
              </button>
            </div>
            <div className="space-y-2">
              {guests.map((guest, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input placeholder="Nombre" value={guest.name} onChange={(e) => handleGuestChange(idx, 'name', e.target.value)} className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
                  <input placeholder="Doc" value={guest.document} onChange={(e) => handleGuestChange(idx, 'document', e.target.value)} className="w-24 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
                  <button onClick={() => handleRemoveGuest(idx)} className="text-rose-400 p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {initialBooking && (
            <div className="pt-4 border-t border-slate-100">
              <ShareActions booking={{...initialBooking, guests, numPeople, numChildren, type, balance, schedule, startDate, endDate, discount, totalPrice, payments, cleaningTotal, cleaningDeposit, cleaningBalance}} />
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-3 sticky bottom-0 bg-white">
          <div className="flex gap-2 w-full md:w-auto">
            {initialBooking && (
              <button 
                onClick={() => {
                  if(confirm('¿Deseas eliminar esta reserva y liberar las fechas?')) {
                    onDelete(initialBooking.id);
                  }
                }} 
                className="flex-1 md:flex-none px-6 py-3 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-colors text-sm"
              >
                Eliminar
              </button>
            )}
            <button onClick={onClose} className="flex-1 md:flex-none px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm">
              Cancelar
            </button>
          </div>
          <button onClick={handleSave} className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all text-sm">
            {initialBooking ? 'Actualizar Reserva' : 'Guardar Reserva'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
