import type { Barber, Service, Booking, EarningsSummary } from "@/types/models";
import { seedData } from "@/lib/seedData";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  barbers: {
    list: async ({ search }: { search?: string }) => {
      await delay(500);
      let barbers = seedData.barbers;
      if (search) {
        barbers = barbers.filter(b => 
          b.name.toLowerCase().includes(search.toLowerCase()) ||
          b.shopName?.toLowerCase().includes(search.toLowerCase())
        );
      }
      return barbers;
    },
    
    profile: async ({ barberId }: { barberId: string }) => {
      await delay(300);
      return seedData.barbers.find(b => b.id === barberId) || null;
    },
  },

  services: {
    list: async ({ barberId }: { barberId: string }) => {
      await delay(300);
      // In production, this would call the backend endpoint
      // const response = await fetch('/api/services/list', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ barberId })
      // });
      // const data = await response.json();
      // return data.services;
      
      const barber = seedData.barbers.find(b => b.id === barberId);
      return barber?.services || [];
    },

    upsert: async ({ barberId, service }: { barberId: string; service: Partial<Service> }) => {
      await delay(500);
      // In production, this would call the backend endpoint
      // const response = await fetch('/api/services/upsert', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ barberId, service })
      // });
      // const data = await response.json();
      // return data.service;
      
      // Mock implementation
      const updatedService: Service = {
        id: service.id || Date.now().toString(),
        barberId,
        name: service.name || '',
        durationMinutes: service.durationMinutes || 30,
        priceCents: service.priceCents || 0,
        description: service.description,
        active: service.active !== undefined ? service.active : true,
      };
      return updatedService;
    },

    delete: async ({ barberId, serviceId }: { barberId: string; serviceId: string }) => {
      await delay(300);
      // In production, this would call the backend endpoint
      // const response = await fetch('/api/services/delete', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ barberId, serviceId })
      // });
      // const data = await response.json();
      // return data;
      
      return { ok: true };
    },
  },

  bookings: {
    create: async (data: any) => {
      await delay(1000);
      const booking: Booking = {
        id: Date.now().toString(),
        ...data,
        endISO: new Date(new Date(data.startISO).getTime() + 30 * 60000).toISOString(),
        status: "pending",
        createdAtISO: new Date().toISOString(),
      };
      return booking;
    },

    list: async ({ userId, barberId, date }: any) => {
      await delay(500);
      return seedData.bookings.filter(b => {
        if (barberId && b.barberId !== barberId) return false;
        if (date && !b.startISO.startsWith(date)) return false;
        return true;
      });
    },
  },

  availability: {
    list: async ({ barberId, startISO, endISO }: { barberId: string; startISO: string; endISO: string }) => {
      try {
        const response = await fetch('/api/availability/list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barberId, startISO, endISO }),
        });
        
        if (response.ok) {
          const data = await response.json();
          return data;
        } else {
          console.error('Failed to fetch availability blocks');
          return { blocks: [] };
        }
      } catch (error) {
        console.error('Error fetching availability blocks:', error);
        return { blocks: [] };
      }
    },

    block: async ({ barberId, startISO, endISO, reason }: { barberId: string; startISO: string; endISO: string; reason?: string }) => {
      try {
        const response = await fetch('/api/availability/block', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barberId, startISO, endISO, reason }),
        });
        
        if (response.ok) {
          const data = await response.json();
          return data;
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to block time');
        }
      } catch (error) {
        console.error('Error blocking time:', error);
        throw error;
      }
    },

    unblock: async ({ barberId, blockId }: { barberId: string; blockId: string }) => {
      try {
        const response = await fetch('/api/availability/unblock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barberId, blockId }),
        });
        
        if (response.ok) {
          const data = await response.json();
          return data;
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to unblock time');
        }
      } catch (error) {
        console.error('Error unblocking time:', error);
        throw error;
      }
    },
  },

  payments: {
    createIntent: async ({ bookingId }: { bookingId: string }) => {
      await delay(1500);
      return {
        clientSecret: "pi_test_" + Date.now(),
        paymentIntentId: "pi_" + Date.now(),
      };
    },
  },

  earnings: {
    summary: async ({ barberId, range }: any) => {
      await delay(500);
      const amounts = {
        week: { gross: 125000, fees: 7500, net: 117500 },
        month: { gross: 542000, fees: 32500, net: 509500 },
        year: { gross: 6504000, fees: 390200, net: 6113800 },
      };
      return amounts[range as keyof typeof amounts] || amounts.month;
    },
  },

  payouts: {
    list: async ({ barberId }: { barberId: string }) => {
      await delay(500);
      return [
        { id: "1", amount: 117500, date: "2024-03-10", status: "completed" },
        { id: "2", amount: 98000, date: "2024-03-03", status: "completed" },
      ];
    },
  },

  stripe: {
    createOrFetchAccount: async ({ barberId }: { barberId: string }) => {
      await delay(800);
      // In production, this would call the backend endpoint
      // const response = await fetch('/api/stripe/create-or-fetch-account', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ barberId })
      // });
      // return response.json();
      
      return {
        accountId: `acct_mock_${barberId}_${Date.now()}`
      };
    },

    createAccountLink: async ({ barberId, refreshUrl, returnUrl }: { 
      barberId: string; 
      refreshUrl: string; 
      returnUrl: string; 
    }) => {
      await delay(500);
      // In production, this would call the backend endpoint
      return {
        url: `https://connect.stripe.com/express/oauth/authorize?client_id=mock&state=${barberId}&redirect_uri=${encodeURIComponent(returnUrl)}`
      };
    },

    getAccountStatus: async ({ barberId }: { barberId: string }) => {
      await delay(300);
      // In production, this would call the backend endpoint
      // const response = await fetch(`/api/stripe/account-status?barberId=${barberId}`);
      // return response.json();
      
      return {
        chargesEnabled: true,
        payoutsEnabled: true
      };
    },
  },
};