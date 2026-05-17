'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/utils/api'
import PageHeader from '@/components/ui/PageHeader'

// ── Types ──────────────────────────────────────────────────────────────
interface DriverData {
  id: number
  nama: string
  nama_kernet: string | null
  username: string
  no_hp: string
  status_aktif: 'aktif' | 'nonaktif'
  armada_id: number
  kode_armada: string
  nama_armada: string
  kode_bus: string | null
  nopol: string | null
}

interface DriverWithStats extends DriverData {
  averageScore: number
  latestMonthScore: number
  trend: 'up' | 'down' | 'stable'
}

// ── Helpers ────────────────────────────────────────────────────────────
function getArmadaIdFromAuth(): number | null {
  try {
    const raw = localStorage.getItem('auth')
    if (!raw) return null
    const auth = JSON.parse(raw)
    return auth?.user?.armada_id ?? null
  } catch {
    return null
  }
}

// ── Component ──────────────────────────────────────────────────────────
export default function MonitoringDriver() {
  const [drivers, setDrivers] = useState<DriverWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDriver, setSelectedDriver] = useState<DriverWithStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'aktif' | 'nonaktif'>('all')

  // ── Fetch drivers by armada ──────────────────────────────────────────
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setLoading(true)
        setError('')

        const armadaId = getArmadaIdFromAuth()
        const endpoint = armadaId
          ? `/api/users/driver?armada_id=${armadaId}`
          : '/api/users/driver'

        const [driverData, penilaianData] = await Promise.all([
          apiFetch(endpoint),
          apiFetch('/api/penilaian')
        ])

        const data: DriverData[] = driverData ?? []
        const penilaians = penilaianData?.penilaians ?? []

        // Group penilaian by driver_id (hanya yang approved)
        const skorByDriver: Record<number, number[]> = {}
        for (const p of penilaians) {
          if (p.status_validasi === 'approved') {
            if (!skorByDriver[p.driver_id]) skorByDriver[p.driver_id] = []
            skorByDriver[p.driver_id].push(parseFloat(p.skor_total))
          }
        }

        const withStats: DriverWithStats[] = data.map(d => {
          const scores = skorByDriver[d.id] || []
          const avg = scores.length > 0
            ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
            : 0
          const latest = scores.length > 0 ? scores[0] : 0 // scores sudah sorted by created_at DESC
          const prev = scores.length > 1 ? scores[1] : latest

          let trend: 'up' | 'down' | 'stable' = 'stable'
          if (latest > prev) trend = 'up'
          else if (latest < prev) trend = 'down'

          return {
            ...d,
            averageScore: avg,
            latestMonthScore: latest,
            trend
          }
        })

        setDrivers(withStats)
      } catch (err: any) {
        setError(err.message ?? 'Gagal memuat data driver')
      } finally {
        setLoading(false)
      }
    }

    fetchDrivers()
  }, [])

  // ── Filter ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return drivers.filter(d => {
      const matchSearch =
        d.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.nama_kernet ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchStatus =
        statusFilter === 'all' ? true : d.status_aktif === statusFilter
      return matchSearch && matchStatus
    })
  }, [drivers, searchQuery, statusFilter])

  const getTrendIndicator = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up')   return { icon: '↑', color: '#ffffff', text: 'Meningkat' }
    if (trend === 'down') return { icon: '↓', color: '#ffffff', text: 'Menurun' }
    return { icon: '→', color: '#ffffff', text: 'Stabil' }
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <PageHeader
          title="Monitoring Driver"
          subtitle="Monitor data driver di armada Anda"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#fff" style={{ width: 28, height: 28 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />

        {/* Summary */}
        {!loading && !error && (
          <div className="manajemen-controls">
            <div className="manajemen-summary">
              <p>Total Driver: <strong>{drivers.length}</strong></p>
              <p>Aktif: <strong>{drivers.filter(d => d.status_aktif === 'aktif').length}</strong></p>
              <p>Non-aktif: <strong>{drivers.filter(d => d.status_aktif === 'nonaktif').length}</strong></p>
            </div>

            <div className="manajemen-filters">
              <div className="search-box">
                <span className="search-icon">
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </span>
                <input
                  className="search-input"
                  placeholder="Cari driver atau kernet..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="filter-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
              >
                <option value="all">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Non-aktif</option>
              </select>
            </div>
          </div>
        )}

        {/* States */}
        {loading ? (
          <div className="loading-state">Memuat data driver...</div>
        ) : error ? (
          <div className="error-state"><p>{error}</p></div>
        ) : (
          <>
            <div className="driver-grid">
              {filtered.map(driver => (
                <div
                  key={driver.id}
                  className="driver-card"
                  onClick={() => setSelectedDriver(driver)}
                  style={{ padding: '14px 16px', cursor: 'pointer' }}
                >
                  {/* Header: nama + status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ minWidth: 0 }}>
                      <h3 className="driver-name" style={{ margin: 0, fontSize: '0.9rem' }}>{driver.nama}</h3>
                      <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#64748b' }}>{driver.nama_armada ?? '-'}</p>
                    </div>
                    <span className={`status-pill ${driver.status_aktif === 'aktif' ? 'active' : 'inactive'}`} style={{ flexShrink: 0, fontSize: '0.7rem' }}>
                      {driver.status_aktif === 'aktif' ? 'Aktif' : 'Non-aktif'}
                    </span>
                  </div>

                  {/* Info: bus + kernet */}
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: 8 }}>
                    <span>{driver.kode_bus ? `${driver.kode_bus} — ${driver.nopol}` : 'Bus belum diassign'}</span>
                    {driver.nama_kernet && <span style={{ marginLeft: 8, color: '#94a3b8' }}>Kernet: {driver.nama_kernet}</span>}
                  </div>

                  {/* Skor */}
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem' }}>
                    <div>
                      <span style={{ color: '#94a3b8', display: 'block' }}>Rata-rata</span>
                      <strong style={{ color: '#1e293b', fontSize: '0.9rem' }}>{driver.averageScore}</strong>
                    </div>
                    <div style={{ width: 1, background: '#e2e8f0' }} />
                    <div>
                      <span style={{ color: '#94a3b8', display: 'block' }}>Bulan Ini</span>
                      <strong style={{ color: '#1e293b', fontSize: '0.9rem' }}>{driver.latestMonthScore}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="empty-state">
                <h3>Tidak ada driver ditemukan</h3>
                <p>Coba ubah filter pencarian atau status</p>
              </div>
            )}
          </>
        )}

        {/* ── Detail Modal (Read Only) ── */}
        {selectedDriver && (
          <div className="modal-overlay" onClick={() => setSelectedDriver(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Profil Driver</h2>
                <button className="modal-close" onClick={() => setSelectedDriver(null)}>✕</button>
              </div>

              <div className="modal-body">
                <div className="profile-section">
                  <h3 className="section-title">Informasi Dasar</h3>
                  <div className="info-grid">
                    {[
                      { label: 'Nama Driver',  value: selectedDriver.nama },
                      { label: 'Username',     value: selectedDriver.username },
                      { label: 'No HP',        value: selectedDriver.no_hp },
                      { label: 'Kode Bus',     value: selectedDriver.kode_bus ?? '-' },
                      { label: 'Nomor Polisi', value: selectedDriver.nopol ?? '-' },
                      { label: 'Armada',       value: selectedDriver.nama_armada },
                      { label: 'Kernet',       value: selectedDriver.nama_kernet ?? 'Tidak ada' },
                      { label: 'Status',       value: selectedDriver.status_aktif === 'aktif' ? 'Aktif' : 'Non-aktif' },
                    ].map(item => (
                      <div key={item.label} className="info-item">
                        <span className="info-label">{item.label}</span>
                        <span className="info-value">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="profile-section">
                  <h3 className="section-title">Overview Performa</h3>
                  <div className="performance-grid">
                    <div className="perf-card">
                      <span className="perf-label">Rata-rata Total</span>
                      <span className="perf-value main">{selectedDriver.averageScore}</span>
                    </div>
                    <div className="perf-card">
                      <span className="perf-label">Skor Terbaru</span>
                      <span className="perf-value">{selectedDriver.latestMonthScore}</span>
                    </div>
                    <div className="perf-card">
                      <span className="perf-label">Trend</span>
                      <div className="trend-display">
                        <span>{getTrendIndicator(selectedDriver.trend).icon}</span>
                        <span style={{ color: getTrendIndicator(selectedDriver.trend).color }}>
                          {getTrendIndicator(selectedDriver.trend).text}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                    * Data skor akan tersedia setelah fitur penilaian aktif
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
