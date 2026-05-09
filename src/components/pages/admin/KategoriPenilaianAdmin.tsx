'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/utils/api'
import PageHeader from '@/components/ui/PageHeader'

interface RubricItem {
  range: string
  deskripsi: string
}

interface Bobot {
  bobot_id: number
  nama_bobot: string
  persentase_bobot: number | string
  deskripsi: string | null
}

interface Siklus {
  siklus_id: number
  nama_siklus: string
  status_display: string
}

const CARD_COLORS = [
  { accent: '#ef4444', bg: '#fef2f2', iconBg: '#fee2e2', iconColor: '#dc2626' },
  { accent: '#f59e0b', bg: '#fffbeb', iconBg: '#fef3c7', iconColor: '#d97706' },
  { accent: '#10b981', bg: '#f0fdf4', iconBg: '#d1fae5', iconColor: '#059669' },
  { accent: '#3b82f6', bg: '#eff6ff', iconBg: '#dbeafe', iconColor: '#2563eb' },
  { accent: '#8b5cf6', bg: '#f5f3ff', iconBg: '#ede9fe', iconColor: '#7c3aed' },
  { accent: '#ec4899', bg: '#fdf2f8', iconBg: '#fce7f3', iconColor: '#db2777' },
]

const DEFAULT_RUBRIC: RubricItem[] = Array.from({ length: 5 }, () => ({ range: '', deskripsi: '' }))

const CloseIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
)
const TrashIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)
const PlusIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)
const SaveIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
)
const EditIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

export default function KategoriPenilaianAdmin() {
  const [siklusList, setSiklusList]             = useState<Siklus[]>([])
  const [selectedSiklusId, setSelectedSiklusId] = useState<number | null>(null)
  const [bobotList, setBobotList]               = useState<Bobot[]>([])
  const [isLoadingSiklus, setIsLoadingSiklus]   = useState(true)
  const [isLoadingBobot, setIsLoadingBobot]     = useState(false)
  const [isSaving, setIsSaving]                 = useState(false)
  const [error, setError]                       = useState<string | null>(null)
  const [successMsg, setSuccessMsg]             = useState<string | null>(null)

  const [showModal, setShowModal]           = useState(false)
  const [selectedBobot, setSelectedBobot]   = useState<Bobot | null>(null)
  const [rubricForm, setRubricForm]         = useState<RubricItem[]>(DEFAULT_RUBRIC)

  useEffect(() => {
    const fetchSiklus = async () => {
      try {
        const data = await apiFetch('/api/siklus')
        setSiklusList(data || [])
        if (data && data.length > 0) setSelectedSiklusId(data[0].siklus_id)
      } catch {
        setError('Gagal memuat daftar siklus')
      } finally {
        setIsLoadingSiklus(false)
      }
    }
    fetchSiklus()
  }, [])

  const fetchBobot = useCallback(async () => {
    if (!selectedSiklusId) return
    setIsLoadingBobot(true); setError(null)
    try {
      const data = await apiFetch(`/api/bobot?siklus_id=${selectedSiklusId}`)
      setBobotList(data?.bobots || [])
    } catch {
      setError('Gagal memuat data bobot')
    } finally {
      setIsLoadingBobot(false)
    }
  }, [selectedSiklusId])

  useEffect(() => { fetchBobot() }, [fetchBobot])

  const handleEditRubric = (bobot: Bobot) => {
    setSelectedBobot(bobot); setSuccessMsg(null)
    let parsed: RubricItem[] = DEFAULT_RUBRIC.map(() => ({ range: '', deskripsi: '' }))
    if (bobot.deskripsi) {
      try {
        const arr = JSON.parse(bobot.deskripsi)
        if (Array.isArray(arr) && arr.length > 0) parsed = arr
      } catch { /* keep default */ }
    }
    setRubricForm(parsed); setShowModal(true)
  }

  const addRow    = () => setRubricForm(prev => [...prev, { range: '', deskripsi: '' }])
  const removeRow = (i: number) => { if (rubricForm.length > 1) setRubricForm(prev => prev.filter((_, idx) => idx !== i)) }
  const updateRow = (i: number, field: 'range' | 'deskripsi', val: string) =>
    setRubricForm(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  const handleSave = async () => {
    if (!selectedBobot) return
    const valid = rubricForm.filter(r => r.range.trim() || r.deskripsi.trim())
    if (valid.length === 0) { alert('Minimal isi satu baris rubric'); return }
    if (valid.find(r => !r.range.trim() || !r.deskripsi.trim())) { alert('Setiap baris harus diisi Range dan Deskripsi'); return }
    setIsSaving(true)
    try {
      await apiFetch(`/api/bobot/${selectedBobot.bobot_id}/deskripsi`, {
        method: 'PUT',
        body: JSON.stringify({ deskripsi: valid }),
      })
      setSuccessMsg(`Rubric "${selectedBobot.nama_bobot}" berhasil disimpan`)
      setShowModal(false); fetchBobot()
    } catch (err: any) {
      alert(err?.message || 'Gagal menyimpan rubric')
    } finally {
      setIsSaving(false)
    }
  }

  const getRubricCount = (bobot: Bobot) => {
    if (!bobot.deskripsi) return 0
    try { const arr = JSON.parse(bobot.deskripsi); return Array.isArray(arr) ? arr.length : 0 } catch { return 0 }
  }

  const selectedSiklus = siklusList.find(s => s.siklus_id === selectedSiklusId)

  if (isLoadingSiklus) {
    return (
      <div className="dashboard-container">
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>
          Memuat data siklus...
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">

        {/* ── Page Header ─────────────────────────────────────── */}
        <PageHeader
          title="Kategori Penilaian"
          subtitle="Kelola rubric penilaian per indikator. Nama & bobot diatur di Konfigurasi Penilaian."
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#fff" style={{ width: 28, height: 28 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          }
        />

        {/* ── Controls bar ────────────────────────────────────── */}
        <div
          style={{
            background: 'rgba(255,255,255,0.97)',
            borderRadius: 16,
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="#fff" width={18} height={18}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Siklus Penilaian</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>{selectedSiklus?.nama_siklus ?? '—'}</p>
            </div>
          </div>

          <select
            value={selectedSiklusId ?? ''}
            onChange={e => setSelectedSiklusId(Number(e.target.value))}
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              padding: '9px 36px 9px 14px',
              border: '1.5px solid #e2e8f0',
              borderRadius: 10,
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#1e293b',
              background: '#f8fafc url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E") no-repeat right 11px center',
              cursor: 'pointer',
              outline: 'none',
              minWidth: 180,
            }}
          >
            {siklusList.map(s => (
              <option key={s.siklus_id} value={s.siklus_id}>{s.nama_siklus}</option>
            ))}
          </select>
        </div>

        {/* ── Alerts ──────────────────────────────────────────── */}
        {successMsg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', marginBottom: 16, color: '#15803d', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            {successMsg}
          </div>
        )}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontSize: 14, fontWeight: 500 }}>
            {error}
          </div>
        )}

        {/* ── Cards ───────────────────────────────────────────── */}
        {isLoadingBobot ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {[0,1,2,3,4,5].map(i => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 18, padding: 24, height: 160 }}>
                <div style={{ height: 14, background: '#e5e7eb', borderRadius: 8, width: '60%', marginBottom: 12 }} />
                <div style={{ height: 12, background: '#f3f4f6', borderRadius: 8, width: '40%', marginBottom: 20 }} />
                <div style={{ height: 36, background: '#e5e7eb', borderRadius: 10 }} />
              </div>
            ))}
          </div>
        ) : bobotList.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 18, padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={40} height={40} style={{ marginBottom: 12, opacity: 0.4 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p style={{ margin: 0, fontSize: 14 }}>Belum ada bobot untuk siklus ini. Tambahkan di Konfigurasi Penilaian.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {bobotList.map((bobot, index) => {
              const clr       = CARD_COLORS[index % CARD_COLORS.length]
              const count     = getRubricCount(bobot)
              const pct       = parseFloat(String(bobot.persentase_bobot))
              return (
                <div
                  key={bobot.bobot_id}
                  style={{
                    background: '#fff',
                    borderRadius: 18,
                    borderTop: `4px solid ${clr.accent}`,
                    padding: '20px 20px 18px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.13)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: clr.iconBg, color: clr.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={20} height={20}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
                        {bobot.nama_bobot}
                      </h3>
                    </div>
                    <span style={{ background: clr.accent, color: '#fff', fontWeight: 700, fontSize: 13, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {pct}%
                    </span>
                  </div>

                  {/* Bobot bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Bobot penilaian</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: clr.accent }}>{pct}%</span>
                    </div>
                    <div style={{ height: 5, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: clr.accent, borderRadius: 999 }} />
                    </div>
                  </div>

                  {/* Rubric status */}
                  <div>
                    {count > 0 ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>
                        <svg width={11} height={11} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/></svg>
                        {count} range rubric tersedia
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>
                        <svg width={11} height={11} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>
                        Belum ada rubric
                      </span>
                    )}
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => handleEditRubric(bobot)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      padding: '10px',
                      border: 'none',
                      borderRadius: 12,
                      background: `linear-gradient(135deg, ${clr.accent}, ${clr.accent}cc)`,
                      color: '#fff',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    <EditIcon />
                    Edit Rubric
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Modal Edit Rubric ───────────────────────────────── */}
        {showModal && selectedBobot && (() => {
          const idx  = bobotList.findIndex(b => b.bobot_id === selectedBobot.bobot_id)
          const clr  = CARD_COLORS[idx >= 0 ? idx % CARD_COLORS.length : 0]
          return (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div
                className="modal-content modal-large"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: 680 }}
              >
                {/* Modal Header */}
                <div className="modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#fff" width={18} height={18}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 700 }}>
                        Edit Rubric — {selectedBobot.nama_bobot}
                      </h2>
                      <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                        Bobot: {parseFloat(String(selectedBobot.persentase_bobot))}%
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowModal(false)} className="modal-close"><CloseIcon /></button>
                </div>

                {/* Modal Body */}
                <div className="modal-body">
                  {/* Column headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 40px', gap: 8, marginBottom: 8, padding: '0 4px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rentang Nilai</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deskripsi Kriteria</span>
                    <span />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {rubricForm.map((row, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 40px', gap: 8, alignItems: 'start' }}>
                        <input
                          type="text"
                          value={row.range}
                          onChange={e => updateRow(i, 'range', e.target.value)}
                          placeholder="cth: 86–100"
                          style={{
                            padding: '9px 12px',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: 10,
                            fontSize: '0.875rem',
                            color: '#1e293b',
                            background: '#f8fafc',
                            outline: 'none',
                            width: '100%',
                            boxSizing: 'border-box',
                          }}
                          onFocus={e => { e.currentTarget.style.borderColor = clr.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${clr.accent}22` }}
                          onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
                        />
                        <textarea
                          value={row.deskripsi}
                          onChange={e => updateRow(i, 'deskripsi', e.target.value)}
                          placeholder="Deskripsi kriteria untuk rentang nilai ini..."
                          rows={2}
                          style={{
                            padding: '9px 12px',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: 10,
                            fontSize: '0.875rem',
                            color: '#1e293b',
                            background: '#f8fafc',
                            outline: 'none',
                            resize: 'vertical',
                            width: '100%',
                            boxSizing: 'border-box',
                            lineHeight: 1.5,
                          }}
                          onFocus={e => { e.currentTarget.style.borderColor = clr.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${clr.accent}22` }}
                          onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
                        />
                        {rubricForm.length > 1 ? (
                          <button
                            onClick={() => removeRow(i)}
                            title="Hapus baris"
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 9,
                              border: '1.5px solid #fecaca',
                              background: '#fef2f2',
                              color: '#dc2626',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'background 0.15s',
                              marginTop: 2,
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#fef2f2')}
                          >
                            <TrashIcon />
                          </button>
                        ) : <div />}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={addRow}
                    style={{
                      marginTop: 14,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      border: `1.5px dashed ${clr.accent}80`,
                      borderRadius: 10,
                      background: clr.bg,
                      color: clr.accent,
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderStyle = 'solid')}
                    onMouseLeave={e => (e.currentTarget.style.borderStyle = 'dashed')}
                  >
                    <PlusIcon /> Tambah Range
                  </button>
                </div>

                {/* Modal Footer */}
                <div className="modal-footer">
                  <button onClick={() => setShowModal(false)} className="btn-cancel">Batal</button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '10px 22px',
                      border: 'none',
                      borderRadius: 10,
                      background: `linear-gradient(135deg, ${clr.accent}, ${clr.accent}cc)`,
                      color: '#fff',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      opacity: isSaving ? 0.6 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <SaveIcon />
                    {isSaving ? 'Menyimpan...' : 'Simpan Rubric'}
                  </button>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
