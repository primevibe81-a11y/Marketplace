export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0
  if (sorted.length === 1) return sorted[0]

  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base

  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base])
  } else {
    return sorted[base]
  }
}

export function filterOutliers(prices: number[]): number[] {
  if (prices.length === 0) return []
  if (prices.length === 1) return prices

  const sorted = [...prices].sort((a, b) => a - b)
  const q1 = quantile(sorted, 0.25)
  const median = quantile(sorted, 0.5)
  const q3 = quantile(sorted, 0.75)
  const iqr = q3 - q1

  const lowerBoundIqr = q1 - 1.5 * iqr
  const upperBoundIqr = q3 + 1.5 * iqr
  const lowerBoundMedian = median * 0.5
  const upperBoundMedian = median * 1.5

  return sorted.filter(
    (p) =>
      p >= lowerBoundIqr &&
      p <= upperBoundIqr &&
      p >= lowerBoundMedian &&
      p <= upperBoundMedian
  )
}

export type Confidence = 'low' | 'medium' | 'high'

export function summarize(prices: number[], sourceCount: number) {
  if (prices.length === 0) {
    return { min: 0, p25: 0, median: 0, p75: 0, max: 0, sample_count: 0, confidence: 'low' as Confidence }
  }

  const sorted = [...prices].sort((a, b) => a - b)
  const sample_count = sorted.length

  let confidence: Confidence = 'low'
  if (sample_count >= 8 && sourceCount >= 2) {
    confidence = 'high'
  } else if (sample_count >= 4 && sample_count <= 7) {
    confidence = 'medium'
  }

  return {
    min: sorted[0],
    p25: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    p75: quantile(sorted, 0.75),
    max: sorted[sample_count - 1],
    sample_count,
    confidence,
  }
}

export function discountFastSale(bestBid: number, median: number): number {
  if (median === 0) return 0
  return 1 - bestBid / median
}

export function suggest(
  input: { discount: number; stockDays: number },
  settings: { fast_sale_threshold: number; stock_age_days: number }
): 'jual_ke_konter' | 'pasang_di_fb' {
  if (
    input.discount <= settings.fast_sale_threshold ||
    input.stockDays > settings.stock_age_days
  ) {
    return 'jual_ke_konter'
  }
  return 'pasang_di_fb'
}

export function estimatedProfit(input: { sold: number; acquired: number; extra: number }): number {
  return input.sold - input.acquired - input.extra
}

export function maxAcquisition(input: { median: number; margin: number; repair: number; other: number }): number {
  return input.median * (1 - input.margin) - input.repair - input.other
}

export function referencePrice(input: {
  fbObservations: { median: number; activeCount: number } | null
  aiEstimate: { median: number } | null
}) {
  if (input.fbObservations && input.fbObservations.activeCount >= 3) {
    return {
      price: input.fbObservations.median,
      source: 'fb_marketplace' as const,
      fb_median: input.fbObservations.median,
      ai_median: input.aiEstimate?.median ?? null,
    }
  }

  if (input.aiEstimate) {
    return {
      price: input.aiEstimate.median,
      source: 'ai' as const,
      fb_median: input.fbObservations?.median ?? null,
      ai_median: input.aiEstimate.median,
    }
  }

  return {
    price: null,
    source: null,
    fb_median: input.fbObservations?.median ?? null,
    ai_median: null,
  }
}
