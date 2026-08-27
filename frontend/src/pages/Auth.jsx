import React, { useState } from 'react'
import { API_BASE_URL } from '../App'
import { User, Mail, Lock, Shield, CreditCard, LogIn, UserPlus } from 'lucide-react'

/**
 * Componente de Autenticação (Auth).
 * Responsável por gerenciar os fluxos de Login e de Registro de novos usuários/pilotos.
 * 
 * @param {function} onLogin - Função callback para passar o token JWT e os dados do usuário para o App.jsx
 */
function Auth({ onLogin }) {
  // Controle de qual formulário mostrar: true para Login, false para Cadastro (Sign Up)
  const [isLogin, setIsLogin] = useState(true)
  
  // Estados para capturar os dados dos campos do formulário
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cpf, setCpf] = useState('')
  const [role, setRole] = useState('PILOT_SPECTATOR') // Padrão: Piloto/Espectador
  
  // Estados de feedback ao usuário
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  /**
   * Manipulador do envio do formulário de Login ou Registro.
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    // Escolhe o endpoint correto da API com base no estado da tela
    const endpoint = isLogin ? '/auth/login' : '/auth/register'
    const payload = isLogin 
      ? { email, password }
      : { name, email, password, cpf, role }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ocorreu um erro no servidor.')
      }

      if (isLogin) {
        // Se for login, passa as credenciais de sucesso de volta para o App.jsx
        onLogin(data.token, data.user)
      } else {
        // Se for registro, mostra mensagem de sucesso e redireciona para a tela de Login
        setMessage('Cadastro realizado com sucesso! Faça seu login.')
        setIsLogin(true)
        
        // Limpa os campos preenchidos
        setName('')
        setCpf('')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Elementos visuais decorativos de fundo (efeito de luzes brilhantes) */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, var(--accent-red-glow) 0%, transparent 70%)',
        top: '-150px',
        left: '-100px',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, var(--accent-blue-glow) 0%, transparent 70%)',
        bottom: '-200px',
        right: '-100px',
        pointerEvents: 'none'
      }} />

      {/* Painel principal de Autenticação */}
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '40px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        {/* Cabeçalho de identificação da marca */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            fontWeight: 900,
            letterSpacing: '1.5px',
            color: '#fff',
            marginBottom: '8px'
          }}>
            RACE<span style={{ color: 'var(--accent-red)' }}>SYNC</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isLogin ? 'Faça login para gerenciar suas baterias e vistorias' : 'Crie sua conta para participar e competir'}
          </p>
        </div>

        {/* Alerta de Erro */}
        {error && (
          <div style={{
            background: 'rgba(255, 23, 68, 0.1)',
            border: '1px solid var(--status-rejected)',
            color: '#ff4d6d',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.88rem',
            fontWeight: 600
          }}>
            {error}
          </div>
        )}

        {/* Alerta de Sucesso */}
        {message && (
          <div style={{
            background: 'rgba(0, 230, 118, 0.1)',
            border: '1px solid var(--status-approved)',
            color: '#00ff88',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.88rem',
            fontWeight: 600
          }}>
            {message}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Campo Nome Completo (Apenas no Cadastro) */}
          {!isLogin && (
            <div className="form-group">
              <label>Nome Completo</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={iconStyle} />
                <input
                  type="text"
                  required
                  placeholder="Seu Nome completo"
                  className="form-control"
                  style={inputWithIconStyle}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Campo E-mail (Comum para Login e Cadastro) */}
          <div className="form-group">
            <label>Endereço de E-mail</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={iconStyle} />
              <input
                type="email"
                required
                placeholder="nome@exemplo.com"
                className="form-control"
                style={inputWithIconStyle}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Campo CPF (Apenas no Cadastro) */}
          {!isLogin && (
            <div className="form-group">
              <label>CPF (Apenas números)</label>
              <div style={{ position: 'relative' }}>
                <CreditCard size={18} style={iconStyle} />
                <input
                  type="text"
                  required
                  placeholder="Apenas números"
                  className="form-control"
                  style={inputWithIconStyle}
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>
          )}

          {/* Campo Senha (Comum para Login e Cadastro) */}
          <div className="form-group">
            <label>Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={iconStyle} />
              <input
                type="password"
                required
                placeholder="Sua senha secreta"
                className="form-control"
                style={inputWithIconStyle}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Tipo de Perfil / Roles (Apenas no Cadastro) - Removed for public registers */}

          {/* Botão de Envio */}
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '12px', height: '48px' }}
          >
            {loading ? 'Processando...' : isLogin ? (
              <>
                Entrar no Grid
                <LogIn size={18} />
              </>
            ) : (
              <>
                Finalizar Cadastro
                <UserPlus size={18} />
              </>
            )}
          </button>
        </form>

        {/* Link para alternar entre as telas de Login e Cadastro */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isLogin ? 'Ainda não tem cadastro? ' : 'Já possui uma conta? '}
          </span>
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
              setMessage('')
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-red)',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? 'Cadastre-se' : 'Faça Login'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Estilos auxiliares reutilizáveis para os ícones e campos de texto
const iconStyle = {
  position: 'absolute',
  left: '16px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--text-muted)',
  pointerEvents: 'none'
}

const inputWithIconStyle = {
  paddingLeft: '48px',
  width: '100%'
}

export default Auth
