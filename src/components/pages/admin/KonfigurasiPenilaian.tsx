'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import PageHeader from '@/components/ui/PageHeader'

interface Siklus {
  siklus_id: number
  nama_siklus: string
  tanggal_mulai: string
  tanggal_selesai: string
  status_display: string
  jumlah_periode: number
}

interface BobotFromAPI {
  bobot_id: number
  nama_bobot: string
  persentase_bobot: number | string
  deskripsi: string | null
}

interface Indikator {
  id: number
  nama: string
  bobot: number
  deskripsi: string
}

const DEFAULT_INDIKATORS: Indikator[] = [
  { id: 1, nama: 'Etika & Adab', bobot: 0, deskripsi: '' },
  { id: 2, nama: 'Disiplin', bobot: 0, deskripsi: '' },
  { id: 3, nama: 'Loyalitas', bobot: 0, deskripsi: '' },
  { id: 4, nama: 'Skill Mengemudi', bobot: 0, deskripsi: '' },
  { id: 5, nama: 'Perawatan Kendaraan', bobot: 0, deskripsi: '' },
  { id: 6, nama: 'Performa', bobot: 0, deskripsi: '' },
]

export default function KonfigurasiPenilaian() {
  const [siklusList, setSiklusList] = useState<Siklus[]>([])
  const [selectedSiklusId, setSelectedSiklusId] = useState<number | null>(null)
  const [selectedSiklus, setSelectedSiklus] = useState<Siklus | null>(null)
  const [indikators, setIndikators] = useState<Indikator[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoadingSiklus, setIsLoadingSiklus] = useState(true)
  const [isLoadingBobot, setIsLoadingBobot] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [hasBobot, setHasBobot] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [countdown, setCountdown] = useState<{ bulan: number; hari: number; jam: number; menit: number; detik: number } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (type: 'success' | 'error', text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ type, text })
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }

  // Countdown real-time ke tanggal_mulai siklus yang belum dimulai
  useEffect(() => {
    if (!selectedSiklus || selectedSiklus.status_display !== 'belum_dimulai') {
      setCountdown(null)
      return
    }
    const target = new Date(`${selectedSiklus.tanggal_mulai}T00:00:00`)

    const tick = () => {
      const now = new Date()
      const diff = target.getTime() - now.getTime()
      if (diff <= 0) { setCountdown(null); return }

      const totalDetik = Math.floor(diff / 1000)
      const detik  = totalDetik % 60
      const totalMenit = Math.floor(totalDetik / 60)
      const menit  = totalMenit % 60
      const totalJam = Math.floor(totalMenit / 60)
      const jam    = totalJam % 24
      const totalHari = Math.floor(totalJam / 24)
      const bulan  = Math.floor(totalHari / 30)
      const hari   = totalHari % 30

      setCountdown({ bulan, hari, jam, menit, detik })
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [selectedSiklus])

  const apiBase = process.env.NEXT_PUBLIC_API_URL || ''

  const getToken = () => {
    try {
      return JSON.parse(localStorage.getItem('auth') || '{}').token || ''
    } catch { return '' }
  }

  // Fetch daftar siklus
  useEffect(() => {
    const fetchSiklus = async () => {
      setIsLoadingSiklus(true)
      try {
        const res = await fetch(`${apiBase}/api/siklus`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        })
        const data = await res.json()
        const list: Siklus[] = data.siklus || data || []
        setSiklusList(list)
        // Auto-pilih siklus yang sedang berjalan
        const active = list.find(s => s.status_display === 'Berjalan')
        if (active) setSelectedSiklusId(active.siklus_id)
        else if (list.length > 0) setSelectedSiklusId(list[0].siklus_id)
      } catch {
        setError('Gagal memuat daftar siklus')
      } finally {
        setIsLoadingSiklus(false)
      }
    }
    fetchSiklus()
  }, [])

  // Fetch bobot saat siklus dipilih
  const fetchBobot = useCallback(async (siklusId: number) => {
    setIsLoadingBobot(true)
    setError(null)
    setIsEditMode(false)
    setIsLocked(false)
    try {
      const res = await fetch(`${apiBase}/api/bobot?siklus_id=${siklusId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      const bobots: BobotFromAPI[] = data.bobots || []
      if (bobots.length === 0) {
        setHasBobot(false)
        setIndikators([])
      } else {
        setHasBobot(true)
        setIndikators(bobots.map((b, i) => ({
          id: b.bobot_id || i + 1,
          nama: b.nama_bobot,
          bobot: parseFloat(String(b.persentase_bobot)),
          deskripsi: b.deskripsi || ''
        })))
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat bobot')
      setIndikators([])
    } finally {
      setIsLoadingBobot(false)
    }
  }, [apiBase])

  useEffect(() => {
    if (!selectedSiklusId) return
    const found = siklusList.find(s => s.siklus_id === selectedSiklusId) || null
    setSelectedSiklus(found)
    fetchBobot(selectedSiklusId)
  }, [selectedSiklusId, siklusList, fetchBobot])

  // Reminder banner: siklus aktif + bobot belum selesai + masih dalam 30 hari pertama siklus
  const isSiklusStarted = !!selectedSiklus && selectedSiklus.status_display !== 'belum_dimulai'

  const reminderDeadline = (() => {
    if (!selectedSiklus || selectedSiklus.status_display !== 'Berjalan') return null
    const totalBobot = indikators.reduce((sum, ind) => sum + ind.bobot, 0)
    if (totalBobot === 100) return null
    const [y, m, d] = selectedSiklus.tanggal_mulai.split('-').map(Number)
    const deadline = new Date(y, m - 1, d + 30)
    if (new Date() > deadline) return null
    return deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  })()

  const totalBobot = indikators.reduce((sum, ind) => sum + ind.bobot, 0)
  const hasLowBobot = indikators.some(ind => ind.bobot > 0 && ind.bobot < 5)
  const hasEmptyNames = indikators.some(ind => !ind.nama.trim())

  const getStatusMessage = () => {
    if (indikators.length < 3) return '⚠️ Indikator minimal 3'
    if (hasEmptyNames) return '⚠️ Ada nama indikator yang kosong'
    if (hasLowBobot) return '⚠️ Ada bobot kurang dari 5%'
    if (totalBobot === 100) return '✅ Siap disimpan'
    if (totalBobot > 100) return '❌ Melebihi 100%'
    return '⚠️ Belum mencapai 100%'
  }

  const getStatusClass = () => {
    if (indikators.length < 3 || hasEmptyNames || hasLowBobot || totalBobot !== 100) return 'invalid'
    return 'valid'
  }

  const getProgressColor = () => {
    if (totalBobot === 100) return '#10b981'
    if (totalBobot >= 80) return '#10b981'
    if (totalBobot >= 40) return '#f59e0b'
    return '#ef4444'
  }

  const handleBobotChange = (id: number, newBobot: string) => {
    const sanitized = newBobot.replace(/\D/g, '')
    let value = sanitized === '' ? 0 : parseInt(sanitized, 10)
    value = Math.max(0, Math.min(100, value))
    setIndikators(prev => prev.map(ind => ind.id === id ? { ...ind, bobot: value } : ind))
  }

  const handleNameChange = (id: number, newName: string) => {
    setIndikators(prev => prev.map(ind => ind.id === id ? { ...ind, nama: newName } : ind))
  }

  const handleAddIndicator = () => {
    const newId = indikators.length > 0 ? Math.max(...indikators.map(i => i.id)) + 1 : 1
    setIndikators(prev => [...prev, { id: newId, nama: '', bobot: 0, deskripsi: '' }])
  }

  const handleDeleteIndicator = (id: number) => {
    if (indikators.length > 3) {
      setIndikators(prev => prev.filter(ind => ind.id !== id))
    } else {
      showToast('error', '⚠️ Jumlah indikator minimal 3')
    }
  }

  const handleStartEdit = () => {
    if (indikators.length === 0) {
      setIndikators(DEFAULT_INDIKATORS.map(d => ({ ...d })))
    }
    setIsEditMode(true)
  }

  const handleCancel = () => {
    setIsEditMode(false)
    if (selectedSiklusId) fetchBobot(selectedSiklusId)
  }

  const handleSave = async () => {
    if (!selectedSiklusId) return
    if (indikators.length < 3) {
      showToast('error', '⚠️ Jumlah indikator minimal 3')
      return
    }
    if (hasEmptyNames) {
      showToast('error', '⚠️ Semua indikator harus memiliki nama!')
      return
    }
    if (hasLowBobot) {
      showToast('error', '⚠️ Setiap indikator harus memiliki bobot minimal 5%!')
      return
    }
    if (totalBobot !== 100) {
      showToast('error', '⚠️ Total bobot harus 100% untuk menyimpan konfigurasi!')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`${apiBase}/api/bobot/bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          siklus_id: selectedSiklusId,
          data: indikators.map(ind => ({
            nama_bobot: ind.nama,
            persentase_bobot: ind.bobot,
            deskripsi: ind.deskripsi || null
          }))
        })
      })
      const result = await res.json()

      if (res.status === 409) {
        setIsLocked(true)
        setIsEditMode(false)
        return
      }
      if (!res.ok) throw new Error(result.message)

      setIsEditMode(false)
      fetchBobot(selectedSiklusId)
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyimpan konfigurasi')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoadingSiklus) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-content">
          <div className="loading-state">Memuat data siklus...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <PageHeader
          title="Konfigurasi Bobot"
          subtitle="Atur bobot penilaian untuk setiap indikator performa driver"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#fff" style={{ width: 28, height: 28 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.97z" />
            </svg>
          }
        />

        {/* Siklus Selector */}
        <div className="siklus-selector-container">
          <label className="siklus-selector-label">Siklus Penilaian</label>
          <select
            className="siklus-selector"
            value={selectedSiklusId || ''}
            onChange={e => setSelectedSiklusId(Number(e.target.value))}
            disabled={isEditMode}
          >
            <option value="" disabled>Pilih siklus...</option>
            {siklusList.map(s => (
              <option key={s.siklus_id} value={s.siklus_id}>
                {s.nama_siklus} — {s.status_display}
              </option>
            ))}
          </select>
        </div>

        {/* Countdown */}
        {countdown && (
          <div style={{
            background: '#fff',
            borderRadius: 16, padding: '22px 28px', marginBottom: 20,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* top accent bar */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 4,
              background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#3730a3', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Siklus dimulai dalam
              </span>
              <span style={{
                marginLeft: 'auto', fontSize: 12, fontWeight: 500, color: '#64748b',
                background: '#f1f5f9', padding: '3px 10px', borderRadius: 999,
              }}>
                {selectedSiklus?.tanggal_mulai}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { label: 'Bulan', value: countdown.bulan,  accent: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
                { label: 'Hari',  value: countdown.hari,   accent: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
                { label: 'Jam',   value: countdown.jam,    accent: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
                { label: 'Menit', value: countdown.menit,  accent: '#06b6d4', bg: '#ecfeff', border: '#a5f3fc' },
                { label: 'Detik', value: countdown.detik,  accent: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
              ].map(({ label, value, accent, bg, border }) => (
                <div key={label} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  background: bg, borderRadius: 14, padding: '14px 18px', minWidth: 76, flex: '1 1 0',
                  border: `1.5px solid ${border}`,
                  boxShadow: `0 2px 8px ${accent}18`,
                }}>
                  <span style={{
                    fontSize: '2rem', fontWeight: 800, color: accent,
                    fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                    fontFeatureSettings: '"tnum"',
                  }}>
                    {String(value).padStart(2, '0')}
                  </span>
                  <span style={{
                    fontSize: 10, color: accent, marginTop: 7,
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8,
                  }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reminder Banner */}
        {reminderDeadline && (
          <div className="reminder-banner">
            <span className="reminder-banner-icon">⏰</span>
            <span>
              Siklus <strong>{selectedSiklus?.nama_siklus}</strong> sedang berjalan.
              Bobot belum dikonfigurasi — harap finalisasi sebelum{' '}
              <strong>{reminderDeadline}</strong> agar penilaian dapat berjalan.
            </span>
          </div>
        )}

        {/* Locked Banner (penilaian sudah ada) */}
        {isLocked && (
          <div className="locked-banner">
            <span>🔒</span>
            <span>Bobot tidak dapat diubah karena sudah ada penilaian yang disubmit dalam siklus ini.</span>
          </div>
        )}

        {/* Siklus Started Banner */}
        {isSiklusStarted && !isLocked && (
          <div className="locked-banner">
            <span>🔒</span>
            <span>
              Siklus <strong>{selectedSiklus?.nama_siklus}</strong> sudah{' '}
              <strong>
                {selectedSiklus?.status_display === 'berjalan' ? 'berjalan' :
                 selectedSiklus?.status_display === 'selesai' ? 'selesai' : 'dinonaktifkan'}
              </strong>{' '}
              — bobot tidak dapat diubah agar tidak mempengaruhi hasil ranking.
            </span>
          </div>
        )}

        {error && (
          <div className="error-banner-config">{error}</div>
        )}

        {isLoadingBobot ? (
          <div className="loading-state">Memuat bobot...</div>
        ) : !selectedSiklusId ? (
          <div className="empty-state-config">Pilih siklus untuk melihat konfigurasi bobot.</div>
        ) : !isEditMode ? (
          /* View Mode */
          <div className="table-container">
            {hasBobot ? (
              <>
                <table className="config-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>No</th>
                      <th>Indikator</th>
                      <th style={{ width: '150px' }}>Bobot (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indikators.map((indikator, index) => (
                      <tr key={indikator.id}>
                        <td className="text-center">{index + 1}</td>
                        <td className="font-semibold">{indikator.nama}</td>
                        <td className="text-center">{indikator.bobot}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!isLocked && !isSiklusStarted && (
                  <div style={{ padding: '16px' }}>
                    <button onClick={handleStartEdit} className="btn-edit-config">
                      ✏️ Edit Bobot
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="no-bobot-container">
                <p className="no-bobot-text">Belum ada bobot yang dikonfigurasi untuk siklus ini.</p>
                {!isLocked && !isSiklusStarted && (
                  <button onClick={handleStartEdit} className="btn-save-config">
                    ➕ Konfigurasi Bobot Baru
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Edit Mode */
          <div className="edit-config-container">
            <div className="table-container">
              <div className="table-header-actions">
                <h3 className="table-title">Edit Indikator Penilaian</h3>
                <button onClick={handleAddIndicator} className="btn-add-indicator">
                  ➕ Tambah Indikator Baru
                </button>
              </div>

              <table className="config-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>No</th>
                    <th>Indikator</th>
                    <th style={{ width: '150px' }}>Bobot (%)</th>
                    <th style={{ width: '100px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {indikators.map((indikator, index) => (
                    <tr key={indikator.id}>
                      <td className="text-center">{index + 1}</td>
                      <td>
                        <div className="input-wrapper-name">
                          <input
                            type="text"
                            value={indikator.nama}
                            onChange={(e) => handleNameChange(indikator.id, e.target.value)}
                            className={`input-indikator-name ${!indikator.nama.trim() ? 'invalid-name' : ''}`}
                            placeholder="Nama indikator"
                          />
                          {!indikator.nama.trim() && (
                            <span className="name-warning">⚠️ Wajib diisi</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="input-wrapper">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={indikator.bobot}
                            onChange={(e) => handleBobotChange(indikator.id, e.target.value)}
                            className={`input-bobot ${indikator.bobot > 0 && indikator.bobot < 5 ? 'invalid-bobot' : ''}`}
                            placeholder="0"
                          />
                          {indikator.bobot > 0 && indikator.bobot < 5 && (
                            <span className="bobot-warning">⚠️ Min 5%</span>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        {indikators.length > 1 && (
                          <button
                            onClick={() => handleDeleteIndicator(indikator.id)}
                            className="btn-delete-indicator"
                            title="Hapus indikator"
                          >
                            🗑️
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan={2} className="text-right font-bold">Total Bobot</td>
                    <td className="text-center font-bold">
                      <span className={`total-badge ${totalBobot === 100 ? 'valid' : 'invalid'}`}>
                        {totalBobot}% {totalBobot === 100 ? '✅' : '⚠️'}
                      </span>
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="progress-section">
              <div className="progress-header">
                <span className="progress-label">Total Bobot: {totalBobot}%</span>
                <span className={`progress-status ${getStatusClass()}`}>
                  {getStatusMessage()}
                </span>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.min(totalBobot, 100)}%`, backgroundColor: getProgressColor() }}
                >
                  <span className="progress-text">{totalBobot}%</span>
                </div>
              </div>
              <div className="progress-legend">
                <span className="legend-item"><span className="legend-dot green"></span> 80-100%: Optimal</span>
                <span className="legend-item"><span className="legend-dot orange"></span> 40-79%: Perlu Penyesuaian</span>
                <span className="legend-item"><span className="legend-dot red"></span> &lt;40% atau &gt;100%: Tidak Valid</span>
              </div>
            </div>

            <div className="config-actions">
              <button onClick={handleCancel} className="btn-cancel" disabled={isSaving}>
                Batal
              </button>
              <button
                onClick={handleSave}
                className="btn-save-config"
                disabled={totalBobot !== 100 || isSaving}
              >
                {isSaving ? 'Menyimpan...' : '💾 Simpan Konfigurasi'}
              </button>
            </div>
          </div>
        )}

        {/* ── Toast Notification ── */}
        {toast && (
          <div style={{
            position: 'fixed', top: 24, right: 24, zIndex: 99999,
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 20px', borderRadius: 14,
            background: toast.type === 'success' ? '#064e3b' : '#7f1d1d',
            color: '#fff', fontSize: 14, fontWeight: 500,
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            maxWidth: 380, lineHeight: 1.4,
            animation: 'fadeSlideIn 0.25s ease',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: toast.type === 'success' ? '#065f46' : '#991b1b',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            }}>
              {toast.type === 'success' ? '✓' : '✕'}
            </div>
            <span style={{ flex: 1 }}>{toast.text}</span>
            <button onClick={() => setToast(null)} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1, flexShrink: 0,
            }}>✕</button>
          </div>
        )}
      </div>
    </div>
  )
}
