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

        const data: DriverData[] = await apiFetch(endpoint)

        // Skor masih statis sampai Fase 3 (penilaian) selesai
        const withStats: DriverWithStats[] = (data ?? []).map(d => ({
          ...d,
          averageScore: 0,
          latestMonthScore: 0,
          trend: 'stable'
        }))

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
    if (trend === 'up')   return { icon: '⬆️', color: '#16a34a', text: 'Meningkat' }
    if (trend === 'down') return { icon: '⬇️', color: '#dc2626', text: 'Menurun' }
    return { icon: '➡️', color: '#6b7280', text: 'Stabil' }
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
              <input
                className="search-input"
                placeholder="🔍 Cari driver atau kernet..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
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
                >
                  {/* Accent strip */}
                  <div className={`driver-card-accent${driver.status_aktif !== 'aktif' ? ' inactive' : ''}`} />

                  <div className="driver-card-header">
                    <div className="driver-header-left">
                      <div className={`driver-avatar${driver.status_aktif !== 'aktif' ? ' inactive' : ''}`}>
                        {driver.nama.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
                      </div>
                      <div className="driver-name-group">
                        <h3 className="driver-name">{driver.nama}</h3>
                        <span className="driver-armada-text">
                          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                          </svg>
                          {driver.nama_armada ?? '-'}
                        </span>
                      </div>
                    </div>
                    <div className="driver-right">
                      <span className={`status-pill ${driver.status_aktif === 'aktif' ? 'active' : 'inactive'}`}>
                        {driver.status_aktif === 'aktif' ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </div>
                  </div>

                  <div className="driver-card-body">
                    <div className="driver-info-grid">
                      <div className="driver-info-item">
                        <span className="driver-info-label">Bus</span>
                        <span className={`driver-info-value${!driver.kode_bus ? ' empty' : ''}`}>
                          {driver.kode_bus ?? '—'}
                        </span>
                      </div>
                      <div className="driver-info-item">
                        <span className="driver-info-label">Plat</span>
                        <span className={`driver-info-value${!driver.nopol ? ' empty' : ''}`}>
                          {driver.nopol ?? '—'}
                        </span>
                      </div>
                      <div className="driver-info-item" style={{ gridColumn: '1 / -1' }}>
                        <span className="driver-info-label">Kernet</span>
                        <span className={`driver-info-value${!driver.nama_kernet ? ' empty' : ''}`}>
                          {driver.nama_kernet ?? '—'}
                        </span>
                      </div>
                    </div>

                    <div className="metric">
                      <div>
                        <span className="muted">Rata-rata</span>
                        <span className="large">{driver.averageScore}<small style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', marginLeft: 2 }}>poin</small></span>
                      </div>
                      <div className="metric-divider" />
                      <div>
                        <span className="muted">Bulan Ini</span>
                        <span className="large">{driver.latestMonthScore}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
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
