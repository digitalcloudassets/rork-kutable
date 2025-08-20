import type { Service, Booking } from "@/types/models";
import { seedData } from "@/lib/seedData";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  barbers: {
    search: async ({ q, serviceId }: { q?: string; serviceId?: string }) => {
      try {
        const response = await fetch('/api/barbers/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q, serviceId }),
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.barbers;
        } else {
          console.error('Failed to search barbers');
          // Fallback to seed data
          await delay(500);
          let barbers = seedData.barbers;
          if (q) {
            barbers = barbers.filter(b => 
              b.name.toLowerCase().includes(q.toLowerCase()) ||
              b.shopName?.toLowerCase().includes(q.toLowerCase()) ||
              b.services.some(s => s.name.toLowerCase().includes(q.toLowerCase()))
            );
          }
          if (serviceId) {
            barbers = barbers.filter(b => 
              b.services.some(s => s.id === serviceId)
            );
          }
          return barbers;
        }
      } catch (error) {
        console.error('Error searching barbers:', error);
        // Fallback to seed data
        await delay(500);
        let barbers = seedData.barbers;
        if (q) {
          barbers = barbers.filter(b => 
            b.name.toLowerCase().includes(q.toLowerCase()) ||
            b.shopName?.toLowerCase().includes(q.toLowerCase()) ||
            b.services.some(s => s.name.toLowerCase().includes(q.toLowerCase()))
          );
        }
        if (serviceId) {
          barbers = barbers.filter(b => 
            b.services.some(s => s.id === serviceId)
          );
        }
        return barbers;
      }
    },

    list: async ({ search }: { search?: string }) => {
      // Deprecated: use search instead
      return api.barbers.search({ q: search });
    },
    
    profile: async ({ barberId }: { barberId: string }) => {
      try {
        const response = await fetch(`/api/barbers/profile?barberId=${barberId}`, {
          method: 'GET',
        });
        
        if (response.ok) {
          const data = await response.json();
          // Combine barber and services into the expected format
          return {
            ...data.barber,
            services: data.services
          };
        } else {
          console.error('Failed to fetch barber profile');
          // Fallback to seed data
          await delay(300);
          return seedData.barbers.find(b => b.id === barberId) || null;
        }
      } catch (error) {
        console.error('Error fetching barber profile:', error);
        // Fallback to seed data
        await delay(300);
        return seedData.barbers.find(b => b.id === barberId) || null;
      }
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

    openSlots: async ({ barberId, serviceId, date, tz }: { 
      barberId: string; 
      serviceId: string; 
      date: string; 
      tz?: string; 
    }) => {
      try {
        const params = new URLSearchParams({
          barberId,
          serviceId,
          date,
          ...(tz && { tz }),
        });
        
        const response = await fetch(`/api/availability/open-slots?${params}`, {
          method: 'GET',
        });
        
        if (response.ok) {
          const data = await response.json();
          return data;
        } else {
          const error = await response.json();
          console.error('Failed to fetch open slots:', error);
          return { slots: [] };
        }
      } catch (error) {
        console.error('Error fetching open slots:', error);
        return { slots: [] };
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
    summary: async ({ barberId, range }: { barberId: string; range: 'today' | 'week' | 'month' }) => {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/earnings/summary?barberId=${barberId}&range=${range}`
        );
        
        if (response.ok) {
          const data = await response.json();
          return {
            gross: data.grossCents,
            fees: data.feesCents,
            net: data.netCents,
          };
        } else {
          console.error('Failed to fetch earnings summary');
          // Fallback to mock data
          await delay(500);
          const amounts = {
            today: { gross: 8500, fees: 500, net: 8000 },
            week: { gross: 125000, fees: 7500, net: 117500 },
            month: { gross: 542000, fees: 32500, net: 509500 },
          };
          return amounts[range] || amounts.month;
        }
      } catch (error) {
        console.error('Error fetching earnings summary:', error);
        // Fallback to mock data
        await delay(500);
        const amounts = {
          today: { gross: 8500, fees: 500, net: 8000 },
          week: { gross: 125000, fees: 7500, net: 117500 },
          month: { gross: 542000, fees: 32500, net: 509500 },
        };
        return amounts[range] || amounts.month;
      }
    },
  },

  payouts: {
    list: async ({ barberId }: { barberId: string }) => {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/payouts/list?barberId=${barberId}`
        );
        
        if (response.ok) {
          const data = await response.json();
          return data.payouts.map((payout: any) => ({
            id: payout.id,
            amount: payout.amountCents,
            date: payout.createdAtISO.split('T')[0],
            status: payout.status === 'paid' ? 'completed' : payout.status,
            arrivalDate: payout.arrivalDateISO,
          }));
        } else {
          console.error('Failed to fetch payouts');
          // Fallback to mock data
          await delay(500);
          return [
            { id: "1", amount: 117500, date: "2024-03-10", status: "completed" },
            { id: "2", amount: 98000, date: "2024-03-03", status: "completed" },
          ];
        }
      } catch (error) {
        console.error('Error fetching payouts:', error);
        // Fallback to mock data
        await delay(500);
        return [
          { id: "1", amount: 117500, date: "2024-03-10", status: "completed" },
          { id: "2", amount: 98000, date: "2024-03-03", status: "completed" },
        ];
      }
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