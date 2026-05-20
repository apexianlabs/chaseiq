'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function GeneratePageInner() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [activeEmail, setActiveEmail] = useState(0)
  const [form, setForm] = useState({
    clientName: '',
    clientEmail: '',
    invoiceNumber: '',
    amount: '',
    projectName: '',
    dueDate: '',
    relationship: 'regular',
    tone: 'professional',
    notes: ''
  })

  useEffect(() => {
    const match = document.cookie.match(/cha_user=([^;]+)/)
    if (match) {
      try { setUser(JSON.parse(decodeURIComponent(match[1]))) } catch(e) {}
    }
  }, [])

  const handleGenerate = async () => {
    if (!form.clientName || !form.amount || !form.invoiceNumber || !form.dueDate) {
      setError('Please fill in client name, invoice number, amount and due date')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const token = document.cookie.match(/cha_token=([^;]+)/)?.[1] || ''
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...form, userId: user?.id })
      })
      const data = await res.json()
      if (data.error === 'limit_reached') { setError('limit_reached'); setLoading(false); return }
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setResult(data)
      setActiveEmail(0)
    } catch(e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const copyEmail = (text) => {
    navigator.clipboard.writeText(text)
  }

  const COLOR = '#7c3aed'
  const inputStyle = { width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13, outline:'none', boxSizing:'border-box', background:'#fff' }
  const labelStyle = { fontSize:12, fontWeight:600, color:'#475569', marginBottom:4, display:'block' }

  const emailLabels = ['Day 1 — Warm Reminder', 'Day 7 — Follow Up', 'Day 14 — Firm Notice', 'Day 30 — Final Warning']
  const emailColors = ['#059669', '#d97706', '#ea580c', '#dc2626']

  if (error === 'limit_reached') return (
    <div style={{minHeight:'100vh',background:'#f8fafc',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'#fff',borderRadius:16,padding:32,maxWidth:400,textAlign:'center',border:'1px solid #e2e8f0'}}>
        <div style={{fontSize:40,marginBottom:16}}>⚡</div>
        <h2 style={{fontSize:18,fontWeight:800,color:'#0f172a',marginBottom:8}}>Free limit reached</h2>
        <p style={{fontSize:14,color:'#64748b',marginBottom:24}}>You've used your 3 free chase sequences. Upgrade to keep chasing invoices.</p>
        <div style={{background:'#f8fafc',borderRadius:10,padding:16,marginBottom:20}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
            <span style={{fontSize:12,color:'#94a3b8'}}>Free uses</span>
            <span style={{fontSize:12,fontWeight:700,color:'#dc2626'}}>3 / 3</span>
          </div>
          <div style={{background:'#e2e8f0',borderRadius:4,height:6}}>
            <div style={{background:'#dc2626',borderRadius:4,height:6,width:'100%'}}/>
          </div>
        </div>
        <Link href="/billing" style={{display:'block',background:COLOR,color:'#fff',padding:'12px 24px',borderRadius:9,textDecoration:'none',fontWeight:700,fontSize:14,marginBottom:12}}>Upgrade now →</Link>
        <button onClick={() => setError('')} style={{background:'none',border:'none',color:'#94a3b8',fontSize:13,cursor:'pointer'}}>Maybe later</button>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#f8fafc',fontFamily:'Inter,Arial,sans-serif'}}>
      {/* Header */}
      <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <Link href="/dashboard" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none'}}>
          <div style={{width:28,height:28,borderRadius:7,background:COLOR,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff'}}>C</div>
          <span style={{fontSize:14,fontWeight:800,color:'#0f172a'}}>ChaseIQ</span>
        </Link>
        <Link href="/dashboard" style={{fontSize:13,color:'#64748b',textDecoration:'none'}}>← Dashboard</Link>
      </div>

      <div style={{maxWidth:900,margin:'0 auto',padding:'32px 20px'}}>
        <div style={{marginBottom:28}}>
          <h1 style={{fontSize:22,fontWeight:800,color:'#0f172a',marginBottom:6}}>Chase your invoice</h1>
          <p style={{fontSize:14,color:'#64748b'}}>Fill in the invoice details and get a personalised 4-email chase sequence in seconds.</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns: result ? '1fr 1fr' : '1fr',gap:24}}>
          {/* Form */}
          <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e8f0',padding:24}}>
            <h2 style={{fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:20}}>Invoice Details</h2>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div>
                <label style={labelStyle}>Client Name *</label>
                <input style={inputStyle} placeholder="e.g. Acme Corp" value={form.clientName}
                  onChange={e => setForm({...form, clientName: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Client Email</label>
                <input style={inputStyle} type="email" placeholder="client@company.com" value={form.clientEmail}
                  onChange={e => setForm({...form, clientEmail: e.target.value})} />
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div>
                <label style={labelStyle}>Invoice Number *</label>
                <input style={inputStyle} placeholder="e.g. INV-0042" value={form.invoiceNumber}
                  onChange={e => setForm({...form, invoiceNumber: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Amount *</label>
                <input style={inputStyle} placeholder="e.g. $2,400" value={form.amount}
                  onChange={e => setForm({...form, amount: e.target.value})} />
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div>
                <label style={labelStyle}>Project Name</label>
                <input style={inputStyle} placeholder="e.g. Website Redesign" value={form.projectName}
                  onChange={e => setForm({...form, projectName: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Due Date *</label>
                <input style={inputStyle} type="date" value={form.dueDate}
                  onChange={e => setForm({...form, dueDate: e.target.value})} />
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div>
                <label style={labelStyle}>Client Relationship</label>
                <select style={inputStyle} value={form.relationship}
                  onChange={e => setForm({...form, relationship: e.target.value})}>
                  <option value="new">New client</option>
                  <option value="regular">Regular client</option>
                  <option value="longterm">Long-term client</option>
                  <option value="difficult">Difficult client</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Starting Tone</label>
                <select style={inputStyle} value={form.tone}
                  onChange={e => setForm({...form, tone: e.target.value})}>
                  <option value="professional">Professional</option>
                  <option value="firm">Firm</option>
                  <option value="final">Final Warning</option>
                </select>
              </div>
            </div>

            <div style={{marginBottom:20}}>
              <label style={labelStyle}>Additional Notes</label>
              <textarea style={{...inputStyle, height:80, resize:'vertical'}}
                placeholder="Any context about this invoice or client situation..."
                value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            </div>

            {error && error !== 'limit_reached' && (
              <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:12,marginBottom:16,fontSize:13,color:'#dc2626'}}>{error}</div>
            )}

            <button onClick={handleGenerate} disabled={loading}
              style={{width:'100%',background: loading ? '#a78bfa' : COLOR,color:'#fff',border:'none',borderRadius:9,padding:'13px 24px',fontSize:14,fontWeight:700,cursor: loading ? 'not-allowed' : 'pointer'}}>
              {loading ? '✨ Generating chase sequence...' : '⚡ Generate Chase Sequence'}
            </button>
          </div>

          {/* Results */}
          {result && (
            <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e8f0',padding:24}}>
              <h2 style={{fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:4}}>Your Chase Sequence</h2>
              <p style={{fontSize:12,color:'#94a3b8',marginBottom:16}}>4 personalised emails ready to send</p>

              {/* Email tabs */}
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

              {result.emails && result.emails[activeEmail] && (
                <div>
                  <div style={{background:'#f8fafc',borderRadius:8,padding:12,marginBottom:12}}>
                    <div style={{fontSize:11,fontWeight:600,color:'#94a3b8',marginBottom:4}}>SUBJECT</div>
                    <div style={{fontSize:13,fontWeight:600,color:'#0f172a'}}>{result.emails[activeEmail].subject}</div>
                  </div>
                  <div style={{background:'#f8fafc',borderRadius:8,padding:12,marginBottom:12,minHeight:200}}>
                    <div style={{fontSize:11,fontWeight:600,color:'#94a3b8',marginBottom:8}}>EMAIL BODY</div>
                    <div style={{fontSize:13,color:'#334155',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{result.emails[activeEmail].body}</div>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={() => copyEmail(result.emails[activeEmail].body)}
                      style={{flex:1,background:'#f1f5f9',border:'none',borderRadius:8,padding:'10px',fontSize:13,fontWeight:600,color:'#475569',cursor:'pointer'}}>
                      📋 Copy Email
                    </button>
                    <button onClick={() => copyEmail(`Subject: ${result.emails[activeEmail].subject}\n\n${result.emails[activeEmail].body}`)}
                      style={{flex:1,background:COLOR,border:'none',borderRadius:8,padding:'10px',fontSize:13,fontWeight:600,color:'#fff',cursor:'pointer'}}>
                      Copy All
                    </button>
                  </div>
                </div>
              )}

              <div style={{marginTop:16,padding:'12px',background:'#f5f3ff',borderRadius:8,border:'1px solid #ddd6fe'}}>
                <div style={{fontSize:11,fontWeight:700,color:COLOR,marginBottom:4}}>💡 CHASE TIPS</div>
                <div style={{fontSize:12,color:'#64748b',lineHeight:1.6}}>
                  Send Email 1 on the due date. Wait 7 days before Email 2. Each email escalates in urgency. Never send two emails the same day.
                </div>
              </div>

              <Link href="/dashboard" style={{display:'block',marginTop:12,textAlign:'center',fontSize:13,color:'#94a3b8',textDecoration:'none'}}>
                View all invoices →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GeneratePage() {
  return <Suspense><GeneratePageInner /></Suspense>
}
