import React, { useEffect, useState } from 'react'
import { API_BASE_URL } from '../App'
import { QRCodeSVG } from 'qrcode.react'
import { Calendar, MapPin, DollarSign, Box, ShieldCheck, ShieldAlert, Award, QrCode, PlusCircle, Car } from 'lucide-react'

/**
 * Componente do Dashboard do Piloto.
 * Exibe eventos ativos em destaque no autódromo e as credenciais digitais de pista do piloto.
 * 
 * @param {string} token - Token de autenticação JWT
 * @param {object} user - Informações do usuário logado
 * @param {function} navigate - Função callback para mudar de página
 */
function Dashboard({ token, user, navigate }) {
  // Lista de eventos e inscrições ativas do piloto
  const [events, setEvents] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Estado para armazenar qual credencial está aberta no modal de visualização de QR Code
  const [selectedBooking, setSelectedBooking] = useState(null)

  // Hook executado na inicialização para buscar dados da API
  useEffect(() => {
    fetchData()
  }, [])

  /**
   * Busca em paralelo os eventos cadastrados e as inscrições de arrancada do piloto autenticado.
   */
  const fetchData = async () => {
    setLoading(true)
    try {
      const [eventsRes, bookingsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/events`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/bookings`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])

      if (eventsRes.ok && bookingsRes.ok) {
        const eventsData = await eventsRes.json()
        const bookingsData = await bookingsRes.json()
        setEvents(eventsData)
        setBookings(bookingsData)
      }
    } catch (err) {
      console.error('Erro ao buscar dados do dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', textAlign: 'center', padding: '50px' }}>CARREGANDO DADOS...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      
      {/* Cabeçalho do Painel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>
            PAINEL DO USUÁRIO
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
            BEM-VINDO, {user.name.split(' ')[0].toUpperCase()}!
          </h2>
        </div>
        <button className="btn-primary" onClick={() => navigate('bookings')}>
          <PlusCircle size={16} />
          Reservar Puxada
        </button>
      </div>

      {/* Grid principal: Eventos em Destaque (Esquerda) e Credenciais de Pista (Direita) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        
        {/* Coluna Esquerda: Lista de Eventos Automobilísticos */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={20} color="var(--accent-red)" />
            Eventos em Destaque
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {events.map(event => (
              <div key={event.id} className="glass-panel" style={{ position: 'relative', overflow: 'hidden' }}>
                
                {/* Tag flutuante mostrando o status do evento (Patrocinado / Confirmado) */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: event.status === 'PATROCINADO' ? 'rgba(255, 51, 75, 0.2)' : 'rgba(0, 188, 212, 0.2)',
                  color: event.status === 'PATROCINADO' ? 'var(--accent-red)' : 'var(--accent-blue)',
                  border: `1px solid ${event.status === 'PATROCINADO' ? 'var(--accent-red)' : 'var(--accent-blue)'}`,
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '1px'
                }}>
                  {event.status}
                </div>

                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: '#fff', marginBottom: '16px', textTransform: 'uppercase' }}>
                  {event.name}
                </h4>

                {/* Detalhes do Evento */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={16} color="var(--accent-red)" />
                    {event.city}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={16} />
                    {event.date}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={16} color="#00e676" />
                    Inscrição: R$ {event.registrationFee.toFixed(2)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Box size={16} />
                    Boxes: {event.boxSlotsRemaining} restantes
                  </div>
                </div>

                <button 
                  className="btn-secondary" 
                  style={{ width: '100%', marginTop: '20px', fontSize: '0.8rem', justifyContent: 'center' }}
                  onClick={() => navigate('bookings')}
                >
                  Inscrever-se no Evento
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna Direita: Credenciais Digitais / Puxadas do Piloto */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <QrCode size={20} color="var(--accent-blue)" />
            Suas Credenciais de Arrancada
          </h3>

          {bookings.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <p style={{ marginBottom: '16px' }}>Você ainda não possui nenhuma puxada ou box agendada.</p>
              <button className="btn-secondary" onClick={() => navigate('bookings')}>
                <PlusCircle size={16} />
                Agendar Minha Primeira Puxada
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {bookings.map(booking => (
                <div key={booking.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: '#fff', textTransform: 'uppercase', marginBottom: '8px' }}>
                      {booking.event.name}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <div>Chave / Emparelhamento: <strong style={{ color: '#fff' }}>{booking.timeSlot}</strong></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Carro: {booking.vehicle.name} (Nº #{booking.vehicle.number})
                      </div>
                      
                      {/* Distintivo dinâmico para o status da vistoria de segurança do veículo */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        Vistoria Técnica: 
                        {booking.vehicle.inspectionStatus === 'APPROVED' ? (
                          <span className="badge badge-approved" style={{ fontSize: '0.65rem' }}>Aprovado</span>
                        ) : booking.vehicle.inspectionStatus === 'REJECTED' ? (
                          <span className="badge badge-rejected" style={{ fontSize: '0.65rem' }}>Reprovado</span>
                        ) : (
                          <span className="badge badge-pending" style={{ fontSize: '0.65rem' }}>Pendente</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Abre o modal do passaporte digital (QR Code) */}
                  <button 
                    className="btn-primary" 
                    style={{ padding: '10px 16px', background: 'linear-gradient(135deg, var(--accent-blue), #008ba3)' }}
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <QrCode size={16} />
                    Ver Passe
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Admin Panel: Staff Registration */}
      {(user.role === 'MANAGER' || user.role === 'ORGANIZER') && (
        <AdminStaffForm token={token} />
      )}

      {/* Modal Suspenso para exibição do Passaporte Digital e do QR Code */}
      {selectedBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '420px', width: '100%', textAlign: 'center', padding: '32px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: '1.25rem', marginBottom: '8px' }}>
              PASSAPORTE DIGITAL
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
              Apresente o QR Code na portaria ou entrada dos boxes para validação.
            </p>

            {/* Container do QR Code renderizado de forma dinâmica com QRCodeSVG */}
            <div style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '12px',
              display: 'inline-block',
              marginBottom: '24px',
              boxShadow: '0 0 20px rgba(0, 188, 212, 0.4)'
            }}>
              <QRCodeSVG value={selectedBooking.qrCodeToken} size={200} />
            </div>

            {/* Detalhes da credencial do modal */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '0.88rem',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              marginBottom: '24px'
            }}>
              <div><strong>Evento:</strong> {selectedBooking.event.name}</div>
              <div><strong>Chave / Sorteio:</strong> {selectedBooking.timeSlot}</div>
              <div><strong>Veículo:</strong> {selectedBooking.vehicle.name}</div>
              <div><strong>Nº Identificação:</strong> #{selectedBooking.vehicle.number}</div>
              <div>
                <strong>Vistoria:</strong>{' '}
                {selectedBooking.vehicle.inspectionStatus === 'APPROVED' ? (
                  <span style={{ color: 'var(--status-approved)', fontWeight: 'bold' }}>APROVADA</span>
                ) : selectedBooking.vehicle.inspectionStatus === 'REJECTED' ? (
                  <span style={{ color: 'var(--status-rejected)', fontWeight: 'bold' }}>REPROVADA</span>
                ) : (
                  <span style={{ color: 'var(--status-pending)', fontWeight: 'bold' }}>PENDENTE DE VISTORIA</span>
                )}
              </div>
            </div>

            <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setSelectedBooking(null)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminStaffForm({ token }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ORGANIZER');
  
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, password, cpf, role })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao registrar.');
      }

      setSuccess(`Membro da equipe ${data.name} registrado com sucesso!`);
      setName('');
      setEmail('');
      setCpf('');
      setPassword('');
      setRole('ORGANIZER');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ marginTop: '32px' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: '8px', color: '#fff' }}>
        Cadastrar Novo Membro da Equipe (Staff)
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
        Área administrativa exclusiva para criação de novas contas de organizadores ou administradores.
      </p>

      {error && <div style={{ background: 'rgba(255, 23, 68, 0.1)', border: '1px solid var(--status-rejected)', color: '#ff4d6d', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>{error}</div>}
      {success && <div style={{ background: 'rgba(0, 230, 118, 0.1)', border: '1px solid var(--status-approved)', color: '#00ff88', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>{success}</div>}

      <form onSubmit={handleRegister} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="form-group">
          <label>Nome Completo</label>
          <input type="text" className="form-control" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do staff" />
        </div>
        <div className="form-group">
          <label>Endereço de E-mail</label>
          <input type="email" className="form-control" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@racesync.com" />
        </div>
        <div className="form-group">
          <label>CPF (Apenas números)</label>
          <input type="text" className="form-control" required value={cpf} onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))} placeholder="Apenas números" />
        </div>
        <div className="form-group">
          <label>Senha de Acesso</label>
          <input type="password" className="form-control" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha provisória" />
        </div>
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label>Função / Perfil</label>
          <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="ORGANIZER">ORGANIZER - Organizador do Evento</option>
            <option value="MANAGER">MANAGER - Administrador Geral</option>
            <option value="PILOT_SPECTATOR">PILOT_SPECTATOR - Piloto</option>
          </select>
        </div>
        <button type="submit" className="btn-primary" disabled={loading} style={{ gridColumn: 'span 2', height: '44px', justifyContent: 'center' }}>
          {loading ? 'Cadastrando...' : 'Cadastrar Membro'}
        </button>
      </form>
    </div>
  );
}

export default Dashboard;
