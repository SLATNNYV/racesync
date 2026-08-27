import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// --- Mock Backend Simulator for Zero-Dependency Testing ---
const originalFetch = window.fetch;

// Initialize mock database
const initDb = () => {
  let db = localStorage.getItem('racesync_db');
  let parsed = db ? JSON.parse(db) : null;
  const hasTrackDay = parsed && parsed.events && parsed.events.some(e => e.name.includes('TRACK DAY'));
  const hasOldSchema = parsed && parsed.vehicles && parsed.vehicles.some(v => v.make || v.plate);
  const has402 = parsed && parsed.events && parsed.events.some(e => e.name.includes('402M'));
  if (!db || hasTrackDay || hasOldSchema || has402) {
    const defaultDb = {
      users: [
        { id: 1, name: 'Pedro Piloto', email: 'piloto@racesync.com', password: '123', cpf: '111.111.111-11', role: 'PILOT_SPECTATOR' },
        { id: 2, name: 'Gustavo Gestor', email: 'gestor@racesync.com', password: '123', cpf: '222.222.222-22', role: 'MANAGER' }
      ],
      events: [
        { id: 1, name: 'FESTIVAL DE ARRANCADA 201M', city: 'Maringá / PR', date: '15/10/2026', registrationFee: 300.00, boxSlotsTotal: 40, boxSlotsRemaining: 18, status: 'PATROCINADO' }
      ],
      vehicles: [
        { id: 1, name: 'Honda Civic Si', number: '77', category: 'Carros Turbo', owner: { id: 1, name: 'Pedro Piloto', email: 'piloto@racesync.com', cpf: '111.111.111-11', role: 'PILOT_SPECTATOR' }, inspectionStatus: 'PENDING', inspectionNotes: 'Aguardando vistoria técnica presencial.' }
      ],
      bookings: []
    };
    localStorage.setItem('racesync_db', JSON.stringify(defaultDb));
    return defaultDb;
  }
  return JSON.parse(db);
};

const getDb = () => initDb();
const saveDb = (db) => localStorage.setItem('racesync_db', JSON.stringify(db));

// Fetch interceptor to fallback to mock database if backend is unreachable
window.fetch = async function (url, options = {}) {
  const urlString = url.toString();
  
  if (urlString.includes('localhost:8080/api')) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 800);
      
      const realResponse = await originalFetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return realResponse;
    } catch (e) {
      console.warn(`[RaceSync Simulator] Backend offline. Interceptando URL: ${urlString}`);
      return simulateBackend(urlString, options);
    }
  }
  
  return originalFetch.apply(this, arguments);
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function textResponse(text, status = 200) {
  return new Response(text, {
    status,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Backend Simulator logic
async function simulateBackend(url, options) {
  const method = (options.method || 'GET').toUpperCase();
  const db = getDb();
  
  let currentUser = null;
  const authHeader = options.headers?.['Authorization'] || options.headers?.['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const email = authHeader.replace('Bearer ', '');
    currentUser = db.users.find(u => u.email === email || `token-${u.email}` === email);
  }

  const path = url.split('/api')[1];

  // 1. Auth Simulator
  if (path.startsWith('/auth/login') && method === 'POST') {
    const { email, password } = JSON.parse(options.body);
    const user = db.users.find(u => u.email === email && u.password === password);
    if (user) {
      return jsonResponse({
        token: `token-${user.email}`,
        user: { id: user.id, name: user.name, email: user.email, cpf: user.cpf, role: user.role }
      });
    }
    return jsonResponse({ error: 'Email ou senha incorretos.' }, 401);
  }

  if (path.startsWith('/auth/register') && method === 'POST') {
    const { name, email, password, cpf, role } = JSON.parse(options.body);
    if (db.users.some(u => u.email === email)) {
      return jsonResponse({ error: 'Email já cadastrado.' }, 400);
    }
    if (db.users.some(u => u.cpf === cpf)) {
      return jsonResponse({ error: 'CPF já cadastrado.' }, 400);
    }
    const newUser = {
      id: db.users.length + 1,
      name,
      email,
      password,
      cpf,
      role: role || 'PILOT_SPECTATOR'
    };
    db.users.push(newUser);
    saveDb(db);
    return jsonResponse({ id: newUser.id, name: newUser.name, email: newUser.email, cpf: newUser.cpf, role: newUser.role }, 201);
  }

  if (path.startsWith('/auth/me') && method === 'GET') {
    if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);
    return jsonResponse({ id: currentUser.id, name: currentUser.name, email: currentUser.email, cpf: currentUser.cpf, role: currentUser.role });
  }

  // 2. Events Simulator
  if (path.startsWith('/events') && method === 'GET') {
    return jsonResponse(db.events);
  }

  if (path.startsWith('/events') && method === 'POST') {
    if (!currentUser || (currentUser.role !== 'MANAGER' && currentUser.role !== 'ORGANIZER')) {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }
    const { name, city, date, registrationFee, boxSlotsTotal, status } = JSON.parse(options.body);
    const newEvent = {
      id: db.events.length + 1,
      name,
      city,
      date,
      registrationFee: parseFloat(registrationFee),
      boxSlotsTotal: parseInt(boxSlotsTotal),
      boxSlotsRemaining: parseInt(boxSlotsTotal),
      status
    };
    db.events.push(newEvent);
    saveDb(db);
    return jsonResponse(newEvent, 201);
  }

  // 3. Vehicles Simulator
  if (path.startsWith('/vehicles') && method === 'GET') {
    if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);
    
    if (path.includes('/vehicles/all')) {
      if (currentUser.role !== 'MANAGER' && currentUser.role !== 'ORGANIZER') {
        return jsonResponse({ error: 'Forbidden' }, 403);
      }
      return jsonResponse(db.vehicles);
    }
    
    const userVehicles = db.vehicles.filter(v => v.owner.id === currentUser.id);
    return jsonResponse(userVehicles);
  }

  if (path.startsWith('/vehicles') && method === 'POST') {
    if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);
    const { name, number, category } = JSON.parse(options.body);
    const newVehicle = {
      id: db.vehicles.length + 1,
      name,
      number,
      category,
      owner: { id: currentUser.id, name: currentUser.name, email: currentUser.email, cpf: currentUser.cpf, role: currentUser.role },
      inspectionStatus: 'PENDING',
      inspectionNotes: 'Aguardando vistoria técnica presencial.'
    };
    db.vehicles.push(newVehicle);
    saveDb(db);
    return jsonResponse(newVehicle, 201);
  }

  if (path.match(/\/vehicles\/(\d+)\/inspect/) && method === 'PUT') {
    if (!currentUser || (currentUser.role !== 'MANAGER' && currentUser.role !== 'ORGANIZER')) {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }
    const match = path.match(/\/vehicles\/(\d+)\/inspect/);
    const vehicleId = parseInt(match[1]);
    const { status, notes } = JSON.parse(options.body);
    
    const vehicleIndex = db.vehicles.findIndex(v => v.id === vehicleId);
    if (vehicleIndex === -1) return jsonResponse({ error: 'Veículo não encontrado.' }, 404);
    
    db.vehicles[vehicleIndex].inspectionStatus = status;
    db.vehicles[vehicleIndex].inspectionNotes = notes;
    
    db.bookings.forEach((b, i) => {
      if (b.vehicle.id === vehicleId) {
        db.bookings[i].vehicle.inspectionStatus = status;
        db.bookings[i].vehicle.inspectionNotes = notes;
      }
    });

    saveDb(db);
    return jsonResponse(db.vehicles[vehicleIndex]);
  }

  // 4. Bookings Simulator
  if (path.startsWith('/bookings') && method === 'GET') {
    if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);

    if (path.includes('/bookings/all')) {
      if (currentUser.role !== 'MANAGER' && currentUser.role !== 'ORGANIZER') {
        return jsonResponse({ error: 'Forbidden' }, 403);
      }
      return jsonResponse(db.bookings);
    }

    const userBookings = db.bookings.filter(b => b.pilot.id === currentUser.id);
    return jsonResponse(userBookings);
  }

  if (path.startsWith('/bookings') && method === 'POST') {
    if (path.includes('/bookings/check-in')) {
      const { qrCodeToken } = JSON.parse(options.body);
      const bookingIndex = db.bookings.findIndex(b => b.qrCodeToken === qrCodeToken);
      if (bookingIndex === -1) {
        return textResponse('Credencial inválida ou não encontrada.', 404);
      }
      
      const booking = db.bookings[bookingIndex];
      if (booking.status === 'CHECKED_IN') {
        return textResponse('Esta credencial já foi utilizada para check-in.', 400);
      }

      if (booking.vehicle.inspectionStatus !== 'APPROVED') {
        return textResponse(`Check-in recusado. O veículo ${booking.vehicle.name} não foi aprovado na vistoria técnica (Status: ${booking.vehicle.inspectionStatus}).`, 403);
      }

      db.bookings[bookingIndex].status = 'CHECKED_IN';
      saveDb(db);
      return jsonResponse(db.bookings[bookingIndex]);
    }

    if (!currentUser) return jsonResponse({ error: 'Unauthorized' }, 401);
    const { eventId, vehicleId, timeSlot, bookBox } = JSON.parse(options.body);
    
    const event = db.events.find(e => e.id === parseInt(eventId));
    const vehicle = db.vehicles.find(v => v.id === parseInt(vehicleId));
    
    if (!event) return jsonResponse({ error: 'Evento não encontrado.' }, 404);
    if (!vehicle) return jsonResponse({ error: 'Veículo não encontrado.' }, 404);

    if (bookBox) {
      if (event.boxSlotsRemaining <= 0) {
        return jsonResponse({ error: 'Não há vagas de Box restantes para este evento.' }, 400);
      }
      event.boxSlotsRemaining -= 1;
    }

    const token = 'mock-uuid-' + Math.random().toString(36).substring(2, 15) + '-' + Math.random().toString(36).substring(2, 15);
    
    const newBooking = {
      id: db.bookings.length + 1,
      event,
      pilot: { id: currentUser.id, name: currentUser.name, email: currentUser.email, cpf: currentUser.cpf, role: currentUser.role },
      vehicle,
      timeSlot,
      qrCodeToken: token,
      status: 'CONFIRMED'
    };
    
    db.bookings.push(newBooking);
    saveDb(db);
    return jsonResponse(newBooking, 201);
  }

  return jsonResponse({ error: 'Endpoint ou método não suportado no simulador.' }, 501);
}

initDb();
// -----------------------------------------------------------

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
