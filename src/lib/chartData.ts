type Observation = {
  price: number
  observed_at: string
}

type Estimate = {
  price_p50: number
  fetched_at: string
}

type ChartData = {
  date: string
  manualPrice: number | null
  aiPrice: number | null
}

export function formatChartData(observations: Observation[], estimates: Estimate[]): ChartData[] {
  const map = new Map<string, { manualPrice: number | null, aiPrice: number | null }>()

  // Group by date (YYYY-MM-DD)
  observations.forEach(o => {
    const d = new Date(o.observed_at).toISOString().split('T')[0]
    if (!map.has(d)) map.set(d, { manualPrice: null, aiPrice: null })
    // If multiple on same day, take average or just first. We'll take average for simplicity.
    const curr = map.get(d)!
    if (curr.manualPrice === null) curr.manualPrice = o.price
    else curr.manualPrice = (curr.manualPrice + o.price) / 2
  })

  estimates.forEach(e => {
    const d = new Date(e.fetched_at).toISOString().split('T')[0]
    if (!map.has(d)) map.set(d, { manualPrice: null, aiPrice: null })
    const curr = map.get(d)!
    if (curr.aiPrice === null) curr.aiPrice = e.price_p50
    else curr.aiPrice = (curr.aiPrice + e.price_p50) / 2
  })

  const sortedKeys = Array.from(map.keys()).sort()
  return sortedKeys.map(k => ({
    date: k,
    manualPrice: map.get(k)!.manualPrice,
    aiPrice: map.get(k)!.aiPrice
  }))
}
