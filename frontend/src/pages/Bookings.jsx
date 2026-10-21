import React, { useEffect, useState } from 'react'
import { API_BASE_URL } from '../App'
import { Calendar, Car, Clock, Box, DollarSign, CheckCircle2, ShieldAlert } from 'lucide-react'

// O horário/chave será definido por sorteio após o início do evento.

/**
 * Componente de Agendamento (Bookings).
 * Permite ao piloto inscrever-se em eventos e agendar puxadas para carros de sua garagem.
 * 
 * @param {string} token - Token de acesso JWT
 */
function Bookings({ token }) {
  // Listas buscadas do servidor
  const [events, setEvents] = useState([])
  const [vehicles, setVehicles] = useState([])
  
  // Estados para capturar as seleções do formulário de agendamento
  const [selectedEventId, setSelectedEventId] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('Shark Tank')
  const [bookBox, setBookBox] = useState(false) // Opção de reserva do Box coberto
  
  // Estados de feedback de controle e visualização
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  // Recebe os detalhes da reserva quando criada com sucesso na API
  const [successBooking, setSuccessBooking] = useState(null)

  // Hook que roda no carregamento para puxar eventos ativos e carros do piloto
  useEffect(() => {
    fetchData()
  }, [])

  /**
   * Busca em paralelo os eventos ativos no autódromo e os veículos do piloto logado.
   */
  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [eventsRes, vehiclesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/events`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/vehicles`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])

      if (eventsRes.ok && vehiclesRes.ok) {
        const eventsData = await eventsRes.json()
        const vehiclesData = await vehiclesRes.json()
        
        setEvents(eventsData)
        setVehicles(vehiclesData)

        // Define seleções iniciais padrão
        if (eventsData.length > 0) setSelectedEventId(eventsData[0].id.toString())
        if (vehiclesData.length > 0) setSelectedVehicleId(vehiclesData[0].id.toString())
        setSelectedTimeSlot('Shark Tank')
      }
    } catch (err) {
      console.error('Erro ao carregar dados de reservas:', err)
      setError('Erro ao carregar informações do servidor.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Envia o agendamento da puxada para a API do backend (/api/bookings) - Método POST.
   */
  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    if (!selectedEventId || !selectedVehicleId || !selectedTimeSlot) {
      setError('Por favor, preencha todos os campos.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: parseInt(selectedEventId),
          vehicleId: parseInt(selectedVehicleId),
          timeSlot: selectedTimeSlot,
          bookBox
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar reserva.')
      }

      // Salva os dados de retorno para exibir o cupom/recibo de agendamento na tela
      setSuccessBooking(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Carregando dados de agendamento...</div>
  }

  // --- Tela de Recibo de Agendamento com Sucesso ---
  if (successBooking) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }} className="glass-panel animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: 'var(--status-approved)' }}>
          <CheckCircle2 size={56} />
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 900, color: '#fff', marginBottom: '10px' }}>
          PUXADA CONFIRMADA!
        </h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.9rem' }}>
          Sua inscrição digital foi realizada. Acesse sua credencial a qualquer momento no painel.
        </p>

        {/* Informações resumidas do agendamento */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '24px',
          fontSize: '0.88rem'
        }}>
          <div><strong>Evento:</strong> {successBooking.event.name}</div>
          <div><strong>Cidade/Local:</strong> {successBooking.event.city}</div>
          <div><strong>Data:</strong> {successBooking.event.date}</div>
          <div><strong>Puxada/Categoria:</strong> {successBooking.timeSlot}</div>
          <div><strong>Carro:</strong> {successBooking.vehicle.name} (Nº #{successBooking.vehicle.number})</div>
          <div><strong>Taxa Inscrição:</strong> R$ {successBooking.event.registrationFee.toFixed(2)}</div>
        </div>

        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => window.location.reload()}>
          Ir para Minhas Credenciais
        </button>
      </div>
    )
  }

  // Encontra os objetos correspondentes aos IDs selecionados
  const selectedEvent = events.find(e => e.id.toString() === selectedEventId)
  const selectedVehicle = vehicles.find(v => v.id.toString() === selectedVehicleId)

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto' }} className="animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>
          NOVA INSCRIÇÃO
        </span>
        <h2 className="page-title">RESERVAR PUXADA</h2>
      </div>

      {error && (
        <div style={{ background: 'rgba(255,23,68,0.1)', border: '1px solid var(--status-rejected)', color: '#ff4d6d', padding: '14px', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Bloqueio se o piloto não tiver carros cadastrados */}
      {vehicles.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
          <Car size={48} style={{ color: 'var(--accent-red)', marginBottom: '16px' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: '1.1rem', marginBottom: '10px' }}>NENHUM VEÍCULO CADASTRADO</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.9rem' }}>
            Para agendar uma puxada, é obrigatório ter pelo menos um veículo cadastrado para vistoria técnica.
          </p>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => window.location.reload()}>
            Cadastrar Veículo Agora
          </button>
        </div>
      ) : (
        <form onSubmit={handleBookingSubmit} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Caixa de Seleção do Evento */}
          <div className="form-group" style={{ margin: 0 }}>
            <label>Selecione o Evento Automobilístico</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <select
                className="form-control"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({event.date}) — R$ {event.registrationFee.toFixed(2)}
                  </option>
                ))}
              </select>
              {selectedEvent && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '2px' }}>
                  <span>Cidade: <strong>{selectedEvent.city}</strong></span>
                  <span>Boxes restantes: <strong>{selectedEvent.boxSlotsRemaining}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Caixa de Seleção do Veículo */}
          <div className="form-group" style={{ margin: 0 }}>
            <label>Selecione o Veículo</label>
            <select
              className="form-control"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} (Nº #{v.number})
                </option>
              ))}
            </select>
            
            {/* Aviso de vistoria pendente ou reprovada */}
            {selectedVehicle && selectedVehicle.inspectionStatus !== 'APPROVED' && (
              <div style={{
                marginTop: '8px',
                background: 'rgba(255, 171, 0, 0.1)',
                border: '1px solid var(--status-pending)',
                borderRadius: '6px',
                padding: '10px',
                fontSize: '0.82rem',
                color: 'var(--status-pending)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>
                  Aviso: Este carro está com vistoria <strong>{selectedVehicle.inspectionStatus === 'PENDING' ? 'PENDENTE' : 'REPROVADA'}</strong>.{' '}
                  O check-in só será liberado após aprovação na vistoria.
                </span>
              </div>
            )}
          </div>

          {/* Seleção de Categoria da Arrancada */}
          <div className="form-group" style={{ margin: 0 }}>
            <label>Selecione a Categoria de Arrancada</label>
            <select
              className="form-control"
              value={selectedTimeSlot}
              onChange={(e) => setSelectedTimeSlot(e.target.value)}
            >
              <option value="Shark Tank">Shark Tank</option>
              <option value="Reis da Rua">Reis da Rua</option>
            </select>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-color)',
            padding: '14px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            color: 'var(--text-muted)'
          }}>
            ℹ️ <strong>Chaves & Emparelhamento:</strong> O emparelhamento e ordem das puxadas serão definidos por sorteio após o início do evento.
          </div>

          {/* Opção para solicitar Box Coberto */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              padding: '14px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            onClick={() => setBookBox(!bookBox)}
          >
            <input
              type="checkbox"
              checked={bookBox}
              onChange={() => {}}
              style={{ marginTop: '3px', cursor: 'pointer', width: '18px', height: '18px', flexShrink: 0 }}
            />
            <div>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>Reservar Vaga de Box</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Desejo reservar um espaço coberto de garagem/box na pista para manutenção técnica do veículo.
              </div>
            </div>
          </div>

          {/* Total + Botão */}
          {selectedEvent && (
            <div className="booking-total-row" style={{
              borderTop: '1px solid var(--border-color)',
              paddingTop: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total a Pagar:</span>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  color: '#fff',
                }}>
                  R$ {selectedEvent.registrationFee.toFixed(2)}
                </div>
              </div>
              
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{ whiteSpace: 'nowrap' }}
              >
                {submitting ? 'Confirmando...' : 'Confirmar & Pagar'}
              </button>
            </div>
          )}

        </form>
      )}
    </div>
  )
}

export default Bookings
