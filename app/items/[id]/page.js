'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function InvoiceDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeEmail, setActiveEmail] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const match = document.cookie.match(/cha_user=([^;]+)/)
    if (!match) { router.push('/login'); return }
    loadInvoice()
  }, [id])

  const loadInvoice = async () => {
    try {
      const token = document.cookie.match(/cha_token=([^;]+)/)?.[1] || ''
      const res = await fetch(`/api/items/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setInvoice(data.data || data)
    } catch(e) {}
    setLoading(false)
  }

  const copyEmail = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const COLOR = '#7c3aed'
  const emailLabels = ['Day 1 — Warm', 'Day 7 — Follow Up', 'Day 14 — Firm', 'Day 30 — Final']
  const emailColors = ['#059669', '#d97706', '#ea580c', '#dc2626']

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Inter,Arial,sans-serif',color:'#94a3b8'}}>Loading...</div>
  if (!invoice) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Inter,Arial,sans-serif',color:'#94a3b8'}}>Invoice not found</div>

  const emails = invoice.result_data?.emails || []

  return (
    <div style={{minHeight:'100vh',background:'#f8fafc',fontFamily:'Inter,Arial,sans-serif'}}>
      {/* Header */}
      <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <Link href="/items" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none'}}>
          <div style={{width:28,height:28,borderRadius:7,background:COLOR,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff'}}>C</div>
          <span style={{fontSize:14,fontWeight:800,color:'#0f172a'}}>ChaseIQ</span>
        </Link>
        <Link href="/items" style={{fontSize:13,color:'#64748b',textDecoration:'none'}}>← All invoices</Link>
      </div>

      <div style={{maxWidth:800,margin:'0 auto',padding:'32px 20px'}}>
        {/* Invoice summary */}
        <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e8f0',padding:24,marginBottom:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <h1 style={{fontSize:20,fontWeight:800,color:'#0f172a',marginBottom:4}}>{invoice.client_name}</h1>
              <p style={{fontSize:13,color:'#94a3b8'}}>{invoice.invoice_number} · {invoice.project_name || 'No project'}</p>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:22,fontWeight:800,color:'#0f172a'}}>{invoice.amount}</div>
              <div style={{fontSize:12,color:'#d97706',fontWeight:600,marginTop:2}}>
                Due: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : 'Not set'}
              </div>
            </div>
          </div>
        </div>

        {/* Email sequence */}
        {emails.length > 0 ? (
          <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e8f0',padding:24}}>
            <h2 style={{fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:4}}>Chase Sequence</h2>
            <p style={{fontSize:12,color:'#94a3b8',marginBottom:16}}>4 personalised emails ready to send</p>

            <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
              {emailLabels.map((label, i) => (
                <button key={i} onClick={() => setActiveEmail(i)}
                  style={{padding:'6px 10px',borderRadius:6,border:'none',fontSize:11,fontWeight:600,cursor:'pointer',
                    background: activeEmail === i ? emailColors[i] : '#f1f5f9',
                    color: activeEmail === i ? '#fff' : '#64748b'}}>
                  {label}
                </button>
              ))}
            </div>

            {emails[activeEmail] && (
              <div>
                <div style={{background:'#f8fafc',borderRadius:8,padding:12,marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:600,color:'#94a3b8',marginBottom:4}}>SUBJECT</div>
                  <div style={{fontSize:13,fontWeight:600,color:'#0f172a'}}>{emails[activeEmail].subject}</div>
                </div>
                <div style={{background:'#f8fafc',borderRadius:8,padding:12,marginBottom:12,minHeight:160}}>
                  <div style={{fontSize:11,fontWeight:600,color:'#94a3b8',marginBottom:8}}>EMAIL BODY</div>
                  <div style={{fontSize:13,color:'#334155',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{emails[activeEmail].body}</div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={() => copyEmail(emails[activeEmail].body)}
                    style={{flex:1,background:'#f1f5f9',border:'none',borderRadius:8,padding:'10px',fontSize:13,fontWeight:600,color:'#475569',cursor:'pointer'}}>
                    {copied ? '✓ Copied!' : '📋 Copy Email'}
                  </button>
                  <button onClick={() => copyEmail(`Subject: ${emails[activeEmail].subject}\n\n${emails[activeEmail].body}`)}
                    style={{flex:1,background:COLOR,border:'none',borderRadius:8,padding:'10px',fontSize:13,fontWeight:600,color:'#fff',cursor:'pointer'}}>
                    Copy with Subject
                  </button>
                </div>
              </div>
            )}

            <div style={{marginTop:16,padding:12,background:'#f5f3ff',borderRadius:8,border:'1px solid #ddd6fe'}}>
              <div style={{fontSize:11,fontWeight:700,color:COLOR,marginBottom:4}}>💡 SEND SCHEDULE</div>
              <div style={{fontSize:12,color:'#64748b',lineHeight:1.6}}>
                Email 1: Send on due date · Email 2: 7 days later · Email 3: 14 days overdue · Email 4: 30 days overdue
              </div>
            </div>
          </div>
        ) : (
          <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e8f0',padding:32,textAlign:'center',color:'#94a3b8'}}>
            No emails found for this invoice.
          </div>
        )}

        <div style={{marginTop:16,textAlign:'center'}}>
          <Link href="/generate" style={{fontSize:13,color:COLOR,textDecoration:'none',fontWeight:600}}>+ Chase another invoice</Link>
        </div>
      </div>
    </div>
  )
}
