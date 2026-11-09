import React, { useEffect, useState } from 'react'
import { API_BASE_URL } from '../App'
import { Calendar, Car, Clock, Box, DollarSign, CheckCircle2, ShieldAlert, CreditCard, QrCode, Copy, Check, Lock, ShieldCheck, Sparkles, Receipt } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

// O horário/chave será definido por sorteio após o início do evento.

/**
 * Componente de Agendamento (Bookings).
 * Permite ao piloto inscrever-se em eventos e agendar puxadas para carros de sua garagem
 * com simulação completa de pagamento via PIX ou Cartão de Crédito.
 * 
 * @param {string} token - Token de acesso JWT
 */
function Bookings({ token, navigate }) {
  // Listas buscadas do servidor
  const [events, setEvents] = useState([])
  const [vehicles, setVehicles] = useState([])
  
  // Estados para capturar as seleções do formulário de agendamento
  const [selectedEventId, setSelectedEventId] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('Shark Tank')
  const [bookBox, setBookBox] = useState(false) // Opção de reserva do Box coberto

  // Estados de Pagamento (PIX ou Cartão de Crédito)
  const [paymentMethod, setPaymentMethod] = useState('PIX') // 'PIX' ou 'CREDIT_CARD'
  const [copiedPix, setCopiedPix] = useState(false)
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    installments: '1'
  })

  // Controle de simulação do pagamento (exigido para apresentação do TCC: se não pagar, não inscreve)
  const [paymentApproved, setPaymentApproved] = useState(false)
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false)
  
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

  // Simula a confirmação/aprovação do pagamento (PIX pelo banco ou Cartão pela operadora)
  const handleSimulatePayment = () => {
    setIsSimulatingPayment(true)
    setError('')
    setTimeout(() => {
      setPaymentApproved(true)
      setIsSimulatingPayment(false)
    }, 600)
  }

  // Permite desfazer a simulação para demonstrar à banca o bloqueio
  const handleResetPayment = () => {
    setPaymentApproved(false)
  }

  // Altera a forma de pagamento e reinicia o status para poder demonstrar cada método
  const handleSelectPaymentMethod = (method) => {
    setPaymentMethod(method)
    setPaymentApproved(false)
  }

  // Gerador de chave simulada do Pix padrão Banco Central
  const getPixCode = (fee) => {
    const amount = Number(fee || 0).toFixed(2)
    return `00020126580014BR.GOV.BCB.PIX0136racesync-pagamentos@autodromo.com.br5204000053039865405${amount}5802BR5916AUTODROMO SPEED6009SAO PAULO62070503***6304A1B2`
  }

  // Formatação do número do cartão em blocos de 4 dígitos
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16)
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ')
    setCardData(prev => ({ ...prev, number: formatted }))
  }

  // Formatação da validade MM/AA
  const handleExpiryChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4)
    if (raw.length >= 3) {
      setCardData(prev => ({ ...prev, expiry: `${raw.slice(0, 2)}/${raw.slice(2)}` }))
    } else {
      setCardData(prev => ({ ...prev, expiry: raw }))
    }
  }

  // Formatação do código de segurança CVV
  const handleCvvChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4)
    setCardData(prev => ({ ...prev, cvv: raw }))
  }

  // Copia o código PIX para a área de transferência com feedback visual
  const handleCopyPix = (pixText) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(pixText).catch(() => {})
    }
    setCopiedPix(true)
    setTimeout(() => setCopiedPix(false), 2500)
  }

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

    if (!paymentApproved) {
      setError('Inscrição bloqueada: O pagamento da taxa de inscrição ainda não foi efetuado. Realize a simulação do pagamento para liberar!')
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
          bookBox,
          paymentMethod
        })
      })

      let data
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      if (!response.ok) {
        throw new Error(typeof data === 'string' ? data : (data.error || data.message || 'Erro ao processar reserva.'))
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
    const isCreditCard = (successBooking.paymentMethod || paymentMethod) === 'CREDIT_CARD'
    const feeAmount = Number(successBooking.event?.registrationFee || 0).toFixed(2)

    return (
      <div style={{ maxWidth: '620px', margin: '0 auto', textAlign: 'center' }} className="glass-panel animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: 'var(--status-approved)' }}>
          <CheckCircle2 size={60} />
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
          INSCRIÇÃO & PAGAMENTO CONFIRMADOS!
        </h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '22px', fontSize: '0.9rem' }}>
          Sua puxada foi agendada e o pagamento foi registrado com sucesso. Seu passaporte digital já está disponível no painel.
        </p>

        {/* Informações resumidas do agendamento */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '20px',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '24px',
          fontSize: '0.88rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>COMPROVANTE DE TRANSAÇÃO</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: 700 }}>
              #PAY-RS-{successBooking.id ? String(successBooking.id).padStart(4, '0') : '2026'}-OK
            </span>
          </div>

          <div><strong>Evento:</strong> {successBooking.event?.name}</div>
          <div><strong>Cidade/Local:</strong> {successBooking.event?.city}</div>
          <div><strong>Data:</strong> {successBooking.event?.date}</div>
          <div><strong>Puxada/Categoria:</strong> {successBooking.timeSlot}</div>
          <div><strong>Carro:</strong> {successBooking.vehicle?.name} (Nº #{successBooking.vehicle?.number})</div>
          <div><strong>Box Coberto:</strong> {bookBox ? 'Vaga de Box Reservada' : 'Não solicitado'}</div>
          
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '6px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><strong>Forma de Pagamento:</strong></span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#fff', fontWeight: 600 }}>
              {isCreditCard ? (
                <>
                  <CreditCard size={16} color="var(--accent-blue)" />
                  Cartão de Crédito {cardData.installments > 1 ? `(${cardData.installments}x)` : '(À vista)'}
                </>
              ) : (
                <>
                  <QrCode size={16} color="var(--accent-red)" />
                  PIX (Aprovado Instantaneamente)
                </>
              )}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><strong>Status do Pagamento:</strong></span>
            <span className="badge badge-approved" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '0.72rem' }}>
              <CheckCircle2 size={12} /> PAGO & CONCLUÍDO
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
            <span><strong>Total Pago:</strong></span>
            <span style={{ color: 'var(--status-approved)', fontWeight: 900, fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>
              R$ {feeAmount}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            style={{ flex: 1, minWidth: '160px', justifyContent: 'center' }}
            onClick={() => {
              setSuccessBooking(null)
              fetchData()
            }}
          >
            Fazer Outra Inscrição
          </button>
          <button
            className="btn-primary"
            style={{ flex: 1, minWidth: '160px', justifyContent: 'center' }}
            onClick={() => navigate ? navigate('dashboard') : window.location.reload()}
          >
            Ir para Minhas Credenciais
          </button>
        </div>
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
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate ? navigate('vehicles') : window.location.reload()}>
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
                onChange={(e) => {
                  setSelectedEventId(e.target.value)
                  setPaymentApproved(false)
                }}
              >
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({event.date}) — R$ {Number(event.registrationFee || 0).toFixed(2)}
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
          {(() => {
            const hasBoxes = selectedEvent ? selectedEvent.boxSlotsRemaining > 0 : true
            return (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  padding: '14px',
                  borderRadius: '8px',
                  cursor: hasBoxes ? 'pointer' : 'not-allowed',
                  opacity: hasBoxes ? 1 : 0.6
                }}
                onClick={() => {
                  if (hasBoxes) setBookBox(!bookBox)
                }}
              >
                <input
                  type="checkbox"
                  checked={bookBox && hasBoxes}
                  disabled={!hasBoxes}
                  onChange={() => {}}
                  style={{ marginTop: '3px', cursor: hasBoxes ? 'pointer' : 'not-allowed', width: '18px', height: '18px', flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                    Reservar Vaga de Box {hasBoxes ? '' : '(Esgotado para este evento)'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {hasBoxes
                      ? `Desejo reservar um espaço coberto de garagem/box na pista (${selectedEvent?.boxSlotsRemaining} vagas restantes).`
                      : 'Não há vagas de box disponíveis no momento para este evento.'}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Seção de Pagamento (PIX vs Cartão de Crédito) */}
          {selectedEvent && (
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={18} color="var(--accent-red)" />
                  <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>
                    FORMA DE PAGAMENTO (EXEMPLO)
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={12} color="var(--status-approved)" /> Ambiente Seguro (Simulação TCC)
                </span>
              </div>

              {/* Botões de Seleção: PIX ou Cartão de Crédito */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                {/* Opção PIX */}
                <div
                  onClick={() => handleSelectPaymentMethod('PIX')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: paymentMethod === 'PIX' ? '2px solid var(--accent-red)' : '1px solid var(--border-color)',
                    background: paymentMethod === 'PIX' ? 'rgba(255, 51, 75, 0.08)' : 'rgba(255,255,255,0.01)',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: paymentMethod === 'PIX' ? 'var(--accent-red)' : 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0
                  }}>
                    <QrCode size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>PIX</span>
                      <span className="badge badge-approved" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>Instantâneo</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Aprovação em segundos</span>
                  </div>
                </div>

                {/* Opção Cartão de Crédito */}
                <div
                  onClick={() => handleSelectPaymentMethod('CREDIT_CARD')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: paymentMethod === 'CREDIT_CARD' ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)',
                    background: paymentMethod === 'CREDIT_CARD' ? 'rgba(0, 188, 212, 0.08)' : 'rgba(255,255,255,0.01)',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: paymentMethod === 'CREDIT_CARD' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0
                  }}>
                    <CreditCard size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>Cartão de Crédito</span>
                      <span style={{ background: 'rgba(0,188,212,0.2)', color: 'var(--accent-blue)', borderRadius: '4px', fontSize: '0.65rem', padding: '2px 6px', fontWeight: 700 }}>Até 12x</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Crédito com liberação imediata</span>
                  </div>
                </div>
              </div>

              {/* Detalhes do PIX */}
              {paymentMethod === 'PIX' && (
                <div style={{
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                    Aponte a câmera do aplicativo do seu banco para o <strong>QR Code</strong> abaixo ou copie a chave Pix:
                  </p>

                  {/* QR Code Container */}
                  <div style={{
                    background: '#ffffff',
                    padding: '12px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <QRCodeSVG value={getPixCode(selectedEvent.registrationFee)} size={160} level="M" />
                  </div>

                  {/* Chave Pix Copia e Cola */}
                  <div style={{ width: '100%', maxWidth: '480px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                      Chave Pix Copia e Cola:
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '8px 12px'
                    }}>
                      <div style={{
                        flex: 1,
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {getPixCode(selectedEvent.registrationFee)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyPix(getPixCode(selectedEvent.registrationFee))}
                        style={{
                          background: copiedPix ? 'var(--status-approved)' : 'rgba(255,255,255,0.08)',
                          color: copiedPix ? '#000' : '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'var(--transition-smooth)',
                          flexShrink: 0
                        }}
                      >
                        {copiedPix ? (
                          <>
                            <Check size={14} /> Copiado!
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> Copiar
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Status do Pagamento PIX e Botão de Simulação */}
                  <div style={{
                    width: '100%',
                    maxWidth: '480px',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    border: paymentApproved ? '1px solid var(--status-approved)' : '1px solid var(--status-pending)',
                    background: paymentApproved ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 171, 0, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {paymentApproved ? (
                        <>
                          <CheckCircle2 size={20} color="var(--status-approved)" style={{ flexShrink: 0 }} />
                          <div>
                            <div style={{ color: 'var(--status-approved)', fontWeight: 800, fontSize: '0.85rem' }}>
                              PIX PAGO & CONFIRMADO
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                              Notificação bancária recebida. Inscrição liberada!
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <Clock size={20} color="var(--status-pending)" style={{ flexShrink: 0 }} />
                          <div>
                            <div style={{ color: 'var(--status-pending)', fontWeight: 800, fontSize: '0.85rem' }}>
                              PIX PENDENTE (NÃO PAGO)
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                              A inscrição permanece bloqueada até pagar.
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {paymentApproved ? (
                      <button
                        type="button"
                        onClick={handleResetPayment}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-muted)',
                          padding: '6px 10px',
                          fontSize: '0.72rem',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                        title="Simular pagamento cancelado ou pendente para mostrar o bloqueio"
                      >
                        ↺ Desfazer (Testar Bloqueio)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSimulatePayment}
                        disabled={isSimulatingPayment}
                        style={{
                          background: 'linear-gradient(135deg, #00e676, #00b34d)',
                          border: 'none',
                          color: '#000',
                          fontWeight: 800,
                          padding: '8px 14px',
                          fontSize: '0.78rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 0 12px rgba(0, 230, 118, 0.4)'
                        }}
                      >
                        {isSimulatingPayment ? (
                          'Validando Pix...'
                        ) : (
                          <>
                            <Sparkles size={14} /> Simular Pagamento do Pix
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Detalhes do Cartão de Crédito */}
              {paymentMethod === 'CREDIT_CARD' && (
                <div style={{
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  {/* Visual do Cartão Virtual */}
                  <div style={{
                    maxWidth: '380px',
                    width: '100%',
                    margin: '0 auto',
                    background: 'linear-gradient(135deg, #1b1e2e 0%, #0d0f17 100%)',
                    border: '1px solid rgba(0, 188, 212, 0.3)',
                    borderRadius: '14px',
                    padding: '18px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '170px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '32px',
                          height: '24px',
                          background: 'linear-gradient(135deg, #e0aa3e, #f9d976)',
                          borderRadius: '4px',
                          boxShadow: 'inset 0 0 2px rgba(0,0,0,0.4)'
                        }} />
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '1px' }}>RACESYNC PAY</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '0.85rem', color: 'var(--accent-blue)', letterSpacing: '1px' }}>
                        CREDIT CARD
                      </span>
                    </div>

                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: '1.15rem',
                      letterSpacing: '3px',
                      color: '#fff',
                      margin: '14px 0 10px 0',
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                      {cardData.number || '•••• •••• •••• ••••'}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Titular do Cartão</div>
                        <div style={{ fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#fff' }}>
                          {cardData.name || 'NOME DO PILOTO'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Validade</div>
                        <div style={{ fontWeight: 700, fontFamily: 'monospace', color: '#fff' }}>
                          {cardData.expiry || 'MM/AA'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Formulário de Dados do Cartão */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>Número do Cartão</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="0000 0000 0000 0000"
                        value={cardData.number}
                        onChange={handleCardNumberChange}
                        maxLength={19}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>Nome Impresso no Cartão</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: AYRTON SENNA"
                        value={cardData.name}
                        onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.8rem' }}>Validade (MM/AA)</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="MM/AA"
                          value={cardData.expiry}
                          onChange={handleExpiryChange}
                          maxLength={5}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.8rem' }}>CVV</label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="123"
                          value={cardData.cvv}
                          onChange={handleCvvChange}
                          maxLength={4}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.8rem' }}>Parcelamento</label>
                        <select
                          className="form-control"
                          value={cardData.installments}
                          onChange={(e) => setCardData(prev => ({ ...prev, installments: e.target.value }))}
                        >
                          <option value="1">1x de R$ {Number(selectedEvent.registrationFee || 0).toFixed(2)} (sem juros)</option>
                          <option value="2">2x de R$ {(Number(selectedEvent.registrationFee || 0) / 2).toFixed(2)} (sem juros)</option>
                          <option value="3">3x de R$ {(Number(selectedEvent.registrationFee || 0) / 3).toFixed(2)} (sem juros)</option>
                          <option value="6">6x de R$ {((Number(selectedEvent.registrationFee || 0) * 1.05) / 6).toFixed(2)}</option>
                          <option value="12">12x de R$ {((Number(selectedEvent.registrationFee || 0) * 1.12) / 12).toFixed(2)}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Status do Pagamento Cartão e Botão de Simulação */}
                  <div style={{
                    width: '100%',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    border: paymentApproved ? '1px solid var(--status-approved)' : '1px solid var(--status-pending)',
                    background: paymentApproved ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 171, 0, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {paymentApproved ? (
                        <>
                          <CheckCircle2 size={20} color="var(--status-approved)" style={{ flexShrink: 0 }} />
                          <div>
                            <div style={{ color: 'var(--status-approved)', fontWeight: 800, fontSize: '0.85rem' }}>
                              CARTÃO AUTORIZADO PELA OPERADORA
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                              Limite reservado e transação aprovada. Inscrição liberada!
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <Clock size={20} color="var(--status-pending)" style={{ flexShrink: 0 }} />
                          <div>
                            <div style={{ color: 'var(--status-pending)', fontWeight: 800, fontSize: '0.85rem' }}>
                              CARTÃO NÃO AUTORIZADO (PENDENTE)
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                              A inscrição permanece bloqueada até autorizar o cartão.
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {paymentApproved ? (
                      <button
                        type="button"
                        onClick={handleResetPayment}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-muted)',
                          padding: '6px 10px',
                          fontSize: '0.72rem',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                        title="Simular transação não aprovada para mostrar o bloqueio"
                      >
                        ↺ Desfazer (Testar Bloqueio)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSimulatePayment}
                        disabled={isSimulatingPayment}
                        style={{
                          background: 'linear-gradient(135deg, var(--accent-blue), #008ba3)',
                          border: 'none',
                          color: '#fff',
                          fontWeight: 800,
                          padding: '8px 14px',
                          fontSize: '0.78rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 0 12px rgba(0, 188, 212, 0.4)'
                        }}
                      >
                        {isSimulatingPayment ? (
                          'Autorizando Cartão...'
                        ) : (
                          <>
                            <Sparkles size={14} /> Simular Aprovação do Cartão
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)'
                  }}>
                    <Lock size={14} color="var(--accent-blue)" />
                    <span>Criptografia ponta a ponta. Dados preenchidos para validação didática do fluxo.</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Total + Botão */}
          {selectedEvent && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {!paymentApproved && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 171, 0, 0.1)',
                  border: '1px solid var(--status-pending)',
                  color: 'var(--status-pending)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 600
                }}>
                  <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Inscrição Bloqueada:</strong> É obrigatório simular e aprovar o pagamento ({paymentMethod === 'CREDIT_CARD' ? 'Cartão' : 'Pix'}) acima antes de concluir.
                  </span>
                </div>
              )}

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
                    color: paymentApproved ? 'var(--status-approved)' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    R$ {Number(selectedEvent.registrationFee || 0).toFixed(2)}
                    {paymentApproved ? (
                      <span className="badge badge-approved" style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                        PAGO
                      </span>
                    ) : (
                      <span className="badge badge-pending" style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                        PENDENTE
                      </span>
                    )}
                  </div>
                </div>
                
                <button
                  type="submit"
                  className={paymentApproved ? 'btn-primary' : 'btn-secondary'}
                  disabled={submitting || !paymentApproved}
                  style={{
                    whiteSpace: 'nowrap',
                    opacity: paymentApproved ? 1 : 0.65,
                    cursor: paymentApproved ? 'pointer' : 'not-allowed',
                    background: paymentApproved ? 'linear-gradient(135deg, var(--status-approved), #00b34d)' : 'rgba(255,255,255,0.05)',
                    borderColor: paymentApproved ? 'transparent' : 'var(--border-color)',
                    color: paymentApproved ? '#000' : 'var(--text-muted)',
                    fontWeight: 800,
                    boxShadow: paymentApproved ? '0 0 16px rgba(0, 230, 118, 0.4)' : 'none'
                  }}
                >
                  {submitting
                    ? 'Gravando Inscrição...'
                    : paymentApproved
                      ? '🏁 Concluir Inscrição (Pago)'
                      : '🔒 Bloqueado (Aguardando Pagamento)'}
                </button>
              </div>
            </div>
          )}

        </form>
      )}
    </div>
  )
}

export default Bookings
