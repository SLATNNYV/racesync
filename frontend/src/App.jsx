import React, { useState, useEffect } from 'react'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Vehicles from './pages/Vehicles'
import Bookings from './pages/Bookings'
import InspectionPortal from './pages/InspectionPortal'
import CheckIn from './pages/CheckIn'
import { LogOut, Car, Calendar, CheckSquare, LayoutDashboard, User, QrCode } from 'lucide-react'

// Backend base URL
export const API_BASE_URL = 'https://racesync-t9y9.onrender.com'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [loading, setLoading] = useState(true)


  // Fetch current user details on load or token change
  useEffect(() => {
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    setLoading(true)
    fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Unauthorized')
        }
        return res.json()
      })
      .then(data => {
        setUser(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Session restore failed:', err)
        logout()
      })
  }, [token])

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(userData)
    setCurrentPage('dashboard')
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken('')
    setUser(null)
    setCurrentPage('dashboard')
  }

  const navigate = (page) => {
    setCurrentPage(page)
    setMobileMenuOpen(false)
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#090a0f',
        color: '#ff334b',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        fontFamily: 'Orbitron, sans-serif',
        textAlign: 'center',
        padding: '20px'
      }}>
        CARREGANDO RACESYNC...
      </div>
    )
  }

  if (!user) {
    return <Auth onLogin={login} />
  }

  // Helper to check role
  const isManagerOrOrganizer = user.role === 'MANAGER' || user.role === 'ORGANIZER'

  // Nav items config
  const navItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'vehicles', label: 'Veículos', icon: Car },
    { id: 'bookings', label: 'Puxadas', icon: Calendar },
    ...(isManagerOrOrganizer ? [
      { id: 'inspection', label: 'Vistoria', icon: CheckSquare },
      { id: 'checkin', label: 'Check-in', icon: QrCode },
    ] : []),
  ]

  return (
    <div className="app-shell">
      {/* ─── Sidebar Desktop ─── */}
      <aside className="app-sidebar">
        {/* Logo / Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-red), #e60026)',
            padding: '10px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(255, 51, 75, 0.3)'
          }}>
            <Calendar size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: 900,
              letterSpacing: '1px',
              color: '#fff'
            }}>
              RACE<span style={{ color: 'var(--accent-red)' }}>SYNC</span>
            </h1>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>
              MARINGÁ ARRANCADA
            </span>
          </div>
        </div>

        {/* User Info Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '8px',
            borderRadius: '50%',
            color: 'var(--accent-blue)'
          }}>
            <User size={18} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {isManagerOrOrganizer ? 'Administrador (ADM)' : 'Piloto'}
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
          {navItems.map(item => (
            <button
              key={item.id}
              className="btn-nav"
              style={navItemStyle(currentPage === item.id)}
              onClick={() => navigate(item.id)}
            >
              <item.icon size={18} />
              {item.label === 'Painel' ? 'Painel do Usuário' :
               item.label === 'Veículos' ? 'Meus Veículos' :
               item.label === 'Puxadas' ? 'Agendar Puxadas' :
               item.label === 'Vistoria' ? 'Vistoria Técnica' :
               'Portaria & Check-in'}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <button
          className="btn-secondary"
          onClick={logout}
          style={{ justifyContent: 'center', gap: '10px' }}
        >
          <LogOut size={16} />
          Sair
        </button>
      </aside>

      {/* ─── Main Page Area ─── */}
      <main className="app-main">
        {/* Mobile Header */}
        <div style={{
          display: 'none',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(9, 10, 15, 0.9)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '12px 0',
          margin: '0 0 20px 0',
        }} className="mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--accent-red), #e60026)',
              padding: '6px',
              borderRadius: '8px',
            }}>
              <Calendar size={18} color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1rem', color: '#fff' }}>
              RACE<span style={{ color: 'var(--accent-red)' }}>SYNC</span>
            </span>
          </div>
          <button
            onClick={logout}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              minHeight: '44px',
              minWidth: '44px',
              justifyContent: 'center',
            }}
          >
            <LogOut size={16} />
          </button>
        </div>

        {currentPage === 'dashboard' && <Dashboard token={token} user={user} navigate={navigate} />}
        {currentPage === 'vehicles' && <Vehicles token={token} />}
        {currentPage === 'bookings' && <Bookings token={token} />}
        {currentPage === 'inspection' && isManagerOrOrganizer && <InspectionPortal token={token} />}
        {currentPage === 'checkin' && isManagerOrOrganizer && <CheckIn token={token} />}
      </main>

      {/* ─── Bottom Navigation Mobile ─── */}
      <nav className="bottom-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`bottom-nav-item${currentPage === item.id ? ' active' : ''}`}
            onClick={() => navigate(item.id)}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
        <button
          className="bottom-nav-item"
          onClick={logout}
          style={{ color: 'var(--status-rejected)' }}
        >
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </nav>
    </div>
  )
}

const navItemStyle = (isActive) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  width: '100%',
  padding: '12px 16px',
  background: isActive ? 'rgba(255, 51, 75, 0.1)' : 'transparent',
  border: 'none',
  borderLeft: isActive ? '3px solid var(--accent-red)' : '3px solid transparent',
  color: isActive ? '#fff' : 'var(--text-muted)',
  borderRadius: '0 8px 8px 0',
  fontSize: '0.9rem',
  fontWeight: isActive ? 600 : 500,
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'all 0.2s ease'
})

export default App
