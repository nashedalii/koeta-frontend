'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/utils/api'

interface KoridorData {
  koridor_id: number
  nama_koridor: string
  tipe: 'koridor' | 'feeder'
  armada_id: number | null
  kode_armada: string | null
  nama_armada: string | null
}

interface FormData {
  nama_koridor: string
  tipe: 'koridor' | 'feeder'
  armada_id: string
}

interface ArmadaOption {
  armada_id: number
  kode_armada: string
  nama_armada: string
}

const EMPTY_FORM: FormData = { nama_koridor: '', tipe: 'koridor', armada_id: '' }

// ── SVG Icons ──────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
const PlusIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)
const EditIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const TrashIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)
const CloseIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
)
const WarningIcon = ({ size = 28, color = '#f59e0b' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

function TipeBadge({ tipe }: { tipe: string }) {
  const isKoridor = tipe === 'koridor'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
      background: isKoridor ? '#dbeafe' : '#fef3c7',
      color: isKoridor ? '#1d4ed8' : '#d97706',
      border: `1px solid ${isKoridor ? '#bfdbfe' : '#fde68a'}`,
    }}>
      {isKoridor ? 'Koridor' : 'Feeder'}
    </span>
  )
}

export default function KelolaKoridor() {
  const [koridors, setKoridors]     = useState<KoridorData[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [tipeFilter, setTipeFilter] = useState('All')
  const [armadaFilter, setArmadaFilter] = useState('All')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [armadaOptions, setArmadaOptions] = useState<ArmadaOption[]>([])
  const [isMobile, setIsMobile] = useState(false)

  const [showModal, setShowModal]           = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [modalMode, setModalMode]           = useState<'add' | 'edit'>('add')
  const [selectedKoridor, setSelectedKoridor] = useState<KoridorData | null>(null)
  const [formData, setFormData]             = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving]                 = useState(false)
  const [toast, setToast]                   = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchKoridors = async () => {
    try {
      setLoading(true); setError('')
      const data = await apiFetch('/api/koridor')
      setKoridors(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message ?? 'Gagal memuat data koridor')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    try {
      const auth = JSON.parse(localStorage.getItem('auth') || '{}')
      setIsSuperAdmin(auth?.user?.role === 'super_admin')
    } catch { /* ignore */ }
    apiFetch('/api/armada')
      .then((d: ArmadaOption[]) => setArmadaOptions(Array.isArray(d) ? d : []))
      .catch(() => {})
    fetchKoridors()
  }, [])

  // Lock body scroll when modal open
  useEffect(() => {
    if (showModal || showDeleteModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showModal, showDeleteModal])

  const filtered = koridors.filter(k => {
    const matchSearch = k.nama_koridor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (k.nama_armada ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchTipe   = tipeFilter === 'All' || k.tipe === tipeFilter
    const matchArmada = armadaFilter === 'All' || String(k.armada_id) === armadaFilter
    return matchSearch && matchTipe && matchArmada
  }).sort((a, b) => {
    const armadaSort = (a.kode_armada ?? '').localeCompare(b.kode_armada ?? '')
    if (armadaSort !== 0) return armadaSort
    return a.nama_koridor.localeCompare(b.nama_koridor)
  })

  const openAdd = () => {
    setModalMode('add')
    setFormData(EMPTY_FORM)
    setSelectedKoridor(null)
    setShowModal(true)
  }

  const openEdit = (k: KoridorData) => {
    setModalMode('edit')
    setSelectedKoridor(k)
    setFormData({ nama_koridor: k.nama_koridor, tipe: k.tipe, armada_id: k.armada_id?.toString() ?? '' })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.nama_koridor || !formData.tipe || (isSuperAdmin && !formData.armada_id)) {
      showToast('error', 'Nama koridor, tipe, dan armada wajib diisi'); return
    }
    setSaving(true)
    try {
      const body: Record<string, any> = { nama_koridor: formData.nama_koridor, tipe: formData.tipe }
      if (isSuperAdmin && formData.armada_id) body.armada_id = parseInt(formData.armada_id)
      if (modalMode === 'add') {
        await apiFetch('/api/koridor', { method: 'POST', body: JSON.stringify(body) })
        showToast('success', 'Koridor berhasil ditambahkan')
      } else if (selectedKoridor) {
        await apiFetch(`/api/koridor/${selectedKoridor.koridor_id}`, { method: 'PUT', body: JSON.stringify(body) })
        showToast('success', 'Koridor berhasil diupdate')
      }
      await fetchKoridors()
      setShowModal(false)
    } catch (err: any) {
      showToast('error', err.message ?? 'Gagal menyimpan data koridor')
    } finally { setSaving(false) }
  }

  const openDelete = (k: KoridorData) => { setSelectedKoridor(k); setShowDeleteModal(true) }

  const confirmDelete = async () => {
    if (!selectedKoridor) return
    setSaving(true)
    try {
      await apiFetch(`/api/koridor/${selectedKoridor.koridor_id}`, { method: 'DELETE' })
      showToast('success', 'Koridor berhasil dihapus')
      await fetchKoridors()
      setShowDeleteModal(false)
    } catch (err: any) {
      showToast('error', err.message ?? 'Gagal menghapus koridor')
    } finally { setSaving(false) }
  }

  return (
    <div>
      {/* ── Controls ── */}
      <div className="table-controls" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="search-box" style={{ width: '100%', maxWidth: '100%' }}>
          <span className="search-icon"><SearchIcon /></span>
          <input
            type="text"
            placeholder="Cari nama koridor atau armada..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div style={{ display: 'flex', gap: 10, width: '100%', flexWrap: 'wrap' }}>
          <select value={tipeFilter} onChange={e => setTipeFilter(e.target.value)} className="role-filter" style={{ flex: 1, minWidth: 120 }}>
            <option value="All">Semua Tipe</option>
            <option value="koridor">Koridor</option>
            <option value="feeder">Feeder</option>
          </select>

          {isSuperAdmin && (
            <select value={armadaFilter} onChange={e => setArmadaFilter(e.target.value)} className="role-filter" style={{ flex: 1, minWidth: 120 }}>
              <option value="All">Semua Armada</option>
              {armadaOptions.map(a => (
                <option key={a.armada_id} value={String(a.armada_id)}>{a.nama_armada}</option>
              ))}
            </select>
          )}

          <button onClick={openAdd} className="btn-add-user" style={{ flex: 1, minWidth: 140 }}>
            <PlusIcon />
            <span>Tambah Koridor</span>
          </button>
        </div>
      </div>

      {/* ── Table / Cards ── */}
      {loading ? (
        <div className="loading-state">Memuat data koridor...</div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchKoridors} className="btn-edit">Coba Lagi</button>
        </div>
      ) : isMobile ? (
        /* ── Mobile Cards ── */
        <div className="user-card-list" style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div className="no-data" style={{ background: 'white', borderRadius: 12, padding: 24, textAlign: 'center', color: '#94a3b8' }}>
              <p>Tidak ada data koridor</p>
            </div>
          ) : filtered.map(k => (
            <div key={k.koridor_id} className="user-card">
              <div className="user-card-left">
                <div className="user-card-info">
                  <div className="user-card-name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {k.nama_koridor}
                    <TipeBadge tipe={k.tipe} />
                  </div>
                  {isSuperAdmin && k.nama_armada && (
                    <div className="user-card-meta">
                      <span className="role-badge role-petugas" style={{ fontSize: '0.65rem', padding: '2px 7px' }}>{k.nama_armada}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="user-card-right">
                <div className="user-card-actions">
                  <button onClick={() => openEdit(k)} className="btn-edit" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 8px' }}>
                    <EditIcon />
                  </button>
                  <button onClick={() => openDelete(k)} className="btn-delete" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 8px' }}>
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Desktop Table ── */
        <div className="table-container">
          <table className="user-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nama Koridor / Feeder</th>
                <th>Tipe</th>
                {isSuperAdmin && <th>Armada</th>}
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((k, idx) => (
                <tr key={k.koridor_id}>
                  <td>{idx + 1}</td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{k.nama_koridor}</td>
                  <td><TipeBadge tipe={k.tipe} /></td>
                  {isSuperAdmin && (
                    <td>
                      {k.nama_armada
                        ? <span className="role-badge role-petugas">{k.nama_armada}</span>
                        : <span style={{ color: '#94a3b8' }}>—</span>}
                    </td>
                  )}
                  <td className="action-buttons">
                    <button onClick={() => openEdit(k)} className="btn-edit" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <EditIcon /> Edit
                    </button>
                    <button onClick={() => openDelete(k)} className="btn-delete" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <TrashIcon /> Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="no-data"><p>Tidak ada data koridor</p></div>
          )}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'add' ? 'Tambah Koridor / Feeder' : 'Edit Koridor / Feeder'}</h2>
              <button onClick={() => setShowModal(false)} className="modal-close"><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nama Koridor / Feeder <span className="required">*</span></label>
                <input
                  type="text"
                  value={formData.nama_koridor}
                  onChange={e => setFormData({ ...formData, nama_koridor: e.target.value })}
                  placeholder="Contoh: Koridor 1 - Pusat Kota"
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tipe <span className="required">*</span></label>
                  <select
                    value={formData.tipe}
                    onChange={e => setFormData({ ...formData, tipe: e.target.value as any })}
                    className="form-select"
                  >
                    <option value="koridor">Koridor</option>
                    <option value="feeder">Feeder</option>
                  </select>
                </div>
                {isSuperAdmin && (
                  <div className="form-group">
                    <label className="form-label">Armada <span className="required">*</span></label>
                    <select
                      value={formData.armada_id}
                      onChange={e => setFormData({ ...formData, armada_id: e.target.value })}
                      className="form-select"
                    >
                      <option value="">Pilih Armada</option>
                      {armadaOptions.map(a => (
                        <option key={a.armada_id} value={String(a.armada_id)}>{a.nama_armada}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn-cancel">Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-save">
                {saving ? 'Menyimpan...' : modalMode === 'add' ? 'Tambah Koridor' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {showDeleteModal && selectedKoridor && (
        <div className="modal-overlay delete-modal" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="delete-icon"><WarningIcon size={32} /></div>
            <h2 className="modal-title">Konfirmasi Hapus Koridor</h2>
            <p className="delete-message">Apakah Anda yakin ingin menghapus koridor ini?</p>
            <div className="delete-user-info">
              <div className="delete-user-name">{selectedKoridor.nama_koridor}</div>
              <div className="delete-user-role">
                {selectedKoridor.tipe === 'koridor' ? 'Koridor' : 'Feeder'}
                {selectedKoridor.nama_armada ? ` • ${selectedKoridor.nama_armada}` : ''}
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', margin: '0.5rem 0' }}>
              Koridor yang masih digunakan driver tidak dapat dihapus.
            </p>
            <div className="form-actions">
              <button onClick={() => setShowDeleteModal(false)} className="btn-cancel">Batal</button>
              <button onClick={confirmDelete} disabled={saving} className="btn-confirm-delete">
                {saving ? 'Menghapus...' : 'Ya, Hapus Koridor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 99999,
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px', borderRadius: 14,
          background: toast.type === 'success' ? '#064e3b' : '#7f1d1d',
          color: '#fff', fontSize: 14, fontWeight: 500,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          maxWidth: 380, lineHeight: 1.4,
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
  )
}
