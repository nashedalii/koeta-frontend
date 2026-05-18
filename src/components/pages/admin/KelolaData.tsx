'use client'

import { useState, useEffect } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import KelolaUser from './KelolaUser'
import KelolaBus from './KelolaBus'
import KelolaKoridor from './KelolaKoridor'

type TabKey = 'user' | 'bus' | 'koridor'

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  {
    key: 'user',
    label: 'Kelola User',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    key: 'bus',
    label: 'Kelola Bus',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
  {
    key: 'koridor',
    label: 'Kelola Koridor',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
  },
]

// ── Sub-header shown below the tab bar for each section ─────────────────────
function SubHeader({ title, subtitle, icon }: { title: string; subtitle: string; icon: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      border: '1px solid #e2e8f0',
      padding: '14px 20px',
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: 'linear-gradient(135deg, #031E65, #0369A1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff',
      }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>{title}</p>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b', marginTop: 2 }}>{subtitle}</p>
      </div>
    </div>
  )
}

export default function KelolaData() {  const [activeTab, setActiveTab] = useState<TabKey>('user')

  // Read tab from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as TabKey
    if (TABS.some(t => t.key === hash)) setActiveTab(hash)
  }, [])

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key)
    window.history.replaceState(null, '', `#${key}`)
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content" style={{ paddingTop: 0 }}>

        {/* ── Page Header ── */}
        <div style={{ paddingTop: 24, paddingBottom: 0 }}>
          <PageHeader
            title="Kelola Data"
            subtitle="Manajemen user, bus, dan koridor armada"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#fff" style={{ width: 28, height: 28 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
            }
          />
        </div>

        {/* ── Tab Navigation ── */}
        <div style={{
          background: '#fff',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          padding: '6px',
          marginBottom: 20,
          display: 'flex',
          gap: 4,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#fff' : '#64748b',
                  background: isActive
                    ? 'linear-gradient(135deg, #031E65 0%, #0a2d8f 60%, #0369A1 100%)'
                    : 'transparent',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 2px 8px rgba(3,30,101,0.25)' : 'none',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9'
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }}
              >
                {tab.icon}
                <span className="tab-label-text">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* ── Tab Content ── */}
        {/* Render all tabs but only show active — preserves state */}
        <div style={{ display: activeTab === 'user' ? 'block' : 'none' }}>
          <SubHeader
            title="Kelola User"
            subtitle="Manajemen akun admin, petugas, dan driver"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            }
          />
          <KelolaUserEmbedded />
        </div>
        <div style={{ display: activeTab === 'bus' ? 'block' : 'none' }}>
          <SubHeader
            title="Kelola Bus"
            subtitle="Manajemen data bus dan kendaraan armada"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            }
          />
          <KelolaBusEmbedded />
        </div>
        <div style={{ display: activeTab === 'koridor' ? 'block' : 'none' }}>
          <SubHeader
            title="Kelola Koridor"
            subtitle="Manajemen rute koridor dan feeder armada"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
            }
          />
          <KelolaKoridor />
        </div>

      </div>

      <style>{`
        @media (max-width: 480px) {
          .tab-label-text { display: none; }
        }
      `}</style>
    </div>
  )
}

// ── Embedded wrappers (strip outer dashboard-container) ──────────────────────
// KelolaUser and KelolaBus each wrap themselves in dashboard-container.
// We render them inside KelolaData which already provides the container,
// so we use a CSS trick to neutralise the inner container padding/bg.

function KelolaUserEmbedded() {
  return (
    <div className="kelola-embedded">
      <KelolaUser />
    </div>
  )
}

function KelolaBusEmbedded() {
  return (
    <div className="kelola-embedded">
      <KelolaBus />
    </div>
  )
}
