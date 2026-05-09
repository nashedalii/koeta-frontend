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
  { accent: '#ef4444', iconBg: '#fee2e2', iconColor: '#dc2626' },
  { accent: '#f59e0b', iconBg: '#fef3c7', iconColor: '#d97706' },
  { accent: '#10b981', iconBg: '#d1fae5', iconColor: '#059669' },
  { accent: '#3b82f6', iconBg: '#dbeafe', iconColor: '#2563eb' },
  { accent: '#8b5cf6', iconBg: '#ede9fe', iconColor: '#7c3aed' },
  { accent: '#ec4899', iconBg: '#fce7f3', iconColor: '#db2777' },
]

export default function KategoriPenilaian() {
  const [siklusList, setSiklusList]             = useState<Siklus[]>([])
  const [selectedSiklusId, setSelectedSiklusId] = useState<number | null>(null)
  const [bobotList, setBobotList]               = useState<Bobot[]>([])
  const [expandedId, setExpandedId]             = useState<number | null>(null)
  const [isLoadingSiklus, setIsLoadingSiklus]   = useState(true)
  const [isLoadingBobot, setIsLoadingBobot]     = useState(false)
  const [error, setError]                       = useState<string | null>(null)

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

  const parseRubric = (deskripsi: string | null): RubricItem[] => {
    if (!deskripsi) return []
    try { const arr = JSON.parse(deskripsi); return Array.isArray(arr) ? arr : [] } catch { return [] }
  }

  const selectedSiklus = siklusList.find(s => s.siklus_id === selectedSiklusId)
  const totalBobot = bobotList.reduce((s, b) => s + parseFloat(String(b.persentase_bobot)), 0)

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
          title="Kategori Penilaian Driver"
          subtitle="Indikator dan rubric penilaian performa driver"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#fff" style={{ width: 28, height: 28 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          }
        />

        {/* ── Controls Bar ────────────────────────────────────── */}
        <div
          style={{
            background: 'rgba(255,255,255,0.97)',
            borderRadius: 16,
            padding: '14px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: '0 2px 16px rgba(0,0,0,0.1)',
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
              appearance: 'none', WebkitAppearance: 'none',
              padding: '9px 36px 9px 14px',
              border: '1.5px solid #e2e8f0', borderRadius: 10,
              fontSize: '0.875rem', fontWeight: 600, color: '#1e293b',
              background: '#f8fafc url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E") no-repeat right 11px center',
              cursor: 'pointer', outline: 'none',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              minWidth: 180,
            }}
          >
            {siklusList.map(s => <option key={s.siklus_id} value={s.siklus_id}>{s.nama_siklus}</option>)}
          </select>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontSize: 14 }}>
            {error}
          </div>
        )}

        {isLoadingBobot ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {[0,1,2,3,4,5].map(i => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 16, padding: '20px', height: 80 }}>
                <div style={{ height: 12, background: '#e5e7eb', borderRadius: 8, width: '60%', marginBottom: 10 }} />
                <div style={{ height: 10, background: '#f3f4f6', borderRadius: 8, width: '35%' }} />
              </div>
            ))}
          </div>
        ) : bobotList.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 18, padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <p style={{ margin: 0, fontSize: 14 }}>Belum ada data bobot untuk siklus ini.</p>
          </div>
        ) : (
          <>
            {/* ── Info banner ─────────────────────────────────── */}
            <div
              style={{
                background: 'linear-gradient(135deg,#667eea,#764ba2)',
                borderRadius: 14,
                padding: '16px 20px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="#fff" width={18} height={18}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>Sistem Penilaian Berbobot</p>
                <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                  Penilaian driver menggunakan {bobotList.length} indikator dengan total bobot {Math.round(totalBobot)}%. Klik setiap indikator untuk melihat rubric penilaian.
                </p>
              </div>
            </div>

            {/* ── Kategori Cards ───────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {bobotList.map((bobot, index) => {
                const clr       = CARD_COLORS[index % CARD_COLORS.length]
                const rubric    = parseRubric(bobot.deskripsi)
                const isOpen    = expandedId === bobot.bobot_id
                const pct       = parseFloat(String(bobot.persentase_bobot))

                return (
                  <div
                    key={bobot.bobot_id}
                    style={{
                      background: '#fff',
                      borderRadius: 16,
                      border: `1.5px solid ${isOpen ? clr.accent : '#f1f5f9'}`,
                      boxShadow: isOpen ? `0 4px 20px ${clr.accent}20` : '0 2px 10px rgba(0,0,0,0.06)',
                      overflow: 'hidden',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                  >
                    {/* Card header — clickable */}
                    <div
                      onClick={() => setExpandedId(isOpen ? null : bobot.bobot_id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '16px 20px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        background: isOpen ? `${clr.accent}08` : '#fff',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: clr.iconBg, color: clr.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={20} height={20}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>{bobot.nama_bobot}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>
                            {rubric.length > 0 ? `${rubric.length} range rubric tersedia` : 'Belum ada rubric'}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        {/* Bobot badge */}
                        <span style={{
                          background: clr.accent, color: '#fff',
                          fontWeight: 700, fontSize: 13,
                          padding: '4px 12px', borderRadius: 999,
                        }}>
                          {pct}%
                        </span>
                        {/* Chevron */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                          strokeWidth={2.5} stroke={isOpen ? clr.accent : '#94a3b8'}
                          width={16} height={16}
                          style={{ transition: 'transform 0.25s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>
                    </div>

                    {/* Bobot progress bar (thin, always visible) */}
                    <div style={{ height: 3, background: '#f1f5f9' }}>
                      <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: clr.accent, transition: 'width 0.4s' }} />
                    </div>

                    {/* Expandable content */}
                    {isOpen && (
                      <div style={{ padding: '0 20px 20px' }}>
                        <div style={{ height: 1, background: '#f1f5f9', margin: '16px 0' }} />

                        {rubric.length === 0 ? (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '14px 16px',
                            background: '#fffbeb', border: '1px solid #fde68a',
                            borderLeft: `4px solid ${clr.accent}`, borderRadius: 10,
                            fontSize: 13, color: '#92400e',
                          }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#d97706" width={16} height={16}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            Rubric belum diisi. Hubungi admin untuk melengkapi panduan penilaian.
                          </div>
                        ) : (
                          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: `${clr.accent}10` }}>
                                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: clr.accent, textTransform: 'uppercase', letterSpacing: '0.05em', width: '22%', borderBottom: `2px solid ${clr.accent}30` }}>
                                    Rentang Nilai
                                  </th>
                                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: clr.accent, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `2px solid ${clr.accent}30` }}>
                                    Deskripsi Kriteria
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {rubric.map((item, i) => (
                                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: clr.accent, borderLeft: `3px solid ${clr.accent}`, verticalAlign: 'top' }}>
                                      {item.range}
                                    </td>
                                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                                      {item.deskripsi}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* ── Bobot Distribution Summary ───────────────────── */}
            <div style={{ background: '#fff', borderRadius: 18, padding: '22px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#eef2ff,#ddd6fe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="#7c3aed" width={16} height={16}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Distribusi Bobot Penilaian</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {bobotList.map((bobot, index) => {
                  const clr = CARD_COLORS[index % CARD_COLORS.length]
                  const pct = parseFloat(String(bobot.persentase_bobot))
                  return (
                    <div key={bobot.bobot_id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: clr.accent, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>{bobot.nama_bobot}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: clr.accent }}>{pct}%</span>
                      </div>
                      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: clr.accent, borderRadius: 999 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
