'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import PageHeader from '@/components/ui/PageHeader'

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
  mode: 'periode' | 'siklus'
  bobot: Bobot[]
  ranking: DriverRanking[]
}

interface PeriodeBreakdown {
  penilaian_id: number
  skor_total: number
  nama_periode: string
  nama_armada: string
  indicators: { bobot_id: number; weighted_score: number }[]
}

interface DetailData {
  driver: { nama_driver: string; nama_kernet: string | null; nama_armada: string }
  bobot: Bobot[]
  periodes: PeriodeBreakdown[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const apiBase = process.env.NEXT_PUBLIC_API_URL || ''

const getAuth = () => {
  try { return JSON.parse(localStorage.getItem('auth') || '{}') }
  catch { return {} }
}
const getToken = () => getAuth().token || ''
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` })

// ── Component ─────────────────────────────────────────────────────────────────
export default function RankingPenilaianPetugas() {
  // Auto-load armada petugas dari auth
  const [myArmada, setMyArmada] = useState<string>('all')

  useEffect(() => {
    const auth = getAuth()
    // armada_id disimpan di auth.armada_id, tapi nama armada perlu di-resolve
    // Kita simpan dulu sebagai armada_id, nanti match ke nama dari ranking data
    if (auth?.armada_id) {
      setMyArmada(`__id__${auth.armada_id}`) // placeholder, di-resolve setelah data datang
    }
  }, [])

  // Selectors
  const [siklusList, setSiklusList]           = useState<Siklus[]>([])
  const [selectedSiklus, setSelectedSiklus]   = useState<number | ''>('')
  const [periodeList, setPeriodeList]         = useState<Periode[]>([])
  const [selectedPeriode, setSelectedPeriode] = useState<number | 'all'>('all')

  // Filter & sort
  const [filterArmada, setFilterArmada] = useState<string>('all')
  const [sortField, setSortField]       = useState<string>('rank')
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('asc')

  // Data
  const [rankingData, setRankingData] = useState<RankingData | null>(null)
  const [isLoading, setIsLoading]     = useState(false)
  const [error, setError]             = useState<string | null>(null)

  // Detail view
  const [detailDriver, setDetailDriver]       = useState<DriverRanking | null>(null)
  const [detailData, setDetailData]           = useState<DetailData | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  // ── Fetch siklus ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${apiBase}/api/siklus`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => setSiklusList(d.siklus || d || []))
      .catch(() => {})
  }, [])

  // ── Fetch periode ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedSiklus) { setPeriodeList([]); return }
    fetch(`${apiBase}/api/siklus/${selectedSiklus}`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => setPeriodeList(d.periodes || []))
      .catch(() => {})
    setSelectedPeriode('all')
    setRankingData(null)
  }, [selectedSiklus])

  // ── Fetch ranking ───────────────────────────────────────────────────────────
  const fetchRanking = useCallback(async () => {
    if (!selectedSiklus) return
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (selectedPeriode === 'all') {
        params.set('mode', 'siklus')
        params.set('siklus_id', String(selectedSiklus))
      } else {
        params.set('mode', 'periode')
        params.set('periode_id', String(selectedPeriode))
      }

      const res  = await fetch(`${apiBase}/api/ranking?${params}`, { headers: authHeader() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setRankingData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [selectedSiklus, selectedPeriode])

  useEffect(() => { fetchRanking() }, [fetchRanking])

  // ── Resolve armada name dari armada_id setelah data ranking datang ──────────
  useEffect(() => {
    if (!rankingData || !myArmada.startsWith('__id__')) return
    const armadaId = Number(myArmada.replace('__id__', ''))
    // Tidak bisa langsung resolve karena ranking tidak return armada_id
    // Fallback: biarkan 'all' jika tidak bisa match
    // Cara alternatif: fetch armada list
    fetch(`${apiBase}/api/users?role=petugas`, { headers: authHeader() })
      .catch(() => {})
    // Simpler: ambil dari endpoint siklus atau biarkan user filter sendiri
    setMyArmada('all')
  }, [rankingData])

  // ── Derived armada list ─────────────────────────────────────────────────────
  const armadaList = useMemo(() =>
    Array.from(new Set((rankingData?.ranking || []).map(r => r.nama_armada))).sort()
  , [rankingData])

  // ── Client-side filter + sort ───────────────────────────────────────────────
  const displayRows = useMemo(() => {
    if (!rankingData) return []

    let rows = rankingData.ranking.filter(r =>
      filterArmada === 'all' || r.nama_armada === filterArmada
    )

    if (sortField === 'rank') {
      rows = [...rows].sort((a, b) => sortDir === 'asc' ? a.rank - b.rank : b.rank - a.rank)
    } else if (sortField === 'total') {
      rows = [...rows].sort((a, b) =>
        sortDir === 'asc'
          ? Number(a.skor_total) - Number(b.skor_total)
          : Number(b.skor_total) - Number(a.skor_total)
      )
    } else {
      const bobotId = Number(sortField)
      rows = [...rows].sort((a, b) => {
        const wa = a.indicators.find(i => i.bobot_id === bobotId)?.weighted_score ?? 0
        const wb = b.indicators.find(i => i.bobot_id === bobotId)?.weighted_score ?? 0
        return sortDir === 'asc' ? wa - wb : wb - wa
      })
    }
    return rows
  }, [rankingData, filterArmada, sortField, sortDir])

  // ── Sort handler ────────────────────────────────────────────────────────────
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir(field === 'rank' ? 'asc' : 'desc')
    }
  }

  // ── Open detail ─────────────────────────────────────────────────────────────
  const openDetail = async (driver: DriverRanking) => {
    setDetailDriver(driver)
    setDetailData(null)
    setIsLoadingDetail(true)
    try {
      const res  = await fetch(
        `${apiBase}/api/ranking/driver/${driver.driver_id}?siklus_id=${selectedSiklus}`,
        { headers: authHeader() }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setDetailData(data)
    } catch { }
    finally { setIsLoadingDetail(false) }
  }

  // ── Sort Icon ───────────────────────────────────────────────────────────────
  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return (
      <svg className="sort-icon inactive" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
      </svg>
    )
    return sortDir === 'asc' ? (
      <svg className="sort-icon active" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
      </svg>
    ) : (
      <svg className="sort-icon active" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-container">
      <div className="dashboard-content">

        <PageHeader
          title="Ranking Penilaian Driver"
          subtitle="Peringkat driver berdasarkan performa dan penilaian"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#fff" style={{ width: 28, height: 28 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
            </svg>
          }
        />

        {/* ── Detail View ────────────────────────────────────────────────── */}
        {detailDriver ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Back button — compact inline */}
            <div>
              <button
                onClick={() => { setDetailDriver(null); setDetailData(null) }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'none', border: '1px solid #e2e8f0',
                  borderRadius: 8, padding: '6px 14px',
                  fontSize: '0.875rem', fontWeight: 500, color: '#475569',
                  cursor: 'pointer', transition: 'all 150ms ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#0f172a'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'none'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#475569'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Kembali ke Ranking
              </button>
            </div>

            {/* Driver Hero Card */}
            <div style={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #0ea5e9 100%)',
              borderRadius: 16, padding: '28px 32px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 20, flexWrap: 'wrap',
              boxShadow: '0 4px 24px rgba(15,23,42,0.18)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.12)',
                  border: '2px solid rgba(255,255,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="rgba(255,255,255,0.8)" style={{ width: 32, height: 32 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <div>
                  <h2 style={{ margin: 0, color: '#fff', fontSize: '1.375rem', fontWeight: 700, lineHeight: 1.3 }}>
                    {detailDriver.nama_driver}
                  </h2>
                  {detailDriver.nama_kernet && (
                    <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem' }}>
                      Kernet: {detailDriver.nama_kernet}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <span style={{
                      background: 'rgba(255,255,255,0.15)', color: '#fff',
                      borderRadius: 6, padding: '3px 10px',
                      fontSize: '0.8125rem', fontWeight: 500, border: '1px solid rgba(255,255,255,0.2)',
                    }}>{detailDriver.nama_armada}</span>
                    {detailDriver.kode_bus && (
                      <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8125rem' }}>
                        {detailDriver.kode_bus} / {detailDriver.nopol}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{
                  background: detailDriver.rank === 1 ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                            : detailDriver.rank === 2 ? 'linear-gradient(135deg,#94a3b8,#64748b)'
                            : detailDriver.rank === 3 ? 'linear-gradient(135deg,#cd7c3a,#a85f25)'
                            : 'rgba(255,255,255,0.1)',
                  borderRadius: 12, padding: '10px 22px',
                  border: detailDriver.rank <= 3 ? 'none' : '1px solid rgba(255,255,255,0.2)',
                }}>
                  <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Peringkat</div>
                  <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 800, lineHeight: 1.1, marginTop: 2 }}>
                    #{detailDriver.rank}
                  </div>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: 6 }}>
                  Skor: <strong style={{ color: '#fff' }}>{Number(detailDriver.skor_total).toFixed(2)}</strong>
                </div>
              </div>
            </div>

            {/* Score Table */}
            {isLoadingDetail ? (
              <div className="loading-state"><div className="loading-spinner" /><p>Memuat detail...</p></div>
            ) : detailData ? (
              <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#0369a1" style={{ width: 20, height: 20, flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                  </svg>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>Skor Per Periode</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="monthly-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Periode</th>
                        <th>Armada</th>
                        {detailData.bobot.map(b => (
                          <th key={b.bobot_id}>
                            {b.nama_bobot}<br />
                            <span style={{ fontWeight: 400, fontSize: '0.75rem' }}>({b.persentase_bobot}%)</span>
                          </th>
                        ))}
                        <th>Skor Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailData.periodes.length === 0 ? (
                        <tr><td colSpan={3 + detailData.bobot.length} className="text-center" style={{ padding: '32px 0', color: '#94a3b8' }}>Belum ada data penilaian</td></tr>
                      ) : detailData.periodes.map(p => (
                        <tr key={p.penilaian_id}>
                          <td className="month-cell">{p.nama_periode}</td>
                          <td className="text-center"><span className="armada-badge">{p.nama_armada}</span></td>
                          {detailData.bobot.map(b => (
                            <td key={b.bobot_id} className="text-center weighted-score">
                              {p.indicators.find(i => i.bobot_id === b.bobot_id)?.weighted_score ?? '-'}
                            </td>
                          ))}
                          <td className="text-center total-score">{Number(p.skor_total).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>

        ) : (
          /* ── Ranking Table ───────────────────────────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Controls */}
            <div style={{
              background: '#fff', borderRadius: 12, padding: '16px 20px',
              border: '1px solid #e2e8f0',
              display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 160px', minWidth: 160 }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>Siklus:</label>
                <select className="filter-select" style={{ flex: 1 }} value={selectedSiklus}
                  onChange={e => setSelectedSiklus(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">-- Pilih Siklus --</option>
                  {siklusList.map(s => <option key={s.siklus_id} value={s.siklus_id}>{s.nama_siklus}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 160px', minWidth: 160 }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>Periode:</label>
                <select className="filter-select" style={{ flex: 1 }} value={selectedPeriode}
                  onChange={e => setSelectedPeriode(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  disabled={!selectedSiklus}>
                  <option value="all">Semua Periode (Rata-rata)</option>
                  {periodeList.map(p => <option key={p.periode_id} value={p.periode_id}>{p.nama_periode}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 160px', minWidth: 160 }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>Armada:</label>
                <select className="filter-select" style={{ flex: 1 }} value={filterArmada}
                  onChange={e => setFilterArmada(e.target.value)} disabled={!rankingData}>
                  <option value="all">Semua Armada</option>
                  {armadaList.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            {!selectedSiklus && (
              <div className="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="#94a3b8" style={{ width: 52, height: 52, marginBottom: 12 }}>
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
              displayRows.length === 0 ? (
                <div className="empty-state">
                  <h3>Belum ada data ranking</h3>
                  <p>Belum ada penilaian yang disetujui untuk periode ini</p>
                </div>
              ) : (
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#0369a1" style={{ width: 18, height: 18 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a' }}>
                      Daftar Peringkat — {displayRows.length} Driver
                    </span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="ranking-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ width: 70 }}>
                            <button className="sort-button" onClick={() => handleSort('rank')}>
                              Rank <SortIcon field="rank" />
                            </button>
                          </th>
                          <th>Nama Driver</th>
                          <th style={{ width: 150 }}>Armada</th>
                          {rankingData.bobot.map(b => (
                            <th key={b.bobot_id} style={{ width: 110 }}>
                              <button className="sort-button" onClick={() => handleSort(String(b.bobot_id))}>
                                {b.nama_bobot}<br />
                                <span style={{ fontWeight: 400, fontSize: '0.7rem' }}>({b.persentase_bobot}%)</span>
                                {' '}<SortIcon field={String(b.bobot_id)} />
                              </button>
                            </th>
                          ))}
                          <th style={{ width: 100 }}>
                            <button className="sort-button" onClick={() => handleSort('total')}>
                              Total <SortIcon field="total" />
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayRows.map(driver => (
                          <tr key={driver.driver_id} className="clickable-row" onClick={() => openDetail(driver)}>
                            <td className="text-center rank-cell">
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 36, height: 36, borderRadius: '50%', fontSize: '0.875rem',
                                ...(driver.rank === 1 ? { background: '#f59e0b', color: '#fff', fontWeight: 700 }
                                  : driver.rank === 2 ? { background: '#94a3b8', color: '#fff', fontWeight: 700 }
                                  : driver.rank === 3 ? { background: '#cd7c3a', color: '#fff', fontWeight: 700 }
                                  : { background: '#f1f5f9', color: '#475569', fontWeight: 600 }),
                              }}>
                                {driver.rank}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 600, color: '#0f172a', display: 'block' }}>{driver.nama_driver}</span>
                              {driver.nama_kernet && (
                                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Kernet: {driver.nama_kernet}</span>
                              )}
                            </td>
                            <td className="text-center">
                              <span className="armada-badge">{driver.nama_armada}</span>
                            </td>
                            {rankingData.bobot.map(b => (
                              <td key={b.bobot_id} className="text-center weighted-score">
                                {driver.indicators.find(i => i.bobot_id === b.bobot_id)?.weighted_score ?? '-'}
                              </td>
                            ))}
                            <td className="text-center" style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                              {Number(driver.skor_total).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
