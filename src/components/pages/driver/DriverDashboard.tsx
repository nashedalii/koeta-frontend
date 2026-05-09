'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/utils/api'

interface DriverProfile {
  driver_id: number
  nama_driver: string
  nama_kernet: string | null
  no_hp: string
  status_aktif: string
  nama_armada: string | null
  kode_bus: string | null
  nopol: string | null
}

interface ScoreItem {
  bobot_id: number
  nama_bobot: string
  persentase_bobot: number
  nilai: number
  weighted_score: number
}

interface PeriodeTerakhir {
  skor_total: number
  nama_periode: string
  bulan: string
  tahun: number
  scores: ScoreItem[]
}

interface RankingData {
  rank: number | null
  skor_total: number | null
  total_driver: number
  periode_terakhir: PeriodeTerakhir | null
}

interface Siklus {
  siklus_id: number
  nama_siklus: string
}

function getScoreColor(score: number) {
  if (score >= 90) return '#10b981'
  if (score >= 75) return '#3b82f6'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

function getScoreLabel(score: number) {
  if (score >= 90) return 'Sangat Baik'
  if (score >= 75) return 'Baik'
  if (score >= 60) return 'Cukup'
  return 'Kurang'
}

const InfoIcon = ({ path }: { path: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" width={16} height={16}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
)

export default function DriverDashboard() {
  const [profile, setProfile]       = useState<DriverProfile | null>(null)
  const [ranking, setRanking]       = useState<RankingData | null>(null)
  const [siklusList, setSiklusList] = useState<Siklus[]>([])
  const [selectedSiklusId, setSelectedSiklusId] = useState<number | null>(null)
  const [isLoading, setIsLoading]   = useState(true)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    const fetchSiklus = async () => {
      try {
        const data = await apiFetch('/api/siklus')
        setSiklusList(data || [])
        if (data && data.length > 0) setSelectedSiklusId(data[0].siklus_id)
      } catch {
        setError('Gagal memuat data siklus')
      }
    }
    fetchSiklus()
  }, [])

  useEffect(() => {
    if (!selectedSiklusId) return
    const fetchData = async () => {
      setIsLoading(true); setError(null)
      try {
        const [profileData, rankingData] = await Promise.all([
          apiFetch('/api/driver/me'),
          apiFetch(`/api/driver/me/ranking?siklus_id=${selectedSiklusId}`),
        ])
        setProfile(profileData)
        setRanking(rankingData)
      } catch {
        setError('Gagal memuat data dashboard')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [selectedSiklusId])

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>
          Memuat data...
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="dashboard-container">
        <div className="alert-error">{error || 'Data tidak ditemukan'}</div>
      </div>
    )
  }

  const periode = ranking?.periode_terakhir
  const score   = periode ? parseFloat(String(periode.skor_total)) : null
  const isAktif = profile.status_aktif === 'aktif'

  const infoFields = [
    {
      label: 'Nama Driver',
      value: profile.nama_driver,
      iconPath: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z',
    },
    {
      label: 'Armada',
      value: profile.nama_armada || '-',
      iconPath: 'M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5h-6m3 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497',
    },
    {
      label: 'Kode Bus',
      value: profile.kode_bus || '-',
      highlight: true,
      iconPath: 'M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z',
    },
    {
      label: 'Nomor Polisi',
      value: profile.nopol || '-',
      iconPath: 'M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Z',
    },
    {
      label: 'Nama Kernet',
      value: profile.nama_kernet || '-',
      iconPath: 'M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z',
    },
    {
      label: 'No HP',
      value: profile.no_hp,
      iconPath: 'M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75',
    },
  ]

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">

        {/* ── Welcome Banner ───────────────────────────────────── */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #2563eb 100%)',
            borderRadius: 16,
            padding: '28px 32px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 24px rgba(15,23,42,0.25)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* background circle decoration */}
          <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: 60, bottom: -60, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Dashboard Informasi & Performa</p>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
              Selamat Datang, {profile.nama_driver}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: isAktif ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                  border: `1px solid ${isAktif ? 'rgba(52,211,153,0.5)' : 'rgba(252,165,165,0.5)'}`,
                  borderRadius: 999,
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: isAktif ? '#6ee7b7' : '#fca5a5',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={12} height={12}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Status: {isAktif ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1, opacity: 0.3 }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="#fff" width={80} height={80}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
        </div>

        {/* ── Identity Card ────────────────────────────────────── */}
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: '24px 28px',
            marginBottom: 24,
            boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
            border: '1px solid #f1f5f9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="#fff" width={18} height={18}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Z" />
              </svg>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Informasi Akun</h2>
              <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>Data identitas driver terdaftar</p>
            </div>
          </div>

          <div style={{ height: 1, background: '#f1f5f9', marginBottom: 20 }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {infoFields.map(field => (
              <div
                key={field.label}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '14px 16px',
                  background: '#f8fafc',
                  borderRadius: 12,
                  border: '1px solid #f1f5f9',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: 'linear-gradient(135deg,#eef2ff,#ddd6fe)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: '#7c3aed',
                  }}
                >
                  <InfoIcon path={field.iconPath} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {field.label}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: field.highlight ? '#667eea' : '#1e293b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {field.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Performance Section ───────────────────────────────── */}
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: '24px 28px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
            border: '1px solid #f1f5f9',
          }}
        >
          {/* Section header + siklus selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#dbeafe,#bfdbfe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="#2563eb" width={18} height={18}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Performa Penilaian</h2>
                <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>Skor dan peringkat berdasarkan siklus</p>
              </div>
            </div>

            {/* Siklus selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>Siklus:</label>
              <select
                value={selectedSiklusId ?? ''}
                onChange={e => setSelectedSiklusId(Number(e.target.value))}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  padding: '7px 32px 7px 12px',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#1e293b',
                  background: '#f8fafc url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E") no-repeat right 10px center',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: 160,
                }}
              >
                {siklusList.map(s => (
                  <option key={s.siklus_id} value={s.siklus_id}>{s.nama_siklus}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ height: 1, background: '#f1f5f9', marginBottom: 20 }} />

          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
            {/* Score card */}
            <div
              style={{
                padding: '20px 20px',
                borderRadius: 14,
                background: score !== null ? `linear-gradient(135deg, ${getScoreColor(score)}18, ${getScoreColor(score)}08)` : '#f8fafc',
                border: `1.5px solid ${score !== null ? getScoreColor(score) + '40' : '#e2e8f0'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Skor {periode ? `${periode.bulan} ${periode.tahun}` : 'Terkini'}
              </p>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: score !== null ? getScoreColor(score) : '#94a3b8', lineHeight: 1 }}>
                {score !== null ? score.toFixed(1) : '—'}
                {score !== null && <span style={{ fontSize: '1rem', fontWeight: 600, color: '#94a3b8' }}>/100</span>}
              </p>
              {score !== null && (
                <span style={{ fontSize: 12, fontWeight: 600, color: getScoreColor(score) }}>{getScoreLabel(score)}</span>
              )}
            </div>

            {/* Rank card */}
            <div
              style={{
                padding: '20px 20px',
                borderRadius: 14,
                background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)',
                border: '1.5px solid #c7d2fe',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Peringkat dalam Siklus</p>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#667eea', lineHeight: 1 }}>
                {ranking?.rank != null ? `#${ranking.rank}` : '—'}
              </p>
              {ranking?.rank != null && (
                <span style={{ fontSize: 12, fontWeight: 600, color: '#818cf8' }}>dari {ranking.total_driver} driver</span>
              )}
            </div>
          </div>

          {/* Score breakdown */}
          {periode && periode.scores.length > 0 ? (
            <div>
              <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Rincian Penilaian — {periode.nama_periode}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {periode.scores.map(sc => {
                  const pct = Math.min(100, Math.max(0, sc.nilai))
                  const color = getScoreColor(pct)
                  return (
                    <div key={sc.bobot_id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>{sc.nama_bobot}</span>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>bobot {sc.persentase_bobot}%</span>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color }}>{sc.nilai}/100</span>
                        </div>
                      </div>
                      <div style={{ height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={40} height={40} style={{ marginBottom: 8, opacity: 0.5 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
              </svg>
              <p style={{ margin: 0, fontSize: 14 }}>Belum ada penilaian yang disetujui dalam siklus ini.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
