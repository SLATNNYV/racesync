import React, { useEffect, useState } from 'react'
import { API_BASE_URL } from '../App'
import { QrCode, Search, Check, X, ShieldAlert, ShieldCheck, User, Car, Calendar, AlertCircle } from 'lucide-react'

/**
 * Componente da Portaria e Check-in do Autódromo.
 * Usado exclusivamente por gestores ou organizadores para ler e validar o QR Code digital dos pilotos na entrada.
 * 
 * @param {string} token - Token de autenticação JWT do usuário ativo (usado nas requisições HTTP)
 */
function CheckIn({ token }) {
  // Estado para armazenar o valor inserido na caixa de texto que simula o QR Code (Token UUID)
  const [qrTokenInput, setQrTokenInput] = useState('')
  
  // Estado para armazenar os detalhes da credencial que foi validada com sucesso
  const [scanResult, setScanResult] = useState(null)
  
  // Estado para capturar e exibir mensagens de erro durante a validação
  const [scanError, setScanError] = useState('')
  
  // Estado que armazena a lista geral de reservas buscada da base de dados do sistema
  const [bookings, setBookings] = useState([])
  
  // Estado de controle para mostrar feedback visual de carregamento na tela
  const [loading, setLoading] = useState(true)
  
  // Estado para filtrar as reservas na barra de busca
  const [searchTerm, setSearchTerm] = useState('')
  
  // Estado lógico para indicar se o sistema está processando uma requisição de check-in ativa
  const [processingToken, setProcessingToken] = useState(false)

  // Hook que roda uma vez no carregamento do componente para carregar a lista de reservas do banco
  useEffect(() => {
    fetchBookings()
  }, [])

  /**
   * Função para carregar todas as inscrições cadastradas de puxadas no sistema (/api/bookings/all).
   * Restrita apenas a gestores e organizadores no backend.
   */
  const fetchBookings = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      }
    } catch (err) {
      console.error('Erro ao buscar reservas:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Processa a validação enviando o token do leitor de QR Code para a rota `/api/bookings/check-in`.
   */
  const handleTokenCheckIn = async (e) => {
    e.preventDefault()
    if (!qrTokenInput.trim()) return

    setProcessingToken(true)
    setScanResult(null)
    setScanError('')

    try {
      const response = await fetch(`${API_BASE_URL}/bookings/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ qrCodeToken: qrTokenInput.trim() })
      })

      // Lê o conteúdo da resposta
      let data
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      if (response.ok) {
        setScanResult({
          success: true,
          booking: typeof data === 'string' ? null : data
        })
        setQrTokenInput('')
        fetchBookings()
      } else {
        setScanError(typeof data === 'string' ? data : (data.error || 'Erro na validação do check-in.'))
      }
    } catch (err) {
      console.error('Erro ao processar check-in:', err)
      setScanError('Erro de conexão ao servidor.')
    } finally {
      setProcessingToken(false)
    }
  }

  /**
   * Permite que o gestor faça o check-in manual direto da lista de reservas.
   * 
   * @param {string} qrCodeToken - Token UUID da reserva que será processada
   */
  const handleManualCheckIn = async (qrCodeToken) => {
    setProcessingToken(true)
    setScanResult(null)
    setScanError('')

    try {
      const response = await fetch(`${API_BASE_URL}/bookings/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ qrCodeToken })
      })

      let data
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      if (response.ok) {
        const bookingObj = typeof data === 'string' ? null : data
        setScanResult({
          success: true,
          booking: bookingObj || bookings.find(b => b.qrCodeToken === qrCodeToken)
        })
        fetchBookings()
      } else {
        setScanError(typeof data === 'string' ? data : (data.error || 'Check-in recusado.'))
      }
    } catch (err) {
      console.error('Erro ao processar check-in manual:', err)
      setScanError('Erro de conexão ao servidor.')
    } finally {
      setProcessingToken(false)
    }
  }

  // Filtra as reservas de acordo com o texto digitado na barra de buscas
  const filteredBookings = bookings.filter(b =>
    b.pilot?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.vehicle?.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.vehicle?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.event?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.qrCodeToken.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      
      {/* Cabeçalho da página */}
      <div className="page-header">
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>
            PORTAL ADMINISTRATIVO
          </span>
          <h2 className="page-title">PORTARIA & CHECK-IN</h2>
        </div>
        <button className="btn-secondary btn-mobile-full" onClick={fetchBookings}>
          Atualizar Lista
        </button>
      </div>

      {/* Grid de duas colunas responsivo */}
      <div className="grid-checkin">
        
        {/* Coluna Esquerda: Formulário Simulador de Scanner QR Code */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <QrCode size={18} color="var(--accent-blue)" />
              Simulador de Leitora QR
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px' }}>
              Insira o token UUID da credencial do piloto para simular a leitura do QR Code na portaria.
            </p>

            <form onSubmit={handleTokenCheckIn} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Token da Credencial (UUID)</label>
                <input
                  type="text"
                  placeholder="Cole o UUID da credencial..."
                  className="form-control"
                  required
                  value={qrTokenInput}
                  onChange={(e) => setQrTokenInput(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={processingToken || !qrTokenInput.trim()}
              >
                {processingToken ? 'Validando...' : 'Validar Entrada'}
              </button>
            </form>
          </div>

          {/* Renderização do Resultado do Scan */}
          {(scanResult || scanError) && (
            <div className="glass-panel animate-fade-in" style={{
              border: `1px solid ${scanError ? 'var(--status-rejected)' : 'var(--status-approved)'}`,
              background: scanError ? 'rgba(255, 23, 68, 0.05)' : 'rgba(0, 230, 118, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: '24px'
            }}>
              {/* Se o check-in foi bem sucedido */}
              {scanResult && scanResult.booking && (
                <>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(0, 230, 118, 0.15)',
                    border: '2px solid var(--status-approved)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--status-approved)',
                    marginBottom: '12px'
                  }}>
                    <Check size={32} />
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: '1.1rem', marginBottom: '4px', textTransform: 'uppercase' }}>
                    CHECK-IN CONFIRMADO!
                  </h4>
                  <p style={{ color: 'var(--status-approved)', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '16px' }}>
                    ENTRADA LIBERADA PARA A PISTA
                  </p>

                  {/* Detalhes do piloto e veículo no painel de portaria */}
                  <div style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '14px',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div><strong>Piloto:</strong> {scanResult.booking.pilot?.name || 'Piloto'}</div>
                    <div><strong>Evento:</strong> {scanResult.booking.event?.name}</div>
                    <div><strong>Chave / Sorteio:</strong> {scanResult.booking.timeSlot}</div>
                    <div><strong>Carro:</strong> {scanResult.booking.vehicle?.name} (Nº #{scanResult.booking.vehicle?.number})</div>
                  </div>
                </>
              )}

              {/* Se o check-in falhou */}
              {scanError && (
                <>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(255, 23, 68, 0.15)',
                    border: '2px solid var(--status-rejected)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--status-rejected)',
                    marginBottom: '12px'
                  }}>
                    <ShieldAlert size={32} />
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: '1.1rem', marginBottom: '8px', textTransform: 'uppercase' }}>
                    ACESSO NEGADO!
                  </h4>
                  <p style={{ color: 'var(--status-rejected)', fontSize: '0.88rem', fontWeight: 600, padding: '0 8px', lineHeight: '1.4' }}>
                    {scanError}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Coluna Direita: Lista Geral de Reservas & Acessos cadastrados */}
        <div className="glass-panel">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: '#fff', marginBottom: '14px' }}>
            Lista Geral de Reservas & Acessos
          </h3>

          {/* Campo de Busca rápida */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar piloto, carro ou token..."
              className="form-control"
              style={{ width: '100%', paddingLeft: '42px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>Carregando dados...</div>
          ) : filteredBookings.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>Nenhuma reserva encontrada.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredBookings.map(booking => {
                const isCheckedIn = booking.status === 'CHECKED_IN'
                const isInspected = booking.vehicle?.inspectionStatus === 'APPROVED'
                const isRejected = booking.vehicle?.inspectionStatus === 'REJECTED'

                return (
                  <div key={booking.id} style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '14px',
                    background: isCheckedIn ? 'rgba(0, 230, 118, 0.02)' : 'rgba(255,255,255,0.01)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    flexWrap: 'wrap'
                  }}>
                    {/* Informações detalhadas do piloto e seu agendamento */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
                        {booking.pilot?.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <div>Evento: {booking.event?.name}</div>
                        <div>Chave: {booking.timeSlot}</div>
                        <div>Veículo: {booking.vehicle?.name} (#{booking.vehicle?.number})</div>
                        <div className="booking-token" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', wordBreak: 'break-all', marginTop: '3px' }}>
                          Token: {booking.qrCodeToken}
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ações e Status da vistoria */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                      {isCheckedIn ? (
                        <span className="badge badge-approved" style={{ fontSize: '0.65rem' }}>Na Puxada</span>
                      ) : (
                        <>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {isInspected ? (
                              <span className="badge badge-approved" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>Vistoria OK</span>
                            ) : isRejected ? (
                              <span className="badge badge-rejected" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>Reprovado</span>
                            ) : (
                              <span className="badge badge-pending" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>Pendente</span>
                            )}
                          </div>

                          {/* Botão de Check-in Manual */}
                          <button
                            className="btn-primary"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.75rem',
                              minHeight: '36px',
                              background: isInspected ? 'linear-gradient(135deg, var(--accent-blue), #008ba3)' : 'rgba(255,255,255,0.05)',
                              boxShadow: isInspected ? '0 2px 8px rgba(0, 188, 212, 0.2)' : 'none',
                              border: isInspected ? 'none' : '1px solid var(--border-color)',
                              color: isInspected ? '#fff' : 'var(--text-muted)',
                              cursor: isInspected ? 'pointer' : 'not-allowed'
                            }}
                            onClick={() => handleManualCheckIn(booking.qrCodeToken)}
                            disabled={!isInspected || processingToken}
                          >
                            Check-in
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CheckIn
