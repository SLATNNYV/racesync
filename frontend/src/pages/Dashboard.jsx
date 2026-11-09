import React, { useEffect, useState } from 'react'
import { API_BASE_URL } from '../App'
import { QRCodeSVG } from 'qrcode.react'
import { Calendar, MapPin, DollarSign, Box, ShieldCheck, ShieldAlert, Award, QrCode, PlusCircle, Car, X, Check, Flag } from 'lucide-react'

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
  
  // Controle do modal de criação de evento (Gestor / Organizador)
  const [showEventModal, setShowEventModal] = useState(false)
  const [eventSuccess, setEventSuccess] = useState('')

  // Verifica se o usuário tem privilégio administrativo
  const isManager = user?.role === 'MANAGER' || user?.role === 'ORGANIZER'

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      
      {/* Mensagem de sucesso ao cadastrar evento */}
      {eventSuccess && (
        <div style={{
          background: 'rgba(0, 230, 118, 0.15)',
          border: '1px solid var(--status-approved)',
          color: '#00ff88',
          padding: '14px 18px',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.9rem',
          fontWeight: 600
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Check size={18} />
            {eventSuccess}
          </div>
          <button
            onClick={() => setEventSuccess('')}
            style={{ background: 'none', border: 'none', color: '#00ff88', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Cabeçalho do Painel */}
      <div className="page-header">
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>
            PAINEL DO USUÁRIO
          </span>
          <h2 className="page-title">
            BEM-VINDO, {user.name.split(' ')[0].toUpperCase()}!
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {isManager && (
            <button
              className="btn-secondary btn-mobile-full"
              onClick={() => setShowEventModal(true)}
              style={{ borderColor: 'var(--accent-red)', color: '#fff', gap: '8px' }}
            >
              <PlusCircle size={16} color="var(--accent-red)" />
              Novo Evento
            </button>
          )}
          <button className="btn-primary btn-mobile-full" onClick={() => navigate('bookings')}>
            <PlusCircle size={16} />
            Reservar Puxada
          </button>
        </div>
      </div>

      {/* Grid principal responsivo */}
      <div className="grid-2col">
        
        {/* Coluna Esquerda: Lista de Eventos Automobilísticos */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award size={20} color="var(--accent-red)" />
              Eventos em Destaque
            </h3>
            {isManager && (
              <button
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.8rem', gap: '6px', minHeight: '34px', borderColor: 'var(--accent-red)', color: '#fff' }}
                onClick={() => setShowEventModal(true)}
              >
                <PlusCircle size={14} color="var(--accent-red)" />
                Cadastrar Evento
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {events.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
                <Calendar size={36} style={{ marginBottom: '12px', opacity: 0.6 }} />
                <p style={{ margin: '0 0 14px 0', fontSize: '0.9rem' }}>Nenhum evento com inscrições abertas no momento.</p>
                {isManager && (
                  <button
                    className="btn-primary"
                    style={{ margin: '0 auto', fontSize: '0.85rem' }}
                    onClick={() => setShowEventModal(true)}
                  >
                    <PlusCircle size={16} />
                    Cadastrar Primeiro Evento
                  </button>
                )}
              </div>
            ) : (
              events.map(event => (
              <div key={event.id} className="glass-panel" style={{ position: 'relative', overflow: 'hidden' }}>
                
                {/* Tag flutuante mostrando o status do evento */}
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

                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: '#fff', marginBottom: '12px', textTransform: 'uppercase', paddingRight: '80px' }}>
                  {event.name}
                </h4>

                {/* Detalhes do Evento — grid responsivo */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="var(--accent-red)" />
                    {event.city}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} />
                    {event.date}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={14} color="#00e676" />
                    R$ {Number(event.registrationFee || 0).toFixed(2)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Box size={14} />
                    {event.boxSlotsRemaining} boxes
                  </div>
                </div>

                <button
                  className="btn-secondary"
                  style={{ width: '100%', marginTop: '16px', fontSize: '0.8rem', justifyContent: 'center' }}
                  onClick={() => navigate('bookings')}
                >
                  Inscrever-se no Evento
                </button>
              </div>
            )))}
          </div>
        </div>

        {/* Coluna Direita: Credenciais Digitais / Puxadas do Piloto */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <QrCode size={20} color="var(--accent-blue)" />
            Suas Credenciais
          </h3>

          {bookings.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              <p style={{ marginBottom: '16px' }}>Você ainda não possui nenhuma puxada ou box agendada.</p>
              <button className="btn-secondary" onClick={() => navigate('bookings')}>
                <PlusCircle size={16} />
                Agendar Minha Primeira Puxada
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {bookings.map(booking => (
                <div key={booking.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', color: '#fff', textTransform: 'uppercase', marginBottom: '6px', wordBreak: 'break-word' }}>
                      {booking.event?.name || 'Evento'}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <div>Chave: <strong style={{ color: '#fff' }}>{booking.timeSlot}</strong></div>
                      <div>Carro: {booking.vehicle?.name || 'Veículo'} (#{booking.vehicle?.number || 'S/N'})</div>
                      
                      {/* Distintivo de status da vistoria e pagamento */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                        <span>Vistoria:</span>
                        {booking.vehicle?.inspectionStatus === 'APPROVED' ? (
                          <span className="badge badge-approved" style={{ fontSize: '0.65rem' }}>Aprovado</span>
                        ) : booking.vehicle?.inspectionStatus === 'REJECTED' ? (
                          <span className="badge badge-rejected" style={{ fontSize: '0.65rem' }}>Reprovado</span>
                        ) : (
                          <span className="badge badge-pending" style={{ fontSize: '0.65rem' }}>Pendente</span>
                        )}
                        <span className="badge badge-approved" style={{ fontSize: '0.65rem' }}>
                          {booking.paymentMethod === 'CREDIT_CARD' ? '💳 Cartão' : '⚡ PIX'} Pago
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Abre o modal do passaporte digital */}
                  <button
                    className="btn-primary"
                    style={{ padding: '10px 14px', background: 'linear-gradient(135deg, var(--accent-blue), #008ba3)', flexShrink: 0 }}
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <QrCode size={16} />
                    Passe
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
          <div className="glass-panel animate-fade-in qr-modal-inner" style={{ maxWidth: '420px', width: '100%', textAlign: 'center', padding: '32px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: '1.15rem', marginBottom: '8px' }}>
              PASSAPORTE DIGITAL
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
              Apresente o QR Code na portaria para validação.
            </p>

            {/* QR Code */}
            <div style={{
              background: '#fff',
              padding: '16px',
              borderRadius: '12px',
              display: 'inline-block',
              marginBottom: '20px',
              boxShadow: '0 0 20px rgba(0, 188, 212, 0.4)'
            }}>
              <QRCodeSVG value={selectedBooking.qrCodeToken} size={180} />
            </div>

            {/* Detalhes da credencial */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '14px',
              fontSize: '0.85rem',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              marginBottom: '20px'
            }}>
              <div><strong>Evento:</strong> {selectedBooking.event?.name || 'Evento'}</div>
              <div><strong>Chave / Sorteio:</strong> {selectedBooking.timeSlot}</div>
              <div><strong>Veículo:</strong> {selectedBooking.vehicle?.name || 'Veículo'}</div>
              <div><strong>Nº:</strong> #{selectedBooking.vehicle?.number || 'S/N'}</div>
              <div>
                <strong>Vistoria:</strong>{' '}
                {selectedBooking.vehicle?.inspectionStatus === 'APPROVED' ? (
                  <span style={{ color: 'var(--status-approved)', fontWeight: 'bold' }}>APROVADA</span>
                ) : selectedBooking.vehicle?.inspectionStatus === 'REJECTED' ? (
                  <span style={{ color: 'var(--status-rejected)', fontWeight: 'bold' }}>REPROVADA</span>
                ) : (
                  <span style={{ color: 'var(--status-pending)', fontWeight: 'bold' }}>PENDENTE</span>
                )}
              </div>
              <div>
                <strong>Pagamento:</strong>{' '}
                <span style={{ color: 'var(--status-approved)', fontWeight: 'bold' }}>
                  PAGO ({selectedBooking.paymentMethod === 'CREDIT_CARD' ? 'Cartão de Crédito' : 'PIX'})
                </span>
              </div>
            </div>

            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setSelectedBooking(null)}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal Suspenso para Cadastro de Novo Evento */}
      {showEventModal && (
        <CreateEventModal
          token={token}
          onClose={() => setShowEventModal(false)}
          onCreated={(newEvent) => {
            setEvents(prev => [newEvent, ...prev])
            setEventSuccess(`Evento "${newEvent.name}" criado e publicado com sucesso!`)
            setShowEventModal(false)
          }}
        />
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

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      if (!response.ok) {
        throw new Error(typeof data === 'string' ? data : (data.error || data.message || 'Erro ao registrar.'));
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
    <div className="glass-panel">
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '6px', color: '#fff' }}>
        Cadastrar Novo Membro da Equipe (Staff)
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '20px' }}>
        Área administrativa exclusiva para criação de novas contas de organizadores ou administradores.
      </p>

      {error && <div style={{ background: 'rgba(255, 23, 68, 0.1)', border: '1px solid var(--status-rejected)', color: '#ff4d6d', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>{error}</div>}
      {success && <div style={{ background: 'rgba(0, 230, 118, 0.1)', border: '1px solid var(--status-approved)', color: '#00ff88', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>{success}</div>}

      <form onSubmit={handleRegister} className="grid-admin-form">
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
        <div className="form-group span-2">
          <label>Função / Perfil</label>
          <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="ORGANIZER">ORGANIZER - Organizador do Evento</option>
            <option value="MANAGER">MANAGER - Administrador Geral</option>
            <option value="PILOT_SPECTATOR">PILOT_SPECTATOR - Piloto</option>
          </select>
        </div>
        <button type="submit" className="btn-primary span-2" disabled={loading} style={{ height: '48px', justifyContent: 'center', width: '100%' }}>
          {loading ? 'Cadastrando...' : 'Cadastrar Membro'}
        </button>
      </form>
    </div>
  );
}

/**
 * Modal para criação de novos eventos automobilísticos no autódromo.
 * Exclusivo para administradores e organizadores.
 */
function CreateEventModal({ token, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [date, setDate] = useState('')
  const [registrationFee, setRegistrationFee] = useState('')
  const [boxSlotsTotal, setBoxSlotsTotal] = useState('')
  const [status, setStatus] = useState('CONFIRMADO')
  
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          city,
          date,
          registrationFee: parseFloat(registrationFee),
          boxSlotsTotal: parseInt(boxSlotsTotal),
          status
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        let errMessage = 'Falha ao cadastrar evento.'
        try {
          const errJson = JSON.parse(errText)
          errMessage = errJson.error || errJson.message || errText
        } catch {
          errMessage = errText || errMessage
        }
        throw new Error(errMessage)
      }

      const createdEvent = await response.json()
      onCreated(createdEvent)
    } catch (err) {
      console.error('Erro ao cadastrar evento:', err)
      setError(err.message || 'Erro de comunicação ao salvar evento.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '540px', width: '100%', padding: '28px', border: '1px solid var(--accent-red)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flag size={20} color="var(--accent-red)" />
            CADASTRAR NOVO EVENTO
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
          Defina as informações do evento no autódromo para abrir inscrições aos pilotos.
        </p>

        {error && (
          <div style={{ background: 'rgba(255, 23, 68, 0.1)', border: '1px solid var(--status-rejected)', color: '#ff4d6d', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Nome do Evento</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="Ex: 3ª ETAPA ARRANCADA 201M"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Cidade / Autódromo</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Ex: Maringá / PR"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Data</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Ex: 15/11/2026"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Taxa de Inscrição (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                className="form-control"
                placeholder="300.00"
                value={registrationFee}
                onChange={(e) => setRegistrationFee(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Total de Vagas de Box</label>
              <input
                type="number"
                min="0"
                required
                className="form-control"
                placeholder="40"
                value={boxSlotsTotal}
                onChange={(e) => setBoxSlotsTotal(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Status do Evento</label>
            <select
              className="form-control"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="CONFIRMADO">CONFIRMADO</option>
              <option value="PATROCINADO">PATROCINADO</option>
              <option value="EM BREVE">EM BREVE</option>
              <option value="INSCRIÇÕES ABERTAS">INSCRIÇÕES ABERTAS</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 2, justifyContent: 'center' }}
              disabled={submitting}
            >
              {submitting ? 'Salvando...' : 'Salvar e Publicar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Dashboard;
