import { PriceProvider, EstimateResult } from './price-provider'

export class GeminiProvider implements PriceProvider {
  private apiKey: string
  private model: string

  constructor(apiKey: string, model: string = 'gemini-3.1-pro-preview') {
    this.apiKey = apiKey
    this.model = model
  }

  async estimate(
    brand: string,
    name: string,
    ram: number | null,
    storage: number | null,
    grade: string
  ): Promise<EstimateResult> {
    const spec = `${brand} ${name} ${ram ? ram + 'GB' : ''}/${storage ? storage + 'GB' : ''}`.trim()
    
    const prompt = `Kamu asisten riset harga HP bekas di Indonesia.
Cari listing HP bekas untuk: ${spec} kondisi ${grade}.
Gunakan hanya listing di Indonesia dengan harga Rupiah. Abaikan aksesori, sparepart, paket tukar tambah, dan varian RAM/storage yang berbeda. Maksimal 15 listing.
Balas HANYA JSON valid tanpa markdown dengan struktur:
{"listings":[{"title":"string","price_idr":1234,"source_domain":"string","url":"string|null","condition_note":"string|null"}],"notes":"string"}`

    let data
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: { temperature: 0.1 }
        })
      })
      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errText}`)
      }
      data = await response.json()
    } catch (e: unknown) {
      throw new Error(`Gagal memanggil Gemini API: ${e instanceof Error ? e.message : String(e)}`)
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    let parsed
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : text

    try {
      parsed = JSON.parse(jsonStr)
    } catch (e) {
      const retryPrompt = `Ini adalah format JSON yang rusak, tolong perbaiki agar menjadi JSON yang valid.
Hanya berikan JSON tanpa markdown apapun:
${jsonStr}`
      
      const retryResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: retryPrompt }] }],
          generationConfig: { temperature: 0 }
        })
      })
      
      const retryData = await retryResponse.json()
      const retryText = retryData.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const retryMatch = retryText.match(/\{[\s\S]*\}/)
      
      try {
        parsed = JSON.parse(retryMatch ? retryMatch[0] : retryText)
      } catch {
        throw new Error('Gagal melakukan parse JSON dari AI meskipun sudah dicoba ulang.')
      }
    }

    const sources: { title: string; url: string }[] = []
    
    const chunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    for (const chunk of chunks) {
      if (chunk.web?.uri) {
        sources.push({
          title: chunk.web.title || chunk.web.uri,
          url: chunk.web.uri
        })
      }
    }

    return {
      rawResponse: text,
      listings: parsed.listings || [],
      notes: parsed.notes || '',
      sources
    }
  }
}
