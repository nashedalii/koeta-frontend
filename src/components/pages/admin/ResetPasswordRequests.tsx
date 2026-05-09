'use client'

import { useEffect, useState, useCallback } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/utils/api'

interface ResetRequest {
  request_id: number
  username: string
  role: 'petugas' | 'driver'
  nomor_hp: string
  status: 'pending' | 'selesai'
  created_at: string
  handled_at: string | null
}

interface ResetResult {
  username: string
  role: string
  password_baru: string
  nomor_hp: string
}

const ROLE_LABEL: Record<string, string> = { petugas: 'Petugas', driver: 'Supir' }

const toWaNumber = (no_hp: string) => {
  const digits = no_hp.replace(/\D/g, '')
  if (digits.startsWith('0')) return '62' + digits.slice(1)
  if (digits.startsWith('62')) return digits
  return '62' + digits
}

const WhatsAppIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
)

const CopyIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)

function RoleBadge({ role }: { role: string }) {
  const isDriver = role === 'driver'
  return (
    <span style={{
      background: isDriver ? '#dbeafe' : '#ede9fe',
      color: isDriver ? '#2563eb' : '#7c3aed',
      borderRadius: 6, padding: '2px 10px',
      fontSize: 12, fontWeight: 600,
    }}>
      {ROLE_LABEL[role] ?? role}
    </span>
  )
}

export default function ResetPasswordRequests() {
  const router = useRouter()
  const [requests, setRequests] = useState<ResetRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState<number | null>(null)
  const [result, setResult] = useState<ResetResult | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiFetch('/api/reset-request')
      setRequests(Array.isArray(data) ? data : [])
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const handleReset = async (id: number) => {
    setResetting(id)
    try {
      const data = await apiFetch(`/api/reset-request/${id}/reset`, { method: 'POST' })
      setResult(data)
      setCopied(false)
      fetchRequests()
    } catch (err: any) {
      alert(err.message ?? 'Gagal mereset password')
    } finally {
      setResetting(null)
    }
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result.password_baru)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWa = () => {
    if (!result) return
    const waNum = toWaNumber(result.nomor_hp)
    const roleLabel = ROLE_LABEL[result.role] ?? result.role
    const msg = encodeURIComponent(
      `Halo, berikut password baru Anda untuk akun ${roleLabel} di Sistem Penilaian Kinerja Driver:\n\nUsername: ${result.username}\nPassword Baru: ${result.password_baru}\n\nSilakan login dan segera ganti password Anda melalui menu Profil.`
    )
    window.open(`https://wa.me/${waNum}?text=${msg}`, '_blank')
  }

  const pending = requests.filter(r => r.status === 'pending')
  const selesai = requests.filter(r => r.status === 'selesai')

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">

        {/* ── Header ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 32 }}>
          <button
            onClick={() => router.push('/admin/kelola-user')}
            className="back-button"
            style={{ alignSelf: 'flex-start', marginBottom: 20 }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Kembali ke Kelola User
          </button>
          <PageHeader
            title="Permintaan Reset Password"
            subtitle="Daftar permintaan reset password dari petugas dan driver"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#fff" style={{ width: 28, height: 28 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            }
          />
        </div>

        {loading ? (
          <div className="loading-state">Memuat data...</div>
        ) : requests.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.95)', borderRadius: 16,
            padding: '40px 24px', textAlign: 'center', color: '#64748b',
          }}>
            Belum ada permintaan reset password.
          </div>
        ) : (
          <>
            {/* ── Pending ── */}
            {pending.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0 }}>
                    Menunggu Diproses
                  </h2>
                  <span style={{
                    background: '#fef3c7', color: '#d97706',
                    borderRadius: 999, padding: '1px 10px',
                    fontSize: 12, fontWeight: 700,
                  }}>{pending.length}</span>
                </div>

                {/* Desktop table */}
                <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                  className="reset-table-desktop">
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          {['#', 'Username', 'Role', 'Nomor HP', 'Waktu Request', 'Aksi'].map(h => (
                            <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#64748b', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pending.map((r, i) => (
                          <tr key={r.request_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: 13 }}>{i + 1}</td>
                            <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>{r.username}</td>
                            <td style={{ padding: '14px 16px' }}><RoleBadge role={r.role} /></td>
                            <td style={{ padding: '14px 16px', color: '#334155' }}>{r.nomor_hp}</td>
                            <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 13 }}>{formatDate(r.created_at)}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <button
                                onClick={() => handleReset(r.request_id)}
                                disabled={resetting === r.request_id}
                                style={{
                                  background: resetting === r.request_id ? '#94a3b8' : '#031E65',
                                  color: '#fff', border: 'none', borderRadius: 8,
                                  padding: '8px 16px', fontSize: 13, fontWeight: 600,
                                  cursor: resetting === r.request_id ? 'not-allowed' : 'pointer',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {resetting === r.request_id ? 'Memproses...' : 'Reset Password'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="reset-cards-mobile">
                  {pending.map(r => (
                    <div key={r.request_id} style={{
                      background: '#fff', borderRadius: 14,
                      padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', margin: 0 }}>{r.username}</p>
                          <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0' }}>{formatDate(r.created_at)}</p>
                        </div>
                        <RoleBadge role={r.role} />
                      </div>
                      <p style={{ fontSize: 13, color: '#334155', marginBottom: 14 }}>
                        HP: {r.nomor_hp}
                      </p>
                      <button
                        onClick={() => handleReset(r.request_id)}
                        disabled={resetting === r.request_id}
                        style={{
                          width: '100%', background: resetting === r.request_id ? '#94a3b8' : '#031E65',
                          color: '#fff', border: 'none', borderRadius: 8,
                          padding: '10px', fontSize: 13, fontWeight: 600,
                          cursor: resetting === r.request_id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {resetting === r.request_id ? 'Memproses...' : 'Reset Password'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Selesai ── */}
            {selesai.length > 0 && (
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>
                  Sudah Diproses
                </h2>
                <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          {['#', 'Username', 'Role', 'Nomor HP', 'Waktu Request', 'Diproses'].map(h => (
                            <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#64748b', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selesai.map((r, i) => (
                          <tr key={r.request_id} style={{ borderBottom: '1px solid #f1f5f9', opacity: 0.6 }}>
                            <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: 13 }}>{i + 1}</td>
                            <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>{r.username}</td>
                            <td style={{ padding: '14px 16px' }}><RoleBadge role={r.role} /></td>
                            <td style={{ padding: '14px 16px', color: '#334155' }}>{r.nomor_hp}</td>
                            <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 13 }}>{formatDate(r.created_at)}</td>
                            <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 13 }}>
                              {r.handled_at ? formatDate(r.handled_at) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal Hasil Reset ── */}
      {result && (
        <div className="modal-overlay" onClick={() => setResult(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2 style={{ color: '#0f172a' }}>Password Berhasil Direset</h2>
              <button className="modal-close" onClick={() => setResult(null)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '24px' }}>

              <div style={{
                background: '#f0fdf4', border: '1px solid #86efac',
                borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span style={{ color: '#15803d', fontSize: 14, fontWeight: 500 }}>
                  Password untuk <strong>{result.username}</strong> ({ROLE_LABEL[result.role]}) berhasil direset
                </span>
              </div>

              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>Password Sementara:</p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#f8fafc', border: '2px solid #e2e8f0',
                borderRadius: 10, padding: '12px 14px', marginBottom: 20,
              }}>
                <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: 3 }}>
                  {result.password_baru}
                </span>
                <button
                  onClick={handleCopy}
                  style={{
                    background: copied ? '#f0fdf4' : '#f1f5f9',
                    border: `1px solid ${copied ? '#86efac' : '#e2e8f0'}`,
                    borderRadius: 7, padding: '6px 10px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                    color: copied ? '#16a34a' : '#64748b', fontSize: 12, fontWeight: 500,
                  }}
                >
                  <CopyIcon />
                  {copied ? 'Disalin!' : 'Salin'}
                </button>
              </div>

              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>
                Sampaikan password ini ke {ROLE_LABEL[result.role]} melalui WhatsApp. Minta mereka segera ganti password setelah login.
              </p>

              <button
                onClick={handleWa}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: '#25D366', color: '#fff', border: 'none',
                  borderRadius: 10, padding: '12px 20px',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <WhatsAppIcon />
                Kirim via WhatsApp ke {result.nomor_hp}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .reset-table-desktop { display: block; }
        .reset-cards-mobile  { display: none; }
        @media (max-width: 640px) {
          .reset-table-desktop { display: none; }
          .reset-cards-mobile  { display: flex; }
        }
      `}</style>
    </div>
  )
}
