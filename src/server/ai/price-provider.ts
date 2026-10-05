export interface PriceProvider {
  estimate(
    brand: string,
    name: string,
    ram: number | null,
    storage: number | null,
    grade: string
  ): Promise<EstimateResult>
}

export type EstimateResult = {
  rawResponse: string
  listings: Array<{
    title: string
    price_idr: number
    source_domain: string
    url: string | null
    condition_note: string | null
  }>
  notes: string
  sources: Array<{ title: string; url: string }> // From grounding metadata
}
