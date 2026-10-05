'use client'

import { useState } from 'react'
import { getFullIdentifiers } from '@/server/units'
import { Button } from '@/components/ui/button'

type Ident = { kind: string; value: string }

export function ImeiRevealer({ unitId, initialIdentifiers }: { unitId: string, initialIdentifiers: Ident[] }) {
  const [identifiers, setIdentifiers] = useState<Ident[]>(initialIdentifiers)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReveal = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getFullIdentifiers(unitId)
      if (res.error) {
        setError(res.error)
      } else if (res.data) {
        setIdentifiers(res.data)
        setRevealed(true)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {identifiers.map(i => (
        <div key={i.kind} className="flex justify-between items-center text-sm">
          <span className="uppercase text-muted-foreground">{i.kind}</span>
          <span className="font-mono font-medium">{i.value}</span>
        </div>
      ))}
      {!revealed && (
        <Button 
          variant="secondary" 
          size="sm" 
          className="w-full mt-2" 
          onClick={handleReveal}
          disabled={loading}
        >
          {loading ? 'Memuat...' : 'Tampilkan Penuh'}
        </Button>
      )}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
}
