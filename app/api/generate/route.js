import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { clientName, clientEmail, invoiceNumber, amount, projectName, dueDate, relationship, tone, notes, userId } = body

    if (!clientName || !invoiceNumber || !amount || !dueDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check usage limit
    if (userId) {
      const usageRes = await fetch(
        `${process.env.DB_API_URL}/usage/check?user_id=${userId}&product=chaseiq`,
        { headers: { 'Authorization': `Bearer ${process.env.DB_API_KEY_CHASEIQ}` } }
      )
      const usage = await usageRes.json()
      if (!usage.allowed) {
        return NextResponse.json({ error: 'limit_reached', used: usage.used, limit: usage.limit }, { status: 403 })
      }
    }

    const daysOverdue = Math.floor((new Date() - new Date(dueDate)) / (1000 * 60 * 60 * 24))
    const relationshipContext = {
      new: 'This is a new client — keep tone warm and assume good faith',
      regular: 'This is a regular client with a good track record',
      longterm: 'This is a long-term trusted client — maintain the relationship while being clear',
      difficult: 'This client has been difficult or slow to pay before — be firmer from the start'
    }[relationship] || 'Regular client'

    const toneContext = {
      professional: 'Start professional and escalate gradually',
      firm: 'Start firm and escalate to very firm — skip the pleasantries',
      final: 'Start at final warning level — this invoice is seriously overdue'
    }[tone] || 'Professional'

    const prompt = `You are writing invoice chase emails for a freelancer. Generate exactly 4 chase emails as a JSON object.

Invoice Details:
- Client: ${clientName}${clientEmail ? ` (${clientEmail})` : ''}
- Invoice: ${invoiceNumber}
- Amount: ${amount}
- Project: ${projectName || 'Not specified'}
- Due Date: ${dueDate}
- Days Overdue: ${daysOverdue > 0 ? daysOverdue + ' days' : 'due today'}
- Relationship: ${relationshipContext}
- Tone: ${toneContext}
${notes ? `- Additional context: ${notes}` : ''}

Write 4 emails that escalate in urgency:
- Email 1 (Day 1): Warm, friendly — assume the invoice slipped through
- Email 2 (Day 7): Polite but clear — reference the previous message
- Email 3 (Day 14): Firm — specific deadline, mention late fee if applicable
- Email 4 (Day 30): Final notice — clear consequence, last chance

Rules:
- Reference the specific invoice number and amount in every email
- Keep each email under 150 words
- Sound like the freelancer wrote it personally — not a template
- Each email must be clearly more urgent than the last
- No threatening language, no all-caps
- Include a specific payment deadline in emails 3 and 4

Respond ONLY with this JSON, no other text:
{
  "emails": [
    { "subject": "...", "body": "..." },
    { "subject": "...", "body": "..." },
    { "subject": "...", "body": "..." },
    { "subject": "...", "body": "..." }
  ],
  "summary": "One sentence summary of the chase strategy used"
}`

    const aiRes = await fetch(`${process.env.AI_API_URL}/api/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.AI_API_KEY}` },
      body: JSON.stringify({ task: 'generate_chase_sequence', inputs: { prompt } })
    })

    if (!aiRes.ok) {
      const errData = await aiRes.json().catch(() => ({}))
      throw new Error(errData.message || errData.error || 'AI generation failed')
    }
    const aiData = await aiRes.json()
    // AI API returns { result: { emails: [...] } } or { result: { raw_response: "..." } }
    const resultData = aiData.data || aiData.result || aiData.content || aiData.output || {}

    let parsed
    try {
      if (resultData.emails) {
        // Direct structured response
        parsed = resultData
      } else if (resultData.raw_response) {
        // Claude returned text - parse it
        const clean = resultData.raw_response.replace(/```json|```/g, '').trim()
        const jsonMatch = clean.match(/\{[\s\S]*\}/)
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean)
      } else {
        parsed = resultData
      }
      if (!parsed.emails || !Array.isArray(parsed.emails)) {
        throw new Error('No emails array in response')
      }
    } catch(e) {
      throw new Error('Failed to parse AI response: ' + e.message)
    }

    // Save to DB
    if (userId) {
      await fetch(`${process.env.DB_API_URL}/db/chaseiq/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DB_API_KEY_CHASEIQ}` },
        body: JSON.stringify({
          user_id: userId,
          client_name: clientName,
          client_email: clientEmail || null,
          invoice_number: invoiceNumber,
          amount,
          project_name: projectName || null,
          due_date: dueDate,
          relationship,
          tone,
          result_data: parsed,
          status: 'chasing'
        })
      })

      // Track usage
      await fetch(`${process.env.DB_API_URL}/usage/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DB_API_KEY_CHASEIQ}` },
        body: JSON.stringify({ user_id: userId, product: 'chaseiq', action: 'generate_chase_sequence' })
      })
    }

    return NextResponse.json({ ...parsed, invoiceNumber, clientName, amount })
  } catch(err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
