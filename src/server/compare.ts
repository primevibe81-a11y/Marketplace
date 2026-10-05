'use server'

import { createClient } from '@/lib/supabase/server'
import { referencePrice, discountFastSale, suggest } from '@/lib/pricing'

export async function getCompareData() {
  const supabase = await createClient()

  const { data: settingsData } = await supabase.from('settings').select('*').single()
  const settings = settingsData || { fast_sale_threshold: 0.15, stale_offer_days: 14, stock_age_days: 30 }

  const { data: shops } = await supabase.from('shops').select('*').eq('is_active', true).order('name')
  const activeShops = shops || []

  const { data: units } = await supabase
    .from('units')
    .select('*, phone_models(*)')
    .neq('status', 'sold')
    .order('created_at', { ascending: false })

  if (!units) return { comparisonUnits: [], activeShops: [], settings }

  const { data: offers } = await supabase
    .from('offers')
    .select('*')
    .in('status', ['open'])
    .in('unit_id', units.map(u => u.id))

  const modelIds = Array.from(new Set(units.map(u => u.model_id)))
  
  const { data: observations } = await supabase
    .from('market_observations')
    .select('*')
    .in('model_id', modelIds)
    .eq('is_active', true)

  const { data: estimates } = await supabase
    .from('market_estimates')
    .select('*')
    .in('model_id', modelIds)

  const marketPerModel = modelIds.reduce((acc, mid) => {
    const obs = observations?.filter(o => o.model_id === mid && o.channel === 'fb_marketplace') || []
    let fbObservations = null
    if (obs.length > 0) {
      const prices = obs.map(o => o.price).sort((a, b) => a - b)
      const median = prices[Math.floor(prices.length / 2)]
      fbObservations = { median, activeCount: prices.length }
    }

    const est = estimates?.filter(e => e.model_id === mid).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || []
    let aiEstimate = null
    if (est.length > 0 && est[0].price_p50) {
      aiEstimate = { median: est[0].price_p50 }
    }

    acc[mid] = referencePrice({ fbObservations, aiEstimate })
    return acc
  }, {} as Record<string, ReturnType<typeof referencePrice>>)

  const comparisonUnits = units.map(unit => {
    const unitOffers = offers?.filter(o => o.unit_id === unit.id) || []
    
    const latestOffersPerShop = activeShops.reduce((acc, shop) => {
      const shopOffers = unitOffers.filter(o => o.shop_id === shop.id).sort((a, b) => new Date(b.offered_at).getTime() - new Date(a.offered_at).getTime())
      acc[shop.id] = shopOffers.length > 0 ? shopOffers[0] : null
      return acc
    }, {} as Record<string, { price: number; offered_at: string } | null>)

    const allPrices = Object.values(latestOffersPerShop).filter(Boolean).map(o => o!.price)
    const bestBid = allPrices.length > 0 ? Math.max(...allPrices) : 0
    
    const refPriceInfo = marketPerModel[unit.model_id]
    const medianPasaran = refPriceInfo.price || 0

    const discount = discountFastSale(bestBid, medianPasaran)
    
    const acquiredAt = unit.acquired_at ? new Date(unit.acquired_at) : new Date(unit.created_at)
    const stockDays = Math.floor((new Date().getTime() - acquiredAt.getTime()) / (1000 * 3600 * 24))

    const suggestion = bestBid > 0 && medianPasaran > 0 
      ? suggest({ discount, stockDays }, settings)
      : null

    return {
      unit,
      latestOffersPerShop,
      bestBid,
      refPriceInfo,
      discount,
      suggestion,
      stockDays,
    }
  })

  return { comparisonUnits, activeShops, settings }
}
