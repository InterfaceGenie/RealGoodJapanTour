import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Profile {
  id: string
  email: string
  full_name?: string
  phone?: string
  country?: string
  travel_preferences?: string
  created_at: string
  updated_at: string
}

export interface Tour {
  id: string
  title: string
  short_title?: string
  description: string
  long_description?: string
  price: number
  duration: string
  max_guests: number
  rating: number
  review_count: number
  images: string[]
  highlights: string[]
  included: string[]
  not_included: string[]
  itinerary?: any[]
  pickup_restrictions: string
  fixed_pickup_location?: string
  pickup_areas: string[]
  booking_notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  booking_number: string
  user_id: string
  tour_id: string
  tour_date: string
  tour_time: string
  guests: number
  total_price: number
  pickup_location?: string
  pickup_lat?: number
  pickup_lng?: number
  customer_name: string
  customer_email: string
  customer_phone: string
  special_requests?: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_status: 'pending' | 'paid' | 'refunded'
  created_at: string
  updated_at: string
  tour?: Tour
}

export interface Location {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  type: string
  area: string
  is_active: boolean
  created_at: string
}

export interface ContactMessage {
  id: string
  first_name: string
  last_name: string
  email: string
  whatsapp?: string
  tour_interest?: string
  message: string
  status: 'new' | 'read' | 'replied' | 'closed'
  created_at: string
}

export interface Review {
  id: string
  booking_id: string
  user_id: string
  tour_id: string
  rating: number
  title?: string
  review_text?: string
  is_featured: boolean
  created_at: string
}
