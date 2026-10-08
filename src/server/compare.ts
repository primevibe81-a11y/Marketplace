'use server'

import { createClient } from '@/lib/supabase/server'
import { referencePrice, discountFastSale, suggest } from '@/lib/pricing'
import { getSettings } from './settings'

export async function getCompareData() {
  const supabase = await createClient()

  const settings = await getSettings()
  const calcSettings = {
    ...settings,
    fast_sale_threshold: settings.fast_sale_threshold / 100,
    margin_target: settings.margin_target / 100
  }

  // Ambil semua konter aktif
  const { data: shops } = await supabase.from('shops').select('*').eq('is_active', true).order('name')
  const activeShops = shops || []

  // Ambil model yang di-watchlist
  const { data: models } = await supabase
    .from('phone_models')
    .select('*')
    .eq('watchlist', true)
    .order('brand')
    .order('name')

  if (!models || models.length === 0) return { comparisonModels: [], activeShops, settings }

  const modelIds = models.map(m => m.id)

  // Ambil tawaran terbaru untuk model-model tersebut (menggunakan view latest_offers)
  const { data: latestOffers } = await supabase
    .from('latest_offers')
    .select('*')
    .in('model_id', modelIds)

  // Ambil data pasaran FB aktif
  const { data: observations } = await supabase
    .from('market_observations')
    .select('*')
    .in('model_id', modelIds)
    .eq('listing_state', 'active')

  const marketData: Record<string, ReturnType<typeof referencePrice>> = {}
  
  models.forEach(model => {
    const key = model.id
    const obs = observations?.filter(o => o.model_id === key) || []
    let fbObservations = null
    if (obs.length > 0) {
      const prices = obs.map(o => o.price).sort((a, b) => a - b)
      const median = prices[Math.floor(prices.length / 2)]
      fbObservations = { median, activeCount: prices.length }
    }
    marketData[key] = referencePrice({ fbObservations, aiEstimate: null })
  })

  const comparisonModels = models.map(model => {
    const modelOffers = latestOffers?.filter(o => o.model_id === model.id) || []
    
    const latestOffersPerShop = activeShops.reduce((acc, shop) => {
      const shopOffer = modelOffers.find(o => o.shop_id === shop.id)
      acc[shop.id] = shopOffer ? { price: shopOffer.price, offered_at: shopOffer.offered_at } : null
      return acc
    }, {} as Record<string, { price: number; offered_at: string } | null>)

    const allPrices = Object.values(latestOffersPerShop).filter((o): o is { price: number; offered_at: string } => o !== null).map(o => o.price)
    const bestBid = allPrices.length > 0 ? Math.max(...allPrices) : 0
    
    const refPriceInfo = marketData[model.id] || { price: null, source: null, fb_median: null, ai_median: null }
    const medianPasaran = refPriceInfo.price || 0

    const discount = discountFastSale(bestBid, medianPasaran)
    
    // Suggestion defaults to always selling to FB if there is no stock age constraints anymore
    // or we can just suggest "Pasang_Di_FB" / "Jual_Ke_Konter" based purely on fast_sale_threshold
    const suggestion = bestBid > 0 && medianPasaran > 0 
      ? (discount <= calcSettings.fast_sale_threshold ? 'jual_ke_konter' : 'pasang_di_fb')
      : null

    return {
      model,
      latestOffersPerShop,
      bestBid,
      refPriceInfo,
      discount,
      suggestion
    }
  })

  return { comparisonModels, activeShops, settings: calcSettings }
}
