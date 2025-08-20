import type { Service, Booking } from "@/types/models";
import { seedData } from "@/lib/seedData";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Get backend URL with fallback
const getBackendUrl = () => {
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    console.warn('EXPO_PUBLIC_BACKEND_URL not configured, using fallback data');
    return null;
  }
  return backendUrl;
};

export const api = {
  barbers: {
    search: async ({ q, serviceId }: { q?: string; serviceId?: string }) => {
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, use seed data
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

      try {
        const response = await fetch(`${backendUrl}/api/barbers/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q, serviceId }),
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data.barbers;
          } else {
            console.warn('Backend returned non-JSON response, using fallback data');
            throw new Error('Non-JSON response');
          }
        } else {
          console.error('Failed to search barbers, status:', response.status);
          throw new Error('API request failed');
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
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, use seed data
        await delay(300);
        return seedData.barbers.find(b => b.id === barberId) || null;
      }

      try {
        const response = await fetch(`${backendUrl}/api/barbers/profile?barberId=${barberId}`, {
          method: 'GET',
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            // Combine barber and services into the expected format
            return {
              ...data.barber,
              services: data.services
            };
          } else {
            console.warn('Backend returned non-JSON response for barber profile, using fallback data');
            throw new Error('Non-JSON response');
          }
        } else {
          console.error('Failed to fetch barber profile, status:', response.status);
          throw new Error('API request failed');
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
        const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/availability/list`, {
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
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, generate mock slots
        await delay(500);
        const mockSlots = [];
        const startHour = 9; // 9 AM
        const endHour = 18; // 6 PM
        const stepMinutes = 15;
        
        for (let hour = startHour; hour < endHour; hour++) {
          for (let minute = 0; minute < 60; minute += stepMinutes) {
            const slotDate = new Date(date + 'T00:00:00');
            slotDate.setHours(hour, minute, 0, 0);
            mockSlots.push(slotDate.toISOString());
          }
        }
        
        return { slots: mockSlots };
      }

      try {
        const params = new URLSearchParams({
          barberId,
          serviceId,
          date,
          ...(tz && { tz }),
        });
        
        const response = await fetch(`${backendUrl}/api/availability/open-slots?${params}`, {
          method: 'GET',
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data;
          } else {
            console.warn('Backend returned non-JSON response for open slots, using fallback data');
            throw new Error('Non-JSON response');
          }
        } else {
          console.error('Failed to fetch open slots, status:', response.status);
          throw new Error('API request failed');
        }
      } catch (error) {
        console.error('Error fetching open slots:', error);
        // Fallback to mock slots
        await delay(500);
        const mockSlots = [];
        const startHour = 9; // 9 AM
        const endHour = 18; // 6 PM
        const stepMinutes = 15;
        
        for (let hour = startHour; hour < endHour; hour++) {
          for (let minute = 0; minute < 60; minute += stepMinutes) {
            const slotDate = new Date(date + 'T00:00:00');
            slotDate.setHours(hour, minute, 0, 0);
            mockSlots.push(slotDate.toISOString());
          }
        }
        
        return { slots: mockSlots };
      }
    },

    block: async ({ barberId, startISO, endISO, reason }: { barberId: string; startISO: string; endISO: string; reason?: string }) => {
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/availability/block`, {
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
        const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/availability/unblock`, {
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

  analytics: {
    summary: async ({ barberId, range }: { barberId: string; range: 'week' | 'month' }) => {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/analytics/summary?barberId=${barberId}&range=${range}`
        );
        
        if (response.ok) {
          const data = await response.json();
          return data;
        } else {
          console.error('Failed to fetch analytics summary');
          // Fallback to mock data
          await delay(500);
          return {
            bookingsCount: range === 'week' ? 12 : 47,
            grossCents: range === 'week' ? 125000 : 542000,
            netCents: range === 'week' ? 117500 : 509500,
            avgTicketCents: range === 'week' ? 10400 : 11500,
            cancellationsCount: range === 'week' ? 2 : 8,
            range,
          };
        }
      } catch (error) {
        console.error('Error fetching analytics summary:', error);
        // Fallback to mock data
        await delay(500);
        return {
          bookingsCount: range === 'week' ? 12 : 47,
          grossCents: range === 'week' ? 125000 : 542000,
          netCents: range === 'week' ? 117500 : 509500,
          avgTicketCents: range === 'week' ? 10400 : 11500,
          cancellationsCount: range === 'week' ? 2 : 8,
          range,
        };
      }
    },

    timeseries: async ({ barberId, start, end, bucket = 'day' }: { 
      barberId: string; 
      start: string; 
      end: string; 
      bucket?: string; 
    }) => {
      try {
        const params = new URLSearchParams({
          barberId,
          start,
          end,
          bucket,
        });
        
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/analytics/timeseries?${params}`
        );
        
        if (response.ok) {
          const data = await response.json();
          return data;
        } else {
          console.error('Failed to fetch analytics timeseries');
          // Fallback to mock data
          await delay(500);
          const mockData = [];
          const startDate = new Date(start);
          const endDate = new Date(end);
          const currentDate = new Date(startDate);
          
          while (currentDate <= endDate) {
            mockData.push({
              date: currentDate.toISOString().split('T')[0],
              bookingsCount: Math.floor(Math.random() * 8) + 1,
              grossCents: Math.floor(Math.random() * 50000) + 10000,
            });
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          return { timeSeries: mockData };
        }
      } catch (error) {
        console.error('Error fetching analytics timeseries:', error);
        // Fallback to mock data
        await delay(500);
        const mockData = [];
        const startDate = new Date(start);
        const endDate = new Date(end);
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          mockData.push({
            date: currentDate.toISOString().split('T')[0],
            bookingsCount: Math.floor(Math.random() * 8) + 1,
            grossCents: Math.floor(Math.random() * 50000) + 10000,
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return { timeSeries: mockData };
      }
    },

    topServices: async ({ barberId, range }: { barberId: string; range: 'month' }) => {
      try {
        const params = new URLSearchParams({
          barberId,
          range,
        });
        
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/analytics/top-services?${params}`
        );
        
        if (response.ok) {
          const data = await response.json();
          return data;
        } else {
          console.error('Failed to fetch top services');
          // Fallback to mock data
          await delay(500);
          return {
            topServices: [
              { serviceId: '1', serviceName: 'Classic Cut', bookingsCount: 18, grossCents: 180000 },
              { serviceId: '2', serviceName: 'Beard Trim', bookingsCount: 15, grossCents: 112500 },
              { serviceId: '3', serviceName: 'Fade Cut', bookingsCount: 12, grossCents: 144000 },
              { serviceId: '4', serviceName: 'Shampoo & Style', bookingsCount: 8, grossCents: 64000 },
            ],
          };
        }
      } catch (error) {
        console.error('Error fetching top services:', error);
        // Fallback to mock data
        await delay(500);
        return {
          topServices: [
            { serviceId: '1', serviceName: 'Classic Cut', bookingsCount: 18, grossCents: 180000 },
            { serviceId: '2', serviceName: 'Beard Trim', bookingsCount: 15, grossCents: 112500 },
            { serviceId: '3', serviceName: 'Fade Cut', bookingsCount: 12, grossCents: 144000 },
            { serviceId: '4', serviceName: 'Shampoo & Style', bookingsCount: 8, grossCents: 64000 },
          ],
        };
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