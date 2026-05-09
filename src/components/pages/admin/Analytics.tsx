'use client'

import { useState, useEffect, useRef } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import { Chart, ChartConfiguration, registerables } from 'chart.js'
import { apiFetch } from '@/utils/api'

Chart.register(...registerables)

const WARNA = [
  { border: 'rgba(239,68,68,0.8)',  bg: 'rgba(239,68,68,0.1)'  },
  { border: 'rgba(59,130,246,0.8)', bg: 'rgba(59,130,246,0.1)' },
  { border: 'rgba(16,185,129,0.8)', bg: 'rgba(16,185,129,0.1)' },
  { border: 'rgba(245,158,11,0.8)', bg: 'rgba(245,158,11,0.1)' },
  { border: 'rgba(168,85,247,0.8)', bg: 'rgba(168,85,247,0.1)' },
  { border: 'rgba(236,72,153,0.8)', bg: 'rgba(236,72,153,0.1)' },
]

interface Siklus { siklus_id: number; nama_siklus: string }
interface Periode { periode_id: number; nama_periode: string }
interface BobotItem { bobot_id: number; nama_bobot: string; persentase_bobot: number }
interface RankingItem {
  rank: number
  driver_id: number
  nama_driver: string
  nama_armada: string
  kode_bus: string
  skor_total: string | number
  indicators: { bobot_id: number; weighted_score: number }[]
}
interface DriverPeriode {
  skor_total: string | number
  nama_periode: string
  indicators: { bobot_id: number; weighted_score: number }[]
}
interface DriverDetail {
  driver: { nama_driver: string; nama_armada: string }
  bobot: BobotItem[]
  periodes: DriverPeriode[]
}

type ChartType        = 'monthly-top20' | 'driver-progress'
type ProgressChartType = 'total' | 'components'

function getScoreColor(score: number) {
  if (score >= 90) return '#10b981'
  if (score >= 75) return '#3b82f6'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

const selectStyle: React.CSSProperties = {
  appearance: 'none',
  WebkitAppearance: 'none',
  padding: '9px 34px 9px 14px',
  background: '#fff url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E") no-repeat right 11px center',
  border: '1.5px solid #e2e8f0',
  borderRadius: 10,
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#1e293b',
  cursor: 'pointer',
  outline: 'none',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
}

export default function Analytics() {
  const [selectedChart, setSelectedChart]           = useState<ChartType>('monthly-top20')
  const [progressChartType, setProgressChartType]   = useState<ProgressChartType>('total')

  const [siklusList, setSiklusList]                 = useState<Siklus[]>([])
  const [selectedSiklus, setSelectedSiklus]         = useState<number | null>(null)
  const [periodeList, setPeriodeList]               = useState<Periode[]>([])
  const [selectedPeriodeId, setSelectedPeriodeId]   = useState<number | null>(null)

  const [rankingList, setRankingList]               = useState<RankingItem[]>([])
  const [selectedDriver, setSelectedDriver]         = useState<number | null>(null)
  const [driverDetail, setDriverDetail]             = useState<DriverDetail | null>(null)
  const [searchDriver, setSearchDriver]             = useState('')

  const chartRef         = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<Chart | null>(null)

  useEffect(() => {
    apiFetch('/api/siklus')
      .then((data: Siklus[]) => { setSiklusList(data); if (data.length > 0) setSelectedSiklus(data[0].siklus_id) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedSiklus) return
    setSelectedPeriodeId(null); setSelectedDriver(null); setDriverDetail(null)
    apiFetch(`/api/siklus/${selectedSiklus}`)
      .then((data: { periodes: Periode[] }) => setPeriodeList(data.periodes || []))
      .catch(() => {})
  }, [selectedSiklus])

  useEffect(() => {
    if (!selectedSiklus) return
    const url = selectedPeriodeId
      ? `/api/ranking?mode=periode&periode_id=${selectedPeriodeId}`
      : `/api/ranking?mode=siklus&siklus_id=${selectedSiklus}`
    apiFetch(url)
      .then((data: { ranking: RankingItem[] }) => setRankingList(data.ranking || []))
      .catch(() => {})
  }, [selectedSiklus, selectedPeriodeId])

  useEffect(() => {
    if (!selectedDriver || !selectedSiklus) return
    setDriverDetail(null)
    apiFetch(`/api/ranking/driver/${selectedDriver}?siklus_id=${selectedSiklus}`)
      .then((data: DriverDetail) => setDriverDetail(data))
      .catch(() => {})
  }, [selectedDriver, selectedSiklus])

  // ── Chart renderers ──────────────────────────────────────────────────────

  const renderBarChart = (drivers: RankingItem[], filterLabel: string) => {
    if (!chartRef.current) return
    if (chartInstanceRef.current) chartInstanceRef.current.destroy()

    const bgColors = drivers.map((_, i) => {
      if (i === 0) return 'rgba(255,215,0,0.85)'
      if (i === 1) return 'rgba(192,192,192,0.85)'
      if (i === 2) return 'rgba(205,127,50,0.85)'
      return 'rgba(102,126,234,0.75)'
    })
    const borderColors = drivers.map((_, i) => {
      if (i === 0) return 'rgb(255,165,0)'
      if (i === 1) return 'rgb(168,168,168)'
      if (i === 2) return 'rgb(160,82,45)'
      return 'rgb(102,126,234)'
    })

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: drivers.map(d => d.nama_driver),
        datasets: [{
          label: 'Skor Total',
          data: drivers.map(d => parseFloat(String(d.skor_total))),
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 2,
          borderRadius: 6,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: `Ranking Driver — ${filterLabel}`,
            font: { size: 18, weight: 'bold' },
            color: '#1e293b',
            padding: 20
          },
          tooltip: {
            callbacks: { label: (ctx: any) => `Skor: ${ctx.parsed.x.toFixed(1)} poin` },
            backgroundColor: 'rgba(15,23,42,0.92)',
            titleColor: '#fff', bodyColor: '#cbd5e1',
            borderColor: '#334155', borderWidth: 1,
            padding: 12, displayColors: false,
            cornerRadius: 8,
          }
        },
        scales: {
          x: {
            beginAtZero: true, max: 100,
            ticks: { font: { size: 12 }, color: '#64748b' },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          y: {
            ticks: { font: { size: 13, weight: 500 as const }, color: '#334155' },
            grid: { display: false }
          }
        },
        layout: { padding: { right: 80 } }
      },
      plugins: [{
        id: 'scoreLabels',
        afterDatasetsDraw(chart: any) {
          const { ctx, chartArea: { right } } = chart
          chart.data.datasets[0].data.forEach((value: number, index: number) => {
            const y = chart.getDatasetMeta(0).data[index].y
            ctx.save()
            ctx.fillStyle = '#1e293b'
            ctx.font = 'bold 13px Poppins, sans-serif'
            ctx.textAlign = 'left'
            ctx.fillText(`${value.toFixed(1)} poin`, right + 10, y + 5)
            ctx.restore()
          })
        }
      }]
    }

    chartInstanceRef.current = new Chart(chartRef.current, config)
  }

  const renderDriverTotalChart = (detail: DriverDetail) => {
    if (!chartRef.current) return
    if (chartInstanceRef.current) chartInstanceRef.current.destroy()

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: detail.periodes.map(p => p.nama_periode),
        datasets: [{
          label: 'Skor Total',
          data: detail.periodes.map(p => parseFloat(String(p.skor_total))),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102,126,234,0.1)',
          borderWidth: 3, tension: 0.4, fill: true,
          pointRadius: 6, pointHoverRadius: 8,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#fff', pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: `Progress Total — ${detail.driver.nama_driver}`,
            color: '#1e293b', font: { size: 18, weight: 'bold' }, padding: 20
          },
          tooltip: {
            backgroundColor: 'rgba(15,23,42,0.92)', titleColor: '#fff', bodyColor: '#cbd5e1',
            padding: 12, cornerRadius: 8, displayColors: false,
          }
        },
        scales: {
          y: { beginAtZero: true, max: 100, ticks: { color: '#64748b', font: { size: 12 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { ticks: { color: '#64748b', font: { size: 12 } }, grid: { color: 'rgba(0,0,0,0.05)' } }
        }
      }
    } as ChartConfiguration)
  }

  const renderDriverComponentsChart = (detail: DriverDetail) => {
    if (!chartRef.current) return
    if (chartInstanceRef.current) chartInstanceRef.current.destroy()

    const datasets = detail.bobot.map((bobot, idx) => ({
      label: `${bobot.nama_bobot} (${bobot.persentase_bobot}%)`,
      data: detail.periodes.map(p => {
        const ind = p.indicators.find(i => i.bobot_id === bobot.bobot_id)
        return ind ? parseFloat(String(ind.weighted_score)) : 0
      }),
      borderColor: WARNA[idx % WARNA.length].border,
      backgroundColor: WARNA[idx % WARNA.length].bg,
      borderWidth: 2, tension: 0.4, pointRadius: 4, pointHoverRadius: 6
    }))

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: 'line',
      data: { labels: detail.periodes.map(p => p.nama_periode), datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top', labels: { color: '#334155', font: { size: 12 }, padding: 15, usePointStyle: true } },
          title: {
            display: true,
            text: `Progress Komponen — ${detail.driver.nama_driver}`,
            color: '#1e293b', font: { size: 18, weight: 'bold' }, padding: 20
          },
          tooltip: {
            backgroundColor: 'rgba(15,23,42,0.92)', titleColor: '#fff', bodyColor: '#cbd5e1',
            padding: 12, cornerRadius: 8,
          }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 5, color: '#64748b', font: { size: 12 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { ticks: { color: '#64748b', font: { size: 12 } }, grid: { color: 'rgba(0,0,0,0.05)' } }
        }
      }
    } as ChartConfiguration)
  }

  useEffect(() => {
    if (selectedChart === 'monthly-top20' && rankingList.length > 0) {
      const label = selectedPeriodeId
        ? periodeList.find(p => p.periode_id === selectedPeriodeId)?.nama_periode ?? ''
        : 'Rata-rata Siklus'
      renderBarChart(rankingList, label)
    }
    if (selectedChart === 'driver-progress' && selectedDriver && driverDetail) {
      if (progressChartType === 'total') renderDriverTotalChart(driverDetail)
      else renderDriverComponentsChart(driverDetail)
    }
    return () => { if (chartInstanceRef.current) chartInstanceRef.current.destroy() }
  }, [selectedChart, rankingList, selectedDriver, driverDetail, progressChartType, selectedPeriodeId, periodeList])

  const filteredDrivers = rankingList.filter(d =>
    d.nama_driver.toLowerCase().includes(searchDriver.toLowerCase())
  )

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">

        {/* ── Page Header ─────────────────────────────────────── */}
        <PageHeader
          title="Grafik & Analitik"
          subtitle="Visualisasi data performa driver"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#fff" style={{ width: 28, height: 28 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
        />

        {/* ── Controls Bar ────────────────────────────────────── */}
        <div className="analytics-controls">
          {/* Tab switcher */}
          <div className="analytics-tabs" style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 3, gap: 2 }}>
            {([
              { key: 'monthly-top20', label: 'Ranking Driver', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z' },
              { key: 'driver-progress', label: 'Progress Driver', icon: 'M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941' },
            ] as const).map(tab => {
              const active = selectedChart === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => { setSelectedChart(tab.key); if (tab.key !== 'driver-progress') { setSelectedDriver(null); setSearchDriver('') } }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: active ? '#fff' : 'transparent',
                    color: active ? '#667eea' : '#64748b',
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    boxShadow: active ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={15} height={15}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Right controls */}
          <div className="analytics-filters" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Siklus selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>Siklus:</span>
              <select value={selectedSiklus ?? ''} onChange={e => setSelectedSiklus(Number(e.target.value))} style={{ ...selectStyle, minWidth: 150 }}>
                {siklusList.length === 0 && <option value="">Memuat...</option>}
                {siklusList.map(s => <option key={s.siklus_id} value={s.siklus_id}>{s.nama_siklus}</option>)}
              </select>
            </div>

            {/* Periode filter — only for ranking view */}
            {selectedChart === 'monthly-top20' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>Periode:</span>
                <select
                  value={selectedPeriodeId ?? 'siklus'}
                  onChange={e => setSelectedPeriodeId(e.target.value === 'siklus' ? null : Number(e.target.value))}
                  style={{ ...selectStyle, minWidth: 150 }}
                >
                  <option value="siklus">Rata-rata Siklus</option>
                  {periodeList.map(p => <option key={p.periode_id} value={p.periode_id}>{p.nama_periode}</option>)}
                </select>
              </div>
            )}

            {/* Progress chart type — only for progress + detail view */}
            {selectedChart === 'driver-progress' && selectedDriver && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>Grafik:</span>
                <select value={progressChartType} onChange={e => setProgressChartType(e.target.value as ProgressChartType)} style={{ ...selectStyle, minWidth: 160 }}>
                  <option value="total">Grafik Total</option>
                  <option value="components">Grafik Komponen</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ── Main Card ───────────────────────────────────────── */}
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}
        >

          {/* ── Ranking Driver ── */}
          {selectedChart === 'monthly-top20' && (
            rankingList.length === 0 ? (
              <div style={{ padding: '56px 32px', textAlign: 'center', color: '#94a3b8' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={44} height={44} style={{ marginBottom: 12, opacity: 0.4 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
                <p style={{ margin: 0, fontSize: 14 }}>Belum ada data penilaian approved untuk periode ini.</p>
              </div>
            ) : (
              <div style={{ padding: 28 }}>
                <div style={{ height: Math.max(300, rankingList.length * 52 + 80), position: 'relative' }}>
                  <canvas ref={chartRef} id="analyticsChart" />
                </div>
              </div>
            )
          )}

          {/* ── Progress Driver ── */}
          {selectedChart === 'driver-progress' && (
            !selectedDriver ? (
              <div style={{ padding: 28 }}>
                {/* Search */}
                <div style={{ position: 'relative', maxWidth: 380, marginBottom: 20 }}>
                  <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Cari nama driver..."
                    value={searchDriver}
                    onChange={e => setSearchDriver(e.target.value)}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '10px 16px 10px 40px',
                      border: '1.5px solid #e2e8f0', borderRadius: 10,
                      fontSize: '0.875rem', color: '#1e293b', background: '#f8fafc',
                      outline: 'none',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.background = '#fff' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc' }}
                  />
                </div>

                {filteredDrivers.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
                    Tidak ada driver dengan data penilaian approved.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                    {filteredDrivers.map(driver => {
                      const score = parseFloat(String(driver.skor_total))
                      const color = getScoreColor(score)
                      return (
                        <div
                          key={driver.driver_id}
                          onClick={() => setSelectedDriver(driver.driver_id)}
                          style={{
                            padding: '18px 20px',
                            borderRadius: 14,
                            border: '1.5px solid #f1f5f9',
                            background: '#fafafa',
                            cursor: 'pointer',
                            transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                          }}
                          onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 4px 16px rgba(102,126,234,0.15)'; el.style.borderColor = '#c7d2fe'; el.style.transform = 'translateY(-2px)' }}
                          onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = 'none'; el.style.borderColor = '#f1f5f9'; el.style.transform = 'none' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                            <div>
                              <p style={{ margin: 0, fontWeight: 700, color: '#111827', fontSize: '0.92rem' }}>{driver.nama_driver}</p>
                              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>{driver.nama_armada} · {driver.kode_bus}</p>
                            </div>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 18l6-6-6-6"/>
                              </svg>
                            </div>
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Rata-rata siklus</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color }}>{score.toFixed(1)}</span>
                            </div>
                            <div style={{ height: 5, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(score, 100)}%`, height: '100%', background: color, borderRadius: 999 }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: 28 }}>
                {/* Back button */}
                <button
                  onClick={() => { setSelectedDriver(null); setDriverDetail(null) }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '8px 16px',
                    border: '1.5px solid #e2e8f0', borderRadius: 10,
                    background: '#f8fafc', color: '#475569',
                    fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                    marginBottom: 20, transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#f8fafc')}
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                  Kembali ke Daftar Driver
                </button>

                {driverDetail ? (
                  <div style={{ height: 420, position: 'relative' }}>
                    <canvas ref={chartRef} id="analyticsChart" />
                  </div>
                ) : (
                  <div style={{ padding: '48px 0', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Memuat data driver...</div>
                )}
              </div>
            )
          )}

        </div>
      </div>
    </div>
  )
}
