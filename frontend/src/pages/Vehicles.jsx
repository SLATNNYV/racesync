import React, { useEffect, useState } from 'react'
import { API_BASE_URL } from '../App'
import { Car, Plus, ShieldCheck, ShieldAlert, Clock, Info } from 'lucide-react'

/**
 * Componente da Garagem / Meus Veículos.
 * Permite aos pilotos cadastrar seus carros e verificar o histórico e parecer da vistoria técnica.
 * 
 * @param {string} token - Token de acesso JWT
 */
function Vehicles({ token }) {
  // Lista de carros cadastrados pelo piloto
  const [vehicles, setVehicles] = useState([])
  
  // Estados para capturar os dados do formulário de cadastro de novo veículo
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [category, setCategory] = useState('')
  
  // Controle para exibir ou ocultar o formulário de cadastro
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Estados para alertas de erro e mensagens de sucesso
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Hook disparado no carregamento da tela para listar os veículos do piloto
  useEffect(() => {
    fetchVehicles()
  }, [])

  /**
   * Busca os carros pertencentes ao piloto logado atual (/api/vehicles).
   */
  const fetchVehicles = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setVehicles(data)
      }
    } catch (err) {
      console.error('Erro ao buscar veículos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNumberChange = (e) => {
    // Blocks letters, allow only digits
    const numericValue = e.target.value.replace(/\D/g, '')
    setNumber(numericValue)
  }

  /**
   * Manipula o envio do formulário para salvar um novo veículo na API (/api/vehicles) - Método POST.
   */
  const handleAddVehicle = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!category) {
      setError('Por favor, selecione uma categoria de inscrição.')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          number,
          category
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao cadastrar veículo. Verifique os dados.')
      }

      const newVehicle = await response.json()
      
      // Insere o novo carro no estado local para renderização dinâmica
      setVehicles([...vehicles, newVehicle])
      setMessage('Veículo cadastrado com sucesso!')
      
      // Limpa os campos do formulário
      setName('')
      setNumber('')
      setCategory('')
      setShowAddForm(false) // Oculta o formulário de cadastro
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      
      {/* Cabeçalho da Página */}
      <div className="page-header">
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>
            GARAGEM
          </span>
          <h2 className="page-title">MEUS VEÍCULOS</h2>
        </div>
        <button className="btn-primary btn-mobile-full" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={16} />
          {showAddForm ? 'Cancelar' : 'Cadastrar Veículo'}
        </button>
      </div>

      {/* Exibição de Alertas */}
      {error && (
        <div style={{ background: 'rgba(255,23,68,0.1)', border: '1px solid var(--status-rejected)', color: '#ff4d6d', padding: '12px 16px', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid var(--status-approved)', color: '#00ff88', padding: '12px 16px', borderRadius: '8px' }}>
          {message}
        </div>
      )}

      {/* Formulário de Inclusão de Veículo */}
      {showAddForm && (
        <div className="glass-panel">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '16px', color: '#fff' }}>
            CADASTRAR NOVO VEÍCULO
          </h3>
          <form onSubmit={handleAddVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Nome do Veículo</label>
              <input
                type="text"
                required
                placeholder="Ex: Honda Civic Si"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Grid responsivo: número e categoria lado a lado no desktop, coluna única no mobile */}
            <div className="grid-vehicles-form">
              <div className="form-group" style={{ margin: 0 }}>
                <label>Nº do Carro</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 77"
                  className="form-control"
                  value={number}
                  onChange={handleNumberChange}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>Categoria de Inscrição</label>
                <select
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="">Selecione a Categoria</option>
                  <option value="Carros Turbo">Carros Turbo</option>
                  <option value="Carros Aspirados">Carros Aspirados</option>
                  <option value="Motos Speed">Motos Speed</option>
                  <option value="Clássicos / Originais">Clássicos / Originais</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', minWidth: '140px' }}>
              Salvar Veículo
            </button>
          </form>
        </div>
      )}

      {/* Grid contendo os cards dos veículos */}
      {loading ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Carregando garagem...</div>
      ) : vehicles.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <Car size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p>Você não possui nenhum veículo cadastrado na sua garagem.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {vehicles.map(vehicle => (
            <div key={vehicle.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Nome do carro e Distintivo de Status de Vistoria */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: '1rem' }}>
                    {vehicle.name}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Nº: <strong style={{ color: 'var(--accent-red)' }}>#{vehicle.number}</strong></span>
                    <span>Categoria: <strong>{vehicle.category}</strong></span>
                  </div>
                </div>
                
                {/* Badge dinâmica de aprovação de segurança */}
                {vehicle.inspectionStatus === 'APPROVED' && (
                  <span className="badge badge-approved">APROVADO</span>
                )}
                {vehicle.inspectionStatus === 'REJECTED' && (
                  <span className="badge badge-rejected">REPROVADO</span>
                )}
                {vehicle.inspectionStatus === 'PENDING' && (
                  <span className="badge badge-pending">PENDENTE</span>
                )}
              </div>

              {/* Informações detalhadas e parecer do vistoriador técnico */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '0.82rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                  <Info size={14} />
                  Histórico de Vistoria
                </div>
                <p style={{ color: vehicle.inspectionNotes ? 'var(--text-main)' : 'var(--text-muted)', fontStyle: vehicle.inspectionNotes ? 'normal' : 'italic' }}>
                  {vehicle.inspectionNotes || 'Nenhuma observação técnica registrada ainda.'}
                </p>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Vehicles
