'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatRupiah } from '@/lib/format'

type ChartData = {
  date: string
  manualPrice: number | null
  aiPrice: number | null
}

export function PriceChart({ data }: { data: ChartData[] }) {
  if (!data || data.length === 0) {
    return <div className="text-center p-6 text-sm text-muted-foreground border rounded-lg">Belum ada data tren harga.</div>
  }

  return (
    <div className="h-[300px] w-full border rounded-lg p-4 bg-card">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }} 
            tickFormatter={(val) => {
              const d = new Date(val)
              return `${d.getDate()}/${d.getMonth()+1}`
            }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(val) => `Rp${val / 1000000}jt`}
            width={70}
          />
          <Tooltip 
            formatter={(value: any, name: any) => [formatRupiah(Number(value)), String(name)]} 
            labelFormatter={(label: any) => new Date(String(label)).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line 
            type="monotone" 
            dataKey="manualPrice" 
            name="Manual (FB)" 
            stroke="#3b82f6" 
            strokeWidth={2}
            connectNulls 
          />
          <Line 
            type="monotone" 
            dataKey="aiPrice" 
            name="Estimasi AI" 
            stroke="#10b981" 
            strokeWidth={2}
            connectNulls 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
