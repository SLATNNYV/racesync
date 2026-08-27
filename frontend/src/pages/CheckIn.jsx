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
  
  // Estado para capturar e exibir mensagens de erro durante a validação (como "Vistoria Reprovada" ou "Token inválido")
  const [scanError, setScanError] = useState('')
  
  // Estado que armazena a lista geral de reservas buscada da base de dados do sistema
  const [bookings, setBookings] = useState([])
  
  // Estado de controle para mostrar feedback visual de carregamento na tela
  const [loading, setLoading] = useState(true)
  
  // Estado para filtrar as reservas na barra de busca (por piloto, carro, placa, etc.)
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
   * Esta função simula o hardware físico da portaria batendo na API e retornando a aprovação ou recusa do piloto.
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

      // Lê o conteúdo da resposta, que pode ser JSON (se aprovado) ou texto plano (se recusado com string explicativa)
      let data
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      if (response.ok) {
        // Se a resposta retornou sucesso (HTTP 200), exibe o check-in como aprovado
        setScanResult({
          success: true,
          booking: typeof data === 'string' ? null : data
        })
        setQrTokenInput('')
        // Atualiza a listagem de reservas para marcar o piloto como CHECKED_IN
        fetchBookings()
      } else {
        // Se a resposta retornou erro, captura a string descritiva da recusa técnica e exibe na tela
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
   * Permite que o gestor faça o check-in manual direto da lista de reservas sem precisar colar o token.
   * Utiliza o mesmo fluxo e rota de validação de segurança da API.
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      
      {/* Cabeçalho da página */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>
            PORTAL ADMINISTRATIVO
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
            PORTARIA & CHECK-IN DE ARRANCADA
          </h2>
        </div>
        <button className="btn-secondary" onClick={fetchBookings}>
          Atualizar Lista
        </button>
      </div>

      {/* Grid de duas colunas: Esquerda (Leitor QR) e Direita (Lista de reservas) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '32px', alignItems: 'flex-start' }}>
        
        {/* Coluna Esquerda: Formulário Simulador de Scanner QR Code */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="glass-panel" style={{ border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <QrCode size={20} color="var(--accent-blue)" />
              Simulador de Leitora QR Code
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '20px' }}>
              Insira o token de segurança UUID da credencial do piloto para simular a leitura do QR Code na portaria do autódromo.
            </p>

            <form onSubmit={handleTokenCheckIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Token da Credencial (UUID)</label>
                <input 
                  type="text" 
                  placeholder="Cole o UUID da credencial (ex: 8f4e2b...)" 
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

          {/* Renderização do Resultado do Scan (Painel de Sucesso ou Erro) */}
          {(scanResult || scanError) && (
            <div className="glass-panel animate-fade-in" style={{
              border: `1px solid ${scanError ? 'var(--status-rejected)' : 'var(--status-approved)'}`,
              background: scanError ? 'rgba(255, 23, 68, 0.05)' : 'rgba(0, 230, 118, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: '32px'
            }}>
              {/* Se o check-in foi bem sucedido */}
              {scanResult && scanResult.booking && (
                <>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(0, 230, 118, 0.15)',
                    border: '2px solid var(--status-approved)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--status-approved)',
                    marginBottom: '16px'
                  }}>
                    <Check size={36} />
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: '1.25rem', marginBottom: '4px', textTransform: 'uppercase' }}>
                    CHECK-IN CONFIRMADO!
                  </h4>
                  <p style={{ color: 'var(--status-approved)', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '20px' }}>
                    ENTRADA LIBERADA PARA A PISTA
                  </p>

                  {/* Detalhes do piloto e veículo no painel de portaria */}
                  <div style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '16px',
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div><strong>Piloto:</strong> {scanResult.booking.pilot?.name || 'Piloto'}</div>
                    <div><strong>Evento:</strong> {scanResult.booking.event?.name}</div>
                    <div><strong>Chave / Sorteio:</strong> {scanResult.booking.timeSlot}</div>
                    <div><strong>Carro:</strong> {scanResult.booking.vehicle?.name} (Nº #{scanResult.booking.vehicle?.number})</div>
                  </div>
                </>
              )}

              {/* Se o check-in falhou (por exemplo, carro reprovado na vistoria de segurança) */}
              {scanError && (
                <>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(255, 23, 68, 0.15)',
                    border: '2px solid var(--status-rejected)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--status-rejected)',
                    marginBottom: '16px'
                  }}>
                    <ShieldAlert size={36} />
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: '1.25rem', marginBottom: '8px', textTransform: 'uppercase' }}>
                    ACESSO NEGADO!
                  </h4>
                  <p style={{ color: 'var(--status-rejected)', fontSize: '0.9rem', fontWeight: 600, padding: '0 10px', lineHeight: '1.4' }}>
                    {scanError}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Coluna Direita: Lista Geral de Reservas & Acessos cadastrados */}
        <div className="glass-panel">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: '#fff', marginBottom: '16px' }}>
            Lista Geral de Reservas & Acessos
          </h3>

          {/* Campo de Busca rápida */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar piloto, carro, placa ou token..." 
              className="form-control"
              style={{ width: '100%', paddingLeft: '48px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>Carregando dados...</div>
          ) : filteredBookings.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>Nenhuma reserva encontrada.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredBookings.map(booking => {
                const isCheckedIn = booking.status === 'CHECKED_IN'
                const isInspected = booking.vehicle?.inspectionStatus === 'APPROVED'
                const isRejected = booking.vehicle?.inspectionStatus === 'REJECTED'

                return (
                  <div key={booking.id} style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '16px',
                    background: isCheckedIn ? 'rgba(0, 230, 118, 0.02)' : 'rgba(255,255,255,0.01)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    {/* Informações detalhadas do piloto e seu agendamento */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>
                        {booking.pilot?.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <div>Evento: {booking.event?.name}</div>
                        <div>Chave / Sorteio: {booking.timeSlot}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          Veículo: {booking.vehicle?.name} (Nº #{booking.vehicle?.number})
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', wordBreak: 'break-all', marginTop: '4px' }}>
                          Token: {booking.qrCodeToken}
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ações e Status da vistoria */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      {isCheckedIn ? (
                        <span className="badge badge-approved" style={{ fontSize: '0.7rem' }}>Na Área de Puxada</span>
                      ) : (
                        <>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {isInspected ? (
                              <span className="badge badge-approved" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>Vistoria OK</span>
                            ) : isRejected ? (
                              <span className="badge badge-rejected" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>Vistoria Reprovada</span>
                            ) : (
                              <span className="badge badge-pending" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>Vistoria Pendente</span>
                            )}
                          </div>

                          {/* Botão de Check-in Manual. Habilitado apenas se o carro foi inspecionado e Aprovado */}
                          <button 
                            className="btn-primary" 
                            style={{ 
                              padding: '6px 12px', 
                              fontSize: '0.75rem', 
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
