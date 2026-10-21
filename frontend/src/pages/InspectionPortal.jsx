import React, { useEffect, useState } from 'react'
import { API_BASE_URL } from '../App'
import { Check, X, ShieldAlert, ShieldCheck, User, Search, RefreshCw, AlertCircle } from 'lucide-react'

/**
 * Componente do Portal de Vistoria Técnica (Inspeção).
 * Usado exclusivamente por gestores ou organizadores para vistoriar fisicamente os carros
 * nos boxes do autódromo antes que eles possam correr.
 * 
 * @param {string} token - Token de acesso JWT do usuário logado
 */
function InspectionPortal({ token }) {
  // Lista geral de veículos cadastrados no sistema
  const [vehicles, setVehicles] = useState([])
  
  // Controle de feedback visual de carregamento
  const [loading, setLoading] = useState(true)
  
  // Filtro de buscas na tabela
  const [searchTerm, setSearchTerm] = useState('')
  
  // Guarda o veículo que está sendo vistoriado no formulário ativo
  const [editingVehicle, setEditingVehicle] = useState(null)
  
  // Guarda a decisão de segurança escolhida no formulário (APPROVED ou REJECTED)
  const [inspectionStatus, setInspectionStatus] = useState('APPROVED')
  
  // Anotações sobre o estado de segurança do carro
  const [inspectionNotes, setInspectionNotes] = useState('')
  
  // Controle de submissão do formulário
  const [submitting, setSubmitting] = useState(false)
  
  // Mensagens de erro e sucesso da API
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Carrega os veículos cadastrados no carregamento da tela
  useEffect(() => {
    fetchVehicles()
  }, [])

  /**
   * Busca a lista de todos os veículos cadastrados no sistema (/api/vehicles/all).
   */
  const fetchVehicles = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setVehicles(data)
      } else {
        setError('Não foi possível carregar os veículos para vistoria.')
      }
    } catch (err) {
      console.error('Erro ao buscar veículos no portal:', err)
      setError('Erro de conexão ao buscar veículos.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Abre o formulário lateral de vistoria técnica preenchendo as informações pré-existentes.
   * 
   * @param {object} vehicle - Objeto do veículo selecionado para vistoria
   */
  const startInspection = (vehicle) => {
    setEditingVehicle(vehicle)
    setInspectionStatus(vehicle.inspectionStatus || 'APPROVED')
    setInspectionNotes(vehicle.inspectionNotes || '')
    setMessage('')
    setError('')
    // Scroll para o formulário de vistoria no mobile
    setTimeout(() => {
      document.getElementById('inspection-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  /**
   * Envia o parecer da vistoria técnica para a API do backend (/api/vehicles/{id}/inspect).
   */
  const handleInspectSubmit = async (e) => {
    e.preventDefault()
    if (!editingVehicle) return

    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${editingVehicle.id}/inspect`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: inspectionStatus,
          notes: inspectionNotes
        })
      })

      if (!response.ok) {
        throw new Error('Falha ao registrar vistoria.')
      }

      const updatedVehicle = await response.json()
      
      // Atualiza o estado da lista local com as novas informações da vistoria
      setVehicles(vehicles.map(v => v.id === updatedVehicle.id ? updatedVehicle : v))
      setMessage(`Vistoria do veículo ${updatedVehicle.name} registrada!`)
      setEditingVehicle(null) // Fecha o formulário lateral
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Filtra os carros com base na caixa de pesquisa
  const filteredVehicles = vehicles.filter(v =>
    v.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.owner.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Número de colunas do grid: 2 se estiver editando (desktop), 1 caso contrário
  const gridCols = editingVehicle ? '1.2fr 1fr' : '1fr'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      
      {/* Cabeçalho */}
      <div className="page-header">
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>
            PORTAL ADMINISTRATIVO
          </span>
          <h2 className="page-title">VISTORIA TÉCNICA</h2>
        </div>
        <button className="btn-secondary btn-mobile-full" onClick={fetchVehicles}>
          <RefreshCw size={16} />
          Atualizar Lista
        </button>
      </div>

      {/* Alertas */}
      {message && (
        <div style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid var(--status-approved)', color: '#00ff88', padding: '12px 16px', borderRadius: '8px' }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(255,23,68,0.1)', border: '1px solid var(--status-rejected)', color: '#ff4d6d', padding: '12px 16px', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {/* Grid responsivo: Tabela (Esquerda) + Painel de Vistoria (Direita, se selecionado) */}
      <div
        className="grid-inspection"
        style={{ gridTemplateColumns: editingVehicle ? gridCols : '1fr' }}
      >
        
        {/* Tabela de Veículos com barra de pesquisa */}
        <div className="glass-panel">
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar por piloto, modelo ou categoria..."
              className="form-control"
              style={{ width: '100%', paddingLeft: '42px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>Carregando dados dos veículos...</div>
          ) : filteredVehicles.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>Nenhum veículo encontrado correspondendo aos critérios.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              {/* Tabela no desktop */}
              <table className="inspection-table">
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', height: '40px' }}>
                    <th style={{ padding: '8px 12px' }}>Piloto</th>
                    <th style={{ padding: '8px 12px' }}>Veículo</th>
                    <th style={{ padding: '8px 12px' }}>Nº</th>
                    <th style={{ padding: '8px 12px' }}>Status</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map(vehicle => (
                    <tr key={vehicle.id} style={{ borderBottom: '1px solid var(--border-color)', height: '54px' }}>
                      <td style={{ padding: '8px 12px' }} data-label="Piloto">
                        <div><strong>{vehicle.owner.name}</strong></div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{vehicle.owner.email}</div>
                      </td>
                      <td style={{ padding: '8px 12px' }} data-label="Veículo">{vehicle.name} ({vehicle.category})</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, fontFamily: 'var(--font-display)' }} data-label="Nº">#{vehicle.number}</td>
                      <td style={{ padding: '8px 12px' }} data-label="Status">
                        {vehicle.inspectionStatus === 'APPROVED' ? (
                          <span className="badge badge-approved">Aprovado</span>
                        ) : vehicle.inspectionStatus === 'REJECTED' ? (
                          <span className="badge badge-rejected">Reprovado</span>
                        ) : (
                          <span className="badge badge-pending">Pendente</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', minHeight: '36px' }}
                          onClick={() => startInspection(vehicle)}
                        >
                          Vistoriar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Formulário ativo para dar parecer na vistoria */}
        {editingVehicle && (
          <div id="inspection-form" className="glass-panel animate-fade-in" style={{ border: '1px solid var(--accent-blue)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: '#fff' }}>
                VISTORIAR VEÍCULO
              </h3>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', minHeight: '36px', minWidth: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setEditingVehicle(null)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Sumário do Veículo selecionado */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              padding: '14px',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '0.85rem'
            }}>
              <div><strong>Piloto:</strong> {editingVehicle.owner.name}</div>
              <div><strong>Carro:</strong> {editingVehicle.name} ({editingVehicle.category})</div>
              <div><strong>Nº:</strong> #{editingVehicle.number}</div>
            </div>

            {/* Formulário técnico */}
            <form onSubmit={handleInspectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Decisão de Segurança</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* Botão para Aprovar */}
                  <button
                    type="button"
                    style={{
                      flexGrow: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s',
                      background: inspectionStatus === 'APPROVED' ? 'rgba(0,230,118,0.15)' : 'transparent',
                      borderColor: inspectionStatus === 'APPROVED' ? 'var(--status-approved)' : 'var(--border-color)',
                      color: inspectionStatus === 'APPROVED' ? 'var(--status-approved)' : 'var(--text-muted)',
                      minHeight: '48px'
                    }}
                    onClick={() => setInspectionStatus('APPROVED')}
                  >
                    <ShieldCheck size={18} />
                    Aprovar
                  </button>

                  {/* Botão para Reprovar */}
                  <button
                    type="button"
                    style={{
                      flexGrow: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s',
                      background: inspectionStatus === 'REJECTED' ? 'rgba(255,23,68,0.15)' : 'transparent',
                      borderColor: inspectionStatus === 'REJECTED' ? 'var(--status-rejected)' : 'var(--border-color)',
                      color: inspectionStatus === 'REJECTED' ? 'var(--status-rejected)' : 'var(--text-muted)',
                      minHeight: '48px'
                    }}
                    onClick={() => setInspectionStatus('REJECTED')}
                  >
                    <ShieldAlert size={18} />
                    Reprovar
                  </button>
                </div>
              </div>

              {/* Descrição técnica */}
              <div className="form-group" style={{ margin: 0 }}>
                <label>Relatório Técnico & Observações</label>
                <textarea
                  required
                  placeholder="Descreva o estado dos pneus, freios, vazamentos, cintos de segurança ou qualquer avaria técnica identificada."
                  rows={4}
                  className="form-control"
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  style={{ resize: 'vertical', fontSize: '16px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flexGrow: 1, justifyContent: 'center' }} disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar Vistoria'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setEditingVehicle(null)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}

export default InspectionPortal
