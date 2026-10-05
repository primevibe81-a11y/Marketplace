import { describe, it, expect } from 'vitest'
import { normalizeImei, isValidImei, maskImei } from './imei'

describe('imei.ts', () => {
  describe('normalizeImei', () => {
    it('removes spaces and hyphens', () => {
      expect(normalizeImei('123-456 789')).toBe('123456789')
      expect(normalizeImei(' 490 154-2032-37518 ')).toBe('490154203237518')
    })
  })

  describe('isValidImei', () => {
    it('validates correct 15-digit IMEI', () => {
      expect(isValidImei('490154203237518')).toBe(true)
    })

    it('rejects invalid IMEI due to checksum', () => {
      expect(isValidImei('490154203237519')).toBe(false)
    })

    it('rejects IMEI with incorrect length (e.g., 14 digits)', () => {
      expect(isValidImei('49015420323751')).toBe(false)
      expect(isValidImei('4901542032375180')).toBe(false)
    })

    it('rejects inputs containing letters', () => {
      expect(isValidImei('49015420323751a')).toBe(false)
      expect(isValidImei('a90154203237518')).toBe(false)
    })
  })

  describe('maskImei', () => {
    it('masks string up to the last 4 characters', () => {
      expect(maskImei('490154203237518')).toBe('***********7518')
    })

    it('handles short strings gracefully', () => {
      expect(maskImei('1234')).toBe('1234')
      expect(maskImei('123')).toBe('123')
      expect(maskImei('')).toBe('')
    })
  })
})
