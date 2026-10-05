export function normalizeImei(input: string): string {
  return input.replace(/[\s-]/g, '')
}

export function isValidImei(s: string): boolean {
  if (!/^[0-9]{15}$/.test(s)) {
    return false
  }

  let sum = 0
  let isDouble = false

  // Luhn algorithm starts from rightmost digit
  for (let i = s.length - 1; i >= 0; i--) {
    let digit = parseInt(s.charAt(i), 10)

    if (isDouble) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isDouble = !isDouble
  }

  return sum % 10 === 0
}

export function maskImei(s: string): string {
  if (s.length <= 4) return s
  return '*'.repeat(s.length - 4) + s.slice(-4)
}
