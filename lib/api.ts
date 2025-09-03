import { supabase } from './supabase'
import type { Tour, Booking, Location, ContactMessage, Profile } from './supabase'

// Tours API
export const toursApi = {
  async getAll(): Promise<Tour[]> {
    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Tour | null> {
    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()
    
    if (error) throw error
    return data
  }
}

// Bookings API
export const bookingsApi = {
  async create(booking: Omit<Booking, 'id' | 'booking_number' | 'created_at' | 'updated_at'>): Promise<Booking> {
    const bookingNumber = await generateBookingNumber()
    
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        ...booking,
        booking_number: bookingNumber
      })
      .select('*, tour:tours(*)')
      .single()
    
    if (error) throw error
    return data
  },

  async getByUserId(userId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, tour:tours(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Booking | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, tour:tours(*)')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Booking>): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select('*, tour:tours(*)')
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Locations API
export const locationsApi = {
  async getAll(): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async searchByQuery(query: string, areas?: string[]): Promise<Location[]> {
    let queryBuilder = supabase
      .from('locations')
      .select('*')
      .eq('is_active', true)
      .ilike('address', `%${query}%`)
    
    if (areas && areas.length > 0) {
      queryBuilder = queryBuilder.in('area', areas)
    }
    
    const { data, error } = await queryBuilder
      .order('name')
      .limit(10)
    
    if (error) throw error
    return data || []
  }
}

// Contact API
export const contactApi = {
  async create(message: Omit<ContactMessage, 'id' | 'status' | 'created_at'>): Promise<ContactMessage> {
    const { data, error } = await supabase
      .from('contact_messages')
      .insert(message)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Profile API
export const profileApi = {
  async get(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  async update(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Auth API
export const authApi = {
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })
    
    if (error) throw error
    return data
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  }
}

// Utility functions
async function generateBookingNumber(): Promise<string> {
  const { data, error } = await supabase.rpc('generate_booking_number')
  if (error) throw error
  return data
}

// Email notifications (you can integrate with services like Resend, SendGrid, etc.)
export const emailApi = {
  async sendBookingConfirmation(booking: Booking) {
    // Implement email sending logic here
    console.log('Sending booking confirmation email for:', booking.booking_number)
  },

  async sendContactConfirmation(message: ContactMessage) {
    // Implement email sending logic here
    console.log('Sending contact confirmation email to:', message.email)
  }
}
