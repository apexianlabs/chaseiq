import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const { id } = params
    const res = await fetch(
      `${process.env.DB_API_URL}/db/chaseiq/invoices/${id}`,
      { headers: { 'Authorization': `Bearer ${process.env.DB_API_KEY_CHASEIQ}` } }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch(err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
