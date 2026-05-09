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
      padding: isMobile ? '20px 16px' : '28px 32px',
      marginBottom: 24,
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
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
            fontSize: isMobile ? '1.125rem' : '1.375rem',
            fontWeight: 700,
            lineHeight: 1.3,
            color: '#fff',
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              margin: '4px 0 0',
              color: 'rgba(255,255,255,0.65)',
              fontSize: '0.875rem',
              lineHeight: 1.4,
            }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  )
}
