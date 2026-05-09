'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import { Chart, ChartConfiguration, registerables } from 'chart.js'
import { apiFetch } from '@/utils/api'

Chart.register(...registerables)

interface ScoreItem {
  bobot_id: number
  nama_bobot: string
  persentase_bobot: number
  nilai: number
  weighted_score: number
}

interface Periode {
  periode_id: number
  nama_periode: string
  bulan: string
  tahun: number
  skor_total: number
  scores: ScoreItem[]
}

interface BobotItem {
  bobot_id: number
  nama_bobot: string
  persentase_bobot: number
}

interface Siklus {
  siklus_id: number
  nama_siklus: string
}

type ChartType = 'total' | 'components'

const WARNA_CHART = [
  'rgba(239, 68, 68, 0.8)',
  'rgba(59, 130, 246, 0.8)',
  'rgba(16, 185, 129, 0.8)',
  'rgba(245, 158, 11, 0.8)',
  'rgba(168, 85, 247, 0.8)',
  'rgba(236, 72, 153, 0.8)',
  'rgba(6, 182, 212, 0.8)',
  'rgba(132, 204, 22, 0.8)',
]

export default function DriverVisualisasi() {
  const [siklusList, setSiklusList]           = useState<Siklus[]>([])
  const [selectedSiklusId, setSelectedSiklusId] = useState<number | null>(null)
  const [bobotList, setBobotList]             = useState<BobotItem[]>([])
  const [periodes, setPeriodes]               = useState<Periode[]>([])
  const [chartType, setChartType]             = useState<ChartType>('total')
  const [isLoading, setIsLoading]             = useState(true)
  const [error, setError]                     = useState<string | null>(null)

  const chartRef          = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef  = useRef<Chart | null>(null)

  // Fetch siklus
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

  // Fetch penilaian saat siklus berubah
  const fetchPenilaian = useCallback(async () => {
    if (!selectedSiklusId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiFetch(`/api/driver/me/penilaian?siklus_id=${selectedSiklusId}`)
      setBobotList(data?.bobot || [])
      setPeriodes(data?.periodes || [])
    } catch {
      setError('Gagal memuat data penilaian')
    } finally {
      setIsLoading(false)
    }
  }, [selectedSiklusId])

  useEffect(() => { fetchPenilaian() }, [fetchPenilaian])

  // Render chart
  useEffect(() => {
    if (isLoading || !chartRef.current || periodes.length === 0) return

    if (chartInstanceRef.current) chartInstanceRef.current.destroy()

    const labels = periodes.map(p => `${p.bulan} ${p.tahun}`)

    let config: ChartConfiguration

    if (chartType === 'total') {
      config = {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Skor Total',
            data: periodes.map(p => parseFloat(String(p.skor_total))),
            borderColor: 'rgba(102, 126, 234, 1)',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: 'rgba(102, 126, 234, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: 'top' },
            title: {
              display: true,
              text: 'Progress Skor Total',
              font: { size: 18, weight: 'bold' },
              padding: 20,
            },
            tooltip: {
              callbacks: {
                label: (ctx: any) => `Skor: ${ctx.parsed.y.toFixed(1)} / 100`,
              },
            },
          },
          scales: {
            y: { beginAtZero: true, max: 100 },
          },
        },
      }
    } else {
      // Chart per komponen — satu dataset per bobot
      const datasets = bobotList.map((bobot, idx) => ({
        label: `${bobot.nama_bobot} (${bobot.persentase_bobot}%)`,
        data: periodes.map(p => {
          const s = p.scores.find(sc => sc.bobot_id === bobot.bobot_id)
          return s ? parseFloat(String(s.weighted_score)) : 0
        }),
        borderColor: WARNA_CHART[idx % WARNA_CHART.length],
        backgroundColor: WARNA_CHART[idx % WARNA_CHART.length].replace('0.8', '0.1'),
        borderWidth: 2.5,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: false,
      }))

      config = {
        type: 'line',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: 'top' },
            title: {
              display: true,
              text: 'Progress per Komponen Penilaian',
              font: { size: 18, weight: 'bold' },
              padding: 20,
            },
            tooltip: {
              callbacks: {
                label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} poin`,
              },
            },
          },
          scales: {
            y: { beginAtZero: true },
          },
        },
      }
    }

    chartInstanceRef.current = new Chart(chartRef.current, config)

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
        chartInstanceRef.current = null
      }
    }
  }, [periodes, bobotList, chartType, isLoading])

  // Generate auto notes dari perbandingan 2 periode terakhir
  const generateNotes = () => {
    if (periodes.length < 2) return []

    const last = periodes[periodes.length - 1]
    const prev = periodes[periodes.length - 2]
    const notes = []

    // Skor total
    const totalChange = parseFloat(String(last.skor_total)) - parseFloat(String(prev.skor_total))
    const totalRounded = Math.round(totalChange * 10) / 10
    notes.push({
      category: 'Skor Total',
      change: totalRounded,
      message: totalRounded > 0
        ? `Skor total meningkat ${totalRounded} poin (${parseFloat(String(prev.skor_total)).toFixed(1)} → ${parseFloat(String(last.skor_total)).toFixed(1)}). Pertahankan!`
        : totalRounded < 0
        ? `Skor total menurun ${Math.abs(totalRounded)} poin (${parseFloat(String(prev.skor_total)).toFixed(1)} → ${parseFloat(String(last.skor_total)).toFixed(1)}). Tingkatkan lagi!`
        : `Skor total stabil di ${parseFloat(String(last.skor_total)).toFixed(1)}. Konsisten!`,
      type: totalRounded > 0 ? 'positive' : totalRounded < 0 ? 'negative' : 'neutral',
    })

    // Per komponen
    bobotList.forEach((bobot, idx) => {
      const lastScore = last.scores.find(s => s.bobot_id === bobot.bobot_id)
      const prevScore = prev.scores.find(s => s.bobot_id === bobot.bobot_id)
      if (!lastScore || !prevScore) return

      const change = Math.round((lastScore.weighted_score - prevScore.weighted_score) * 10) / 10
      notes.push({
        category: bobot.nama_bobot,
        change,
        message: change > 0
          ? `${bobot.nama_bobot} meningkat ${change} poin. Terus pertahankan!`
          : change < 0
          ? `${bobot.nama_bobot} menurun ${Math.abs(change)} poin. Fokuskan perbaikan di area ini.`
          : `${bobot.nama_bobot} konsisten. Pertahankan!`,
        type: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
        color: WARNA_CHART[idx % WARNA_CHART.length],
      })
    })

    return notes
  }

  const notes = generateNotes()

  return (
    <div className="driver-visualisasi">
      <PageHeader
        title="Visualisasi Progress"
        subtitle="Perkembangan performa Anda dari waktu ke waktu"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#fff" style={{ width: 28, height: 28 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
          </svg>
        }
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select
              value={selectedSiklusId ?? ''}
              onChange={e => setSelectedSiklusId(Number(e.target.value))}
              style={{
                padding: '7px 12px', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 500,
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer',
              }}
            >
              {siklusList.map(s => (
                <option key={s.siklus_id} value={s.siklus_id} style={{ color: '#0f172a' }}>{s.nama_siklus}</option>
              ))}
            </select>
            <select
              value={chartType}
              onChange={e => setChartType(e.target.value as ChartType)}
              style={{
                padding: '7px 12px', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 500,
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer',
              }}
            >
              <option value="total" style={{ color: '#0f172a' }}>Grafik Total</option>
              <option value="components" style={{ color: '#0f172a' }}>Grafik per Komponen</option>
            </select>
          </div>
        }
      />

      {error && <div className="alert-error">{error}</div>}

      {isLoading ? (
        <div className="loading-message">Memuat data...</div>
      ) : periodes.length === 0 ? (
        <div className="empty-state">
          <p>Belum ada penilaian yang disetujui dalam siklus ini.</p>
        </div>
      ) : (
        <>
          <div className="analytics-container">
            <div className="chart-card">
              <canvas ref={chartRef}></canvas>
            </div>
          </div>

          {/* Auto Notes */}
          <div className="auto-notes-section">
            <h2 className="notes-title">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Catatan dan Saran
            </h2>
            <p className="notes-subtitle">
              Analisis performa berdasarkan 2 periode terakhir: {periodes[periodes.length - 2]?.bulan} → {periodes[periodes.length - 1]?.bulan} {periodes[periodes.length - 1]?.tahun}
            </p>
            {notes.length === 0 ? (
              <div className="no-notes">
                <p>Minimal 2 periode diperlukan untuk menghasilkan catatan otomatis.</p>
              </div>
            ) : (
              <div className="notes-grid">
                {notes.map((note, i) => (
                  <div key={i} className={`note-card ${note.type}`}>
                    <div className="note-header">
                      <span className="note-category" style={{ color: (note as any).color || '#1a202c' }}>
                        {note.category}
                      </span>
                      <span className={`note-badge ${note.type}`}>
                        {note.change > 0 ? `+${note.change}` : note.change < 0 ? `${note.change}` : 'Stabil'}
                      </span>
                    </div>
                    <p className="note-message">{note.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
