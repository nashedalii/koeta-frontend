'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Siklus {
  siklus_id: number
  nama_siklus: string
}

interface Periode {
  periode_id: number
  nama_periode: string
}

interface Bobot {
  bobot_id: number
  nama_bobot: string
  persentase_bobot: number
}

interface DriverRanking {
  rank: number
  driver_id: number
  nama_driver: string
  nama_kernet: string | null
  nama_armada: string
  kode_bus: string
  nopol: string
  skor_total: number
  indicators: { bobot_id: number; weighted_score: number }[]
}

interface RankingData {
  bobot: Bobot[]
  ranking: DriverRanking[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const apiBase = process.env.NEXT_PUBLIC_API_URL || ''

const getAuth = () => {
  try { return JSON.parse(localStorage.getItem('auth') || '{}') }
  catch { return {} }
}
const getToken   = () => getAuth().token || ''
const getMyId    = (): number | null => getAuth()?.user?.id ?? null
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` })

// ── Medal icon SVG ─────────────────────────────────────────────────────────────
const MedalIcon = ({ rank }: { rank: number }) => {
  const color = rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : '#cd7c3a'
  return (
    <svg viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 40, height: 48 }}>
      <circle cx="20" cy="28" r="14" fill={color} />
      <circle cx="20" cy="28" r="10" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
      <text x="20" y="33" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">{rank}</text>
      <path d="M14 14 L20 4 L26 14" fill={color} />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DriverRankingPenilaian() {
  const myId = getMyId()

  const [siklusList, setSiklusList]           = useState<Siklus[]>([])
  const [selectedSiklus, setSelectedSiklus]   = useState<number | ''>('')
  const [periodeList, setPeriodeList]         = useState<Periode[]>([])
  const [selectedPeriode, setSelectedPeriode] = useState<number | 'all'>('all')
  const [rankingData, setRankingData]         = useState<RankingData | null>(null)
  const [isLoading, setIsLoading]             = useState(false)
  const [error, setError]                     = useState<string | null>(null)
  const [isMobile, setIsMobile]               = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    fetch(`${apiBase}/api/siklus`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => setSiklusList(d.siklus || d || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedSiklus) { setPeriodeList([]); return }
    fetch(`${apiBase}/api/siklus/${selectedSiklus}`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => setPeriodeList(d.periodes || []))
      .catch(() => {})
    setSelectedPeriode('all')
    setRankingData(null)
  }, [selectedSiklus])

  const fetchRanking = useCallback(async () => {
    if (!selectedSiklus) return
    setIsLoading(true); setError(null)
    try {
      const params = new URLSearchParams()
      if (selectedPeriode === 'all') {
        params.set('mode', 'siklus'); params.set('siklus_id', String(selectedSiklus))
      } else {
        params.set('mode', 'periode'); params.set('periode_id', String(selectedPeriode))
      }
      const res  = await fetch(`${apiBase}/api/ranking?${params}`, { headers: authHeader() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setRankingData(data)
    } catch (err: any) { setError(err.message) }
    finally { setIsLoading(false) }
  }, [selectedSiklus, selectedPeriode])

  useEffect(() => { fetchRanking() }, [fetchRanking])

  const allRows   = rankingData?.ranking ?? []
  const top3      = allRows.slice(0, 3)
  const top10     = allRows.slice(0, 10)
  const myRow     = myId ? allRows.find(r => r.driver_id === myId) : null
  const myInTop10 = myRow ? myRow.rank <= 10 : false

  // ── Rank badge colors ────────────────────────────────────────────────────────
  const rankStyle = (rank: number, isMe: boolean): React.CSSProperties => {
    if (rank === 1) return { background: '#f59e0b', color: '#fff', fontWeight: 700 }
    if (rank === 2) return { background: '#94a3b8', color: '#fff', fontWeight: 700 }
    if (rank === 3) return { background: '#cd7c3a', color: '#fff', fontWeight: 700 }
    if (isMe)       return { background: '#dbeafe', color: '#1d4ed8', fontWeight: 600 }
    return { background: '#f1f5f9', color: '#475569', fontWeight: 600 }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content" style={{ maxWidth: 'none' }}>

        {/* ── Page Header ───────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #2563eb 100%)',
          borderRadius: 16, padding: isMobile ? '24px 20px' : '32px 40px',
          marginBottom: 24, color: '#fff',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#fff" style={{ width: 28, height: 28 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 700 }}>Ranking Penilaian Driver</h1>
            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.65)', fontSize: '0.875rem' }}>
              Peringkat driver berdasarkan performa dan penilaian
            </p>
          </div>
        </div>

        {/* ── Filter Controls ───────────────────────────────────────────────── */}
        <div style={{
          background: '#fff', borderRadius: 12, padding: '16px 20px',
          border: '1px solid #e2e8f0', marginBottom: 20,
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 160px', minWidth: 160 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>Siklus</label>
            <select
              className="filter-select"
              style={{ flex: 1 }}
              value={selectedSiklus}
              onChange={e => setSelectedSiklus(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">-- Pilih Siklus --</option>
              {siklusList.map(s => (
                <option key={s.siklus_id} value={s.siklus_id}>{s.nama_siklus}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 160px', minWidth: 160 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>Periode</label>
            <select
              className="filter-select"
              style={{ flex: 1 }}
              value={selectedPeriode}
              onChange={e => setSelectedPeriode(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              disabled={!selectedSiklus}
            >
              <option value="all">Semua (Rata-rata)</option>
              {periodeList.map(p => (
                <option key={p.periode_id} value={p.periode_id}>{p.nama_periode}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

        {!selectedSiklus && (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="#94a3b8" style={{ width: 56, height: 56, marginBottom: 12 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <h3>Pilih Siklus</h3>
            <p>Pilih siklus terlebih dahulu untuk melihat ranking</p>
          </div>
        )}

        {selectedSiklus && isLoading && (
          <div className="loading-state"><div className="loading-spinner" /><p>Memuat ranking...</p></div>
        )}

        {selectedSiklus && !isLoading && rankingData && (
          allRows.length === 0 ? (
            <div className="empty-state">
              <h3>Belum ada data ranking</h3>
              <p>Belum ada penilaian yang disetujui untuk periode ini</p>
            </div>
          ) : (
            <>
              {/* ── Top 3 Cards ─────────────────────────────────────────── */}
              {top3.length >= 1 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                  gap: 12, marginBottom: 20,
                }}>
                  {/* Sort: rank 1 first on mobile, 2-1-3 visual order on desktop via order */}
                  {(isMobile ? [top3[0], top3[1], top3[2]] : [top3[1], top3[0], top3[2]]).map((driver, i) => {
                    if (!driver) return null
                    const isMe = driver.driver_id === myId
                    const isFirst = driver.rank === 1
                    const borderColor = driver.rank === 1 ? '#f59e0b' : driver.rank === 2 ? '#94a3b8' : '#cd7c3a'
                    return (
                      <div key={driver.driver_id} style={{
                        background: '#fff',
                        border: `2px solid ${isFirst ? '#f59e0b' : '#e2e8f0'}`,
                        borderRadius: 14,
                        padding: isMobile ? '16px' : '20px',
                        boxShadow: isFirst ? '0 4px 20px rgba(245,158,11,0.2)' : '0 1px 4px rgba(0,0,0,0.07)',
                        display: 'flex', alignItems: 'center', gap: 14,
                        order: !isMobile ? (driver.rank === 1 ? 0 : driver.rank === 2 ? -1 : 1) : undefined,
                        position: 'relative', overflow: 'hidden',
                      }}>
                        {/* Top border accent */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: borderColor, borderRadius: '14px 14px 0 0' }} />

                        {/* Medal */}
                        <div style={{ flexShrink: 0, marginTop: 4 }}>
                          <MedalIcon rank={driver.rank} />
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: isMobile ? '0.9375rem' : '1rem',
                              fontWeight: 700, color: '#0f172a',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              maxWidth: isMe ? 'calc(100% - 52px)' : '100%',
                            }}>
                              {driver.nama_driver}
                            </span>
                            {isMe && (
                              <span style={{
                                background: '#1d4ed8', color: '#fff',
                                fontSize: '0.6875rem', fontWeight: 700,
                                borderRadius: 4, padding: '2px 7px',
                                letterSpacing: '0.04em', flexShrink: 0,
                              }}>ANDA</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {driver.nama_armada}
                          </div>
                          <div style={{
                            marginTop: 8,
                            fontSize: isMobile ? '1.25rem' : '1.5rem',
                            fontWeight: 800,
                            color: driver.rank === 1 ? '#d97706' : driver.rank === 2 ? '#64748b' : '#a85f25',
                          }}>
                            {Number(driver.skor_total).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── Ranking Table ────────────────────────────────────────── */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#0369a1" style={{ width: 18, height: 18 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a' }}>Daftar Peringkat — Top 10</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="ranking-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 64 }}>Rank</th>
                        <th>Nama Driver</th>
                        <th style={{ width: 140 }}>Armada</th>
                        {rankingData.bobot.map(b => (
                          <th key={b.bobot_id} style={{ width: 110 }}>
                            {b.nama_bobot}<br />
                            <span style={{ fontWeight: 400, fontSize: '0.75rem' }}>({b.persentase_bobot}%)</span>
                          </th>
                        ))}
                        <th style={{ width: 100 }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {top10.map(driver => {
                        const isMe = driver.driver_id === myId
                        return (
                          <tr key={driver.driver_id} style={isMe ? { background: '#eff6ff' } : {}}>
                            <td className="text-center rank-cell">
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 32, height: 32, borderRadius: 8,
                                fontSize: '0.875rem', ...rankStyle(driver.rank, isMe),
                              }}>
                                {driver.rank}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
                                <span style={{ fontWeight: isMe ? 700 : 500, color: isMe ? '#1d4ed8' : '#0f172a', whiteSpace: 'nowrap' }}>
                                  {driver.nama_driver}
                                </span>
                                {isMe && (
                                  <span style={{
                                    background: '#1d4ed8', color: '#fff',
                                    fontSize: '0.6875rem', fontWeight: 700,
                                    borderRadius: 4, padding: '2px 7px',
                                    letterSpacing: '0.04em', flexShrink: 0,
                                  }}>ANDA</span>
                                )}
                              </div>
                            </td>
                            <td className="text-center">
                              <span className="armada-badge">{driver.nama_armada}</span>
                            </td>
                            {rankingData.bobot.map(b => (
                              <td key={b.bobot_id} className="text-center weighted-score" style={isMe ? { color: '#1d4ed8', fontWeight: 600 } : {}}>
                                {driver.indicators.find(i => i.bobot_id === b.bobot_id)?.weighted_score ?? '-'}
                              </td>
                            ))}
                            <td className="text-center total-score" style={isMe ? { color: '#1d4ed8' } : {}}>
                              {Number(driver.skor_total).toFixed(2)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Posisi saya jika di luar top 10 ─────────────────────── */}
              {myRow && !myInTop10 && (
                <div style={{ marginTop: 16, background: '#eff6ff', borderRadius: 14, border: '1px solid #bfdbfe', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#1d4ed8" style={{ width: 18, height: 18 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1d4ed8' }}>Posisi Anda</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="ranking-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ width: 64 }}>Rank</th>
                          <th>Nama Driver</th>
                          <th style={{ width: 140 }}>Armada</th>
                          {rankingData.bobot.map(b => (
                            <th key={b.bobot_id} style={{ width: 110 }}>
                              {b.nama_bobot}<br />
                              <span style={{ fontWeight: 400, fontSize: '0.75rem' }}>({b.persentase_bobot}%)</span>
                            </th>
                          ))}
                          <th style={{ width: 100 }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ background: '#dbeafe' }}>
                          <td className="text-center rank-cell">
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 32, height: 32, borderRadius: 8, fontSize: '0.875rem',
                              background: '#1d4ed8', color: '#fff', fontWeight: 700,
                            }}>{myRow.rank}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 700, color: '#1d4ed8', whiteSpace: 'nowrap' }}>{myRow.nama_driver}</span>
                              <span style={{
                                background: '#1d4ed8', color: '#fff',
                                fontSize: '0.6875rem', fontWeight: 700,
                                borderRadius: 4, padding: '2px 7px', flexShrink: 0,
                              }}>ANDA</span>
                            </div>
                          </td>
                          <td className="text-center">
                            <span className="armada-badge">{myRow.nama_armada}</span>
                          </td>
                          {rankingData.bobot.map(b => (
                            <td key={b.bobot_id} className="text-center weighted-score" style={{ color: '#1d4ed8', fontWeight: 600 }}>
                              {myRow.indicators.find(i => i.bobot_id === b.bobot_id)?.weighted_score ?? '-'}
                            </td>
                          ))}
                          <td className="text-center total-score" style={{ color: '#1d4ed8' }}>
                            {Number(myRow.skor_total).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  )
}
