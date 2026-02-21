
import React, { useState } from 'react';
import { Booking, ReservationType } from '../types';
import { formatCurrency } from '../utils/helpers';

interface ShareActionsProps {
  booking: Partial<Booking>;
}

const ShareActions: React.FC<ShareActionsProps> = ({ booking }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const generateMonicaMessage = () => {
    const isHospedaje = booking.type === ReservationType.HOSPEDAJE;
    const checkIn = isHospedaje ? '3:00 PM' : booking.schedule?.split('-')[0].trim();
    const checkOut = isHospedaje ? '1:00 PM' : booking.schedule?.split('-')[1].trim();
    
    return `🏡 *RESERVA CHALET OHANNA BAY* 🏡
--------------------------------
👤 *Monica:*
📅 *Ingreso:* ${booking.startDate} (${checkIn})
📅 *Salida:* ${booking.endDate} (${checkOut})
🏨 *Tipo:* ${booking.type}
👥 *Personas:* ${booking.numPeople}
💰 *Saldo Pendiente:* ${formatCurrency(booking.balance || 0)}
--------------------------------`;
  };

  const generatePorteroMessage = () => {
    const guestList = booking.guests?.map(g => `• ${g.name} - ${g.document}`).join('\n') || 'No registrados';
    return `👮 *AUTORIZACIÓN PORTERÍA* 👮
--------------------------------
📅 *Fecha:* ${booking.startDate} al ${booking.endDate}
🏠 *Chalet Ohanna Bay*
👥 *Huéspedes:*
${guestList}
--------------------------------`;
  };

  const generateAdminSummary = () => {
    const totalGuests = (booking.numPeople || 0) + (booking.numChildren || 0);
    const finalTotal = (booking.totalPrice || 0) - (booking.discount || 0);
    
    const start = new Date(booking.startDate + 'T00:00:00');
    const end = new Date(booking.endDate + 'T00:00:00');
    let daysCount = 0;
    if (booking.type === ReservationType.PASADIA) {
      daysCount = 1;
    } else if (booking.startDate && booking.endDate) {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const dayLabel = booking.type === ReservationType.HOSPEDAJE 
      ? (daysCount === 1 ? 'Día Hospedaje' : 'Días Hospedaje') 
      : (daysCount === 1 ? 'Día Pasadía' : 'Días Pasadía');

    const paymentBreakdown = booking.payments && booking.payments.length > 0
      ? booking.payments.map(p => `• ${formatCurrency(p.amount)} (${p.method}) - ${p.date}`).join('\n')
      : `• ${formatCurrency(booking.deposit || 0)} (${booking.paymentMethod || 'No especificado'})`;

    return `📝 *RESUMEN DE RESERVA (ADMIN)* 📝
--------------------------------
👥 *Huéspedes totales:* ${totalGuests} (${booking.numPeople} adultos, ${booking.numChildren} niños)
📅 *Duración:* ${daysCount} ${dayLabel}
💰 *Desglose:* ${formatCurrency(booking.totalPrice || 0)} (Tarifa base + adicionales)
📉 *Descuento:* ${formatCurrency(booking.discount || 0)}
✅ *Total:* ${formatCurrency(finalTotal)}
💳 *Abonos:*
${paymentBreakdown}
🧹 *Aseo:* ${formatCurrency(booking.cleaningTotal || 0)} (Abonado: ${formatCurrency(booking.cleaningDeposit || 0)}, Saldo: ${formatCurrency(booking.cleaningBalance || 0)})
--------------------------------`;
  };

  const generateJSON = () => {
    const data = {
      cliente: booking.guests?.[0]?.name || 'No registrado',
      tipo: booking.type,
      inicio: booking.startDate,
      fin: booking.endDate,
      huespedes: (booking.numPeople || 0) + (booking.numChildren || 0),
      total: (booking.totalPrice || 0) - (booking.discount || 0),
      abonos: booking.payments || [{ amount: booking.deposit, method: booking.paymentMethod }],
      aseo_total: booking.cleaningTotal,
      aseo_abonado: booking.cleaningDeposit
    };
    return JSON.stringify(data, null, 2);
  };

  const calendarLink = "https://calendar.google.com/calendar/embed?src=7780f7085d435f8d62c0d6f0368a29965149fb2d9134768cdb15cf4eddce53fb%40group.calendar.google.com&ctz=America%2FBogota";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Enviar Información</h3>
        <a 
          href={calendarLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          Ver Calendario
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button 
          onClick={() => copyToClipboard(generateMonicaMessage(), 'Monica')}
          className="flex items-center justify-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all font-semibold text-xs"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 00-2 2h2v4l.586-.586z"/></svg>
          {copied === 'Monica' ? '¡Copiado!' : 'Mensaje Monica'}
        </button>
        <button 
          onClick={() => copyToClipboard(generatePorteroMessage(), 'Portero')}
          className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 hover:bg-blue-100 transition-all font-semibold text-xs"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          {copied === 'Portero' ? '¡Copiado!' : 'Lista Portería'}
        </button>
        <button 
          onClick={() => copyToClipboard(generateAdminSummary(), 'Admin')}
          className="flex items-center justify-center gap-2 p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all font-semibold text-xs"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          {copied === 'Admin' ? '¡Copiado!' : 'Resumen Admin'}
        </button>
        <button 
          onClick={() => copyToClipboard(generateJSON(), 'JSON')}
          className="flex items-center justify-center gap-2 p-3 bg-slate-50 text-slate-700 rounded-xl border border-slate-100 hover:bg-slate-100 transition-all font-semibold text-xs"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
          {copied === 'JSON' ? '¡Copiado!' : 'Exportar JSON'}
        </button>
      </div>
    </div>
  );
};

export default ShareActions;
