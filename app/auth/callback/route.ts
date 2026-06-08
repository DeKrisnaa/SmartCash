import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/reset-password'

  // Ambil origin yang benar (mendukung HTTPS di Vercel/production)
  const host = request.headers.get('host')
  const protocol = request.url.startsWith('https') ? 'https' : (request.headers.get('x-forwarded-proto') ?? 'https')
  const origin = `${protocol}://${host}`

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Jika gagal, kembalikan ke halaman login dengan parameter error
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`)
}
