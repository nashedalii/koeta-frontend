'use client'

import { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/ui/PageHeader'

interface Driver {
  id: number
  nama: string
  nama_kernet: string | null
  armada_id: number
  kode_armada: string
  nama_armada: string
  bus_id: number | null
  kode_bus: string | null
  nopol: string | null
  bus_status: string | null
  status_aktif: string
}

interface Periode {
  periode_id: number
  siklus_id: number
  nama_periode: string
  bulan: string
  tahun: number
  tanggal_mulai: string
  tanggal_selesai: string
  is_aktif: boolean
}

interface Bobot {
  bobot_id: number
  nama_bobot: string
  persentase_bobot: number
}

interface PenilaianStatus {
  penilaian_id: number
  driver_id: number
  skor_total: number
  status_validasi: 'pending' | 'approved' | 'rejected'
  note_validasi: string | null
}

interface DetailInput {
  bobot_id: number
  nilai: string
}

interface FotoState {
  file: File | null
  preview: string | null
}

type ModalMode = 'input' | 'edit' | 'detail'

const apiBase = process.env.NEXT_PUBLIC_API_URL || ''

const getToken = () => {
  try { return JSON.parse(localStorage.getItem('auth') || '{}').token || '' }
  catch { return '' }
}

const getUser = () => {
  try { return JSON.parse(localStorage.getItem('auth') || '{}').user || {} }
  catch { return {} }
}

export default function InputValidasiData() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [periodeAktif, setPeriodeAktif] = useState<Periode | null>(null)
  const [bobotList, setBobotList] = useState<Bobot[]>([])
  const [penilaianList, setPenilaianList] = useState<PenilaianStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modal states
  const [modalMode, setModalMode] = useState<ModalMode>('input')
  const [showModal, setShowModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [selectedPenilaianId, setSelectedPenilaianId] = useState<number | null>(null)

  // Form states
  const [details, setDetails] = useState<DetailInput[]>([])
  const [catatan, setCatatan] = useState('')
  const [foto, setFoto] = useState<FotoState>({ file: null, preview: null })
  const [existingFoto, setExistingFoto] = useState<{ bukti_id: number; file_path: string; nama_file: string } | null>(null)
  const [deleteFotoOnSave, setDeleteFotoOnSave] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Detail view state
  const [detailData, setDetailData] = useState<any>(null)
  const [confirmDelete, setConfirmDelete] = useState<Driver | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [noBusWarning, setNoBusWarning] = useState<string | null>(null)

  const user = getUser()
  const armada_id = user.armada_id

  // ── Fetch initial data ────────────────────────────────────────────────
  const fetchPenilaian = useCallback(async (periode_id: number) => {
    try {
      const res = await fetch(`${apiBase}/api/penilaian?periode_id=${periode_id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await res.json()
      setPenilaianList(data.penilaians || [])
    } catch {
      // silent fail — penilaian list non-critical
    }
  }, [])

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const headers = { Authorization: `Bearer ${getToken()}` }

        // Fetch drivers, periode aktif secara paralel
        const [driversRes, periodeRes] = await Promise.all([
          fetch(`${apiBase}/api/users/driver?armada_id=${armada_id}`, { headers }),
          fetch(`${apiBase}/api/periode/aktif`, { headers })
        ])

        const driversData = await driversRes.json()
        const periodeData = await periodeRes.json()

        const driverList: Driver[] = (driversData || []).filter((d: Driver) => d.status_aktif === 'aktif')
        setDrivers(driverList)

        const periode = periodeData.periode || null
        setPeriodeAktif(periode)

        if (periode) {
          // Fetch bobot dari siklus_id periode aktif
          if (periode.siklus_id) {
            const bobotRes = await fetch(`${apiBase}/api/bobot?siklus_id=${periode.siklus_id}`, { headers })
            const bobotData = await bobotRes.json()
            setBobotList(bobotData.bobots || [])
          }

          await fetchPenilaian(periode.periode_id)
        }
      } catch (err) {
        setError('Gagal memuat data. Pastikan koneksi internet tersedia.')
      } finally {
        setIsLoading(false)
      }
    }

    if (armada_id) {
      fetchAll()
    } else {
      setIsLoading(false)
      setError('Akun Anda belum terdaftar ke armada manapun. Hubungi admin.')
    }
  }, [armada_id, fetchPenilaian])

  // ── Helpers ───────────────────────────────────────────────────────────
  const getPenilaianDriver = (driver_id: number) =>
    penilaianList.find(p => p.driver_id === driver_id) || null

  const getDriverStatus = (driver_id: number) => {
    const p = getPenilaianDriver(driver_id)
    if (!p) return 'belum-diisi'
    return p.status_validasi
  }

  const calculateTotal = (currentDetails: DetailInput[]) => {
    let total = 0
    for (const d of currentDetails) {
      const bobot = bobotList.find(b => b.bobot_id === d.bobot_id)
      if (bobot && d.nilai !== '') {
        total += (parseFloat(d.nilai) * parseFloat(String(bobot.persentase_bobot))) / 100
      }
    }
    return Math.round(total * 100) / 100
  }

  const getEmptyDetails = () =>
    bobotList.map(b => ({ bobot_id: b.bobot_id, nilai: '' }))

  // ── Validation ────────────────────────────────────────────────────────
  const getValidationErrors = () => {
    const errors: string[] = []
    for (const d of details) {
      const bobot = bobotList.find(b => b.bobot_id === d.bobot_id)
      const nama = bobot?.nama_bobot || `Indikator ${d.bobot_id}`
      if (d.nilai === '' || d.nilai === null) {
        errors.push(`${nama} belum diisi`)
      } else if (parseFloat(d.nilai) < 0 || parseFloat(d.nilai) > 100) {
        errors.push(`${nama} harus antara 0 dan 100`)
      }
    }
    return errors
  }

  // ── Open modals ───────────────────────────────────────────────────────
  const handleOpenInput = (driver: Driver) => {
    if (!periodeAktif) return
    if (!driver.bus_id) {
      setNoBusWarning(`Driver ${driver.nama} belum memiliki bus aktif. Hubungi admin untuk mengatur bus.`)
      setTimeout(() => setNoBusWarning(null), 4000)
      return
    }
    setSelectedDriver(driver)
    setModalMode('input')
    setDetails(getEmptyDetails())
    setCatatan('')
    setFoto({ file: null, preview: null })
    setExistingFoto(null)
    setDeleteFotoOnSave(false)
    setSubmitError(null)
    setShowModal(true)
  }

  const handleOpenEdit = async (driver: Driver) => {
    const penilaian = getPenilaianDriver(driver.id)
    if (!penilaian) return
    setSelectedDriver(driver)
    setSelectedPenilaianId(penilaian.penilaian_id)
    setModalMode('edit')
    setSubmitError(null)
    setFoto({ file: null, preview: null })
    setDeleteFotoOnSave(false)

    try {
      const res = await fetch(`${apiBase}/api/penilaian/${penilaian.penilaian_id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await res.json()
      setDetails(data.details.map((d: any) => ({
        bobot_id: d.bobot_id,
        nilai: String(d.nilai)
      })))
      setCatatan(data.catatan_petugas || '')
      setExistingFoto(data.fotos?.[0] || null)
    } catch {
      setDetails(getEmptyDetails())
      setCatatan('')
      setExistingFoto(null)
    }
    setShowModal(true)
  }

  const handleOpenDetail = async (driver: Driver) => {
    const penilaian = getPenilaianDriver(driver.id)
    if (!penilaian) return
    setSelectedDriver(driver)
    setModalMode('detail')
    setDetailData(null)

    try {
      const res = await fetch(`${apiBase}/api/penilaian/${penilaian.penilaian_id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await res.json()
      setDetailData(data)
    } catch {
      setDetailData(null)
    }
    setShowModal(true)
  }

  // ── Delete penilaian ──────────────────────────────────────────────────
  const handleDelete = (driver: Driver) => {
    setConfirmDelete(driver)
  }

  const handleConfirmDelete = async () => {
    if (!confirmDelete || !periodeAktif) return
    const penilaian = getPenilaianDriver(confirmDelete.id)
    if (!penilaian) return

    setIsDeleting(true)
    try {
      const res = await fetch(`${apiBase}/api/penilaian/${penilaian.penilaian_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      if (!res.ok) {
        const data = await res.json()
        setSubmitError(data.message || 'Gagal menghapus penilaian')
      } else {
        await fetchPenilaian(periodeAktif.periode_id)
      }
    } catch {
      setSubmitError('Gagal menghapus penilaian')
    } finally {
      setIsDeleting(false)
      setConfirmDelete(null)
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedDriver || !periodeAktif) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      if (modalMode === 'input') {
        // POST penilaian baru
        const res = await fetch(`${apiBase}/api/penilaian`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({
            driver_id: selectedDriver.id,
            periode_id: periodeAktif.periode_id,
            catatan_petugas: catatan || null,
            details: details.map(d => ({ bobot_id: d.bobot_id, nilai: parseFloat(d.nilai) }))
          })
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result.message)

        // Upload foto jika ada
        if (foto.file) {
          const formData = new FormData()
          formData.append('foto', foto.file)
          await fetch(`${apiBase}/api/penilaian/${result.penilaian_id}/foto`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${getToken()}` },
            body: formData
          })
        }
      } else {
        // PUT update penilaian
        const res = await fetch(`${apiBase}/api/penilaian/${selectedPenilaianId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({
            catatan_petugas: catatan || null,
            details: details.map(d => ({ bobot_id: d.bobot_id, nilai: parseFloat(d.nilai) }))
          })
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result.message)

        // Hapus foto lama jika ditandai
        if (deleteFotoOnSave && existingFoto) {
          await fetch(`${apiBase}/api/penilaian/foto/${existingFoto.bukti_id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${getToken()}` }
          })
        }

        // Upload foto baru jika ada
        if (foto.file) {
          const formData = new FormData()
          formData.append('foto', foto.file)
          await fetch(`${apiBase}/api/penilaian/${selectedPenilaianId}/foto`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${getToken()}` },
            body: formData
          })
        }
      }

      setShowModal(false)
      setShowPreview(false)
      await fetchPenilaian(periodeAktif.periode_id)
    } catch (err: any) {
      setSubmitError(err.message || 'Gagal menyimpan penilaian')
      setShowPreview(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Filter & sort drivers ─────────────────────────────────────────────
  const filteredDrivers = drivers
    .filter(driver => {
      const matchSearch =
        driver.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (driver.nama_kernet || '').toLowerCase().includes(searchQuery.toLowerCase())
      const status = getDriverStatus(driver.id)
      const matchStatus = statusFilter === 'all' || status === statusFilter
      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      const aHasBus = !!a.bus_id
      const bHasBus = !!b.bus_id
      if (aHasBus !== bHasBus) return aHasBus ? -1 : 1
      return a.nama.localeCompare(b.nama, 'id')
    })

  // ── Status badge ──────────────────────────────────────────────────────
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':  return { className: 'status-badge approved',   text: '✓ Disetujui' }
      case 'pending':   return { className: 'status-badge pending',    text: '⏳ Pending' }
      case 'rejected':  return { className: 'status-badge rejected',   text: '✕ Ditolak' }
      default:          return { className: 'status-badge not-filled', text: '⚠️ Belum Diisi' }
    }
  }

  const validationErrors = getValidationErrors()
  const totalSkor = calculateTotal(details)

  // ── Loading / Error state ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-content">
          <div className="loading-state">Memuat data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-content">
          <div className="error-banner-config">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <PageHeader
          title="Input & Validasi Data"
          subtitle={periodeAktif ? `Periode aktif: ${periodeAktif.nama_periode}` : 'Tidak ada periode aktif saat ini'}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#fff" style={{ width: 28, height: 28 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
        />

        {!periodeAktif && (
          <div className="reminder-banner">
            <span>⚠️</span>
            <span>Tidak ada periode aktif. Hubungi admin untuk mengaktifkan periode penilaian.</span>
          </div>
        )}

        {periodeAktif && bobotList.length === 0 && (
          <div className="reminder-banner">
            <span>⚠️</span>
            <span>Bobot penilaian belum dikonfigurasi oleh admin untuk siklus ini.</span>
          </div>
        )}

        {/* Summary & Controls */}
        <div className="input-controls">
          <div className="input-summary">
            <div className="summary-item approved">
              <span className="summary-icon">✓</span>
              <div>
                <p className="summary-label">Disetujui</p>
                <p className="summary-value">{drivers.filter(d => getDriverStatus(d.id) === 'approved').length}</p>
              </div>
            </div>
            <div className="summary-item pending">
              <span className="summary-icon">⏳</span>
              <div>
                <p className="summary-label">Pending</p>
                <p className="summary-value">{drivers.filter(d => getDriverStatus(d.id) === 'pending').length}</p>
              </div>
            </div>
            <div className="summary-item not-filled">
              <span className="summary-icon">⚠️</span>
              <div>
                <p className="summary-label">Belum Diisi</p>
                <p className="summary-value">{drivers.filter(d => getDriverStatus(d.id) === 'belum-diisi').length}</p>
              </div>
            </div>
            <div className="summary-item rejected">
              <span className="summary-icon">✕</span>
              <div>
                <p className="summary-label">Ditolak</p>
                <p className="summary-value">{drivers.filter(d => getDriverStatus(d.id) === 'rejected').length}</p>
              </div>
            </div>
          </div>

          <div className="input-filters">
            <input
              className="search-input"
              placeholder="🔍 Cari driver..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <select
              className="filter-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="approved">Disetujui</option>
              <option value="pending">Pending</option>
              <option value="rejected">Ditolak</option>
              <option value="belum-diisi">Belum Diisi</option>
            </select>
          </div>
        </div>

        {/* No-bus warning toast — fixed top-center */}
        {noBusWarning && (
          <div style={{
            position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
            zIndex: 99999, maxWidth: 480, width: 'calc(100% - 32px)',
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#fff7ed', border: '1px solid #fed7aa',
            borderRadius: 10, padding: '12px 16px',
            color: '#9a3412', fontSize: '0.875rem', fontWeight: 500,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}>
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
            <span style={{ flex: 1 }}>{noBusWarning}</span>
            <button onClick={() => setNoBusWarning(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9a3412', fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}>✕</button>
          </div>
        )}

        {/* Driver Cards */}
        <div className="driver-grid">
          {filteredDrivers.map(driver => {
            const status = getDriverStatus(driver.id)
            const badge = getStatusBadge(status)
            const penilaian = getPenilaianDriver(driver.id)

            return (
              <div key={driver.id} className="driver-card input-card">
                <div className="driver-card-header">
                  <div>
                    <h3 className="driver-name">{driver.nama}</h3>
                    <p className="muted small">Kernet: {driver.nama_kernet || '-'}</p>
                  </div>
                  <span className="armada-badge">{driver.kode_armada}</span>
                </div>

                <div className="driver-card-body">
                  <p className="muted small">
                    Bus: <strong>{driver.kode_bus ? `${driver.kode_bus} — ${driver.nopol}` : '—'}</strong>
                  </p>
                  <div className="status-row">
                    <span className={badge.className}>{badge.text}</span>
                    {penilaian && (
                      <span className="skor-preview">Skor: <strong>{penilaian.skor_total}</strong></span>
                    )}
                  </div>
                  {status === 'rejected' && penilaian?.note_validasi && (
                    <p className="rejected-note">Alasan: {penilaian.note_validasi}</p>
                  )}

                  <div className="card-actions">
                    {status === 'belum-diisi' && periodeAktif && bobotList.length > 0 && (
                      <button className="btn btn-primary" onClick={() => handleOpenInput(driver)}>
                        📝 Input Data
                      </button>
                    )}
                    {(status === 'pending' || status === 'rejected') && (
                      <>
                        <button className="btn btn-secondary" onClick={() => handleOpenEdit(driver)}>
                          ✏️ Edit
                        </button>
                        <button className="btn btn-outline" onClick={() => handleOpenDetail(driver)}>
                          👁️ Lihat
                        </button>
                        <button className="btn btn-danger-outline" onClick={() => handleDelete(driver)}>
                          🗑️
                        </button>
                      </>
                    )}
                    {status === 'approved' && (
                      <button className="btn btn-outline" onClick={() => handleOpenDetail(driver)}>
                        👁️ Lihat Detail
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredDrivers.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>Tidak ada data ditemukan</h3>
            <p>Coba ubah filter atau pencarian</p>
          </div>
        )}

        {/* ── Input / Edit Modal ── */}
        {showModal && selectedDriver && !showPreview && (modalMode === 'input' || modalMode === 'edit') && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2 className="modal-title">
                    {modalMode === 'input' ? 'Input Penilaian Driver' : 'Edit Penilaian Driver'}
                  </h2>
                  <p className="modal-subtitle">
                    {selectedDriver.nama} — {periodeAktif?.nama_periode}
                  </p>
                </div>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <div className="modal-body">
                {submitError && (
                  <div className="error-banner-config" style={{ marginBottom: '16px' }}>{submitError}</div>
                )}

                {/* Penilaian Kinerja */}
                <div className="form-section">
                  <h3 className="form-section-title">Penilaian Kinerja</h3>
                  <div className="form-grid">
                    {bobotList.map(bobot => {
                      const detail = details.find(d => d.bobot_id === bobot.bobot_id)
                      const nilai = detail?.nilai ?? ''
                      const isEmpty = nilai === ''
                      const isInvalid = nilai !== '' && (parseFloat(nilai) < 0 || parseFloat(nilai) > 100)

                      return (
                        <div key={bobot.bobot_id} className="form-group">
                          <label className="form-label">
                            {bobot.nama_bobot}{' '}
                            <span className="badge-bobot">{bobot.persentase_bobot}%</span>
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            className={`form-input ${isEmpty || isInvalid ? 'input-error' : ''}`}
                            value={nilai}
                            onChange={e => {
                              const raw = e.target.value
                              // Hanya izinkan angka dan satu titik desimal
                              const sanitized = raw
                                .replace(/[^0-9.]/g, '')
                                .replace(/^(\d*\.?\d*).*$/, '$1')
                              // Cegah lebih dari satu titik desimal
                              const parts = sanitized.split('.')
                              const val = parts.length > 2
                                ? parts[0] + '.' + parts.slice(1).join('')
                                : sanitized
                              setDetails(prev =>
                                prev.map(d => d.bobot_id === bobot.bobot_id
                                  ? { ...d, nilai: val }
                                  : d
                                )
                              )
                            }}
                            placeholder="0–100"
                          />
                          {isEmpty && (
                            <span className="field-warning">⚠️ {bobot.nama_bobot} belum diisi</span>
                          )}
                          {isInvalid && (
                            <span className="field-warning">⚠️ Nilai harus antara 0 dan 100</span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="total-score-preview">
                    <span>Total Skor Tertimbang:</span>
                    <strong className="total-value">{totalSkor}</strong>
                  </div>
                </div>

                {/* Upload Foto */}
                <div className="form-section">
                  <h3 className="form-section-title">
                    Bukti Pendukung <span style={{ color: '#94a3b8', fontSize: '0.85em' }}>opsional</span>
                  </h3>

                  {/* Foto existing saat edit */}
                  {existingFoto && !deleteFotoOnSave && (
                    <div className="existing-foto">
                      <span>📎 {existingFoto.nama_file}</span>
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => setDeleteFotoOnSave(true)}
                      >
                        ✕ Hapus
                      </button>
                    </div>
                  )}

                  {(!existingFoto || deleteFotoOnSave) && !foto.file && (
                    <>
                      <input
                        type="file"
                        id="foto-upload"
                        accept="image/jpeg,image/png,image/webp"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0] || null
                          if (file) {
                            setFoto({ file, preview: URL.createObjectURL(file) })
                          }
                        }}
                      />
                      <label htmlFor="foto-upload" className="upload-label">
                        <span className="upload-icon">📎</span>
                        <span>Klik untuk upload foto</span>
                        <span className="upload-hint">JPEG, PNG, WebP — Maks 2MB</span>
                      </label>
                    </>
                  )}

                  {foto.file && (
                    <div className="uploaded-files">
                      <div className="file-item">
                        <span className="file-name">📄 {foto.file.name}</span>
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => setFoto({ file: null, preview: null })}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Catatan */}
                <div className="form-section">
                  <h3 className="form-section-title">
                    Catatan Tambahan <span style={{ color: '#94a3b8', fontSize: '0.85em' }}>opsional</span>
                  </h3>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Tambahkan catatan atau keterangan tambahan..."
                    value={catatan}
                    onChange={e => setCatatan(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowPreview(true)}
                  disabled={validationErrors.length > 0}
                >
                  👁️ Preview &amp; Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Preview Modal ── */}
        {showPreview && selectedDriver && (
          <div className="modal-overlay" onClick={() => setShowPreview(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Preview Data Sebelum Submit</h2>
                <button className="modal-close" onClick={() => setShowPreview(false)}>✕</button>
              </div>

              <div className="modal-body">
                <div className="preview-section">
                  <h3>Informasi Driver</h3>
                  <table className="preview-table">
                    <tbody>
                      <tr><td><strong>Nama Driver</strong></td><td>{selectedDriver.nama}</td></tr>
                      <tr><td><strong>Kernet</strong></td><td>{selectedDriver.nama_kernet || '—'}</td></tr>
                      <tr><td><strong>Bus</strong></td><td>{selectedDriver.kode_bus ? `${selectedDriver.kode_bus} — ${selectedDriver.nopol}` : '—'}</td></tr>
                      <tr><td><strong>Periode</strong></td><td>{periodeAktif?.nama_periode}</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="preview-section">
                  <h3>Hasil Penilaian</h3>
                  <table className="preview-table">
                    <tbody>
                      {details.map(d => {
                        const bobot = bobotList.find(b => b.bobot_id === d.bobot_id)
                        return (
                          <tr key={d.bobot_id}>
                            <td><strong>{bobot?.nama_bobot} ({bobot?.persentase_bobot}%)</strong></td>
                            <td>{d.nilai}</td>
                          </tr>
                        )
                      })}
                      <tr className="total-row">
                        <td><strong>Total Skor Tertimbang</strong></td>
                        <td><strong className="total-score">{totalSkor}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {foto.file && (
                  <div className="preview-section">
                    <h3>Bukti Foto</h3>
                    <p>📄 {foto.file.name}</p>
                  </div>
                )}

                {catatan && (
                  <div className="preview-section">
                    <h3>Catatan</h3>
                    <p className="preview-note">{catatan}</p>
                  </div>
                )}

                <div className="preview-warning">
                  <strong>⚠️ Perhatian:</strong> Data yang sudah disubmit akan menunggu persetujuan Admin.
                  Pastikan semua data sudah benar.
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowPreview(false)} disabled={isSubmitting}>
                  ← Kembali Edit
                </button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : '✓ Submit ke Admin'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Detail Modal ── */}
        {showModal && selectedDriver && modalMode === 'detail' && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2 className="modal-title">Detail Penilaian Driver</h2>
                  <p className="modal-subtitle">{selectedDriver.nama} — {periodeAktif?.nama_periode}</p>
                </div>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <div className="modal-body">
                {!detailData ? (
                  <div className="loading-state">Memuat detail...</div>
                ) : (
                  <>
                    <div className="preview-section">
                      <h3>Informasi Driver</h3>
                      <table className="preview-table">
                        <tbody>
                          <tr><td><strong>Bus</strong></td><td>{detailData.kode_bus} — {detailData.nopol}</td></tr>
                          <tr><td><strong>Petugas</strong></td><td>{detailData.nama_petugas}</td></tr>
                          <tr><td><strong>Status</strong></td><td>
                            <span className={getStatusBadge(detailData.status_validasi).className}>
                              {getStatusBadge(detailData.status_validasi).text}
                            </span>
                          </td></tr>
                          {detailData.note_validasi && (
                            <tr><td><strong>Catatan Admin</strong></td><td className="rejected-note">{detailData.note_validasi}</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="preview-section">
                      <h3>Hasil Penilaian</h3>
                      <table className="preview-table">
                        <tbody>
                          {detailData.details?.map((d: any) => (
                            <tr key={d.penilaian_detail_id}>
                              <td><strong>{d.nama_bobot} ({d.persentase_bobot}%)</strong></td>
                              <td>{d.nilai}</td>
                            </tr>
                          ))}
                          <tr className="total-row">
                            <td><strong>Total Skor Tertimbang</strong></td>
                            <td><strong className="total-score">{detailData.skor_total}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {detailData.fotos?.length > 0 && (
                      <div className="preview-section">
                        <h3>Bukti Foto</h3>
                        <a href={detailData.fotos[0].file_path} target="_blank" rel="noreferrer" className="btn btn-outline">
                          📎 Lihat Foto
                        </a>
                      </div>
                    )}

                    {detailData.catatan_petugas && (
                      <div className="preview-section">
                        <h3>Catatan</h3>
                        <p className="preview-note">{detailData.catatan_petugas}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowModal(false)}>Tutup</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Confirm Delete Modal ── */}
        {confirmDelete && (
          <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
            <div className="confirm-modal" onClick={e => e.stopPropagation()}>
              <div className="confirm-modal-icon">🗑️</div>
              <h3 className="confirm-modal-title">Hapus Penilaian?</h3>
              <p className="confirm-modal-desc">
                Penilaian <strong>{confirmDelete.nama}</strong> akan dihapus permanen.
                Data tidak dapat dikembalikan.
              </p>
              <div className="confirm-modal-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => setConfirmDelete(null)}
                  disabled={isDeleting}
                >
                  Batal
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
