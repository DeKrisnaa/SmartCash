import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    // Test inserting with the new constraint values: 'none', 'ongoing', 'paid'
    const testUuid = '00000000-0000-0000-0000-000000000000'

    // Test 'ongoing' (maps to pinjam or memberi_pinjaman)
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: testUuid,
        amount: 1000,
        type: 'expense',
        category: 'lainnya',
        description: 'Test Memberi Pinjaman (ongoing)',
        date: '2026-05-28',
        loan_status: 'ongoing',
        person_name: 'Test Person'
      })
      .select()

    // Test 'paid' (maps to bayar_utang or piutang_kembali)
    const { data: data2, error: error2 } = await supabase
      .from('transactions')
      .insert({
        user_id: testUuid,
        amount: 1000,
        type: 'expense',
        category: 'lainnya',
        description: 'Test Bayar Utang (paid)',
        date: '2026-05-28',
        loan_status: 'paid',
        person_name: 'Test Person'
      })
      .select()

    return NextResponse.json({
      ongoing_test: error ? { message: error.message, code: error.code, details: error.details } : 'Success',
      paid_test: error2 ? { message: error2.message, code: error2.code, details: error2.details } : 'Success'
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message })
  }
}
