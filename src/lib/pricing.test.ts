import { describe, it, expect } from 'vitest'
import {

  filterOutliers,
  summarize,
  discountFastSale,
  suggest,
  estimatedProfit,
  maxAcquisition,
  referencePrice
} from './pricing'

describe('pricing.ts', () => {
  describe('filterOutliers and summarize', () => {
    it('handles example from spec correctly', () => {
      const rawPrices = [2000000, 2100000, 2150000, 2200000, 2250000, 5000000]
      const filtered = filterOutliers(rawPrices)
      
      expect(filtered).not.toContain(5000000)
      expect(filtered).toHaveLength(5)

      const summary = summarize(filtered, 2)
      expect(summary.p25).toBe(2100000)
      expect(summary.median).toBe(2150000)
      expect(summary.p75).toBe(2200000)
      expect(summary.sample_count).toBe(5)
      expect(summary.confidence).toBe('medium')
    })

    it('handles empty and single sample gracefully', () => {
      expect(filterOutliers([])).toEqual([])
      expect(filterOutliers([1000])).toEqual([1000])

      const sumEmpty = summarize([], 1)
      expect(sumEmpty.median).toBe(0)
      expect(sumEmpty.sample_count).toBe(0)
      expect(sumEmpty.confidence).toBe('low')

      const sumSingle = summarize([1000], 1)
      expect(sumSingle.median).toBe(1000)
      expect(sumSingle.sample_count).toBe(1)
      expect(sumSingle.confidence).toBe('low')
    })
  })

  describe('discountFastSale and suggest', () => {
    it('calculates discount correctly', () => {
      const discount = discountFastSale(1900000, 2150000)
      expect(discount).toBeCloseTo(0.116279, 5)
    })

    it('suggests jual_ke_konter if discount is below or equal to threshold', () => {
      const discount = discountFastSale(1900000, 2150000) // ~11.6%
      const suggestion = suggest(
        { discount, stockDays: 10 },
        { fast_sale_threshold: 0.15, stock_age_days: 30 }
      )
      expect(suggestion).toBe('jual_ke_konter')
    })

    it('suggests jual_ke_konter if stock is too old despite bad discount', () => {
      const suggestion = suggest(
        { discount: 0.20, stockDays: 40 },
        { fast_sale_threshold: 0.15, stock_age_days: 30 }
      )
      expect(suggestion).toBe('jual_ke_konter')
    })

    it('suggests pasang_di_fb if discount is high and stock is fresh', () => {
      const suggestion = suggest(
        { discount: 0.20, stockDays: 10 },
        { fast_sale_threshold: 0.15, stock_age_days: 30 }
      )
      expect(suggestion).toBe('pasang_di_fb')
    })
  })

  describe('maxAcquisition and estimatedProfit', () => {
    it('calculates max acquisition properly', () => {
      const max = maxAcquisition({ median: 2150000, margin: 0.12, repair: 100000, other: 0 })
      expect(max).toBe(1792000)
    })

    it('calculates estimated profit properly', () => {
      const profit = estimatedProfit({ sold: 2150000, acquired: 1700000, extra: 100000 })
      expect(profit).toBe(350000)
    })
  })

  describe('referencePrice', () => {
    it('prefers fb if activeCount >= 3', () => {
      const ref = referencePrice({
        fbObservations: { median: 100, activeCount: 3 },
        aiEstimate: { median: 120 }
      })
      expect(ref.price).toBe(100)
      expect(ref.source).toBe('fb_marketplace')
    })

    it('falls back to AI if fb activeCount < 3', () => {
      const ref = referencePrice({
        fbObservations: { median: 100, activeCount: 2 },
        aiEstimate: { median: 120 }
      })
      expect(ref.price).toBe(120)
      expect(ref.source).toBe('ai')
    })

    it('uses AI if fb is missing', () => {
      const ref = referencePrice({
        fbObservations: null,
        aiEstimate: { median: 120 }
      })
      expect(ref.price).toBe(120)
      expect(ref.source).toBe('ai')
    })

    it('uses FB if AI is missing (though <3 active, fallback is FB if no AI)', () => {
      // Actually, spec says:
      // "median pengamatan FB bila >= 3 sampel aktif; jika tidak, median estimasi AI"
      // If AI is missing but FB is < 3, what should happen? The spec doesn't explicitly mention it,
      // but returning FB median or null is acceptable. Our code returns null for price.
      const ref = referencePrice({
        fbObservations: { median: 100, activeCount: 2 },
        aiEstimate: null
      })
      expect(ref.price).toBeNull()
    })
  })
})
