import { useEffect, useState } from 'react'
import { loadDemoData } from '../lib/data'
import type { CampaignHistory, Customer, Offer } from '../types'

export function useDemoData() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [history, setHistory] = useState<CampaignHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { loadDemoData().then((data) => { setCustomers(data.customers); setOffers(data.offers); setHistory(data.history) }).catch((err: Error) => setError(err.message)).finally(() => setLoading(false)) }, [])
  return { customers, offers, history, loading, error }
}
