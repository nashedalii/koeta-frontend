'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/utils/api'

interface DriverBelumDinilai {
  driver_id: number
  nama_driver: string
  nama_kernet: string | null
  kode_bus: string | null
  nopol: string | null
}

interface PenilaianBulanIni {
  total: number
  pending: number
  approved: number
  rejected: number
}

interface PeriodeAktif {
  periode_id: number
  nama_periode: string
  bulan: string
  tahun: number
  tanggal_mulai: string
  tanggal_selesai: string
}

interface DashboardData {
  nama_petugas: string
  nama_armada: string
  total_driver_aktif: number
  periode_aktif: PeriodeAktif | null
  penilaian_bulan_ini: PenilaianBulanIni
  rata_skor_armada: number | null
  driver_belum_dinilai: DriverBelumDinilai[]
  siklus_mendatang: {
    siklus_id: number
    nama_siklus: string
    tanggal_mulai: string
    is_activated: boolean
  } | null
}

function getScoreColor(score: number) {
  if (score >= 90) return '#10b981'
  if (score >= 75) return '#3b82f6'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

export default function PetugasDashboard() {
  const [data, setData]           = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [countdown, setCountdown] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const result = await apiFetch('/api/dashboard/petugas')
        setData(result)
      } catch {
        setError('Gagal memuat data dashboard')
      } finally {
        setIsLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  // Timer countdown untuk siklus mendatang
  useEffect(() => {
    if (!data?.siklus_mendatang) { setCountdown(null); return }

    const target = new Date(`${data.siklus_mendatang.tanggal_mulai}T00:00:00`)

    const tick = () => {
      const diff = target.getTime() - Date.now()
      if (diff <= 0) {
        // Tanggal sudah lewat tapi siklus belum aktif (tertunda)
        setCountdown('00:00:00:00')
        return
      }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown(`${String(d).padStart(2,'0')}:${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [data?.siklus_mendatang])

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>
          Memuat dashboard...
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="dashboard-container">
        <div className="alert-error">{error || 'Data tidak tersedia'}</div>
      </div>
    )
  }

  const { penilaian_bulan_ini: p } = data
  const driverDinilai = data.total_driver_aktif - data.driver_belum_dinilai.length
  const submitPct = data.total_driver_aktif > 0
    ? Math.round((driverDinilai / data.total_driver_aktif) * 100)
    : 0
  const skor = data.rata_skor_armada != null ? parseFloat(String(data.rata_skor_armada)) : null
  const skorColor = skor != null ? getScoreColor(skor) : '#94a3b8'

  const CARD_ACCENTS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b']

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">

        {/* ── Welcome Banner (same style as Driver) ────────────── */}
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
          {/* Background circle decorations */}
          <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: 60, bottom: -60, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
              Dashboard Informasi &amp; Performa
            </p>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
              Selamat Datang, {data.nama_petugas}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 999, padding: '4px 12px',
                fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)',
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={12} height={12}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5h-6m3 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497" />
                </svg>
                Armada {data.nama_armada || '—'}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: data.periode_aktif ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                border: `1px solid ${data.periode_aktif ? 'rgba(52,211,153,0.5)' : 'rgba(252,165,165,0.5)'}`,
                borderRadius: 999, padding: '4px 12px',
                fontSize: 12, fontWeight: 600, color: data.periode_aktif ? '#6ee7b7' : '#fca5a5',
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={14} height={14}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                {data.periode_aktif ? `Periode: ${data.periode_aktif.nama_periode}` : 'Tidak ada periode aktif'}
              </span>
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1, opacity: 0.2, flexShrink: 0 }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="#fff" width={50} height={50}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
        </div>

        {/* ── Timer Siklus Mendatang ─────────────────────────── */}
        {!data.periode_aktif && data.siklus_mendatang && countdown !== null && (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: '24px 28px',
            marginBottom: 24,
            boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
            border: '1px solid #e2e8f0',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Top accent */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 4,
              background: countdown === '00:00:00:00'
                ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                : 'linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>{countdown === '00:00:00:00' ? '⏸️' : '⏱️'}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: countdown === '00:00:00:00' ? '#92400e' : '#1e3a8a', letterSpacing: '0.03em' }}>
                  {countdown === '00:00:00:00' ? 'Siklus Tertunda' : 'Periode Penilaian Dimulai Dalam'}
                </span>
              </div>
              <span style={{ fontSize: 12, color: '#64748b', background: '#f1f5f9', padding: '3px 10px', borderRadius: 999, fontWeight: 500 }}>
                {data.siklus_mendatang.nama_siklus}
              </span>
            </div>

            {/* Timer digits */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: countdown === '00:00:00:00' ? 16 : 0 }}>
              {countdown.split(':').map((val, i) => {
                const labels = ['Hari', 'Jam', 'Menit', 'Detik']
                const colors = countdown === '00:00:00:00'
                  ? ['#d97706', '#d97706', '#d97706', '#d97706']
                  : ['#3b82f6', '#6366f1', '#8b5cf6', '#10b981']
                const bgs = countdown === '00:00:00:00'
                  ? ['#fef3c7', '#fef3c7', '#fef3c7', '#fef3c7']
                  : ['#eff6ff', '#eef2ff', '#f5f3ff', '#f0fdf4']
                const borders = countdown === '00:00:00:00'
                  ? ['#fcd34d', '#fcd34d', '#fcd34d', '#fcd34d']
                  : ['#bfdbfe', '#c7d2fe', '#ddd6fe', '#bbf7d0']
                return (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    background: bgs[i], borderRadius: 12, padding: '12px 16px', minWidth: 64, flex: '1 1 0',
                    border: `1.5px solid ${borders[i]}`,
                  }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: 800, color: colors[i], fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                      {val}
                    </span>
                    <span style={{ fontSize: 10, color: colors[i], marginTop: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.8 }}>
                      {labels[i]}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Pesan tertunda */}
            {countdown === '00:00:00:00' && (
              <p style={{ margin: 0, textAlign: 'center', fontSize: 13, color: '#92400e', fontWeight: 500 }}>
                Siklus sedang tertunda, harap bersabar menunggu konfigurasi admin.
              </p>
            )}
          </div>
        )}

        {/* ── Stat Cards ───────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>

          {/* Total Driver */}
          <div style={{ background: '#fff', borderRadius: 18, borderTop: `4px solid ${CARD_ACCENTS[0]}`, padding: '20px 22px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: CARD_ACCENTS[0], opacity: 0.05 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Driver</p>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#ede9fe,#ddd6fe)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" width={18} height={18}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            </div>
            <p style={{ margin: '0 0 4px', fontSize: 42, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{data.total_driver_aktif}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>Driver aktif · Armada {data.nama_armada}</p>
          </div>

          {/* Input Bulan Ini */}
          <div style={{ background: '#fff', borderRadius: 18, borderTop: `4px solid ${CARD_ACCENTS[1]}`, padding: '20px 22px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: CARD_ACCENTS[1], opacity: 0.05 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Input Bulan Ini</p>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#dbeafe,#bfdbfe)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" width={18} height={18}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
            </div>
            {/* Three status values stacked in a row — bounded inside card */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              {[
                { label: 'Approved', val: p.approved, color: '#10b981', bg: '#f0fdf4' },
                { label: 'Pending',  val: p.pending,  color: '#f59e0b', bg: '#fffbeb' },
                { label: 'Rejected', val: p.rejected,  color: '#ef4444', bg: '#fef2f2' },
              ].map(item => (
                <div key={item.label} style={{ flex: 1, textAlign: 'center', background: item.bg, borderRadius: 10, padding: '8px 4px' }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.val}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 10, fontWeight: 600, color: item.color, opacity: 0.8 }}>{item.label}</p>
                </div>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Total {p.total} penilaian masuk</p>
          </div>

          {/* Rata-rata Skor Armada */}
          <div style={{ background: '#fff', borderRadius: 18, borderTop: `4px solid ${CARD_ACCENTS[2]}`, padding: '20px 22px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: CARD_ACCENTS[2], opacity: 0.05 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rata-rata Skor</p>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" width={18} height={18}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
            </div>
            <p style={{ margin: '0 0 4px', fontSize: 42, fontWeight: 800, color: skor != null ? skorColor : '#94a3b8', lineHeight: 1 }}>
              {skor != null ? skor.toFixed(1) : '—'}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
              {data.periode_aktif ? `Periode ${data.periode_aktif.nama_periode}` : 'Belum ada data'}
            </p>
          </div>

          {/* Progress Input */}
          <div style={{ background: '#fff', borderRadius: 18, borderTop: `4px solid ${CARD_ACCENTS[3]}`, padding: '20px 22px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: CARD_ACCENTS[3], opacity: 0.05 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress Input</p>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#fef3c7,#fde68a)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" width={18} height={18}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: 42, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{submitPct}%</p>
            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ width: `${submitPct}%`, height: '100%', background: submitPct === 100 ? '#10b981' : CARD_ACCENTS[3], borderRadius: 999, transition: 'width 0.6s ease' }} />
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{driverDinilai} dari {data.total_driver_aktif} driver dinilai</p>
          </div>

        </div>

        {/* ── Driver Belum Dinilai ─────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: data.driver_belum_dinilai.length === 0 ? 'linear-gradient(135deg,#d1fae5,#a7f3d0)' : 'linear-gradient(135deg,#fef3c7,#fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke={data.driver_belum_dinilai.length === 0 ? '#059669' : '#d97706'} width={18} height={18}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Driver Belum Dinilai Bulan Ini</h2>
                <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>
                  {data.driver_belum_dinilai.length === 0 ? 'Semua driver sudah dinilai' : `${data.driver_belum_dinilai.length} driver belum dinilai`}
                </p>
              </div>
            </div>
            {data.driver_belum_dinilai.length > 0 && (
              <span style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                {data.driver_belum_dinilai.length} belum dinilai
              </span>
            )}
          </div>

          <div style={{ height: 1, background: '#f1f5f9', marginBottom: 16 }} />

          {data.driver_belum_dinilai.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#15803d' }}>
                Semua driver di armada {data.nama_armada} sudah dinilai bulan ini.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.driver_belum_dinilai.map(driver => (
                <div
                  key={driver.driver_id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderLeft: '4px solid #f59e0b',
                    borderRadius: 12,
                  }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#fde68a,#fcd34d)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="#d97706" width={18} height={18}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, color: '#111827', fontSize: '0.92rem' }}>{driver.nama_driver}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#92400e' }}>
                      {driver.kode_bus || '—'} · {driver.nopol || '—'}
                      {driver.nama_kernet ? ` · Kernet: ${driver.nama_kernet}` : ''}
                    </p>
                  </div>
                  <span style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    Belum Dinilai
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
