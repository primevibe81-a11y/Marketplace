import { describe, it, expect } from 'vitest'
import { formatRupiah, parseRupiah } from './format'

describe('formatRupiah', () => {
  it('formats positive integers correctly', () => {
    expect(formatRupiah(1250000)).toBe('Rp 1.250.000')
    expect(formatRupiah(0)).toBe('Rp 0')
  })

  it('rejects negatives and decimals', () => {
    expect(formatRupiah(-1250000)).toBeNull()
    expect(formatRupiah(1250.5)).toBeNull()
  })

  it('handles null or undefined input', () => {
    expect(formatRupiah(null)).toBeNull()
    expect(formatRupiah(undefined)).toBeNull()
  })
})

describe('parseRupiah', () => {
  it('parses formatted string correctly', () => {
    expect(parseRupiah('1.250.000')).toBe(1250000)
    expect(parseRupiah('Rp 1.250.000')).toBe(1250000)
    expect(parseRupiah('Rp1250000')).toBe(1250000)
  })

  it('rejects negatives and decimals', () => {
    expect(parseRupiah('-1.250.000')).toBeNull()
    expect(parseRupiah('1.250,50')).toBeNull() // contains comma for decimal
  })

  it('handles empty or invalid input', () => {
    expect(parseRupiah('')).toBeNull()
    expect(parseRupiah('   ')).toBeNull()
    expect(parseRupiah('abc')).toBeNull()
    expect(parseRupiah(null)).toBeNull()
    expect(parseRupiah(undefined)).toBeNull()
  })
})
