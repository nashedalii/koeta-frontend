'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const ROLE_REDIRECT: Record<string, string> = {
  super_admin: '/admin/dashboard',
  admin:       '/admin/dashboard',
  petugas:     '/petugas/dashboard',
  driver:      '/driver/dashboard',
}

export default function LoginForm() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [showLupaModal, setShowLupaModal] = useState(false)
  const [lupaForm, setLupaForm] = useState({ username: '', role: 'petugas', nomor_hp: '' })
  const [lupaSending, setLupaSending] = useState(false)
  const [lupaSuccess, setLupaSuccess] = useState('')
  const [lupaError, setLupaError] = useState('')

  const handleLupaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLupaSending(true)
    setLupaError('')
    setLupaSuccess('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reset-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lupaForm),
      })
      const data = await res.json()
      if (!res.ok) { setLupaError(data.message || 'Gagal mengirim permintaan'); return }
      setLupaSuccess(data.message)
    } catch {
      setLupaError('Tidak dapat terhubung ke server')
    } finally {
      setLupaSending(false)
    }
  }

  const closeLupaModal = () => {
    setShowLupaModal(false)
    setLupaForm({ username: '', role: 'petugas', nomor_hp: '' })
    setLupaSuccess('')
    setLupaError('')
  }

  useEffect(() => {
    const raw = localStorage.getItem('auth')
    if (!raw) return
    try {
      const auth = JSON.parse(raw)
      const role = auth?.user?.role
      if (auth?.token && role && ROLE_REDIRECT[role]) router.replace(ROLE_REDIRECT[role])
    } catch {
      localStorage.removeItem('auth')
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      })
      const data = await res.json()
      if (!res.ok) { setErrorMessage(data.message || 'Login gagal'); return }
      const roleLabel: Record<string, string> = { super_admin: 'Admin', admin: 'Admin', petugas: 'Petugas', driver: 'Supir' }
      const auth = {
        token: data.token,
        user: {
          id: data.user.id,
          nama: data.user.nama,
          role: data.user.role,
          roleLabel: roleLabel[data.user.role] ?? data.user.role,
          ...(data.user.armada_id !== undefined && { armada_id: data.user.armada_id }),
        },
      }
      localStorage.setItem('auth', JSON.stringify(auth))
      router.push(ROLE_REDIRECT[data.user.role] ?? '/')
    } catch {
      setErrorMessage('Tidak dapat terhubung ke server')
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    paddingTop: '13px', paddingBottom: '13px',
    paddingLeft: '46px', paddingRight: '16px',
    fontSize: '14px', color: '#0F172A',
    background: '#F8FAFC',
    border: '2px solid #E2E8F0',
    borderRadius: '12px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
    boxSizing: 'border-box' as const,
  }

  return (
    <>
    <main style={{ minHeight: '100vh', display: 'flex', width: '100%' }}>

      {/* ── LEFT PANEL: Branding ── */}
      <div
        className="hidden lg:flex flex-col items-center justify-center relative overflow-hidden"
        style={{
          width: '42%',
          minHeight: '100vh',
          flexShrink: 0,
          background: 'linear-gradient(155deg, #020f3d 0%, #031E65 40%, #0a2d8f 100%)',
        }}
      >
        {/* Dot pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        {/* Glow circles */}
        <div className="absolute" style={{
          top: '-120px', right: '-120px', width: '400px', height: '400px',
          borderRadius: '50%', background: 'rgba(3,105,161,0.18)',
          filter: 'blur(60px)',
        }} />
        <div className="absolute" style={{
          bottom: '-100px', left: '-100px', width: '350px', height: '350px',
          borderRadius: '50%', background: 'rgba(3,30,101,0.3)',
          filter: 'blur(60px)',
        }} />

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center text-center" style={{ maxWidth: '380px', padding: '0 40px' }}>

          {/* Logo badge */}
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '22px',
            padding: '22px',
            marginBottom: '28px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <Image
              src="/logodishub.png"
              alt="Logo Dinas Perhubungan Aceh"
              width={96}
              height={96}
              priority
              style={{ objectFit: 'contain', display: 'block' }}
            />
          </div>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(3,105,161,0.3)', border: '1px solid rgba(3,105,161,0.5)',
            borderRadius: '100px', padding: '4px 14px', marginBottom: '16px',
          }}>
            <span style={{ color: '#93c5fd', fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Dinas Perhubungan · Aceh
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            color: '#ffffff', fontSize: '30px', fontWeight: '700',
            lineHeight: '1.25', marginBottom: '14px',
          }}>
            Sistem Penilaian<br />Kinerja Driver
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', lineHeight: '1.75', marginBottom: '36px' }}>
            Platform manajemen dan evaluasi kinerja sopir TransKoetaradja secara digital dan terukur.
          </p>

          {/* Features */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
            {[
              { label: 'Manajemen Data Driver', desc: 'Kelola data pengemudi terpusat' },
              { label: 'Penilaian Terstruktur', desc: 'Evaluasi berbasis kriteria bobot' },
            
            ].map((f) => (
              <div key={f.label} style={{
                display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', padding: '11px 14px',
              }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
                  background: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p style={{ color: '#fff', fontSize: '12px', fontWeight: '600', marginBottom: '1px' }}>{f.label}</p>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* ── RIGHT PANEL: Form ── */}
      <div
        className="flex-1 flex items-center justify-center"
        style={{ minHeight: '100vh', background: '#F0F4F8', padding: '48px 24px' }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>

          {/* Mobile branding */}
          <div className="lg:hidden flex flex-col items-center" style={{ marginBottom: '36px' }}>
            <Image src="/logodishub.png" alt="Logo" width={70} height={70} priority style={{ objectFit: 'contain' }} />
            <p style={{ marginTop: '12px', color: '#031E65', fontWeight: '700', fontSize: '15px' }}>
              Dinas Perhubungan Aceh
            </p>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '3px' }}>
              Sistem Penilaian Kinerja Driver
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '40px 36px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 20px 40px rgba(3,30,101,0.1)',
            border: '1px solid #E2E8F0',
          }}>

            {/* Card header */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: '#EFF6FF', borderRadius: '8px', padding: '4px 12px', marginBottom: '14px',
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0369A1' }} />
                <span style={{ color: '#0369A1', fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                  Portal Masuk
                </span>
              </div>
              <h2 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '26px', fontWeight: '700', color: '#0F172A',
                lineHeight: '1.2', marginBottom: '8px',
              }}>
                Selamat Datang
              </h2>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>
                Masuk dengan akun Anda untuk mengakses sistem
              </p>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: '#F1F5F9', marginBottom: '24px' }} />

            {/* Form */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Username field */}
              <div>
                <label htmlFor="identifier" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '7px' }}>
                  Username atau Nomor Pegawai
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    color: '#94a3b8', pointerEvents: 'none', display: 'flex',
                  }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <input
                    id="identifier"
                    type="text"
                    placeholder="admin@dishub atau NIP"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0369A1'
                      e.target.style.boxShadow = '0 0 0 4px rgba(3,105,161,0.1)'
                      e.target.style.background = '#fff'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#E2E8F0'
                      e.target.style.boxShadow = 'none'
                      e.target.style.background = '#F8FAFC'
                    }}
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label htmlFor="password" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '7px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    color: '#94a3b8', pointerEvents: 'none', display: 'flex',
                  }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ ...inputStyle, paddingRight: '50px' }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0369A1'
                      e.target.style.boxShadow = '0 0 0 4px rgba(3,105,161,0.1)'
                      e.target.style.background = '#fff'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#E2E8F0'
                      e.target.style.boxShadow = 'none'
                      e.target.style.background = '#F8FAFC'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    style={{
                      position: 'absolute', right: '0', top: '0', bottom: '0', width: '48px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#94a3b8', cursor: 'pointer', background: 'transparent', border: 'none',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#0369A1')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                  >
                    {showPassword ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {errorMessage && (
                <div role="alert" style={{
                  display: 'flex', gap: '10px', alignItems: 'flex-start',
                  padding: '12px 14px',
                  background: '#FEF2F2', border: '1px solid #FECACA',
                  borderLeft: '4px solid #EF4444', borderRadius: '10px',
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#EF4444" style={{ flexShrink: 0, marginTop: '1px' }}>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <p style={{ color: '#B91C1C', fontSize: '13px', lineHeight: '1.5' }}>{errorMessage}</p>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%', minHeight: '50px',
                  padding: '13px 24px',
                  fontSize: '13px', fontWeight: '700',
                  letterSpacing: '1px', textTransform: 'uppercase',
                  color: '#fff',
                  background: isLoading
                    ? '#94a3b8'
                    : 'linear-gradient(135deg, #031E65 0%, #0a2d8f 50%, #0369A1 100%)',
                  border: 'none', borderRadius: '12px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s, transform 0.1s, box-shadow 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: isLoading ? 'none' : '0 4px 16px rgba(3,30,101,0.3)',
                }}
                onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(3,30,101,0.4)' } }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = isLoading ? 'none' : '0 4px 16px rgba(3,30,101,0.3)' }}
                onMouseDown={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(0.98)' }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin" width="17" height="17" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" style={{ opacity: 0.75 }} />
                    </svg>
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk ke Sistem
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
              {/* Lupa Password */}
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowLupaModal(true)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#0369A1', fontSize: '13px', fontWeight: 500,
                    textDecoration: 'underline', padding: 0,
                  }}
                >
                  Lupa Password?
                </button>
              </div>

            </form>
          </div>

          {/* Footer */}
          <p style={{ textAlign: 'center', marginTop: '20px', color: '#94a3b8', fontSize: '12px' }}>
            © {new Date().getFullYear()} Dinas Perhubungan · Pemerintah Aceh
          </p>
        </div>
      </div>

    </main>

    {/* Modal Lupa Password */}

    {showLupaModal && (
      <div
        onClick={closeLupaModal}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            overflow: 'hidden',
          }}
        >
          {/* Modal Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
          }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>Lupa Password</h2>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0' }}>
                Permintaan akan dikirim ke admin untuk diproses
              </p>
            </div>
            <button
              onClick={closeLupaModal}
              style={{
                background: '#f1f5f9', border: 'none', borderRadius: 8,
                width: 32, height: 32, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: '#64748b', fontWeight: 700,
              }}
            >×</button>
          </div>

          {/* Modal Body */}
          <div style={{ padding: '24px' }}>
            {lupaSuccess ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <p style={{ fontSize: 14, color: '#15803d', fontWeight: 500, marginBottom: 20 }}>{lupaSuccess}</p>
                <button
                  onClick={closeLupaModal}
                  style={{
                    background: '#031E65', color: '#fff', border: 'none',
                    borderRadius: 10, padding: '11px 28px',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >Tutup</button>
              </div>
            ) : (
              <form onSubmit={handleLupaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Anda adalah
                  </label>
                  <select
                    value={lupaForm.role}
                    onChange={e => setLupaForm(f => ({ ...f, role: e.target.value }))}
                    style={{
                      width: '100%', padding: '11px 14px', fontSize: 14,
                      border: '2px solid #e2e8f0', borderRadius: 10,
                      background: '#f8fafc', color: '#0f172a', outline: 'none',
                    }}
                  >
                    <option value="petugas">Petugas</option>
                    <option value="driver">Supir / Driver</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Username / Nomor Pegawai
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan username Anda"
                    value={lupaForm.username}
                    onChange={e => setLupaForm(f => ({ ...f, username: e.target.value }))}
                    required
                    style={{
                      width: '100%', padding: '11px 14px', fontSize: 14,
                      border: '2px solid #e2e8f0', borderRadius: 10,
                      background: '#f8fafc', color: '#0f172a', outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Nomor HP (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    value={lupaForm.nomor_hp}
                    onChange={e => setLupaForm(f => ({ ...f, nomor_hp: e.target.value }))}
                    required
                    style={{
                      width: '100%', padding: '11px 14px', fontSize: 14,
                      border: '2px solid #e2e8f0', borderRadius: 10,
                      background: '#f8fafc', color: '#0f172a', outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>
                    Admin akan mengirim password baru ke nomor ini via WhatsApp
                  </p>
                </div>

                {lupaError && (
                  <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca',
                    borderLeft: '4px solid #ef4444', borderRadius: 8,
                    padding: '10px 14px', fontSize: 13, color: '#b91c1c',
                  }}>
                    {lupaError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={lupaSending}
                  style={{
                    background: lupaSending ? '#94a3b8' : 'linear-gradient(135deg, #031E65 0%, #0369A1 100%)',
                    color: '#fff', border: 'none', borderRadius: 10,
                    padding: '12px', fontSize: 13, fontWeight: 700,
                    cursor: lupaSending ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.5px',
                  }}
                >
                  {lupaSending ? 'Mengirim...' : 'Kirim Permintaan'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  )
}
