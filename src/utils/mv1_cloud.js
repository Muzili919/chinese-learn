// Cloud-based MV1 persistence using Supabase (client-side)
import { createClient } from '@supabase/supabase-js'

let supabase = null

function getClient() {
  if (!supabase) {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!url || !key) {
      console.warn('MV1 cloud: Supabase env vars not found, falling back to local storage')
      return null
    }
    supabase = createClient(url, key)
  }
  return supabase
}

export async function fetchMV1State(userId) {
  if (!userId) return null
  const client = getClient()
  if (!client) return null
  try {
    const { data, error } = await client
      .from('mv1_state')
      .select('state')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) {
      console.error('MV1 fetch error', error)
      return null
    }
    return data?.state ?? null
  } catch (e) {
    console.error('MV1 fetch exception', e)
    return null
  }
}

export async function upsertMV1State(userId, state) {
  if (!userId) return
  const client = getClient()
  if (!client) return
  try {
    await client.from('mv1_state').upsert({ user_id: userId, state }).eq('user_id', userId)
  } catch (e) {
    console.error('MV1 upsert error', e)
  }
}
