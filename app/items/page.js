'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const Logo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#2563eb"/>
    <text x="16" y="23" textAnchor="middle" fontSize="18" fontWeight="900" fontFamily="Arial,sans-serif" fill="white">A</text>
  </svg>
)


export default function InvoicesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const match = document.cookie.match(/cha_user=([^;]+)/)
    if (!match) { router.push('/login'); return }
    try {
      const u = JSON.parse(decodeURIComponent(match[1]))
      setUser(u)
      loadInvoices(u.id)
    } catch(e) { router.push('/login') }
  }, [])

  const loadInvoices = async (userId) => {
    try {
      const token = document.cookie.match(/cha_token=([^;]+)/)?.[1] || ''
      const res = await fetch(`/api/items?user_id=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setInvoices(data.data || [])
    } catch(e) {}
    setLoading(false)
  }

  const COLOR = '#7c3aed'
  const statusColor = (s) => ({ chasing:'#d97706', paid:'#059669', written_off:'#94a3b8' }[s] || '#64748b')
  const statusLabel = (s) => ({ chasing:'Chasing', paid:'Paid ✓', written_off:'Written off' }[s] || s)

  return (
    <div style={{minHeight:'100vh',background:'#f8fafc',fontFamily:'Inter,Arial,sans-serif'}}>
      {/* Header */}
      <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <Link href="/dashboard" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none'}}>
          <Logo size={28}/>
          <span style={{fontSize:14,fontWeight:800,color:'#0f172a'}}>ChaseIQ</span>
        </Link>
        <Link href="/generate" style={{background:COLOR,color:'#fff',padding:'8px 16px',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none'}}>+ New Chase</Link>
      </div>

      <div style={{maxWidth:800,margin:'0 auto',padding:'32px 20px'}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:22,fontWeight:800,color:'#0f172a',marginBottom:4}}>Your Invoices</h1>
          <p style={{fontSize:14,color:'#64748b'}}>{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} tracked</p>
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:48,color:'#94a3b8'}}>Loading...</div>
        ) : invoices.length === 0 ? (
          <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e8f0',padding:48,textAlign:'center'}}>
            <div style={{fontSize:40,marginBottom:16}}>📄</div>
            <p style={{fontSize:15,fontWeight:600,color:'#0f172a',marginBottom:8}}>No invoices yet</p>
            <p style={{fontSize:13,color:'#94a3b8',marginBottom:20}}>Generate your first chase sequence to start tracking</p>
            <Link href="/generate" style={{background:COLOR,color:'#fff',padding:'10px 20px',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none'}}>Chase an invoice →</Link>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {invoices.map(inv => (
              <div key={inv.id} style={{background:'#fff',borderRadius:12,border:'1px solid #e2e8f0',padding:20}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:2}}>{inv.client_name || 'Unknown client'}</div>
                    <div style={{fontSize:12,color:'#94a3b8'}}>{inv.invoice_number} · {inv.project_name || 'No project'}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:16,fontWeight:800,color:'#0f172a'}}>{inv.amount}</div>
                    <div style={{fontSize:11,fontWeight:600,color:statusColor(inv.status),marginTop:2}}>{statusLabel(inv.status)}</div>
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{fontSize:12,color:'#94a3b8'}}>
                    Due: {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : 'Not set'}
                    {' · '}Added: {new Date(inv.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                  </div>
                  <Link href={`/items/${inv.id}`} style={{fontSize:12,fontWeight:600,color:COLOR,textDecoration:'none',background:'#f5f3ff',padding:'5px 12px',borderRadius:6}}>
                    View emails →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
