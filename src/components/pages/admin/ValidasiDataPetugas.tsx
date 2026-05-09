'use client'

import { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/ui/PageHeader'

interface PenilaianItem {
  penilaian_id: number
  status_validasi: 'pending' | 'approved' | 'rejected'
  skor_total: number
  catatan_petugas: string | null
  note_validasi: string | null
  created_at: string
  updated_at: string
  nama_driver: string
  kode_bus: string
  nopol: string
  nama_armada: string
  nama_periode: string
  bulan: string
  tahun: number
  nama_petugas_input: string
  nama_admin_validasi: string | null
}

interface PeriodeOption {
  periode_id: number
  nama_periode: string
  is_aktif: boolean
}

interface DetailItem {
  penilaian_detail_id: number
  nilai: number
  bobot_id: number
  nama_bobot: string
  persentase_bobot: number
}

interface FotoItem {
  bukti_id: number
  file_path: string
  nama_file: string | null
  uploaded_at: string
}

interface LogItem {
  validasi_log_id: number
  aksi: string
  alasan: string | null
  created_at: string
  nama_admin: string
}

interface DetailData {
  penilaian: PenilaianItem
  details: DetailItem[]
  foto: FotoItem[]
  log: LogItem[]
}

type ViewMode = 'grid' | 'list'

const apiBase = process.env.NEXT_PUBLIC_API_URL || ''
const getToken = () => {
  try { return JSON.parse(localStorage.getItem('auth') || '{}').token || '' } catch { return '' }
}
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` })

// ── Status config ──────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:  { label: 'Menunggu',  color: '#d97706', bg: '#fef3c7', border: '#fcd34d' },
  approved: { label: 'Disetujui', color: '#059669', bg: '#d1fae5', border: '#6ee7b7' },
  rejected: { label: 'Ditolak',   color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
}
const ROW_BG = {
  pending:  '#fffbeb',
  approved: '#f0fdf4',
  rejected: '#fef2f2',
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status as keyof typeof STATUS_CFG] ?? { label: status, color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? '#059669' : score >= 75 ? '#2563eb' : score >= 60 ? '#d97706' : '#dc2626'
  const bg    = score >= 90 ? '#d1fae5' : score >= 75 ? '#dbeafe' : score >= 60 ? '#fef3c7' : '#fee2e2'
  return (
    <div style={{ background: bg, borderRadius: 12, padding: '10px 16px', textAlign: 'center', minWidth: 80 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Skor Total</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{Number(score).toFixed(2)}</div>
    </div>
  )
}

// ── SVG Icons ──────────────────────────────────────────────────────────
const GridIcon  = () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
const ListIcon  = () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
const CloseIcon = () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
const SearchIcon = () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
const RefreshIcon = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
const EyeIcon   = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const CheckIcon = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const XIcon     = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>

const SUMMARY_ICONS = {
  total:    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 12 2 2 4-4"/></svg>,
  pending:  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  approved: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  rejected: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>,
}

const SUMMARY_STYLE = {
  total:    { color: '#2563eb', bg: '#dbeafe', gradient: 'linear-gradient(135deg,#eff6ff,#dbeafe)' },
  pending:  { color: '#d97706', bg: '#fef3c7', gradient: 'linear-gradient(135deg,#fffbeb,#fef3c7)' },
  approved: { color: '#059669', bg: '#d1fae5', gradient: 'linear-gradient(135deg,#f0fdf4,#d1fae5)' },
  rejected: { color: '#dc2626', bg: '#fee2e2', gradient: 'linear-gradient(135deg,#fef2f2,#fee2e2)' },
}

// ── Main Component ─────────────────────────────────────────────────────
export default function ValidasiDataPetugas() {
  const [list, setList]             = useState<PenilaianItem[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [viewMode, setViewMode]     = useState<ViewMode>('grid')

  const [filterStatus, setFilterStatus]   = useState<string>('all')
  const [filterArmada, setFilterArmada]   = useState<string>('all')
  const [searchQuery, setSearchQuery]     = useState('')
  const [periodeList, setPeriodeList]     = useState<PeriodeOption[]>([])
  const [filterPeriode, setFilterPeriode] = useState<string>('')

  const [detailData, setDetailData]           = useState<DetailData | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [showDetail, setShowDetail]           = useState(false)

  const [showReject, setShowReject]     = useState(false)
  const [rejectAlasan, setRejectAlasan] = useState('')
  const [isRejectUlang, setIsRejectUlang] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionMsg, setActionMsg]       = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    try {
      const auth = JSON.parse(localStorage.getItem('auth') || '{}')
      setIsSuperAdmin(auth?.user?.role === 'super_admin')
    } catch {}
  }, [])

  useEffect(() => {
    const fetchPeriodes = async () => {
      try {
        const res = await fetch(`${apiBase}/api/periode/semua`, { headers: authHeader() })
        const data = await res.json()
        const list: PeriodeOption[] = data.periodes || []
        setPeriodeList(list)
        const aktif = list.find(p => p.is_aktif)
        if (aktif) {
          setFilterPeriode(String(aktif.periode_id))
        } else if (list.length > 0) {
          setFilterPeriode(String(list[0].periode_id))
        } else {
          setFilterPeriode('all')
        }
      } catch {
        setFilterPeriode('all')
      }
    }
    fetchPeriodes()
  }, [])

  const fetchList = useCallback(async () => {
    if (!filterPeriode) return
    setIsLoading(true); setError(null)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status_validasi', filterStatus)
      if (filterPeriode !== 'all') params.set('periode_id', filterPeriode)
      const res = await fetch(`${apiBase}/api/validasi?${params}`, { headers: authHeader() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal memuat data')
      setList(data.penilaian || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [filterStatus, filterArmada, filterPeriode])

  useEffect(() => { fetchList() }, [fetchList])

  const armadaList = Array.from(new Set(list.map(p => p.nama_armada))).sort()

  const filtered = list.filter(p => {
    const matchArmada = filterArmada === 'all' || p.nama_armada === filterArmada
    const matchSearch = p.nama_driver.toLowerCase().includes(searchQuery.toLowerCase())
    return matchArmada && matchSearch
  })

  const counts = {
    total:    list.length,
    pending:  list.filter(p => p.status_validasi === 'pending').length,
    approved: list.filter(p => p.status_validasi === 'approved').length,
    rejected: list.filter(p => p.status_validasi === 'rejected').length,
  }

  const openDetail = async (id: number) => {
    setIsLoadingDetail(true); setShowDetail(true); setDetailData(null); setActionMsg(null)
    try {
      const res = await fetch(`${apiBase}/api/validasi/${id}`, { headers: authHeader() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setDetailData(data)
    } catch (err: any) {
      setShowDetail(false); setError(err.message)
    } finally { setIsLoadingDetail(false) }
  }

  const closeDetail = () => { setShowDetail(false); setDetailData(null); setActionMsg(null) }

  const handleApprove = async () => {
    if (!detailData) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`${apiBase}/api/validasi/${detailData.penilaian.penilaian_id}/approve`, { method: 'PUT', headers: authHeader() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setActionMsg({ type: 'success', text: data.message })
      fetchList()
      const res2 = await fetch(`${apiBase}/api/validasi/${detailData.penilaian.penilaian_id}`, { headers: authHeader() })
      const data2 = await res2.json()
      if (res2.ok) setDetailData(data2)
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message })
    } finally { setIsSubmitting(false) }
  }

  const openReject = (isUlang = false) => {
    setRejectAlasan(''); setIsRejectUlang(isUlang); setShowReject(true)
  }

  const handleReject = async () => {
    if (!detailData || !rejectAlasan.trim()) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`${apiBase}/api/validasi/${detailData.penilaian.penilaian_id}/reject`, {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ alasan: rejectAlasan.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setShowReject(false)
      setActionMsg({ type: 'success', text: data.message })
      fetchList()
      const res2 = await fetch(`${apiBase}/api/validasi/${detailData.penilaian.penilaian_id}`, { headers: authHeader() })
      const data2 = await res2.json()
      if (res2.ok) setDetailData(data2)
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message })
    } finally { setIsSubmitting(false) }
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">

        {/* ── Page Header ── */}
        <PageHeader
          title="Validasi Data Petugas"
          subtitle="Review dan validasi penilaian driver yang disubmit petugas"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#fff" style={{ width: 28, height: 28 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          actions={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 3, gap: 2 }}>
                {(['grid', 'list'] as ViewMode[]).map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 500,
                      background: viewMode === mode ? '#fff' : 'transparent',
                      color: viewMode === mode ? '#1e293b' : 'rgba(255,255,255,0.7)',
                      transition: 'all 0.2s',
                    }}>
                    {mode === 'grid' ? <GridIcon /> : <ListIcon />}
                    {mode === 'grid' ? 'Grid' : 'Tabel'}
                  </button>
                ))}
              </div>
              <button onClick={fetchList} disabled={isLoading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.25)',
                  background: 'rgba(255,255,255,0.1)', color: 'white',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                }}>
                <RefreshIcon />
                {isLoading ? 'Memuat...' : 'Refresh'}
              </button>
            </div>
          }
        />

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* ── Summary Cards ── */}
        <div className="validasi-summary-grid" style={{ marginBottom: 24 }}>
          {(['total', 'pending', 'approved', 'rejected'] as const).map(key => {
            const s = SUMMARY_STYLE[key]
            const labels = { total: 'Total Penilaian', pending: 'Menunggu Validasi', approved: 'Disetujui', rejected: 'Ditolak' }
            const isActive = filterStatus === (key === 'total' ? 'all' : key)
            return (
              <div key={key} onClick={() => setFilterStatus(key === 'total' ? 'all' : key)}
                style={{
                  background: '#fff', borderRadius: 16, padding: '16px 18px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  cursor: 'pointer', border: `2px solid ${isActive ? s.color : 'transparent'}`,
                  boxShadow: isActive ? `0 0 0 3px ${s.bg}` : '0 2px 12px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s',
                }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: s.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                  {SUMMARY_ICONS[key]}
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>{labels[key]}</p>
                  <p style={{ fontSize: 26, fontWeight: 800, color: s.color, margin: '2px 0 0', fontVariantNumeric: 'tabular-nums' }}>{counts[key]}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Filters ── */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '14px 18px',
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
          marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
            <SearchIcon />
            <input type="text" placeholder="Cari nama driver..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 14, color: '#1e293b', width: '100%', background: 'transparent' }} />
          </div>
          {isSuperAdmin && (
            <>
              <div style={{ width: 1, height: 24, background: '#e5e7eb' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>Armada:</span>
                <select value={filterArmada} onChange={e => setFilterArmada(e.target.value)}
                  style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '5px 10px', fontSize: 13, color: '#1e293b', background: '#f9fafb', outline: 'none', cursor: 'pointer' }}>
                  <option value="all">Semua Armada</option>
                  {armadaList.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>Periode:</span>
            <select value={filterPeriode} onChange={e => setFilterPeriode(e.target.value)}
              style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '5px 10px', fontSize: 13, color: '#1e293b', background: '#f9fafb', outline: 'none', cursor: 'pointer' }}>
              <option value="all">Semua Periode</option>
              {periodeList.map(p => (
                <option key={p.periode_id} value={String(p.periode_id)}>
                  {p.nama_periode}{p.is_aktif ? ' (Aktif)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div style={{ width: 1, height: 24, background: '#e5e7eb' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Status:</span>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '5px 10px', fontSize: 13, color: '#1e293b', background: '#f9fafb', outline: 'none', cursor: 'pointer' }}>
              <option value="all">Semua</option>
              <option value="pending">Menunggu</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
          <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 'auto' }}>{filtered.length} data</span>
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 12 }}>
            <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Memuat data penilaian...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '48px 24px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <div style={{ width: 48, height: 48, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={1.8} strokeLinecap="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
            </div>
            <p style={{ fontWeight: 600, color: '#374151', margin: 0 }}>Tidak ada data</p>
            <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 4 }}>Tidak ada penilaian yang sesuai dengan filter</p>
          </div>

        ) : viewMode === 'grid' ? (
          /* ── GRID VIEW ── */
          <div className="validasi-penilaian-grid">
            {filtered.map(p => {
              const cfg = STATUS_CFG[p.status_validasi]
              const score = Number(p.skor_total)
              const scoreColor = score >= 90 ? '#059669' : score >= 75 ? '#2563eb' : score >= 60 ? '#d97706' : '#dc2626'
              const scoreBg   = score >= 90 ? '#d1fae5' : score >= 75 ? '#dbeafe' : score >= 60 ? '#fef3c7' : '#fee2e2'
              return (
                <div key={p.penilaian_id} className="validasi-penilaian-card"
                  style={{ borderTop: `3px solid ${cfg.color}` }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.13)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
                >
                  {/* Card Body */}
                  <div className="vpc-body">
                    {/* Status badge + periode */}
                    <div className="vpc-top">
                      <StatusBadge status={p.status_validasi} />
                      <span className="vpc-periode">{p.nama_periode}</span>
                    </div>

                    {/* Driver name */}
                    <p className="vpc-name">{p.nama_driver}</p>

                    {/* Score prominent */}
                    <div className="vpc-score" style={{ color: scoreColor, background: scoreBg }}>
                      <span className="vpc-score-label">Skor</span>
                      <span className="vpc-score-value">{score.toFixed(2)}</span>
                    </div>

                    {/* Info rows */}
                    <div className="vpc-info">
                      <div className="vpc-info-row">
                        <span className="vpc-info-label">Armada</span>
                        <span className="vpc-info-value">{p.nama_armada}</span>
                      </div>
                      <div className="vpc-info-row">
                        <span className="vpc-info-label">Bus</span>
                        <span className="vpc-info-value">{p.kode_bus} / {p.nopol}</span>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="vpc-meta">
                      <span style={{ fontWeight: 600, color: '#d97706' }}>{p.nama_petugas_input}</span>
                      <span> · {fmtDate(p.created_at)}</span>
                    </div>
                    {p.nama_admin_validasi && (
                      <div className="vpc-meta" style={{ marginTop: 2 }}>
                        <span>Validasi: </span>
                        <span style={{ fontWeight: 600, color: '#2563eb' }}>{p.nama_admin_validasi}</span>
                      </div>
                    )}
                    {p.status_validasi === 'rejected' && p.note_validasi && (
                      <div className="vpc-reject-note">
                        {p.note_validasi}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="vpc-footer">
                    <button className="vpc-btn" onClick={() => openDetail(p.penilaian_id)}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}
                    >
                      <EyeIcon /> <span className="vpc-btn-text">Lihat Detail</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

        ) : (
          /* ── TABLE / LIST VIEW ── */
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#1e40af,#3b82f6)' }}>
                    {['#', 'Driver', 'Armada', 'Bus', 'Periode', 'Diinput Oleh', 'Tgl Input', 'Divalidasi', 'Skor', 'Status', 'Aksi'].map(col => (
                      <th key={col} style={{
                        padding: '12px 14px', textAlign: 'left', fontWeight: 600,
                        fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em',
                        color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap',
                        borderBottom: '2px solid rgba(255,255,255,0.15)',
                      }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, idx) => {
                    const rowBg = ROW_BG[p.status_validasi] ?? '#fff'
                    const cfg = STATUS_CFG[p.status_validasi]
                    const score = Number(p.skor_total)
                    const scoreColor = score >= 90 ? '#059669' : score >= 75 ? '#2563eb' : score >= 60 ? '#d97706' : '#dc2626'
                    return (
                      <tr key={p.penilaian_id} style={{ background: idx % 2 === 0 ? rowBg : '#fff', borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f8fafc'}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? rowBg : '#fff'}
                      >
                        <td style={{ padding: '11px 14px', color: '#9ca3af', fontWeight: 500 }}>{idx + 1}</td>
                        <td style={{ padding: '11px 14px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>{p.nama_driver}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', background: '#ede9fe', padding: '2px 8px', borderRadius: 999 }}>{p.nama_armada}</span>
                        </td>
                        <td style={{ padding: '11px 14px', color: '#374151', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 600, color: '#2563eb' }}>{p.kode_bus}</span>
                          <span style={{ color: '#9ca3af' }}> / {p.nopol}</span>
                        </td>
                        <td style={{ padding: '11px 14px', color: '#374151', whiteSpace: 'nowrap' }}>{p.nama_periode}</td>
                        {/* Highlighted: Petugas Input */}
                        <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 600, color: '#d97706', background: '#fef3c7', padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>{p.nama_petugas_input}</span>
                        </td>
                        <td style={{ padding: '11px 14px', color: '#6b7280', whiteSpace: 'nowrap', fontSize: 12 }}>{fmtDate(p.created_at)}</td>
                        {/* Highlighted: Admin Validasi */}
                        <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                          {p.nama_admin_validasi
                            ? <span style={{ fontWeight: 600, color: '#2563eb', background: '#dbeafe', padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>{p.nama_admin_validasi}</span>
                            : <span style={{ color: '#d1d5db' }}>—</span>}
                        </td>
                        {/* Score */}
                        <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 800, fontSize: 15, color: scoreColor, fontVariantNumeric: 'tabular-nums' }}>
                            {score.toFixed(2)}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <StatusBadge status={p.status_validasi} />
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <button onClick={() => openDetail(p.penilaian_id)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '5px 10px', borderRadius: 7,
                              border: '1.5px solid #e5e7eb', background: '#fff',
                              fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer',
                              whiteSpace: 'nowrap', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9'}
                            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#fff'}
                          >
                            <EyeIcon /> Detail
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Table legend */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid #f3f4f6', background: '#fafafa', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {Object.entries(STATUS_CFG).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: ROW_BG[k as keyof typeof ROW_BG], border: `1px solid ${v.border}` }} />
                  Baris {v.label}
                </div>
              ))}
              <div style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af' }}>
                <span style={{ fontWeight: 600, color: '#d97706' }}>Kuning</span> = Petugas Input &nbsp;|&nbsp;
                <span style={{ fontWeight: 600, color: '#2563eb' }}>Biru</span> = Admin Validasi
              </div>
            </div>
          </div>
        )}

        {/* ── Detail Modal ── */}
        {showDetail && (
          <div className="modal-overlay" onClick={closeDetail}>
            <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2 className="modal-title">Detail Penilaian</h2>
                  {detailData && (
                    <p className="modal-subtitle">{detailData.penilaian.nama_driver} — {detailData.penilaian.nama_periode}</p>
                  )}
                </div>
                <button className="modal-close" onClick={closeDetail}><CloseIcon /></button>
              </div>

              <div className="modal-body">
                {isLoadingDetail ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 12 }}>
                    <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <p style={{ color: '#9ca3af' }}>Memuat detail...</p>
                  </div>
                ) : detailData ? (
                  <>
                    {actionMsg && (
                      <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 500,
                        background: actionMsg.type === 'success' ? '#d1fae5' : '#fee2e2',
                        color: actionMsg.type === 'success' ? '#065f46' : '#991b1b',
                        border: `1px solid ${actionMsg.type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
                      }}>
                        {actionMsg.text}
                      </div>
                    )}

                    {/* Info + Score side-by-side */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, background: '#f8fafc', borderRadius: 12, padding: '16px', minWidth: 240 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', margin: '0 0 12px' }}>Informasi Penilaian</p>
                        {[
                          ['Driver', detailData.penilaian.nama_driver],
                          ['Bus', `${detailData.penilaian.kode_bus} / ${detailData.penilaian.nopol}`],
                          ['Armada', detailData.penilaian.nama_armada],
                          ['Periode', detailData.penilaian.nama_periode],
                          ['Tgl Input', fmtDateTime(detailData.penilaian.created_at)],
                        ].map(([label, val]) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e5e7eb', fontSize: 13 }}>
                            <span style={{ color: '#6b7280' }}>{label}</span>
                            <span style={{ fontWeight: 600, color: '#111827', textAlign: 'right', maxWidth: '60%' }}>{val}</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e5e7eb', fontSize: 13 }}>
                          <span style={{ color: '#6b7280' }}>Petugas Input</span>
                          <span style={{ fontWeight: 600, color: '#d97706' }}>{detailData.penilaian.nama_petugas_input}</span>
                        </div>
                        {detailData.penilaian.nama_admin_validasi && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                            <span style={{ color: '#6b7280' }}>Divalidasi</span>
                            <span style={{ fontWeight: 600, color: '#2563eb' }}>{detailData.penilaian.nama_admin_validasi}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', minWidth: 140 }}>
                        <ScoreBadge score={Number(detailData.penilaian.skor_total)} />
                        <StatusBadge status={detailData.penilaian.status_validasi} />
                      </div>
                    </div>

                    {/* Detail Indikator */}
                    <div className="preview-section">
                      <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', marginBottom: 10 }}>Detail Indikator</h3>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9' }}>
                            {['Indikator', 'Bobot', 'Nilai', 'Kontribusi'].map(h => (
                              <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Indikator' ? 'left' : 'center', fontWeight: 600, color: '#374151', fontSize: 12 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {detailData.details.map(d => (
                            <tr key={d.penilaian_detail_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ padding: '8px 12px', color: '#374151' }}>{d.nama_bobot}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'center', color: '#6b7280' }}>{d.persentase_bobot}%</td>
                              <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>{Number(d.nilai).toFixed(2)}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: '#2563eb' }}>
                                {((Number(d.nilai) * Number(d.persentase_bobot)) / 100).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                          <tr style={{ background: '#f8fafc', borderTop: '2px solid #e5e7eb' }}>
                            <td colSpan={3} style={{ padding: '10px 12px', fontWeight: 700, color: '#111827' }}>Skor Total</td>
                            <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, fontSize: 16, color: '#2563eb' }}>
                              {Number(detailData.penilaian.skor_total).toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Catatan Petugas */}
                    {detailData.penilaian.catatan_petugas && (
                      <div className="preview-section">
                        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', marginBottom: 8 }}>Catatan Petugas</h3>
                        <p style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e', margin: 0 }}>
                          {detailData.penilaian.catatan_petugas}
                        </p>
                      </div>
                    )}

                    {/* Note Penolakan */}
                    {detailData.penilaian.note_validasi && (
                      <div className="preview-section">
                        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#dc2626', marginBottom: 8 }}>Alasan Penolakan</h3>
                        <p style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#991b1b', margin: 0 }}>
                          {detailData.penilaian.note_validasi}
                        </p>
                      </div>
                    )}

                    {/* Bukti Foto */}
                    {detailData.foto.length > 0 && (
                      <div className="preview-section">
                        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', marginBottom: 8 }}>Bukti Foto</h3>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {detailData.foto.map(f => (
                            <a key={f.bukti_id} href={f.file_path} target="_blank" rel="noreferrer"
                              style={{ display: 'block', borderRadius: 8, overflow: 'hidden', border: '2px solid #e5e7eb' }}>
                              <img src={f.file_path} alt={f.nama_file || 'Bukti foto'}
                                style={{ width: 120, height: 90, objectFit: 'cover', display: 'block' }} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Riwayat Validasi */}
                    {detailData.log.length > 0 && (
                      <div className="preview-section">
                        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', marginBottom: 8 }}>Riwayat Validasi</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {detailData.log.map(l => (
                            <div key={l.validasi_log_id} style={{
                              display: 'flex', alignItems: 'flex-start', gap: 12,
                              padding: '10px 14px', background: '#f8fafc', borderRadius: 10,
                              border: '1px solid #e5e7eb',
                            }}>
                              <StatusBadge status={l.aksi} />
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>{l.nama_admin}</p>
                                {l.alasan && <p style={{ margin: '3px 0 0', fontSize: 12, color: '#dc2626' }}>{l.alasan}</p>}
                              </div>
                              <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>{fmtDateTime(l.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              {/* Footer actions */}
              {detailData && !isSuperAdmin && (
                <div className="modal-footer">
                  {detailData.penilaian.status_validasi === 'pending' && (
                    <>
                      <button className="btn btn-danger-outline" onClick={() => openReject(false)} disabled={isSubmitting}>
                        <XIcon /> Tolak
                      </button>
                      <button className="btn btn-primary" onClick={handleApprove} disabled={isSubmitting}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckIcon /> {isSubmitting ? 'Memproses...' : 'Setujui'}
                      </button>
                    </>
                  )}
                  {detailData.penilaian.status_validasi === 'approved' && (
                    <button onClick={() => openReject(true)} disabled={isSubmitting}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '9px 18px', borderRadius: 10, border: '1.5px solid #fca5a5',
                        background: '#fff', color: '#dc2626', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'}
                      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#fff'}
                    >
                      <XIcon /> Tolak Ulang
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Reject / Tolak Ulang Modal ── */}
        {showReject && detailData && (
          <div className="modal-overlay" onClick={() => setShowReject(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2 className="modal-title" style={{ color: '#dc2626' }}>
                    {isRejectUlang ? 'Tolak Ulang Penilaian' : 'Tolak Penilaian'}
                  </h2>
                  <p className="modal-subtitle">{detailData.penilaian.nama_driver} — {detailData.penilaian.nama_periode}</p>
                </div>
                <button className="modal-close" onClick={() => setShowReject(false)}><CloseIcon /></button>
              </div>
              <div className="modal-body">
                {isRejectUlang && (
                  <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#92400e' }}>
                    Penilaian ini sebelumnya telah disetujui. Tolak ulang akan mengubah status kembali menjadi <strong>Ditolak</strong>.
                  </div>
                )}
                <div className="form-section">
                  <h3 className="form-section-title">Alasan Penolakan <span style={{ color: '#ef4444' }}>*</span></h3>
                  <p className="form-help-text">Penjelasan ini akan ditampilkan ke petugas yang menginput data.</p>
                  <textarea
                    className="form-textarea"
                    rows={5}
                    placeholder="Contoh: Data tidak lengkap, bukti tidak valid, penilaian tidak sesuai..."
                    value={rejectAlasan}
                    onChange={e => setRejectAlasan(e.target.value)}
                  />
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{rejectAlasan.trim().length} karakter</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowReject(false)} disabled={isSubmitting}>Batal</button>
                <button className="btn btn-danger" onClick={handleReject} disabled={isSubmitting || !rejectAlasan.trim()}>
                  {isSubmitting ? 'Memproses...' : isRejectUlang ? 'Konfirmasi Tolak Ulang' : 'Konfirmasi Tolak'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
