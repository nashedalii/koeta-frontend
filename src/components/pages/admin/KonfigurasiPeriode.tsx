'use client'

import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '@/utils/api'
import PageHeader from '@/components/ui/PageHeader'

// ── Types ──────────────────────────────────────────────────────────────────
interface Siklus {
  siklus_id: number
  nama_siklus: string
  tanggal_mulai: string
  tanggal_selesai: string
  status_siklus: 'aktif' | 'nonaktif'
  status_display: 'berjalan' | 'belum_dimulai' | 'selesai' | 'nonaktif' | 'tertunda'
  jumlah_periode: number
  is_activated: boolean
}

interface Periode {
  periode_id: number
  bulan: string
  tahun: number
  nama_periode: string
  tanggal_mulai: string
  tanggal_selesai: string
  is_override: boolean
  is_aktif: boolean
}

// ── Helpers ────────────────────────────────────────────────────────────────
const BULAN_ID = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
]

function formatTanggal(dateStr: string) {
  const [year, month, day] = dateStr.split('-')
  return `${parseInt(day)} ${BULAN_ID[parseInt(month) - 1]} ${year}`
}

function getToday() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function autoNamaSiklus(mulai: string, selesai: string) {
  if (!mulai || !selesai) return ''
  const [mulaiY, mulaiM] = mulai.split('-')
  const [selesaiY, selesaiM] = selesai.split('-')
  return `${BULAN_ID[parseInt(mulaiM) - 1]} ${mulaiY} - ${BULAN_ID[parseInt(selesaiM) - 1]} ${selesaiY}`
}

const STATUS_CONFIG = {
  berjalan:      { label: 'Berjalan',      color: '#16a34a', bg: '#dcfce7' },
  belum_dimulai: { label: 'Belum Dimulai', color: '#64748b', bg: '#f1f5f9' },
  tertunda:      { label: 'Tertunda',      color: '#d97706', bg: '#fef3c7' },
  selesai:       { label: 'Selesai',       color: '#2563eb', bg: '#dbeafe' },
  nonaktif:      { label: 'Nonaktif',      color: '#dc2626', bg: '#fee2e2' },
}

// ── Component ──────────────────────────────────────────────────────────────
export default function KonfigurasiPenilaian() {
  const [sikluses, setSikluses]           = useState<Siklus[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')

  const [selectedSiklus, setSelectedSiklus] = useState<Siklus | null>(null)
  const [periodes, setPeriodes]             = useState<Periode[]>([])
  const [loadingDetail, setLoadingDetail]   = useState(false)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [saving, setSaving]                   = useState(false)
  const [form, setForm] = useState({ nama_siklus: '', tanggal_mulai: '', tanggal_selesai: '' })

  // Cek apakah tanggal_selesai bukan hari terakhir bulannya
  const isNotLastDayOfMonth = (() => {
    if (!form.tanggal_selesai) return false
    const [y, m] = form.tanggal_selesai.split('-').map(Number)
    const lastDay = new Date(y, m, 0).getDate()
    const inputDay = parseInt(form.tanggal_selesai.split('-')[2])
    return inputDay < lastDay
  })()

  // Cek overlap form vs siklus yang sudah ada
  const overlapSiklus = (() => {
    if (!form.tanggal_mulai || !form.tanggal_selesai) return null
    return sikluses.find(s =>
      form.tanggal_mulai <= s.tanggal_selesai &&
      s.tanggal_mulai   <= form.tanggal_selesai
    ) || null
  })()

  const [confirmDelete, setConfirmDelete] = useState<Siklus | null>(null)
  const [deleting, setDeleting]           = useState(false)
  const [activating, setActivating]       = useState(false)
  const [confirmActivate, setConfirmActivate] = useState<Siklus | null>(null)

  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showToast = (type: 'success' | 'error', text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ type, text })
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Fetch siklus ──────────────────────────────────────────────────────────
  const fetchSikluses = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiFetch('/api/siklus')
      setSikluses(data ?? [])
    } catch (err: any) {
      setError(err.message ?? 'Gagal memuat data siklus')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSikluses() }, [])

  // ── Buka detail siklus ───────────────────────────────────────────────────
  const openDetail = async (siklus: Siklus) => {
    setSelectedSiklus(siklus)
    setLoadingDetail(true)
    try {
      const data = await apiFetch(`/api/siklus/${siklus.siklus_id}`)
      setPeriodes(data.periodes ?? [])
    } catch (err: any) {
      showToast('error', err.message ?? 'Gagal memuat detail siklus')
    } finally {
      setLoadingDetail(false)
    }
  }

  // ── Toggle override periode ───────────────────────────────────────────────
  const handleToggleOverride = async (periode: Periode) => {
    try {
      const res = await apiFetch(`/api/periode/${periode.periode_id}/override`, { method: 'PUT' })
      showToast('success', res.message ?? 'Periode aktif berhasil diubah')
      const data = await apiFetch(`/api/siklus/${selectedSiklus!.siklus_id}`)
      setPeriodes(data.periodes ?? [])
    } catch (err: any) {
      showToast('error', err.message ?? 'Gagal mengubah periode aktif')
    }
  }

  // ── Create siklus ─────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.tanggal_mulai || !form.tanggal_selesai) {
      showToast('error', 'Tanggal mulai dan selesai wajib diisi')
      return
    }
    if (form.tanggal_selesai <= form.tanggal_mulai) {
      showToast('error', 'Tanggal selesai harus setelah tanggal mulai')
      return
    }
    const nama = form.nama_siklus.trim() || autoNamaSiklus(form.tanggal_mulai, form.tanggal_selesai)

    setSaving(true)
    try {
      const res = await apiFetch('/api/siklus', {
        method: 'POST',
        body: JSON.stringify({ nama_siklus: nama, tanggal_mulai: form.tanggal_mulai, tanggal_selesai: form.tanggal_selesai })
      })
      await fetchSikluses()
      setShowCreateModal(false)
      setForm({ nama_siklus: '', tanggal_mulai: '', tanggal_selesai: '' })
      showToast('success', res.message ?? 'Siklus berhasil dibuat')
    } catch (err: any) {
      showToast('error', err.message ?? 'Gagal membuat siklus')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete siklus ─────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await apiFetch(`/api/siklus/${confirmDelete.siklus_id}`, { method: 'DELETE' })
      setConfirmDelete(null)
      await fetchSikluses()
      showToast('success', 'Siklus berhasil dihapus')
    } catch (err: any) {
      showToast('error', err.message ?? 'Gagal menghapus siklus')
    } finally {
      setDeleting(false)
    }
  }

  // ── Activate siklus (manual, untuk siklus tertunda) ─────────────────────
  const handleActivate = async () => {
    if (!confirmActivate) return
    setActivating(true)
    try {
      const res = await apiFetch(`/api/siklus/${confirmActivate.siklus_id}/activate`, { method: 'PUT' })
      setConfirmActivate(null)
      await fetchSikluses()
      showToast('success', res.message ?? 'Siklus berhasil diaktifkan')
    } catch (err: any) {
      showToast('error', err.message ?? 'Gagal mengaktifkan siklus')
    } finally {
      setActivating(false)
    }
  }

  const today = getToday()

  // ── Render: Detail Siklus ─────────────────────────────────────────────────
  if (selectedSiklus) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-content">
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button onClick={() => setSelectedSiklus(null)} className="btn-cancel" style={{ alignSelf: 'flex-start' }}>
              ← Kembali
            </button>
            <div>
              <h1 className="page-title" style={{ margin: 0, fontSize: '1.25rem' }}>{selectedSiklus.nama_siklus}</h1>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                {formatTanggal(selectedSiklus.tanggal_mulai)} – {formatTanggal(selectedSiklus.tanggal_selesai)}
              </p>
            </div>
          </div>

          {loadingDetail ? (
            <div className="loading-state">Memuat periode...</div>
          ) : isMobile ? (
            <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              {periodes.map(p => {
                const isFuture = p.tanggal_mulai > today
                const isAktif  = p.is_aktif
                return (
                  <div key={p.periode_id} className="user-card" style={{ background: isAktif ? '#f0fdf4' : undefined }}>
                    <div className="user-card-left">
                      <div className="user-card-info">
                        <div className="user-card-name" style={{ display: 'flex', alignItems: 'center', gap: 6, color: isAktif ? '#16a34a' : isFuture ? '#94a3b8' : '#1e293b' }}>
                          {p.nama_periode}
                          {p.is_override && <span style={{ fontSize: '0.65rem', color: '#f59e0b' }}>(override)</span>}
                          {isFuture ? (
                            <span style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 500 }}>Belum dimulai</span>
                          ) : isAktif ? (
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                          ) : (
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8', flexShrink: 0 }} />
                          )}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 2 }}>
                          {formatTanggal(p.tanggal_mulai)} – {formatTanggal(p.tanggal_selesai)}
                        </div>
                      </div>
                    </div>
                    <div className="user-card-right">
                      <div className="user-card-actions">
                        {isFuture ? (
                          <button className="btn-edit" disabled style={{ opacity: 0.4, cursor: 'not-allowed', padding: '5px 10px', fontSize: '0.72rem' }}>
                            Aktifkan
                          </button>
                        ) : isAktif ? (
                          <button onClick={() => handleToggleOverride(p)} className="btn-delete" style={{ padding: '5px 8px', fontSize: '0.72rem' }}>
                            Nonaktifkan
                          </button>
                        ) : (
                          <button onClick={() => handleToggleOverride(p)} className="btn-edit" style={{ padding: '5px 10px', fontSize: '0.72rem' }}>
                            Aktifkan
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="table-container">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Periode</th>
                    <th>Tanggal Mulai</th>
                    <th>Tanggal Selesai</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {periodes.map((p, idx) => {
                    const isFuture  = p.tanggal_mulai > today
                    const isAktif   = p.is_aktif

                    return (
                      <tr key={p.periode_id} style={{ background: isAktif ? '#f0fdf4' : undefined }}>
                        <td>{idx + 1}</td>
                        <td>
                          <strong style={{ color: isAktif ? '#16a34a' : isFuture ? '#94a3b8' : '#1e293b' }}>
                            {p.nama_periode}
                          </strong>
                          {p.is_override && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#f59e0b' }}>
                              (override)
                            </span>
                          )}
                        </td>
                        <td style={{ color: isFuture ? '#94a3b8' : undefined }}>{formatTanggal(p.tanggal_mulai)}</td>
                        <td style={{ color: isFuture ? '#94a3b8' : undefined }}>{formatTanggal(p.tanggal_selesai)}</td>
                        <td>
                          {isFuture ? (
                            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Belum dimulai</span>
                          ) : isAktif ? (
                            <span className="status-badge status-aktif">● Aktif</span>
                          ) : (
                            <span className="status-badge status-nonaktif">○ Tidak Aktif</span>
                          )}
                        </td>
                        <td>
                          {isFuture ? (
                            <button className="btn-edit" disabled style={{ opacity: 0.4, cursor: 'not-allowed' }}>
                              Aktifkan
                            </button>
                          ) : isAktif ? (
                            <button onClick={() => handleToggleOverride(p)} className="btn-delete">
                              Nonaktifkan
                            </button>
                          ) : (
                            <button onClick={() => handleToggleOverride(p)} className="btn-edit">
                              Aktifkan
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Render: List Siklus ───────────────────────────────────────────────────
  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <PageHeader
          title="Konfigurasi Penilaian"
          subtitle="Kelola siklus dan periode penilaian driver"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#fff" style={{ width: 28, height: 28 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          }
          actions={
            <button onClick={() => setShowCreateModal(true)} className="btn-add-user">
              <span>+</span>
              <span>Buat Siklus</span>
            </button>
          }
        />

        {loading ? (
          <div className="loading-state">Memuat data siklus...</div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchSikluses} className="btn-edit">Coba Lagi</button>
          </div>
        ) : isMobile ? (
          <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            {sikluses.length === 0 ? (
              <div className="no-data" style={{ background: 'white', borderRadius: 12, padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                <p>Belum ada siklus penilaian</p>
              </div>
            ) : sikluses.map(s => {
              const cfg = STATUS_CONFIG[s.status_display] ?? STATUS_CONFIG.nonaktif
              return (
                <div key={s.siklus_id} className="user-card">
                  <div className="user-card-left">
                    <div className="user-card-info">
                      <div className="user-card-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {s.nama_siklus}
                        <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: '0.6rem', fontWeight: 600, color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
                      </div>
                      <div className="user-card-meta">
                        <span className="user-card-hp">{s.jumlah_periode} bulan</span>
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 2 }}>
                        {formatTanggal(s.tanggal_mulai)} – {formatTanggal(s.tanggal_selesai)}
                      </div>
                    </div>
                  </div>
                  <div className="user-card-right" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    {s.status_display === 'tertunda' && (
                      <button onClick={() => setConfirmActivate(s)} disabled={activating} className="btn-edit" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '5px 10px', fontSize: '0.75rem', background: '#f59e0b', color: '#fff', border: 'none', whiteSpace: 'nowrap' }}>
                        ▶ Aktifkan
                      </button>
                    )}
                    <div className="user-card-actions">
                      <button onClick={() => openDetail(s)} className="btn-edit" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 8px', fontSize: '0.85rem' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" width={14} height={14}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                      </button>
                      {(s.status_display === 'belum_dimulai' || s.status_display === 'tertunda') && (
                        <button onClick={() => setConfirmDelete(s)} className="btn-delete" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 8px', fontSize: '0.85rem' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" width={14} height={14}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="table-container">
            <table className="user-table">
              <thead>
                <tr>
                  <th>#</th><th>Nama Siklus</th><th>Mulai</th>
                  <th>Selesai</th><th>Periode</th><th>Status</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sikluses.map((s, idx) => {
                  const cfg = STATUS_CONFIG[s.status_display] ?? STATUS_CONFIG.nonaktif
                  return (
                    <tr key={s.siklus_id}>
                      <td>{idx + 1}</td>
                      <td><strong style={{ color: '#031e65' }}>{s.nama_siklus}</strong></td>
                      <td>{formatTanggal(s.tanggal_mulai)}</td>
                      <td>{formatTanggal(s.tanggal_selesai)}</td>
                      <td style={{ textAlign: 'center' }}>{s.jumlah_periode} bulan</td>
                      <td>
                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600, color: cfg.color, background: cfg.bg }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button onClick={() => openDetail(s)} className="btn-edit">Detail</button>
                        {s.status_display === 'tertunda' && (
                          <button onClick={() => setConfirmActivate(s)} disabled={activating} className="btn-edit" style={{ background: '#f59e0b', color: '#fff', border: 'none' }}>
                            ▶ Aktifkan
                          </button>
                        )}
                        {(s.status_display === 'belum_dimulai' || s.status_display === 'tertunda') && (
                          <button onClick={() => setConfirmDelete(s)} className="btn-delete">Hapus</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {sikluses.length === 0 && <div className="no-data"><p>Belum ada siklus penilaian</p></div>}
          </div>
        )}

        {/* ── Confirm Delete Modal ── */}
        {confirmDelete && (
          <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
            <div className="confirm-modal" onClick={e => e.stopPropagation()}>
              <h3 className="confirm-modal-title">Hapus Siklus?</h3>
              <p className="confirm-modal-desc">
                Siklus <strong>{confirmDelete.nama_siklus}</strong> beserta semua periode dan bobot di dalamnya akan dihapus permanen. Data tidak dapat dikembalikan.
              </p>
              <div className="confirm-modal-actions">
                <button className="btn btn-outline" onClick={() => setConfirmDelete(null)} disabled={deleting}>
                  Batal
                </button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Confirm Activate Modal ── */}
        {confirmActivate && (
          <div className="modal-overlay" onClick={() => setConfirmActivate(null)}>
            <div className="confirm-modal" onClick={e => e.stopPropagation()}>
              <h3 className="confirm-modal-title">Aktifkan Siklus?</h3>
              <p className="confirm-modal-desc">
                Apakah Anda yakin ingin mengaktifkan siklus <strong>{confirmActivate.nama_siklus}</strong>? Setelah diaktifkan, petugas dapat mulai melakukan penilaian dan siklus tidak dapat dihapus.
              </p>
              <div className="confirm-modal-actions" style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <button className="btn btn-outline" onClick={() => setConfirmActivate(null)} disabled={activating} style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Batal
                </button>
                <button className="btn btn-save" onClick={handleActivate} disabled={activating} style={{ flex: 1, background: '#d97706', border: 'none', color: '#fff', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {activating ? 'Mengaktifkan...' : 'Ya, Aktifkan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Create Siklus Modal ── */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Buat Siklus Baru</h2>
                <button onClick={() => setShowCreateModal(false)} className="modal-close">✕</button>
              </div>

              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Tanggal Mulai <span className="required">*</span></label>
                    <input
                      type="date"
                      value={form.tanggal_mulai}
                      onChange={e => setForm({ ...form, tanggal_mulai: e.target.value })}
                      min={getToday()}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tanggal Selesai <span className="required">*</span></label>
                    <input
                      type="date"
                      value={form.tanggal_selesai}
                      onChange={e => setForm({ ...form, tanggal_selesai: e.target.value })}
                      min={form.tanggal_mulai || getToday()}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Siklus</label>
                  <input
                    type="text"
                    value={form.nama_siklus}
                    onChange={e => setForm({ ...form, nama_siklus: e.target.value })}
                    placeholder={autoNamaSiklus(form.tanggal_mulai, form.tanggal_selesai) || 'Otomatis dari bulan mulai - bulan selesai'}
                    className="form-input"
                  />
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    Kosongkan untuk menggunakan nama otomatis
                  </p>
                </div>

                {/* Overlap warning */}
                {overlapSiklus && (
                  <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#991b1b', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>⛔</span>
                    <span>
                      Tanggal ini tumpang tindih dengan siklus <strong>"{overlapSiklus.nama_siklus}"</strong> ({formatTanggal(overlapSiklus.tanggal_mulai)} – {formatTanggal(overlapSiklus.tanggal_selesai)}). Pilih tanggal setelah siklus tersebut berakhir.
                    </span>
                  </div>
                )}

                {/* End date not last day of month warning */}
                {isNotLastDayOfMonth && !overlapSiklus && (
                  <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#92400e', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>!</span>
                    <span>
                      Tanggal selesai bukan akhir bulan. Sistem akan otomatis menyesuaikan tanggal selesai periode terakhir ke hari terakhir bulan tersebut.
                    </span>
                  </div>
                )}

                {/* Success preview */}
                {!overlapSiklus && form.tanggal_mulai && form.tanggal_selesai && form.tanggal_selesai > form.tanggal_mulai && (() => {
                  const [y, m] = form.tanggal_selesai.split('-').map(Number)
                  const lastDay = new Date(y, m, 0)
                  const adjusted = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2,'0')}-${String(lastDay.getDate()).padStart(2,'0')}`
                  return (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.75rem', fontSize: '0.85rem', color: '#16a34a' }}>
                      ✓ Akan membuat periode bulanan dari <strong>{formatTanggal(form.tanggal_mulai)}</strong> hingga <strong>{formatTanggal(adjusted)}</strong>
                    </div>
                  )
                })()}
              </div>

              <div className="modal-footer">
                <button onClick={() => setShowCreateModal(false)} className="btn-cancel">Batal</button>
                <button onClick={handleCreate} disabled={saving || !!overlapSiklus} className="btn-save"
                  style={{ opacity: overlapSiklus ? 0.4 : 1, cursor: overlapSiklus ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Membuat...' : 'Buat Siklus'}
                </button>
              </div>
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
