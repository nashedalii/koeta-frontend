'use client'

import { useState, useEffect, type ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon: ReactNode
  actions?: ReactNode
}

export default function PageHeader({ title, subtitle, icon, actions }: PageHeaderProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #2563eb 100%)',
      borderRadius: 16,
      padding: isMobile ? '14px 14px' : '28px 32px',
      marginBottom: 24,
      color: '#fff',
      display: 'flex',
      alignItems: isMobile ? 'flex-start' : 'center',
      justifyContent: 'space-between',
      gap: isMobile ? 10 : 16,
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16 }}>
        <div style={{
          width: isMobile ? 36 : 48, height: isMobile ? 36 : 48, borderRadius: 12,
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: isMobile ? '1rem' : '1.375rem',
            fontWeight: 700,
            lineHeight: 1.3,
            color: '#fff',
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              margin: '2px 0 0',
              color: 'rgba(255,255,255,0.65)',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              lineHeight: 1.4,
            }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: isMobile ? undefined : 0, flexWrap: 'wrap', width: isMobile ? '100%' : undefined }}>
          {actions}
        </div>
      )}
    </div>
  )
}
