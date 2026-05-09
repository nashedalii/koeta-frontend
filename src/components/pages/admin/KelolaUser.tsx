'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/utils/api'

// ── Toast ──────────────────────────────────────────────────────────────
type ToastType = 'error' | 'success' | 'warning'
interface Toast { id: number; message: string; type: ToastType }

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  const colors: Record<ToastType, { bg: string; border: string; icon: string; iconColor: string }> = {
    error:   { bg: '#fff1f2', border: '#fca5a5', icon: '✕', iconColor: '#ef4444' },
    success: { bg: '#f0fdf4', border: '#86efac', icon: '✓', iconColor: '#22c55e' },
    warning: { bg: '#fffbeb', border: '#fcd34d', icon: '!', iconColor: '#f59e0b' },
  }
  if (toasts.length === 0) return null
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360 }}>
      {toasts.map(t => {
        const c = colors[t.type]
        return (
          <div key={t.id} style={{
            background: c.bg, border: `1.5px solid ${c.border}`,
            borderRadius: 12, padding: '14px 16px',
            display: 'flex', alignItems: 'flex-start', gap: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            animation: 'slideIn 0.25s ease',
          }}>
            <span style={{
              width: 24, height: 24, borderRadius: '50%',
              background: c.iconColor, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}>{c.icon}</span>
            <p style={{ margin: 0, fontSize: 14, color: '#1e293b', lineHeight: 1.5, flex: 1 }}>{t.message}</p>
            <button onClick={() => onRemove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
          </div>
        )
      })}
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  )
}

// ── Types ──────────────────────────────────────────────────────────────
interface UserData {
  id: number
  nama: string
  identifier: string
  no_hp: string
  status_aktif: 'aktif' | 'nonaktif'
  role: 'super_admin' | 'admin' | 'petugas' | 'driver'
  nama_kernet?: string
  armada_id?: number
  kode_armada?: string
  nama_armada?: string
  bus_id?: number
  kode_bus?: string
  nopol?: string
  bus_status?: 'aktif' | 'nonaktif'
  koridor_id?: number
  nama_koridor?: string
  tipe_koridor?: string
}

interface ArmadaOption {
  armada_id: number
  kode_armada: string
  nama_armada: string
}

interface KoridorOption {
  koridor_id: number
  nama_koridor: string
  tipe: string
  armada_id: number
}

interface BusOption {
  bus_id: number
  kode_bus: string
  nopol: string
  status_aktif: 'aktif' | 'nonaktif'
  driver_id: number | null
}

interface FormData {
  nama: string
  identifier: string
  no_hp: string
  status_aktif: 'aktif' | 'nonaktif'
  nama_kernet: string
  armada_id: string
  bus_id: string
  koridor_id: string
}

interface AddFormData {
  role: 'super_admin' | 'admin' | 'petugas' | 'driver'
  nama: string
  nomor_pegawai: string
  username: string
  no_hp: string
  armada_id: string
  nama_kernet: string
  bus_id: string
  koridor_id: string
}

const EMPTY_ADD_FORM: AddFormData = {
  role: 'admin', nama: '', nomor_pegawai: '', username: '',
  no_hp: '', armada_id: '', nama_kernet: '', bus_id: '', koridor_id: '',
}

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin:       'Admin',
  petugas:     'Petugas',
  driver:      'Supir',
}

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
const CopyIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)
const CheckIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const WhatsAppIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
)

const toWaNumber = (no_hp: string) => {
  const digits = no_hp.replace(/\D/g, '')
  if (digits.startsWith('0')) return '62' + digits.slice(1)
  if (digits.startsWith('62')) return digits
  return '62' + digits
}
const WarningIcon = ({ size = 28, color = '#f59e0b' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const KeyIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
)

function RoleInitial({ role }: { role: string }) {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    super_admin: { bg: '#fce7f3', color: '#be185d', label: 'SA' },
    admin:       { bg: '#fef3c7', color: '#d97706', label: 'A' },
    petugas:     { bg: '#ede9fe', color: '#7c3aed', label: 'P' },
    driver:      { bg: '#dbeafe', color: '#2563eb', label: 'S' },
  }
  const c = cfg[role] ?? cfg.driver
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 22, height: 22, borderRadius: '50%',
      fontSize: '0.65rem', fontWeight: 700,
      background: c.bg, color: c.color,
      marginRight: 8, flexShrink: 0,
    }}>
      {c.label}
    </span>
  )
}

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  color?: string
  weight?: number
}

function CustomSelect({
  value, onChange, options, disabled = false, placeholder = 'Pilih...',
}: {
  value: string
  onChange: (val: string) => void
  options: SelectOption[]
  disabled?: boolean
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleOpen = () => {
    if (disabled || !btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setDropPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    setOpen(o => !o)
  }

  const selected = options.find(o => o.value === value)

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className="custom-select-btn"
        style={{ opacity: disabled ? 0.55 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <span style={{ color: selected?.color ?? '#334155', fontWeight: selected?.weight ?? 400, flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : <span style={{ color: '#94a3b8' }}>{placeholder}</span>}
        </span>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div
          className="custom-select-dropdown"
          style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
        >
          {options.map(opt => (
            <div
              key={opt.value}
              onMouseDown={e => e.preventDefault()}
              onClick={() => { if (!opt.disabled) { onChange(opt.value); setOpen(false) } }}
              className={`custom-select-option${opt.value === value ? ' selected' : ''}${opt.disabled ? ' disabled' : ''}`}
              style={{ color: opt.disabled ? '#94a3b8' : (opt.color ?? '#1e293b'), fontWeight: opt.value === value ? 600 : (opt.weight ?? 400) }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
export default function KelolaUser() {
  const router = useRouter()
  const [toasts, setToasts] = useState<Toast[]>([])
  const showToast = useCallback((message: string, type: ToastType = 'error') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [callerId, setCallerId]         = useState<number | null>(null)
  const [armadaOptions, setArmadaOptions] = useState<ArmadaOption[]>([])
  const [pendingResetCount, setPendingResetCount] = useState(0)

  const [users, setUsers]         = useState<UserData[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')

  const [showModal, setShowModal]           = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [showAddModal, setShowAddModal]     = useState(false)

  const [selectedUser, setSelectedUser]   = useState<UserData | null>(null)
  const [newPassword, setNewPassword]     = useState('')
  const [passwordModalTitle, setPasswordModalTitle] = useState('Password Berhasil Direset')
  const [saving, setSaving]                   = useState(false)
  const [copied, setCopied]                   = useState(false)
  const [busOptions, setBusOptions]           = useState<BusOption[]>([])
  const [koridorOptions, setKoridorOptions]   = useState<KoridorOption[]>([])
  const [addFormData, setAddFormData]         = useState<AddFormData>(EMPTY_ADD_FORM)
  const [addBusOptions, setAddBusOptions]     = useState<BusOption[]>([])
  const [addKoridorOptions, setAddKoridorOptions] = useState<KoridorOption[]>([])

  const [formData, setFormData] = useState<FormData>({
    nama: '', identifier: '', no_hp: '', status_aktif: 'aktif',
    nama_kernet: '', armada_id: '', bus_id: '', koridor_id: '',
  })

  const fetchUsers = async () => {
    try {
      setLoading(true); setError('')
      const data = await apiFetch('/api/users')
      setUsers(data ?? [])
    } catch (err: any) {
      setError(err.message ?? 'Gagal memuat data user')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Detect caller role and fetch armada list
    try {
      const auth = JSON.parse(localStorage.getItem('auth') || '{}')
      const role = auth?.user?.role
      setIsSuperAdmin(role === 'super_admin')
      setCallerId(auth?.user?.id ?? null)
    } catch { /* ignore */ }

    apiFetch('/api/armada')
      .then((d: ArmadaOption[]) => setArmadaOptions(Array.isArray(d) ? d : []))
      .catch(() => {})

    apiFetch('/api/reset-request/count')
      .then((d: { count: number }) => setPendingResetCount(d.count ?? 0))
      .catch(() => {})

    fetchUsers()
  }, [])

  const ROLE_ORDER: Record<string, number> = { super_admin: 0, admin: 1, petugas: 2, driver: 3 }

  const filtered = users
    .filter(u => {
      const matchSearch =
        u.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.no_hp.toLowerCase().includes(searchTerm.toLowerCase())
      const matchRole = roleFilter === 'All' || u.role === roleFilter
      return matchSearch && matchRole
    })
    .sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9))

  const openEdit = async (user: UserData) => {
    setSelectedUser(user)
    setFormData({
      nama: user.nama, identifier: user.identifier, no_hp: user.no_hp,
      status_aktif: user.status_aktif, nama_kernet: user.nama_kernet ?? '',
      armada_id: user.armada_id?.toString() ?? '', bus_id: user.bus_id?.toString() ?? '',
      koridor_id: user.koridor_id?.toString() ?? '',
    })
    if (user.role === 'driver' && user.armada_id) {
      apiFetch(`/api/bus?armada_id=${user.armada_id}`)
        .then(buses => setBusOptions(buses ?? []))
        .catch(() => setBusOptions([]))
      apiFetch(`/api/koridor?armada_id=${user.armada_id}`)
        .then(koridor => setKoridorOptions(koridor ?? []))
        .catch(() => setKoridorOptions([]))
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!selectedUser) return
    setSaving(true)
    try {
      const body: Record<string, any> = {
        nama: formData.nama, identifier: formData.identifier,
        no_hp: formData.no_hp, status_aktif: formData.status_aktif,
      }
      if (selectedUser.role !== 'admin') body.armada_id = parseInt(formData.armada_id)
      if (selectedUser.role === 'driver') {
        body.nama_kernet = formData.nama_kernet
        body.bus_id = formData.bus_id ? parseInt(formData.bus_id) : null
        body.koridor_id = formData.koridor_id ? parseInt(formData.koridor_id) : null
      }
      await apiFetch(`/api/users/${selectedUser.role}/${selectedUser.id}`, {
        method: 'PUT', body: JSON.stringify(body),
      })
      await fetchUsers()
      setShowModal(false)
    } catch (err: any) {
      showToast(err.message ?? 'Gagal menyimpan perubahan')
    } finally { setSaving(false) }
  }

  const openDelete = (user: UserData) => { setSelectedUser(user); setShowDeleteModal(true) }

  const confirmDelete = async () => {
    if (!selectedUser) return
    setSaving(true)
    try {
      await apiFetch(`/api/users/${selectedUser.role}/${selectedUser.id}`, { method: 'DELETE' })
      await fetchUsers()
      setShowDeleteModal(false)
    } catch (err: any) {
      showToast(err.message ?? 'Gagal menghapus user')
    } finally { setSaving(false) }
  }

  const handleResetPassword = async () => {
    if (!selectedUser) return
    setSaving(true)
    try {
      const data = await apiFetch(
        `/api/users/${selectedUser.role}/${selectedUser.id}/reset-password`,
        { method: 'PUT' }
      )
      setNewPassword(data.password_baru)
      setPasswordModalTitle('Password Berhasil Direset')
      setCopied(false)
      setShowModal(false)
      setShowResetModal(true)
    } catch (err: any) {
      showToast(err.message ?? 'Gagal mereset password')
    } finally { setSaving(false) }
  }

  const openAdd = () => { setAddFormData(EMPTY_ADD_FORM); setAddBusOptions([]); setShowAddModal(true) }

  const handleAdd = async () => {
    const { role, nama, nomor_pegawai, username, no_hp, armada_id, nama_kernet, bus_id } = addFormData
    if (!nama || !username || !no_hp) { showToast('Nama, username, dan no HP wajib diisi', 'warning'); return }
    if (role !== 'driver' && !nomor_pegawai) { showToast('Nomor pegawai wajib diisi', 'warning'); return }
    if (role !== 'super_admin' && !armada_id) { showToast('Armada wajib diisi', 'warning'); return }

    setSaving(true)
    try {
      let body: Record<string, any>
      let endpoint: string
      if (role === 'super_admin' || role === 'admin') {
        body = {
          nama_admin: nama, nomor_pegawai, username, no_hp,
          role,
          ...(role === 'admin' && armada_id ? { armada_id: parseInt(armada_id) } : {}),
        }
        endpoint = '/api/users/admin'
      } else if (role === 'petugas') {
        body = { nama_petugas: nama, nomor_pegawai, username, no_hp, armada_id: parseInt(armada_id) }
        endpoint = '/api/users/petugas'
      } else {
        body = {
          nama_driver: nama, nama_kernet: nama_kernet || null, username, no_hp,
          armada_id: parseInt(armada_id),
          koridor_id: addFormData.koridor_id ? parseInt(addFormData.koridor_id) : null,
        }
        endpoint = '/api/users/driver'
      }
      const result = await apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) })
      if (role === 'driver' && bus_id && result?.user?.id) {
        try {
          await apiFetch(`/api/users/driver/${result.user.id}`, {
            method: 'PUT', body: JSON.stringify({ bus_id: parseInt(bus_id) }),
          })
        } catch { /* bus assignment gagal, tidak kritis */ }
      }
      await fetchUsers()
      setSelectedUser({ id: result.user.id, nama: result.user.nama ?? nama, identifier: '', no_hp, status_aktif: 'aktif', role })
      setNewPassword(result.password_awal)
      setPasswordModalTitle('User Berhasil Dibuat')
      setCopied(false)
      setShowAddModal(false)
      setShowResetModal(true)
    } catch (err: any) {
      showToast(err.message ?? 'Gagal menambahkan user')
    } finally { setSaving(false) }
  }

  return (
    <>
    <ToastContainer toasts={toasts} onRemove={id => setToasts(prev => prev.filter(t => t.id !== id))} />
    <div className="dashboard-container">
      <div className="dashboard-content">
        <PageHeader
          title="Kelola User"
          subtitle="Manajemen akun petugas dan driver"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#fff" style={{ width: 28, height: 28 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />

        {/* ── Controls ── */}
        <div className="table-controls">
          <div className="search-box">
            <span className="search-icon"><SearchIcon /></span>
            <input
              type="text"
              placeholder="Cari nama atau no HP..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="role-filter">
            <option value="All">Semua Role</option>
            {isSuperAdmin && <option value="super_admin">Super Admin</option>}
            <option value="admin">Admin</option>
            <option value="petugas">Petugas</option>
            <option value="driver">Supir</option>
          </select>

          <button
            onClick={() => router.push('/admin/reset-password')}
            style={{
              position: 'relative', display: 'flex', alignItems: 'center', gap: 6,
              background: '#fff', border: '1.5px solid #e2e8f0',
              borderRadius: 8, padding: '8px 14px',
              fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Lupa Password
            {pendingResetCount > 0 && (
              <span style={{
                position: 'absolute', top: -7, right: -7,
                background: '#ef4444', color: '#fff',
                borderRadius: '50%', width: 18, height: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
              }}>
                {pendingResetCount > 9 ? '9+' : pendingResetCount}
              </span>
            )}
          </button>

          <button onClick={openAdd} className="btn-add-user">
            <PlusIcon />
            <span>Tambah User</span>
          </button>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="loading-state">Memuat data...</div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchUsers} className="btn-edit">Coba Lagi</button>
          </div>
        ) : (
          <div className="table-container">
            {/* Desktop Table */}
            <table className="user-table">
              <thead>
                <tr>
                  <th>#</th><th>Nama</th><th>No HP</th><th>Role</th>
                  <th>Bus / Armada</th><th>Status</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, idx) => {
                  const isSelf = user.id === callerId && (user.role === 'admin' || user.role === 'super_admin')
                  const canDelete = !isSelf && (isSuperAdmin || (user.role !== 'admin' && user.role !== 'super_admin'))
                  return (
                  <tr key={`${user.role}-${user.id}`}>
                    <td>{idx + 1}</td>
                    <td className="user-name" style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={isSelf ? { fontWeight: 700, color: '#2563eb' } : undefined}>
                        {user.nama}
                      </span>
                    </td>
                    <td>{user.no_hp}</td>
                    <td>
                      <span className={`role-badge role-${user.role === 'super_admin' ? 'super-admin' : user.role}`}>
                        {ROLE_LABEL[user.role]}
                      </span>
                    </td>
                    <td>
                      {user.role === 'super_admin' ? (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      ) : user.role === 'driver' && user.status_aktif === 'nonaktif' ? (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      ) : user.role === 'driver' && user.kode_bus ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {user.bus_status === 'nonaktif' ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, color: '#ef4444', fontSize: '0.85rem' }}>
                              <WarningIcon size={14} color="#ef4444" />
                              Bus dinonaktifkan
                            </span>
                          ) : (
                            <span style={{ fontWeight: 600, color: '#667eea' }}>{user.kode_bus} - {user.nopol}</span>
                          )}
                          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{user.nama_armada}</span>
                        </div>
                      ) : user.nama_armada ? (
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{user.nama_armada}</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td><StatusDot status={user.status_aktif} /></td>
                    <td className="action-buttons">
                      <button onClick={() => openEdit(user)} className="btn-edit" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <EditIcon /> Edit
                      </button>
                      {canDelete && (
                        <button onClick={() => openDelete(user)} className="btn-delete" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <TrashIcon /> Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Mobile Card List */}
            <div className="user-card-list">
              {filtered.map((user, idx) => {
                const isSelf = user.id === callerId && (user.role === 'admin' || user.role === 'super_admin')
                const canDelete = !isSelf && (isSuperAdmin || (user.role !== 'admin' && user.role !== 'super_admin'))
                return (
                <div key={`card-${user.role}-${user.id}`} className="user-card">
                  <div className="user-card-left">
                    <div className="user-card-info">
                      <div className="user-card-name" style={isSelf ? { fontWeight: 700, color: '#2563eb' } : undefined}>{user.nama}</div>
                      <div className="user-card-meta">
                        <span className={`role-badge role-${user.role === 'super_admin' ? 'super-admin' : user.role}`} style={{ fontSize: '0.65rem', padding: '2px 7px' }}>
                          {ROLE_LABEL[user.role]}
                        </span>
                        <span className="user-card-hp">{user.no_hp}</span>
                      </div>
                      {user.role === 'driver' && user.kode_bus && user.status_aktif === 'aktif' && (
                        <div className="user-card-bus">
                          {user.bus_status === 'nonaktif' ? (
                            <span style={{ color: '#ef4444', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <WarningIcon size={11} color="#ef4444" /> Bus dinonaktifkan
                            </span>
                          ) : (
                            <span style={{ color: '#667eea', fontSize: '0.75rem', fontWeight: 600 }}>
                              {user.kode_bus} · {user.nama_armada}
                            </span>
                          )}
                        </div>
                      )}
                      {(user.role === 'admin' || user.role === 'petugas') && user.nama_armada && (
                        <div className="user-card-bus">
                          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{user.nama_armada}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="user-card-right">
                    <StatusDot status={user.status_aktif} />
                    <div className="user-card-actions">
                      <button onClick={() => openEdit(user)} className="btn-edit" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: '0.78rem' }}>
                        <EditIcon /> Edit
                      </button>
                      {canDelete && (
                        <button onClick={() => openDelete(user)} className="btn-delete" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: '0.78rem' }}>
                          <TrashIcon /> Hapus
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                )
              })}
            </div>

            {filtered.length === 0 && (
              <div className="no-data"><p>Tidak ada data user yang ditemukan</p></div>
            )}
          </div>
        )}

        {/* ── Edit Modal ── */}
        {showModal && selectedUser && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit User — {ROLE_LABEL[selectedUser.role]}</h2>
                <button onClick={() => setShowModal(false)} className="modal-close"><CloseIcon /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Lengkap <span className="required">*</span></label>
                  <input type="text" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">{selectedUser.role === 'driver' ? 'Username' : 'Nomor Pegawai'}</label>
                  <input type="text" value={formData.identifier} onChange={e => setFormData({ ...formData, identifier: e.target.value })} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">No HP</label>
                  <input type="tel" value={formData.no_hp} onChange={e => setFormData({ ...formData, no_hp: e.target.value })} className="form-input" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <CustomSelect
                      value={formData.status_aktif}
                      onChange={val => setFormData({ ...formData, status_aktif: val as any })}
                      options={[{ value: 'aktif', label: 'Aktif' }, { value: 'nonaktif', label: 'Nonaktif' }]}
                    />
                  </div>
                  {selectedUser.role !== 'super_admin' && selectedUser.role !== 'admin' && (
                    <div className="form-group">
                      <label className="form-label">Armada</label>
                      <CustomSelect
                        value={formData.armada_id}
                        placeholder="Pilih Armada"
                        onChange={async val => {
                          setFormData({ ...formData, armada_id: val, bus_id: '', koridor_id: '' })
                          if (selectedUser.role === 'driver' && val) {
                            apiFetch(`/api/bus?armada_id=${val}`).then(b => setBusOptions(b ?? [])).catch(() => setBusOptions([]))
                            apiFetch(`/api/koridor?armada_id=${val}`).then(k => setKoridorOptions(k ?? [])).catch(() => setKoridorOptions([]))
                          }
                        }}
                        options={armadaOptions.map(a => ({ value: String(a.armada_id), label: a.nama_armada }))}
                      />
                    </div>
                  )}
                </div>

                {selectedUser.role === 'driver' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Nama Kernet (Opsional)</label>
                      <input type="text" value={formData.nama_kernet} onChange={e => setFormData({ ...formData, nama_kernet: e.target.value })} placeholder="Kosongkan jika tidak ada kernet" className="form-input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Koridor / Feeder</label>
                      <CustomSelect
                        value={formData.koridor_id}
                        onChange={val => setFormData({ ...formData, koridor_id: val })}
                        disabled={!formData.armada_id}
                        placeholder="— Tanpa Koridor —"
                        options={[
                          { value: '', label: '— Tanpa Koridor —' },
                          ...koridorOptions.map(k => ({ value: String(k.koridor_id), label: k.nama_koridor })),
                        ]}
                      />
                      {!formData.armada_id && (
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>Pilih armada terlebih dahulu</p>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Bus</label>
                      {formData.status_aktif === 'nonaktif' ? (
                        <div className="form-input" style={{ color: '#94a3b8', background: '#f8fafc', cursor: 'not-allowed' }}>— (driver nonaktif)</div>
                      ) : (
                        <CustomSelect
                          value={formData.bus_id}
                          onChange={val => setFormData({ ...formData, bus_id: val })}
                          placeholder="— Tanpa Bus —"
                          options={[
                            { value: '', label: '— Tanpa Bus —' },
                            ...busOptions.map(bus => {
                              const isOwn      = bus.bus_id === selectedUser.bus_id
                              const isTaken    = bus.driver_id !== null && bus.driver_id !== selectedUser.id
                              const isNonaktif = bus.status_aktif === 'nonaktif'
                              const isDisabled = isTaken || isNonaktif
                              let suffix = ''
                              if (isOwn && isNonaktif) suffix = ' (Nonaktif)'
                              else if (isTaken)        suffix = ' (Terpakai)'
                              else if (isNonaktif)     suffix = ' (Nonaktif)'
                              return {
                                value: String(bus.bus_id),
                                label: `${bus.kode_bus} - ${bus.nopol}${suffix}`,
                                disabled: isDisabled,
                                color: isOwn ? '#16a34a' : isDisabled ? '#ef4444' : undefined,
                                weight: isOwn ? 600 : undefined,
                              }
                            }),
                          ]}
                        />
                      )}
                    </div>
                  </>
                )}

                <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '1rem', paddingTop: '1rem' }}>
                  <button type="button" onClick={handleResetPassword} disabled={saving} className="btn-delete"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <KeyIcon /> Reset Password
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowModal(false)} className="btn-cancel">Batal</button>
                <button onClick={handleSave} disabled={saving} className="btn-save">
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Add Modal ── */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Tambah User Baru</h2>
                <button onClick={() => setShowAddModal(false)} className="modal-close"><CloseIcon /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Role <span className="required">*</span></label>
                  <CustomSelect
                    value={addFormData.role}
                    onChange={val => setAddFormData({ ...EMPTY_ADD_FORM, role: val as any })}
                    options={[
                      ...(isSuperAdmin ? [{ value: 'super_admin', label: 'Super Admin' }] : []),
                      { value: 'admin', label: 'Admin Vendor' },
                      { value: 'petugas', label: 'Petugas' },
                      { value: 'driver', label: 'Supir' },
                    ]}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nama Lengkap <span className="required">*</span></label>
                  <input type="text" value={addFormData.nama} onChange={e => setAddFormData({ ...addFormData, nama: e.target.value })} placeholder="Masukkan nama lengkap" className="form-input" />
                </div>
                {addFormData.role !== 'driver' && (
                  <div className="form-group">
                    <label className="form-label">Nomor Pegawai <span className="required">*</span></label>
                    <input type="text" value={addFormData.nomor_pegawai} onChange={e => setAddFormData({ ...addFormData, nomor_pegawai: e.target.value })} placeholder="Contoh: NIP-001" className="form-input" />
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Username <span className="required">*</span></label>
                    <input type="text" value={addFormData.username} onChange={e => setAddFormData({ ...addFormData, username: e.target.value })} placeholder="Username login" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">No HP <span className="required">*</span></label>
                    <input type="tel" value={addFormData.no_hp} onChange={e => setAddFormData({ ...addFormData, no_hp: e.target.value })} placeholder="08xxxxxxxxxx" className="form-input" />
                  </div>
                </div>
                {addFormData.role !== 'super_admin' && (
                  <div className="form-group">
                    <label className="form-label">Armada <span className="required">*</span></label>
                    <CustomSelect
                      value={addFormData.armada_id}
                      placeholder="Pilih Armada"
                      onChange={async val => {
                        setAddFormData({ ...addFormData, armada_id: val, bus_id: '', koridor_id: '' })
                        if (addFormData.role === 'driver' && val) {
                          apiFetch(`/api/bus?armada_id=${val}`).then(b => setAddBusOptions(b ?? [])).catch(() => setAddBusOptions([]))
                          apiFetch(`/api/koridor?armada_id=${val}`).then(k => setAddKoridorOptions(k ?? [])).catch(() => setAddKoridorOptions([]))
                        }
                      }}
                      options={armadaOptions.map(a => ({ value: String(a.armada_id), label: a.nama_armada }))}
                    />
                  </div>
                )}
                {addFormData.role === 'driver' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Nama Kernet (Opsional)</label>
                      <input type="text" value={addFormData.nama_kernet} onChange={e => setAddFormData({ ...addFormData, nama_kernet: e.target.value })} placeholder="Kosongkan jika tidak ada kernet" className="form-input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Koridor / Feeder</label>
                      <CustomSelect
                        value={addFormData.koridor_id}
                        onChange={val => setAddFormData({ ...addFormData, koridor_id: val })}
                        disabled={!addFormData.armada_id}
                        placeholder="— Tanpa Koridor —"
                        options={[
                          { value: '', label: '— Tanpa Koridor —' },
                          ...addKoridorOptions.map(k => ({ value: String(k.koridor_id), label: k.nama_koridor })),
                        ]}
                      />
                      {!addFormData.armada_id && (
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>Pilih armada terlebih dahulu</p>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Bus</label>
                      <CustomSelect
                        value={addFormData.bus_id}
                        onChange={val => setAddFormData({ ...addFormData, bus_id: val })}
                        disabled={!addFormData.armada_id}
                        placeholder="— Tanpa Bus —"
                        options={[
                          { value: '', label: '— Tanpa Bus —' },
                          ...addBusOptions.map(bus => {
                            const isTaken    = bus.driver_id !== null
                            const isNonaktif = bus.status_aktif === 'nonaktif'
                            const isDisabled = isTaken || isNonaktif
                            let suffix = ''
                            if (isTaken)         suffix = ' (Terpakai)'
                            else if (isNonaktif) suffix = ' (Nonaktif)'
                            return {
                              value: String(bus.bus_id),
                              label: `${bus.kode_bus} - ${bus.nopol}${suffix}`,
                              disabled: isDisabled,
                              color: isDisabled ? '#ef4444' : undefined,
                            }
                          }),
                        ]}
                      />
                      {!addFormData.armada_id && (
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>Pilih armada terlebih dahulu</p>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowAddModal(false)} className="btn-cancel">Batal</button>
                <button onClick={handleAdd} disabled={saving} className="btn-save">
                  {saving ? 'Menyimpan...' : 'Tambah User'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete Modal ── */}
        {showDeleteModal && selectedUser && (
          <div className="modal-overlay delete-modal" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="delete-icon"><WarningIcon size={32} /></div>
              <h2 className="modal-title">Konfirmasi Hapus User</h2>
              <p className="delete-message">Apakah Anda yakin ingin menghapus user ini?</p>
              <div className="delete-user-info">
                <div className="delete-user-name">{selectedUser.nama}</div>
                <div className="delete-user-role">{selectedUser.no_hp} • {ROLE_LABEL[selectedUser.role]}</div>
              </div>
              <div className="form-actions">
                <button onClick={() => setShowDeleteModal(false)} className="btn-cancel">Batal</button>
                <button onClick={confirmDelete} disabled={saving} className="btn-confirm-delete">
                  {saving ? 'Menghapus...' : 'Ya, Hapus User'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Reset Password Result Modal ── */}
        {showResetModal && (
          <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{passwordModalTitle}</h2>
                <button onClick={() => setShowResetModal(false)} className="modal-close"><CloseIcon /></button>
              </div>
              <div className="modal-body">
                <p style={{ marginBottom: '0.75rem', color: '#64748b' }}>
                  Password baru untuk <strong>{selectedUser?.nama}</strong>:
                </p>
                <div style={{
                  background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8,
                  padding: '1rem 1rem 1rem 1.25rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.2em', color: '#1e293b' }}>
                    {newPassword}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(newPassword).then(() => {
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      })
                    }}
                    title="Salin password"
                    style={{
                      flexShrink: 0, background: copied ? '#f0fdf4' : 'white',
                      border: `1.5px solid ${copied ? '#86efac' : '#cbd5e1'}`,
                      borderRadius: 6, padding: '6px 8px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                      color: copied ? '#16a34a' : '#64748b', fontSize: '0.8rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {copied ? <><CheckIcon /> Tersalin</> : <><CopyIcon /> Salin</>}
                  </button>
                </div>
                <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <WarningIcon size={14} color="#ef4444" />
                  Catat password ini. Password tidak bisa dilihat lagi setelah modal ditutup.
                </p>
              </div>
              <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                {selectedUser?.no_hp ? (
                  <a
                    href={`https://wa.me/${toWaNumber(selectedUser.no_hp)}?text=${encodeURIComponent(`Halo ${selectedUser.nama}, password akun Anda telah direset.\nPassword baru: *${newPassword}*\nSilakan login dan segera ganti password Anda.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 8, fontSize: '0.875rem',
                      fontWeight: 600, textDecoration: 'none',
                      background: '#22c55e', color: 'white',
                    }}
                  >
                    <WhatsAppIcon /> Kirim via WA
                  </a>
                ) : <span />}
                <button onClick={() => setShowResetModal(false)} className="btn-save">Sudah Dicatat</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
