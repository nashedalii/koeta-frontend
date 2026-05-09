'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

const API = process.env.NEXT_PUBLIC_API_URL

function getToken(): string {
  try { return JSON.parse(localStorage.getItem('auth') ?? '').token } catch { return '' }
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

interface Profile {
  id: number
  nama: string
  nomor_pegawai?: string
  username: string
  no_hp: string
  foto_profil: string | null
  status_aktif: string
  role: string
  nama_armada?: string
  kode_armada?: string
  nama_kernet?: string
  kode_bus?: string
  nopol?: string
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; gradient: string }> = {
  driver:  { label: 'Driver',  color: '#2563eb', bg: '#dbeafe', gradient: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' },
  petugas: { label: 'Petugas', color: '#7c3aed', bg: '#ede9fe', gradient: 'linear-gradient(135deg,#6d28d9,#8b5cf6)' },
}

export default function ProfilePage() {
  const [profile, setProfile]     = useState<Profile | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  const [editMode, setEditMode]   = useState(false)
  const [username, setUsername]   = useState('')
  const [no_hp, setNoHp]          = useState('')
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveMsg, setSaveMsg]     = useState('')

  const [showPass, setShowPass]   = useState(false)
  const [passLama, setPassLama]   = useState('')
  const [passBaru, setPassBaru]   = useState('')
  const [passLoading, setPassLoading] = useState(false)
  const [passMsg, setPassMsg]     = useState('')

  const fileRef = useRef<HTMLInputElement>(null)
  const [fotoLoading, setFotoLoading] = useState(false)
  const [fotoMsg, setFotoMsg]     = useState('')
  const [hoverAvatar, setHoverAvatar] = useState(false)

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/profile/me`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      setProfile(data)
      setUsername(data.username)
      setNoHp(data.no_hp)
    } catch {
      setError('Tidak dapat terhubung ke server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProfile() }, [])

  const handleSaveInfo = async () => {
    setSaveLoading(true); setSaveMsg('')
    try {
      const res = await fetch(`${API}/api/profile/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ username, no_hp }),
      })
      const data = await res.json()
      setSaveMsg(res.ok ? '✓ Profil berhasil diperbarui' : data.message)
      if (res.ok) { setEditMode(false); fetchProfile() }
    } catch { setSaveMsg('Gagal menyimpan perubahan') }
    finally { setSaveLoading(false) }
  }

  const handleFotoUpload = async (file: File) => {
    setFotoLoading(true); setFotoMsg('')
    const form = new FormData()
    form.append('foto', file)
    try {
      const res = await fetch(`${API}/api/profile/me/foto`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      })
      const data = await res.json()
      setFotoMsg(res.ok ? '✓ Foto berhasil diperbarui' : data.message)
      if (res.ok) fetchProfile()
    } catch { setFotoMsg('Gagal mengupload foto') }
    finally { setFotoLoading(false) }
  }

  const handleFotoDelete = async () => {
    if (!confirm('Hapus foto profil?')) return
    setFotoLoading(true); setFotoMsg('')
    try {
      const res = await fetch(`${API}/api/profile/me/foto`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      setFotoMsg(res.ok ? '✓ Foto berhasil dihapus' : data.message)
      if (res.ok) fetchProfile()
    } catch { setFotoMsg('Gagal menghapus foto') }
    finally { setFotoLoading(false) }
  }

  const handleChangePassword = async () => {
    setPassLoading(true); setPassMsg('')
    try {
      const res = await fetch(`${API}/api/profile/me/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ password_lama: passLama, password_baru: passBaru }),
      })
      const data = await res.json()
      setPassMsg(res.ok ? '✓ Password berhasil diubah' : data.message)
      if (res.ok) { setPassLama(''); setPassBaru(''); setShowPass(false) }
    } catch { setPassMsg('Gagal mengubah password') }
    finally { setPassLoading(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Memuat profil...</p>
      </div>
    </div>
  )

  if (error || !profile) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px 20px', borderRadius: 12, fontSize: 14 }}>
        {error || 'Profil tidak ditemukan'}
      </div>
    </div>
  )

  const isDriver  = profile.role === 'driver'
  const isPetugas = profile.role === 'petugas'
  const roleConf  = ROLE_CONFIG[profile.role] ?? ROLE_CONFIG.driver

  const infoItems = [
    isPetugas && profile.nomor_pegawai ? { icon: idIcon, label: 'Nomor Pegawai', value: profile.nomor_pegawai } : null,
    profile.nama_armada               ? { icon: armadaIcon, label: 'Armada', value: `${profile.kode_armada} — ${profile.nama_armada}` } : null,
    isDriver && profile.nama_kernet   ? { icon: kernetIcon, label: 'Nama Kernet', value: profile.nama_kernet } : null,
    isDriver && profile.kode_bus      ? { icon: busIcon, label: 'Bus', value: `${profile.kode_bus} (${profile.nopol})` } : null,
  ].filter(Boolean) as { icon: string; label: string; value: string }[]

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px 48px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Page title ── */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'white', margin: 0 }}>Profil Saya</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Kelola informasi akun dan keamanan Anda</p>
      </div>

      {/* ── Hero Card: Avatar + Identitas ── */}
      <div style={{
        background: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
      }}>
        {/* Gradient banner */}
        <div style={{ height: 80, background: roleConf.gradient, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.12) 0%, transparent 60%)' }} />
        </div>

        <div style={{ padding: '0 28px 28px', position: 'relative' }}>
          {/* Avatar — overlaps banner */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -44, marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              {/* Avatar circle */}
              <div
                onClick={() => fileRef.current?.click()}
                onMouseEnter={() => setHoverAvatar(true)}
                onMouseLeave={() => setHoverAvatar(false)}
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '4px solid #fff',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
                  cursor: 'pointer',
                  position: 'relative',
                  background: roleConf.gradient,
                }}
              >
                {profile.foto_profil ? (
                  <Image src={profile.foto_profil} alt="Foto Profil" fill sizes="88px" style={{ objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                    {getInitials(profile.nama)}
                  </div>
                )}
                {/* Hover overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: hoverAvatar || fotoLoading ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                  borderRadius: '50%',
                }}>
                  {fotoLoading ? (
                    <svg style={{ animation: 'spin 0.8s linear infinite' }} width={22} height={22} viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Hapus foto button */}
              {profile.foto_profil && !fotoLoading && (
                <button
                  onClick={handleFotoDelete}
                  title="Hapus foto"
                  style={{
                    position: 'absolute', bottom: 2, right: 2,
                    width: 24, height: 24, borderRadius: '50%',
                    background: '#ef4444', border: '2px solid #fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', padding: 0,
                  }}
                >
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Status badge */}
            <div style={{
              display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 4,
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: roleConf.color, background: roleConf.bg, padding: '4px 12px', borderRadius: 999 }}>
                {roleConf.label}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 999,
                color: profile.status_aktif === 'aktif' ? '#059669' : '#dc2626',
                background: profile.status_aktif === 'aktif' ? '#d1fae5' : '#fee2e2',
              }}>
                {profile.status_aktif === 'aktif' ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          </div>

          {/* Nama */}
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>{profile.nama}</h2>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 20px' }}>
            {profile.no_hp}
          </p>

          {/* Hidden file input */}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFotoUpload(f) }} />

          {fotoMsg && (
            <div style={{ fontSize: 12, marginBottom: 16, color: fotoMsg.startsWith('✓') ? '#059669' : '#dc2626', display: 'flex', alignItems: 'center', gap: 6 }}>
              {fotoMsg}
            </div>
          )}

          {/* Info grid */}
          {infoItems.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {infoItems.map((item, i) => (
                <div key={i} style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: roleConf.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={roleConf.color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d={item.icon} />
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{item.label}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '2px 0 0' }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Card: Informasi Akun ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Informasi Akun</h2>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Username dan no HP login</p>
            </div>
          </div>
          {!editMode && (
            <button onClick={() => { setEditMode(true); setSaveMsg('') }} style={outlineBtnStyle}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FieldRow label="Username" value={username} editing={editMode} onChange={setUsername} type="text" />
          <FieldRow label="No HP" value={no_hp} editing={editMode} onChange={setNoHp} type="tel" />
        </div>

        {saveMsg && (
          <p style={{ fontSize: 13, marginTop: 12, color: saveMsg.startsWith('✓') ? '#059669' : '#dc2626' }}>{saveMsg}</p>
        )}

        {editMode && (
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={handleSaveInfo} disabled={saveLoading} style={primaryBtnStyle}>
              {saveLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            <button onClick={() => { setEditMode(false); setUsername(profile.username); setNoHp(profile.no_hp); setSaveMsg('') }} style={ghostBtnStyle}>
              Batal
            </button>
          </div>
        )}
      </div>

      {/* ── Card: Keamanan ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showPass ? 20 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Keamanan</h2>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Ganti password akun Anda</p>
            </div>
          </div>
          {!showPass && (
            <button onClick={() => { setShowPass(true); setPassMsg('') }} style={outlineBtnStyle}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Ganti Password
            </button>
          )}
        </div>

        {showPass && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FieldRow label="Password Lama" value={passLama} editing={true} onChange={setPassLama} type="password" placeholder="Masukkan password lama" />
            <FieldRow label="Password Baru" value={passBaru} editing={true} onChange={setPassBaru} type="password" placeholder="Minimal 6 karakter" />

            {passMsg && (
              <p style={{ fontSize: 13, color: passMsg.startsWith('✓') ? '#059669' : '#dc2626', margin: 0 }}>{passMsg}</p>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={handleChangePassword} disabled={passLoading || !passLama || !passBaru} style={primaryBtnStyle}>
                {passLoading ? 'Menyimpan...' : 'Simpan Password'}
              </button>
              <button onClick={() => { setShowPass(false); setPassLama(''); setPassBaru(''); setPassMsg('') }} style={ghostBtnStyle}>
                Batal
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

/* ── Helpers ────────────────────────────────────────────── */

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function FieldRow({ label, value, editing, onChange, type, placeholder }: {
  label: string; value: string; editing: boolean
  onChange: (v: string) => void; type: string; placeholder?: string
}) {
  const [showPwd, setShowPwd] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPwd ? 'text' : 'password') : type

  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
      {editing ? (
        <div style={{ position: 'relative' }}>
          <input
            type={inputType}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: isPassword ? '10px 42px 10px 14px' : '10px 14px', fontSize: 14,
              border: '2px solid #e5e7eb', borderRadius: 10,
              outline: 'none', color: '#111827',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 0,
              }}
              tabIndex={-1}
            >
              <EyeIcon open={showPwd} />
            </button>
          )}
        </div>
      ) : (
        <div style={{ padding: '10px 14px', background: '#f9fafb', borderRadius: 10, fontSize: 14, color: '#111827', border: '1px solid #f3f4f6' }}>
          {value}
        </div>
      )}
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────── */

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
  border: '1px solid rgba(0,0,0,0.06)',
}

const primaryBtnStyle: React.CSSProperties = {
  padding: '10px 20px', fontSize: 13, fontWeight: 600,
  background: '#2563eb', color: '#fff',
  border: 'none', borderRadius: 10, cursor: 'pointer',
  transition: 'background 0.2s',
}

const outlineBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', fontSize: 13, fontWeight: 600,
  background: '#fff', color: '#374151',
  border: '1.5px solid #e5e7eb', borderRadius: 10, cursor: 'pointer',
  transition: 'background 0.2s',
}

const ghostBtnStyle: React.CSSProperties = {
  padding: '10px 16px', fontSize: 13, fontWeight: 500,
  background: 'transparent', color: '#6b7280',
  border: '1.5px solid #e5e7eb', borderRadius: 10, cursor: 'pointer',
}

/* ── Icon paths (SVG d attributes) ──────────────────────── */
const idIcon      = 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0'
const armadaIcon  = 'M8 7h12m0 0l-4-4m4 4-4 4m0 6H4m0 0l4 4m-4-4 4-4'
const kernetIcon  = 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0'
const busIcon     = 'M8 6v12M16 6v12M2 10h20M2 14h20M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z'
