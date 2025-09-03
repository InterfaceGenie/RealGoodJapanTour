-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  country TEXT,
  travel_preferences TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tours table
CREATE TABLE public.tours (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  short_title TEXT,
  description TEXT,
  long_description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration TEXT,
  max_guests INTEGER DEFAULT 15,
  rating DECIMAL(2,1) DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  highlights TEXT[] DEFAULT '{}',
  included TEXT[] DEFAULT '{}',
  not_included TEXT[] DEFAULT '{}',
  itinerary JSONB DEFAULT '[]',
  pickup_restrictions TEXT DEFAULT 'flexible', -- 'flexible', 'dotonbori', 'fixed'
  fixed_pickup_location TEXT,
  pickup_areas TEXT[] DEFAULT '{}',
  booking_notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE,
  tour_date DATE NOT NULL,
  tour_time TIME NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  pickup_location TEXT,
  pickup_lat DECIMAL(10,8),
  pickup_lng DECIMAL(10,8),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  special_requests TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contact_messages table
CREATE TABLE public.contact_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  tour_interest TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create locations table for pickup locations
CREATE TABLE public.locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(10,8) NOT NULL,
  type TEXT NOT NULL, -- 'hotel', 'station', 'landmark', 'district', etc.
  area TEXT NOT NULL, -- 'Kyoto', 'Osaka', 'Kobe', 'Nara'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample tours
INSERT INTO public.tours (id, title, short_title, description, long_description, price, duration, max_guests, rating, review_count, images, highlights, included, not_included, pickup_restrictions, pickup_areas, booking_notes) VALUES
(
  '1',
  'Full Day Tour of Kyoto with Private Transportation',
  'Kyoto Full Day',
  'Experience the ancient capital''s most iconic temples, traditional districts, and cultural treasures with private transportation and expert guidance.',
  'Immerse yourself in the timeless beauty of Kyoto, Japan''s former imperial capital and cultural heart. This comprehensive full-day tour takes you through the city''s most iconic temples, traditional districts, and hidden gems, all while traveling in comfort with private transportation and an expert local guide.',
  39500,
  '8-10 hours',
  15,
  4.9,
  127,
  ARRAY['/kyoto-traditional-street.jpg', '/traditional-japanese-tea-house.png', '/japanese-temple-garden.png'],
  ARRAY['Fushimi Inari Shrine', 'Kiyomizu Temple', 'Bamboo Grove', 'Traditional Tea House', 'Private Transportation', 'Expert Guide'],
  ARRAY['Private air-conditioned vehicle with professional driver', 'Expert English-speaking local guide', 'All entrance fees to temples and attractions', 'Traditional tea ceremony experience', 'Hotel pickup and drop-off', 'Bottled water and refreshments'],
  ARRAY['Lunch and personal meals', 'Personal shopping and souvenirs', 'Travel insurance', 'Gratuities (optional but appreciated)'],
  'flexible',
  ARRAY['Kyoto', 'Osaka'],
  'This tour requires a minimum of 24 hours advance booking. Weather conditions may affect some outdoor activities.'
),
(
  '2',
  'Osaka Food Hopping Tour by Local Japanese Guide',
  'Osaka Food Tour',
  'Discover Osaka''s incredible street food scene with a local guide who knows all the best hidden spots and authentic flavors.',
  'Embark on a culinary adventure through Osaka''s vibrant food scene, guided by a passionate local who knows every hidden gem and authentic flavor the city has to offer. This intimate food hopping tour takes you beyond tourist restaurants to discover the real taste of Osaka.',
  7537,
  '2-4 hours',
  15,
  4.8,
  89,
  ARRAY['/osaka-food-family.jpg', '/osaka-takoyaki-street-food.png', '/osaka-dotonbori-neon.png'],
  ARRAY['Takoyaki Tasting', 'Local Street Food', 'Hidden Gems', 'Cultural Stories', 'English-Speaking Guide', 'Small Group'],
  ARRAY['Expert local Japanese guide', 'All food tastings (6-8 different dishes)', 'Cultural stories and historical context', 'Restaurant recommendations for future visits', 'Small group experience (max 15 people)'],
  ARRAY['Additional drinks beyond included tastings', 'Transportation to/from meeting point', 'Personal purchases and souvenirs', 'Gratuities (optional but appreciated)'],
  'dotonbori',
  ARRAY['Osaka'],
  'This tour involves walking and standing for extended periods. Please inform us of any dietary restrictions or allergies.'
),
(
  '3',
  'Imperial Osaka Castle & Elite Districts',
  'Imperial Osaka',
  'Explore the majestic Osaka Castle and the city''s most prestigious districts, blending historical grandeur with modern luxury.',
  'Step into the world of Japanese nobility and modern elegance with this exclusive tour of Osaka''s most prestigious locations. From the magnificent Osaka Castle to the city''s elite shopping districts, experience the perfect blend of historical grandeur and contemporary luxury.',
  28500,
  '6-8 hours',
  15,
  4.9,
  156,
  ARRAY['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_1898-c4aZKGAyNBPryIGsdGtxsxBLLKcA6P.jpeg', '/kobe-harbor-night.png', '/osaka-dotonbori-neon.png'],
  ARRAY['Osaka Castle', 'Elite Shopping Districts', 'Traditional Gardens', 'Modern Architecture', 'Premium Experience', 'Private Guide'],
  ARRAY['Private transportation with professional driver', 'Expert English-speaking guide', 'Osaka Castle entrance and museum fees', 'Traditional garden access', 'Exclusive restaurant lunch', 'Hotel pickup and drop-off'],
  ARRAY['Personal shopping in elite districts', 'Additional meals and beverages', 'Travel insurance', 'Gratuities (optional but appreciated)'],
  'flexible',
  ARRAY['Osaka', 'Kyoto'],
  'This premium tour includes exclusive access to certain locations. Advance booking of 48 hours is recommended.'
),
(
  '4',
  'Customized Private Tour',
  'Custom Tour',
  'Create your perfect Japan experience with a fully customized tour tailored to your interests, schedule, and preferences.',
  'Design your dream Japan experience with our completely customizable private tour service. Whether you''re interested in traditional culture, modern attractions, culinary adventures, or hidden gems, we''ll create the perfect itinerary just for you.',
  25000,
  'Flexible',
  15,
  5.0,
  203,
  ARRAY['/japanese-temple-garden.png', '/traditional-japanese-tea-house.png', '/kyoto-traditional-street.jpg'],
  ARRAY['Personalized Itinerary', 'Private Guide', 'Flexible Schedule', 'Your Interests', 'Custom Experience', 'Premium Service'],
  ARRAY['Fully customized itinerary planning', 'Private expert guide for your chosen duration', 'Transportation as needed for your itinerary', 'Entrance fees to selected attractions', 'Personalized recommendations and insights', 'Flexible scheduling and modifications'],
  ARRAY['Meals (unless specifically requested)', 'Personal purchases and shopping', 'Travel insurance', 'Activities not included in agreed itinerary'],
  'flexible',
  ARRAY['Kyoto', 'Osaka', 'Kobe', 'Nara', 'Other'],
  'Custom tours require advance planning. Please contact us at least 48 hours before your desired date to discuss your preferences and create the perfect itinerary.'
);

-- Insert sample locations
INSERT INTO public.locations (name, address, lat, lng, type, area) VALUES
-- Kyoto locations
('Kyoto Station', 'Kyoto Station, Kyoto, Japan', 34.9858, 135.7581, 'Station', 'Kyoto'),
('Gion District', 'Gion District, Kyoto, Japan', 35.0036, 135.7778, 'District', 'Kyoto'),
('Kiyomizu-dera Temple', 'Kiyomizu-dera Temple, Kyoto, Japan', 34.9949, 135.7851, 'Temple', 'Kyoto'),
('Arashiyama', 'Arashiyama, Kyoto, Japan', 35.0170, 135.6761, 'District', 'Kyoto'),
('Fushimi Inari Shrine', 'Fushimi Inari Shrine, Kyoto, Japan', 34.9671, 135.7727, 'Shrine', 'Kyoto'),
('Hotel Granvia Kyoto', 'Hotel Granvia Kyoto, Kyoto Station', 34.9858, 135.7581, 'Hotel', 'Kyoto'),
('The Ritz-Carlton Kyoto', 'The Ritz-Carlton Kyoto', 35.0036, 135.7714, 'Hotel', 'Kyoto'),

-- Osaka locations
('Osaka Station', 'Osaka Station, Osaka, Japan', 34.7024, 135.4959, 'Station', 'Osaka'),
('Dotonbori', 'Dotonbori, Osaka, Japan', 34.6686, 135.5023, 'District', 'Osaka'),
('Osaka Castle', 'Osaka Castle, Osaka, Japan', 34.6873, 135.5262, 'Castle', 'Osaka'),
('Shinsaibashi', 'Shinsaibashi, Osaka, Japan', 34.6751, 135.5018, 'Shopping', 'Osaka'),
('Namba Station', 'Namba Station, Osaka, Japan', 34.6661, 135.5006, 'Station', 'Osaka'),
('Hotel Granvia Osaka', 'Hotel Granvia Osaka, Osaka Station', 34.7024, 135.4959, 'Hotel', 'Osaka'),
('The St. Regis Osaka', 'The St. Regis Osaka', 34.6751, 135.5018, 'Hotel', 'Osaka'),

-- Kobe locations
('Kobe Station', 'Kobe Station, Kobe, Japan', 34.6760, 135.1875, 'Station', 'Kobe'),
('Kobe Port Tower', 'Kobe Port Tower, Kobe, Japan', 34.6823, 135.1864, 'Landmark', 'Kobe'),
('Kitano Foreign District', 'Kitano Foreign District, Kobe, Japan', 34.6953, 135.1897, 'District', 'Kobe'),

-- Nara locations
('Nara Station', 'Nara Station, Nara, Japan', 34.6851, 135.8048, 'Station', 'Nara'),
('Nara Park', 'Nara Park, Nara, Japan', 34.6851, 135.8432, 'Park', 'Nara'),
('Todaiji Temple', 'Todaiji Temple, Nara, Japan', 34.6890, 135.8398, 'Temple', 'Nara');

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their bookings" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public read access for tours and locations
CREATE POLICY "Anyone can view tours" ON public.tours
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view locations" ON public.locations
  FOR SELECT USING (is_active = true);

-- Contact messages - no RLS needed as it's public
CREATE POLICY "Anyone can create contact messages" ON public.contact_messages
  FOR INSERT WITH CHECK (true);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_tours_updated_at
  BEFORE UPDATE ON public.tours
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to generate booking numbers
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'RGJ' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
