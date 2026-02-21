import streamlit as st
from datetime import datetime, timedelta
import calendar
import json
from typing import List, Dict, Any, Optional
import pandas as pd

# ----------------------------------------------------------------------
# Constantes y funciones de ayuda (portadas de constants.ts)
# ----------------------------------------------------------------------
WEEKEND_HOLIDAY_RATE = 70000
WEEKDAY_RATE = 56000
CHILD_RATE = 40000

def format_currency(value: int) -> str:
    """Formatea un número como moneda COP sin decimales."""
    return f"${value:,.0f}".replace(",", ".")

def get_days_in_month(year: int, month: int) -> List[datetime.date]:
    """Retorna una lista de objetos date para cada día del mes."""
    first_day = datetime(year, month, 1)
    if month == 12:
        next_month = datetime(year+1, 1, 1)
    else:
        next_month = datetime(year, month+1, 1)
    days = []
    current = first_day
    while current < next_month:
        days.append(current.date())
        current += timedelta(days=1)
    return days

def format_date_key(date: datetime.date) -> str:
    """Convierte una fecha a string YYYY-MM-DD."""
    return date.strftime("%Y-%m-%d")

def calculate_hospedaje_price(num_people: int, num_children: int, date: datetime.date, is_holiday: bool = False) -> int:
    """Calcula el precio de una noche de hospedaje."""
    day = date.weekday()  # 0=lunes, 6=domingo
    is_special_day = (day == 5 or day == 6) or is_holiday  # sábado(5) o domingo(6)
    
    effective_people = min(num_people, 6)
    if effective_people <= 2:
        base_price = 450000 if (day == 5 or is_holiday) else 380000
    else:
        prices_week = {3: 430000, 4: 500000, 5: 570000, 6: 640000}
        prices_weekend = {3: 520000, 4: 590000, 5: 660000, 6: 730000}
        base_price = prices_weekend[effective_people] if (day == 5 or is_holiday) else prices_week[effective_people]

    extra_people = max(0, num_people - 6)
    extra_rate = WEEKEND_HOLIDAY_RATE if is_special_day else WEEKDAY_RATE
    return base_price + (extra_people * extra_rate) + (num_children * CHILD_RATE)

def calculate_pasadia_price(num_people: int, num_children: int, date: datetime.date, is_holiday: bool = False) -> int:
    """Calcula el precio de un pasadía."""
    day = date.weekday()
    is_weekend_or_holiday = (day == 5 or day == 6) or is_holiday
    base_price = 400000 if is_weekend_or_holiday else 280000
    extra_rate = WEEKEND_HOLIDAY_RATE if is_weekend_or_holiday else WEEKDAY_RATE
    total = base_price
    if num_people > 6:
        total += (num_people - 6) * extra_rate
    total += num_children * CHILD_RATE
    return total

# ----------------------------------------------------------------------
# Inicialización de session_state
# ----------------------------------------------------------------------
if "bookings" not in st.session_state:
    st.session_state.bookings = []  # lista de dicts con estructura Booking

if "current_date" not in st.session_state:
    st.session_state.current_date = datetime.now().replace(day=1)

if "modal_open" not in st.session_state:
    st.session_state.modal_open = False

if "selected_booking" not in st.session_state:
    st.session_state.selected_booking = None  # dict o None

if "selected_date" not in st.session_state:
    st.session_state.selected_date = None  # string YYYY-MM-DD

# ----------------------------------------------------------------------
# Funciones auxiliares para manejo de bookings
# ----------------------------------------------------------------------
def save_booking(booking: Dict[str, Any]):
    """Guarda una reserva (nueva o actualizada)."""
    if st.session_state.selected_booking:
        # actualizar existente
        for i, b in enumerate(st.session_state.bookings):
            if b["id"] == booking["id"]:
                st.session_state.bookings[i] = booking
                break
    else:
        # nueva reserva
        st.session_state.bookings.append(booking)
    st.session_state.modal_open = False
    st.session_state.selected_booking = None
    st.session_state.selected_date = None

def delete_booking(booking_id: str):
    """Elimina una reserva por su id."""
    st.session_state.bookings = [b for b in st.session_state.bookings if b["id"] != booking_id]
    st.session_state.modal_open = False
    st.session_state.selected_booking = None
    st.session_state.selected_date = None

def get_bookings_for_month(year: int, month: int) -> List[Dict]:
    """Filtra reservas que ocurren en el mes indicado (inicio o fin)."""
    result = []
    for b in st.session_state.bookings:
        start = datetime.strptime(b["startDate"], "%Y-%m-%d").date()
        end = datetime.strptime(b["endDate"], "%Y-%m-%d").date()
        # si el mes está dentro del rango de la reserva
        if (start.year == year and start.month == month) or (end.year == year and end.month == month):
            result.append(b)
        else:
            # ver si el mes está entre start y end
            first_of_month = datetime(year, month, 1).date()
            last_of_month = (datetime(year, month, 1) + timedelta(days=calendar.monthrange(year, month)[1]-1)).date()
            if start <= last_of_month and end >= first_of_month:
                result.append(b)
    return result

# ----------------------------------------------------------------------
# UI: encabezado y navegación de meses
# ----------------------------------------------------------------------
st.set_page_config(page_title="Chalet Ohanna Bay", layout="wide")
st.markdown("""
<style>
    .stButton > button {
        width: 100%;
    }
    .calendar-cell {
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        padding: 0.5rem;
        min-height: 100px;
        background-color: white;
    }
    .occupied {
        background-color: #f1f5f9;
    }
    .weekend {
        color: #4f46e5;
        font-weight: bold;
    }
    .hospedaje-tag {
        background-color: #d1fae5;
        color: #065f46;
        border: 1px solid #a7f3d0;
        border-radius: 0.375rem;
        padding: 0.125rem 0.375rem;
        font-size: 0.7rem;
        font-weight: 600;
    }
    .pasadia-tag {
        background-color: #e0f2fe;
        color: #075985;
        border: 1px solid #bae6fd;
        border-radius: 0.375rem;
        padding: 0.125rem 0.375rem;
        font-size: 0.7rem;
        font-weight: 600;
    }
</style>
""", unsafe_allow_html=True)

header_col1, header_col2, header_col3 = st.columns([1, 2, 1])
with header_col1:
    st.image("https://via.placeholder.com/150x50?text=Ohanna+Bay", width=150)  # placeholder, puedes poner tu logo
with header_col2:
    st.markdown("<h1 style='text-align: center;'>Chalet Ohanna Bay</h1>", unsafe_allow_html=True)
    st.markdown("<p style='text-align: center; color: #64748b;'>Gestión de Reservas</p>", unsafe_allow_html=True)
with header_col3:
    st.link_button("🔗 Ver Calendario Público", "https://calendar.google.com/calendar/embed?src=7780f7085d435f8d62c0d6f0368a29965149fb2d9134768cdb15cf4eddce53fb%40group.calendar.google.com&ctz=America%2FBogota")

col_prev, col_month, col_next = st.columns([1, 2, 1])
with col_prev:
    if st.button("◀ Anterior"):
        new_date = st.session_state.current_date - timedelta(days=1)
        st.session_state.current_date = new_date.replace(day=1)
with col_month:
    st.markdown(f"<h2 style='text-align: center;'>{st.session_state.current_date.strftime('%B %Y').capitalize()}</h2>", unsafe_allow_html=True)
with col_next:
    if st.button("Siguiente ▶"):
        new_date = st.session_state.current_date + timedelta(days=32)
        st.session_state.current_date = new_date.replace(day=1)

# ----------------------------------------------------------------------
# Estadísticas rápidas
# ----------------------------------------------------------------------
bookings_month = get_bookings_for_month(st.session_state.current_date.year, st.session_state.current_date.month)

total_reservas = len(bookings_month)
hospedajes = sum(1 for b in bookings_month if b.get("type") == "Hospedaje")
pasadias = sum(1 for b in bookings_month if b.get("type") == "Pasadía")
saldos = sum(b.get("balance", 0) for b in bookings_month)
aseo_pendiente = sum(b.get("cleaningBalance", 0) for b in bookings_month)

stat1, stat2, stat3, stat4, stat5 = st.columns(5)
with stat1:
    st.metric("Reservas", total_reservas)
with stat2:
    st.metric("Hospedajes", hospedajes)
with stat3:
    st.metric("Pasadías", pasadias)
with stat4:
    st.metric("Saldos Reservas", format_currency(saldos))
with stat5:
    st.metric("Aseo Pendiente", format_currency(aseo_pendiente))

# ----------------------------------------------------------------------
# Calendario
# ----------------------------------------------------------------------
days = get_days_in_month(st.session_state.current_date.year, st.session_state.current_date.month)
first_day_weekday = days[0].weekday()  # lunes=0, domingo=6
# Ajustamos para que la semana empiece en lunes (como en el original) y la primera columna sea L
padding = first_day_weekday  # número de celdas vacías antes del día 1

weekdays = ["L", "M", "X", "J", "V", "S", "D"]

# Mostrar cabecera de días
cols = st.columns(7)
for i, day in enumerate(weekdays):
    cols[i].markdown(f"<div style='text-align: center; font-weight: bold; color: #94a3b8;'>{day}</div>", unsafe_allow_html=True)

# Construir grid
grid_cells = []
grid_cells.extend([None] * padding)  # celdas vacías
grid_cells.extend(days)

# Rellenar hasta completar 42 celdas (6 semanas)
while len(grid_cells) < 42:
    grid_cells.append(None)

# Crear filas
for week in range(6):
    cols = st.columns(7)
    for day_idx in range(7):
        cell_date = grid_cells[week*7 + day_idx]
        with cols[day_idx]:
            if cell_date is None:
                st.markdown("<div class='calendar-cell' style='background-color: #f8fafc;'></div>", unsafe_allow_html=True)
                continue

            date_str = format_date_key(cell_date)
            is_weekend = cell_date.weekday() >= 5  # sábado o domingo
            # Buscar reserva para esta fecha
            booking = None
            for b in bookings_month:
                start = datetime.strptime(b["startDate"], "%Y-%m-%d").date()
                end = datetime.strptime(b["endDate"], "%Y-%m-%d").date()
                if b["type"] == "Pasadía":
                    if start == cell_date:
                        booking = b
                        break
                else:  # Hospedaje
                    if start <= cell_date < end:
                        booking = b
                        break

            # Crear celda
            cell_content = f"<div class='calendar-cell {'occupied' if booking else ''}'>"
            cell_content += f"<div style='display: flex; justify-content: space-between;'>"
            cell_content += f"<span class='{'weekend' if is_weekend else ''}'>{cell_date.day}</span>"
            if not booking:
                # precio base del día (para 2 adultos, 0 niños)
                base = calculate_hospedaje_price(2, 0, cell_date)
                cell_content += f"<span style='font-size: 0.6rem; color: #94a3b8;'>{format_currency(base)}</span>"
            cell_content += "</div>"

            if booking:
                tipo = booking["type"]
                guest_name = booking.get("guests", [{}])[0].get("name", "Ocupado")
                tag_class = "hospedaje-tag" if tipo == "Hospedaje" else "pasadia-tag"
                cell_content += f"<div class='{tag_class}' style='margin-top: 4px;'>{tipo}</div>"
                cell_content += f"<div style='font-size: 0.7rem; margin-top: 2px;'>{guest_name}</div>"
            cell_content += "</div>"

            st.markdown(cell_content, unsafe_allow_html=True)

            # Botón invisible que cubre la celda para detectar clic
            if st.button("📅", key=f"btn_{date_str}", help="Haz clic para agregar/editar"):
                if booking:
                    st.session_state.selected_booking = booking
                    st.session_state.selected_date = date_str
                else:
                    st.session_state.selected_booking = None
                    st.session_state.selected_date = date_str
                st.session_state.modal_open = True
                st.rerun()

# ----------------------------------------------------------------------
# Modal de reserva (se muestra como expander cuando modal_open es True)
# ----------------------------------------------------------------------
if st.session_state.modal_open:
    with st.expander("✏️ Detalles de la reserva", expanded=True):
        booking = st.session_state.selected_booking
        date = st.session_state.selected_date

        # Valores por defecto
        default_type = "Hospedaje" if booking is None else booking.get("type", "Hospedaje")
        default_start = date if booking is None else booking.get("startDate", date)
        default_end = "" if booking is None else booking.get("endDate", "")
        default_people = 2 if booking is None else booking.get("numPeople", 2)
        default_children = 0 if booking is None else booking.get("numChildren", 0)
        default_discount = 0 if booking is None else booking.get("discount", 0)
        default_cleaning_total = 0 if booking is None else booking.get("cleaningTotal", 0)
        default_cleaning_deposit = 0 if booking is None else booking.get("cleaningDeposit", 0)
        default_is_holiday = False if booking is None else booking.get("isHoliday", False)
        default_schedule = "9:00 AM - 5:30 PM" if booking is None else booking.get("schedule", "9:00 AM - 5:30 PM")
        default_guests = [{"name": "", "document": ""}] if booking is None else booking.get("guests", [])
        default_payments = [] if booking is None else booking.get("payments", [])

        # Formulario
        with st.form("booking_form"):
            col1, col2 = st.columns(2)
            with col1:
                tipo = st.selectbox("Tipo", ["Hospedaje", "Pasadía"], index=0 if default_type=="Hospedaje" else 1)
            with col2:
                num_people = st.number_input("Personas", min_value=1, value=default_people, step=1)
            num_children = st.number_input("Niños", min_value=0, value=default_children, step=1)

            col1, col2 = st.columns(2)
            with col1:
                start_date = st.date_input("Ingreso", value=datetime.strptime(default_start, "%Y-%m-%d").date() if default_start else datetime.now().date())
            with col2:
                if tipo == "Hospedaje":
                    end_date = st.date_input("Salida", value=datetime.strptime(default_end, "%Y-%m-%d").date() if default_end else start_date + timedelta(days=1), min_value=start_date + timedelta(days=1))
                else:
                    end_date = start_date
                    st.markdown(f"*Salida: mismo día*")

            is_holiday = st.checkbox("¿Es temporada festiva / Sábado?", value=default_is_holiday)

            if tipo == "Pasadía":
                schedule = st.radio("Horario Pasadía", ["9:00 AM - 5:30 PM", "2:00 PM - 10:30 PM"], index=0 if default_schedule=="9:00 AM - 5:30 PM" else 1)
            else:
                schedule = default_schedule

            # Cálculo de precio total
            if tipo == "Hospedaje":
                total_price = 0
                current = start_date
                while current < end_date:
                    total_price += calculate_hospedaje_price(num_people, num_children, current, is_holiday)
                    current += timedelta(days=1)
            else:
                total_price = calculate_pasadia_price(num_people, num_children, start_date, is_holiday)

            st.markdown(f"**Precio total calculado:** {format_currency(total_price)}")

            discount = st.number_input("Descuento", min_value=0, value=default_discount, step=1000)

            # Gestión de huéspedes
            st.subheader("Huéspedes")
            guests = []
            if st.form_submit_button("➕ Añadir huésped", type="secondary"):
                default_guests.append({"name": "", "document": ""})
            for i, guest in enumerate(default_guests):
                col1, col2, col3 = st.columns([4, 3, 1])
                with col1:
                    name = st.text_input(f"Nombre {i+1}", value=guest.get("name", ""), key=f"guest_name_{i}")
                with col2:
                    doc = st.text_input(f"Documento {i+1}", value=guest.get("document", ""), key=f"guest_doc_{i}")
                with col3:
                    if st.form_submit_button("❌", key=f"remove_guest_{i}"):
                        default_guests.pop(i)
                        st.rerun()
                guests.append({"name": name, "document": doc})

            # Gestión de pagos
            st.subheader("Pagos")
            payments = []
            if st.form_submit_button("➕ Nuevo abono", type="secondary"):
                default_payments.append({"id": str(datetime.now().timestamp()), "amount": 0, "method": "Efectivo", "date": format_date_key(datetime.now().date())})
            for i, p in enumerate(default_payments):
                col1, col2, col3, col4 = st.columns([2, 2, 2, 1])
                with col1:
                    amount = st.number_input("Monto", value=p.get("amount", 0), step=1000, key=f"pay_amount_{i}")
                with col2:
                    method = st.selectbox("Método", ["Nequi Hernan", "Nequi Lady", "Davivienda", "DaviPlata", "Efectivo", "Otro"], index=["Nequi Hernan","Nequi Lady","Davivienda","DaviPlata","Efectivo","Otro"].index(p.get("method","Efectivo")), key=f"pay_method_{i}")
                with col3:
                    pay_date = st.date_input("Fecha", value=datetime.strptime(p.get("date", format_date_key(datetime.now().date())), "%Y-%m-%d").date(), key=f"pay_date_{i}")
                with col4:
                    if st.form_submit_button("🗑️", key=f"remove_pay_{i}"):
                        default_payments.pop(i)
                        st.rerun()
                payments.append({"id": p.get("id", str(datetime.now().timestamp())), "amount": amount, "method": method, "date": format_date_key(pay_date)})

            deposit = sum(p["amount"] for p in payments)
            balance = total_price - discount - deposit

            st.markdown(f"**Total abonado:** {format_currency(deposit)}")
            st.markdown(f"**Saldo por cobrar:** {format_currency(balance)}")

            # Gestión de aseo
            st.subheader("Gestión de Aseo")
            col1, col2, col3 = st.columns(3)
            with col1:
                cleaning_total = st.number_input("Total acordado", value=default_cleaning_total, step=1000)
            with col2:
                cleaning_deposit = st.number_input("Abonado", value=default_cleaning_deposit, step=1000)
            with col3:
                cleaning_balance = cleaning_total - cleaning_deposit
                st.markdown(f"**Saldo pendiente:** {format_currency(cleaning_balance)}")

            # Botones de acción
            col1, col2, col3 = st.columns(3)
            with col1:
                if booking and st.form_submit_button("🗑️ Eliminar", type="primary"):
                    delete_booking(booking["id"])
                    st.rerun()
            with col2:
                if st.form_submit_button("❌ Cancelar"):
                    st.session_state.modal_open = False
                    st.session_state.selected_booking = None
                    st.session_state.selected_date = None
                    st.rerun()
            with col3:
                if st.form_submit_button("💾 Guardar"):
                    new_booking = {
                        "id": booking["id"] if booking else str(datetime.now().timestamp()),
                        "startDate": format_date_key(start_date),
                        "endDate": format_date_key(end_date),
                        "type": tipo,
                        "numPeople": num_people,
                        "numChildren": num_children,
                        "guests": guests,
                        "totalPrice": total_price,
                        "discount": discount,
                        "deposit": deposit,
                        "balance": balance,
                        "expenses": booking.get("expenses", []) if booking else [],
                        "payments": payments,
                        "paymentMethod": payments[0]["method"] if payments else "Efectivo",
                        "schedule": schedule,
                        "isHoliday": is_holiday,
                        "cleaningTotal": cleaning_total,
                        "cleaningDeposit": cleaning_deposit,
                        "cleaningBalance": cleaning_balance
                    }
                    save_booking(new_booking)
                    st.rerun()

        # Acciones de compartir (solo si estamos editando una reserva existente)
        if booking:
            st.divider()
            st.subheader("Compartir información")
            # Generar mensajes (similares a ShareActions.tsx)
            def generate_monica_message():
                check_in = "3:00 PM" if tipo=="Hospedaje" else schedule.split('-')[0].strip()
                check_out = "1:00 PM" if tipo=="Hospedaje" else schedule.split('-')[1].strip()
                return f"""🏡 *RESERVA CHALET OHANNA BAY* 🏡
--------------------------------
👤 *Monica:*
📅 *Ingreso:* {start_date} ({check_in})
📅 *Salida:* {end_date} ({check_out})
🏨 *Tipo:* {tipo}
👥 *Personas:* {num_people}
💰 *Saldo Pendiente:* {format_currency(balance)}
--------------------------------"""

            def generate_portero_message():
                guest_list = "\n".join([f"• {g['name']} - {g['document']}" for g in guests if g['name']]) or "No registrados"
                return f"""👮 *AUTORIZACIÓN PORTERÍA* 👮
--------------------------------
📅 *Fecha:* {start_date} al {end_date}
🏠 *Chalet Ohanna Bay*
👥 *Huéspedes:*
{guest_list}
--------------------------------"""

            def generate_admin_summary():
                total_guests = num_people + num_children
                final_total = total_price - discount
                days_count = (end_date - start_date).days if tipo=="Hospedaje" else 1
                day_label = "Día Hospedaje" if tipo=="Hospedaje" and days_count==1 else "Días Hospedaje" if tipo=="Hospedaje" else "Día Pasadía" if days_count==1 else "Días Pasadía"
                payment_lines = "\n".join([f"• {format_currency(p['amount'])} ({p['method']}) - {p['date']}" for p in payments]) if payments else f"• {format_currency(deposit)} ({payments[0]['method'] if payments else 'No especificado'})"
                return f"""📝 *RESUMEN DE RESERVA (ADMIN)* 📝
--------------------------------
👥 *Huéspedes totales:* {total_guests} ({num_people} adultos, {num_children} niños)
📅 *Duración:* {days_count} {day_label}
💰 *Desglose:* {format_currency(total_price)} (Tarifa base + adicionales)
📉 *Descuento:* {format_currency(discount)}
✅ *Total:* {format_currency(final_total)}
💳 *Abonos:*
{payment_lines}
🧹 *Aseo:* {format_currency(cleaning_total)} (Abonado: {format_currency(cleaning_deposit)}, Saldo: {format_currency(cleaning_balance)})
--------------------------------"""

            def generate_json():
                data = {
                    "cliente": guests[0]["name"] if guests else "No registrado",
                    "tipo": tipo,
                    "inicio": format_date_key(start_date),
                    "fin": format_date_key(end_date),
                    "huespedes": num_people + num_children,
                    "total": total_price - discount,
                    "abonos": payments,
                    "aseo_total": cleaning_total,
                    "aseo_abonado": cleaning_deposit
                }
                return json.dumps(data, indent=2, ensure_ascii=False)

            col1, col2, col3, col4 = st.columns(4)
            with col1:
                if st.button("📋 Mensaje Mónica"):
                    st.code(generate_monica_message(), language="text")
            with col2:
                if st.button("📋 Lista Portería"):
                    st.code(generate_portero_message(), language="text")
            with col3:
                if st.button("📋 Resumen Admin"):
                    st.code(generate_admin_summary(), language="text")
            with col4:
                if st.button("📋 Exportar JSON"):
                    st.code(generate_json(), language="json")

# ----------------------------------------------------------------------
# Resumen de recaudación por método de pago (mes actual)
# ----------------------------------------------------------------------
st.divider()
st.subheader(f"Recaudación por método - {st.session_state.current_date.strftime('%B %Y').capitalize()}")

method_totals = {}
total_recaudado = 0
for b in bookings_month:
    if "payments" in b and b["payments"]:
        for p in b["payments"]:
            pay_date = datetime.strptime(p["date"], "%Y-%m-%d").date()
            if pay_date.month == st.session_state.current_date.month and pay_date.year == st.session_state.current_date.year:
                method_totals[p["method"]] = method_totals.get(p["method"], 0) + p["amount"]
                total_recaudado += p["amount"]
    elif b.get("deposit", 0) > 0:
        # pago legacy asociado a la fecha de inicio
        booking_date = datetime.strptime(b["startDate"], "%Y-%m-%d").date()
        if booking_date.month == st.session_state.current_date.month and booking_date.year == st.session_state.current_date.year:
            method = b.get("paymentMethod", "No especificado")
            method_totals[method] = method_totals.get(method, 0) + b["deposit"]
            total_recaudado += b["deposit"]

if method_totals:
    st.markdown(f"**Total recaudado en el mes:** {format_currency(total_recaudado)}")
    cols = st.columns(len(method_totals))
    for i, (method, amount) in enumerate(sorted(method_totals.items(), key=lambda x: x[1], reverse=True)):
        with cols[i]:
            st.metric(method, format_currency(amount), f"{amount/total_recaudado*100:.1f}%" if total_recaudado>0 else "0%")
else:
    st.info("No hay pagos registrados en este mes.")
