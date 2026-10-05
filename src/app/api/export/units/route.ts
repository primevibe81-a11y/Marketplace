import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('units')
    .select(`
      code,
      grade,
      status,
      source_type,
      acquired_price,
      extra_cost,
      target_price,
      sold_price,
      sold_channel,
      acquired_at,
      sold_at,
      phone_models ( brand, name, ram_gb, storage_gb ),
      unit_identifiers ( kind, value )
    `)
    .order('created_at', { ascending: false })

  if (error || !data) {
    return NextResponse.json({ error: 'Gagal mengekspor data' }, { status: 500 })
  }

  // Flatten the data for CSV
  const csvRows = data.map((u: any) => {
    const imei1 = u.unit_identifiers.find((i: any) => i.kind === 'imei1')?.value || ''
    const brand = u.phone_models?.brand || ''
    const name = u.phone_models?.name || ''
    return [
      u.code,
      `"${brand} ${name}"`,
      u.grade,
      u.status,
      imei1,
      u.source_type,
      u.acquired_price,
      u.extra_cost,
      u.sold_price || '',
      u.acquired_at || '',
      u.sold_at || ''
    ].join(',')
  })

  const header = 'Kode,Model,Grade,Status,IMEI_1,Sumber,Harga Beli,Biaya Ekstra,Harga Jual,Tgl Beli,Tgl Jual'
  const csvContent = [header, ...csvRows].join('\n')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="data-stok-hp.csv"'
    }
  })
}
