'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/utils/api'
import PageHeader from '@/components/ui/PageHeader'

interface BusData {
  bus_id: number
  kode_bus: string
  nopol: string
  status_aktif: 'aktif' | 'nonaktif'
  driver_id: number | null
  armada_id: number | null
  kode_armada: string | null
  nama_armada: string | null
  nama_driver: string | null
}

interface FormData {
  kode_bus: string
  nopol: string
  armada_id: string
  status_aktif: 'aktif' | 'nonaktif'
}

interface ArmadaOption {
  armada_id: number
  kode_armada: string
  nama_armada: string
}

const EMPTY_FORM: FormData = { kode_bus: '', nopol: '', armada_id: '', status_aktif: 'aktif' }

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
const DriverIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

function StatusDot({ status }: { status: string }) {
  const active = status === 'aktif'
  return (
    <span className={`status-badge status-${status}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: active ? '#10b981' : '#ef4444', display: 'inline-block', flexShrink: 0 }} />
      {active ? 'Aktif' : 'Nonaktif'}
    </span>
  )
}

// ── Component ──────────────────────────────────────────────────────────
export default function KelolaBus() {
  const [buses, setBuses]         = useState<BusData[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [armadaFilter, setArmadaFilter] = useState('All')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [armadaOptions, setArmadaOptions] = useState<ArmadaOption[]>([])
  const [isMobile, setIsMobile]   = useState(false)

  const [showModal, setShowModal]           = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [modalMode, setModalMode]           = useState<'add' | 'edit'>('add')
  const [selectedBus, setSelectedBus]       = useState<BusData | null>(null)
  const [formData, setFormData]             = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving]                 = useState(false)

  const fetchBuses = async () => {
    try {
      setLoading(true); setError('')
      const data = await apiFetch('/api/bus')
      setBuses(data ?? [])
    } catch (err: any) {
      setError(err.message ?? 'Gagal memuat data bus')
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
    fetchBuses()
  }, [])

  const filtered = buses.filter(b => {
    const matchSearch =
      b.kode_bus.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.nopol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.nama_driver ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchArmada = armadaFilter === 'All' || String(b.armada_id) === armadaFilter
    return matchSearch && matchArmada
  })

  const openAdd = () => { setModalMode('add'); setFormData(EMPTY_FORM); setSelectedBus(null); setShowModal(true) }

  const openEdit = (bus: BusData) => {
    setModalMode('edit'); setSelectedBus(bus)
    setFormData({ kode_bus: bus.kode_bus, nopol: bus.nopol, armada_id: bus.armada_id?.toString() ?? '', status_aktif: bus.status_aktif })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.kode_bus || !formData.nopol || (isSuperAdmin && !formData.armada_id)) {
      alert('Kode bus, nopol, dan armada wajib diisi'); return
    }
    setSaving(true)
    try {
      const body: Record<string, any> = { kode_bus: formData.kode_bus, nopol: formData.nopol, status_aktif: formData.status_aktif }
      if (isSuperAdmin && formData.armada_id) body.armada_id = parseInt(formData.armada_id)
      if (modalMode === 'add') {
        await apiFetch('/api/bus', { method: 'POST', body: JSON.stringify(body) })
      } else if (selectedBus) {
        await apiFetch(`/api/bus/${selectedBus.bus_id}`, { method: 'PUT', body: JSON.stringify(body) })
      }
      await fetchBuses()
      setShowModal(false)
    } catch (err: any) {
      alert(err.message ?? 'Gagal menyimpan data bus')
    } finally { setSaving(false) }
  }

  const openDelete = (bus: BusData) => { setSelectedBus(bus); setShowDeleteModal(true) }

  const confirmDelete = async () => {
    if (!selectedBus) return
    setSaving(true)
    try {
      await apiFetch(`/api/bus/${selectedBus.bus_id}`, { method: 'DELETE' })
      await fetchBuses()
      setShowDeleteModal(false)
    } catch (err: any) {
      alert(err.message ?? 'Gagal menghapus bus')
    } finally { setSaving(false) }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <PageHeader
          title="Kelola Bus"
          subtitle="Manajemen data bus dan kendaraan armada"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#fff" style={{ width: 28, height: 28 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          }
        />

        {/* ── Controls ── */}
        <div className="table-controls">
          <div className="search-box">
            <span className="search-icon"><SearchIcon /></span>
            <input
              type="text"
              placeholder="Cari kode bus, nopol, atau driver..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {isSuperAdmin && (
            <select value={armadaFilter} onChange={e => setArmadaFilter(e.target.value)} className="role-filter">
              <option value="All">Semua Armada</option>
              {armadaOptions.map(a => (
                <option key={a.armada_id} value={String(a.armada_id)}>{a.nama_armada}</option>
              ))}
            </select>
          )}

          <button onClick={openAdd} className="btn-add-user">
            <PlusIcon />
            <span>Tambah Bus</span>
          </button>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="loading-state">Memuat data bus...</div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchBuses} className="btn-edit">Coba Lagi</button>
          </div>
        ) : isMobile ? (
          /* ── Mobile Cards ── */
          <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              {filtered.length === 0 ? (
                <div className="no-data" style={{ background: 'white', borderRadius: 12, padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                  <p>Tidak ada data bus</p>
                </div>
              ) : filtered.map(bus => (
                <div key={bus.bus_id} className="user-card">
                  <div className="user-card-left">
                    <div className="user-card-avatar">
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, fontSize: '0.7rem', fontWeight: 700, background: '#e0e7ff', color: '#031e65', marginRight: 8, flexShrink: 0 }}>
                        {bus.kode_bus}
                      </span>
                    </div>
                    <div className="user-card-info">
                      <div className="user-card-name">{bus.nopol}</div>
                      <div className="user-card-meta">
                        {bus.nama_armada && <span className="role-badge role-petugas" style={{ fontSize: '0.65rem', padding: '2px 7px' }}>{bus.nama_armada}</span>}
                        {bus.nama_driver && <span className="user-card-hp">{bus.nama_driver}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="user-card-right">
                    <StatusDot status={bus.status_aktif} />
                    <div className="user-card-actions">
                      <button onClick={() => openEdit(bus)} className="btn-edit" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: '0.78rem' }}>
                        <EditIcon /> Edit
                      </button>
                      <button onClick={() => openDelete(bus)} className="btn-delete" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: '0.78rem' }}>
                        <TrashIcon /> Hapus
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
                  <th>#</th><th>Kode Bus</th><th>Nomor Polisi</th>
                  <th>Armada</th><th>Driver</th><th>Status</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bus, idx) => (
                  <tr key={bus.bus_id}>
                    <td>{idx + 1}</td>
                    <td><strong style={{ color: '#031e65' }}>{bus.kode_bus}</strong></td>
                    <td>{bus.nopol}</td>
                    <td>{bus.nama_armada ? <span className="role-badge role-petugas">{bus.nama_armada}</span> : <span style={{ color: '#94a3b8' }}>-</span>}</td>
                    <td>
                      {bus.nama_driver
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><DriverIcon />{bus.nama_driver}</span>
                        : <span style={{ color: '#94a3b8' }}>—</span>}
                    </td>
                    <td><StatusDot status={bus.status_aktif} /></td>
                    <td className="action-buttons">
                      <button onClick={() => openEdit(bus)} className="btn-edit" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><EditIcon /> Edit</button>
                      <button onClick={() => openDelete(bus)} className="btn-delete" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><TrashIcon /> Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="no-data"><p>Tidak ada data bus</p></div>}
          </div>
        )}

        {/* ── Add / Edit Modal ── */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{modalMode === 'add' ? 'Tambah Bus Baru' : 'Edit Bus'}</h2>
                <button onClick={() => setShowModal(false)} className="modal-close"><CloseIcon /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Kode Bus <span className="required">*</span></label>
                  <input type="text" value={formData.kode_bus} onChange={e => setFormData({ ...formData, kode_bus: e.target.value })} placeholder="Contoh: TR 01" className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Nomor Polisi <span className="required">*</span></label>
                  <input type="text" value={formData.nopol} onChange={e => setFormData({ ...formData, nopol: e.target.value })} placeholder="Contoh: BL 1234 AB" className="form-input" />
                </div>
                <div className="form-row">
                  {isSuperAdmin && (
                    <div className="form-group">
                      <label className="form-label">Armada <span className="required">*</span></label>
                      <select value={formData.armada_id} onChange={e => setFormData({ ...formData, armada_id: e.target.value })} className="form-select">
                        <option value="">Pilih Armada</option>
                        {armadaOptions.map(a => (
                          <option key={a.armada_id} value={String(a.armada_id)}>{a.nama_armada}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select value={formData.status_aktif} onChange={e => setFormData({ ...formData, status_aktif: e.target.value as any })} className="form-select">
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowModal(false)} className="btn-cancel">Batal</button>
                <button onClick={handleSave} disabled={saving} className="btn-save">
                  {saving ? 'Menyimpan...' : modalMode === 'add' ? 'Tambah Bus' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete Modal ── */}
        {showDeleteModal && selectedBus && (
          <div className="modal-overlay delete-modal" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="delete-icon"><WarningIcon size={32} /></div>
              <h2 className="modal-title">Konfirmasi Hapus Bus</h2>
              <p className="delete-message">Apakah Anda yakin ingin menghapus bus ini?</p>
              <div className="delete-user-info">
                <div className="delete-user-name">{selectedBus.kode_bus}</div>
                <div className="delete-user-role">{selectedBus.nopol} • {selectedBus.nama_armada}</div>
              </div>
              {selectedBus.driver_id && (
                <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', margin: '0.5rem 0' }}>
                  <WarningIcon size={14} color="#ef4444" />
                  Bus ini masih digunakan oleh {selectedBus.nama_driver}
                </p>
              )}
              <div className="form-actions">
                <button onClick={() => setShowDeleteModal(false)} className="btn-cancel">Batal</button>
                <button onClick={confirmDelete} disabled={saving || !!selectedBus.driver_id} className="btn-confirm-delete">
                  {saving ? 'Menghapus...' : 'Ya, Hapus Bus'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
