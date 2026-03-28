import type { Barber, Booking, AvailabilityBlock } from "@/types/models";

export const seedData = {
  barbers: [
    {
      id: "barber-1",
      name: "Marcus Johnson",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      bio: "Master barber with 10+ years of experience. Specializing in fades, beard sculpting, and classic cuts.",
      shopName: "Elite Cuts Barbershop",
      shopAddress: "123 Main St, Downtown",
      phone: "(555) 123-4567",
      services: [
        {
          id: "s1",
          barberId: "barber-1",
          name: "Classic Haircut",
          durationMinutes: 30,
          priceCents: 3500,
          description: "Traditional haircut with styling",
          active: true,
        },
        {
          id: "s2",
          barberId: "barber-1",
          name: "Beard Trim",
          durationMinutes: 20,
          priceCents: 2500,
          description: "Professional beard shaping and trim",
          active: true,
        },
        {
          id: "s3",
          barberId: "barber-1",
          name: "Full Service",
          durationMinutes: 60,
          priceCents: 6000,
          description: "Haircut, beard trim, and hot towel treatment",
          active: true,
        },
      ],
      galleryTop: [
        {
          url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
          createdAtISO: '2024-01-15T10:30:00Z',
          path: 'gallery/barber-1/haircut-1.jpg'
        },
        {
          url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=400&fit=crop',
          createdAtISO: '2024-01-14T15:20:00Z',
          path: 'gallery/barber-1/haircut-2.jpg'
        },
        {
          url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop',
          createdAtISO: '2024-01-13T09:45:00Z',
          path: 'gallery/barber-1/haircut-3.jpg'
        },
        {
          url: 'https://images.unsplash.com/photo-1622286346003-c3d4e9370c04?w=400&h=400&fit=crop',
          createdAtISO: '2024-01-12T14:15:00Z',
          path: 'gallery/barber-1/haircut-4.jpg'
        }
      ],
    },
    {
      id: "barber-2",
      name: "Alex Rivera",
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
      bio: "Creative stylist specializing in modern cuts and color. Instagram: @alexcuts",
      shopName: "The Modern Barber",
      shopAddress: "456 Oak Ave, Midtown",
      phone: "(555) 234-5678",
      services: [
        {
          id: "s4",
          barberId: "barber-2",
          name: "Premium Fade",
          durationMinutes: 45,
          priceCents: 4500,
          description: "Precision fade with detailed line work",
          active: true,
        },
        {
          id: "s5",
          barberId: "barber-2",
          name: "Kids Cut",
          durationMinutes: 25,
          priceCents: 2500,
          description: "Patient and fun haircuts for children",
          active: true,
        },
      ],
      galleryTop: [
        {
          url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=400&fit=crop',
          createdAtISO: '2024-01-16T11:00:00Z',
          path: 'gallery/barber-2/style-1.jpg'
        },
        {
          url: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&h=400&fit=crop',
          createdAtISO: '2024-01-15T16:30:00Z',
          path: 'gallery/barber-2/style-2.jpg'
        }
      ],
    },
    {
      id: "barber-3",
      name: "James Chen",
      photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
      bio: "Traditional barber with a modern touch. Straight razor specialist.",
      shopName: null,
      shopAddress: "Mobile Service - I come to you!",
      phone: "(555) 345-6789",
      services: [
        {
          id: "s6",
          barberId: "barber-3",
          name: "House Call Haircut",
          durationMinutes: 45,
          priceCents: 7500,
          description: "Professional haircut at your location",
          active: true,
        },
        {
          id: "s7",
          barberId: "barber-3",
          name: "Straight Razor Shave",
          durationMinutes: 30,
          priceCents: 4000,
          description: "Classic hot towel and straight razor shave",
          active: true,
        },
        {
          id: "s8",
          barberId: "barber-3",
          name: "Wedding Package",
          durationMinutes: 90,
          priceCents: 15000,
          description: "Groom and groomsmen styling",
          active: true,
        },
      ],
      galleryTop: [
        {
          url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
          createdAtISO: '2024-01-17T14:20:00Z',
          path: 'gallery/barber-3/mobile-1.jpg'
        },
        {
          url: 'https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?w=400&h=400&fit=crop',
          createdAtISO: '2024-01-16T09:15:00Z',
          path: 'gallery/barber-3/mobile-2.jpg'
        },
        {
          url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&h=400&fit=crop',
          createdAtISO: '2024-01-15T12:45:00Z',
          path: 'gallery/barber-3/mobile-3.jpg'
        }
      ],
    },
  ] as Barber[],

  bookings: [
    {
      id: "b1",
      barberId: "barber-1",
      barberName: "Marcus Johnson",
      serviceId: "s1",
      serviceName: "Classic Haircut",
      startISO: new Date(Date.now() + 86400000).toISOString(),
      endISO: new Date(Date.now() + 88200000).toISOString(),
      clientName: "John Smith",
      clientPhone: "(555) 111-2222",
      status: "confirmed",
      createdAtISO: new Date().toISOString(),
    },
    {
      id: "b2",
      barberId: "barber-1",
      barberName: "Marcus Johnson",
      serviceId: "s2",
      serviceName: "Beard Trim",
      startISO: new Date(Date.now() - 86400000).toISOString(),
      endISO: new Date(Date.now() - 84600000).toISOString(),
      clientName: "Mike Johnson",
      clientPhone: "(555) 222-3333",
      status: "completed",
      createdAtISO: new Date(Date.now() - 172800000).toISOString(),
    },
  ] as Booking[],

  availabilityBlocks: [
    {
      id: "ab1",
      barberId: "barber-1",
      startISO: new Date().setHours(12, 0, 0, 0).toString(),
      endISO: new Date().setHours(13, 0, 0, 0).toString(),
      reason: "Lunch break",
    },
  ] as AvailabilityBlock[],
};