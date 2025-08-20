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
            // Combine barber, services, and gallery into the expected format
            return {
              ...data.barber,
              services: data.services,
              galleryTop: data.galleryTop
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
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, use seed data
        await delay(300);
        const barber = seedData.barbers.find(b => b.id === barberId);
        return barber?.services || [];
      }

      try {
        const response = await fetch(`${backendUrl}/api/services/list`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barberId }),
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data.services;
          } else {
            console.warn('Backend returned non-JSON response for services list, using fallback data');
            throw new Error('Non-JSON response');
          }
        } else {
          console.error('Failed to fetch services list, status:', response.status);
          throw new Error('API request failed');
        }
      } catch (error) {
        console.error('Error fetching services list:', error);
        // Fallback to seed data
        await delay(300);
        const barber = seedData.barbers.find(b => b.id === barberId);
        return barber?.services || [];
      }
    },

    upsert: async ({ barberId, service }: { barberId: string; service: Partial<Service> }) => {
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, use mock implementation
        await delay(500);
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
      }

      try {
        const response = await fetch(`${backendUrl}/api/services/upsert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barberId, service }),
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data.service;
          } else {
            console.warn('Backend returned non-JSON response for service upsert, using fallback data');
            throw new Error('Non-JSON response');
          }
        } else {
          console.error('Failed to upsert service, status:', response.status);
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'API request failed');
        }
      } catch (error) {
        console.error('Error upserting service:', error);
        throw error;
      }
    },

    delete: async ({ barberId, serviceId }: { barberId: string; serviceId: string }) => {
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, use mock implementation
        await delay(300);
        return { ok: true };
      }

      try {
        const response = await fetch(`${backendUrl}/api/services/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barberId, serviceId }),
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data;
          } else {
            console.warn('Backend returned non-JSON response for service delete, using fallback data');
            throw new Error('Non-JSON response');
          }
        } else {
          console.error('Failed to delete service, status:', response.status);
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'API request failed');
        }
      } catch (error) {
        console.error('Error deleting service:', error);
        throw error;
      }
    },
  },

  bookings: {
    cancel: async ({ bookingId, reason, userId }: { bookingId: string; reason?: string; userId: string }) => {
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, use mock implementation
        await delay(500);
        return { booking: { id: bookingId, status: 'cancelled' } };
      }

      try {
        const response = await fetch(`${backendUrl}/api/bookings/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId, reason, userId }),
        });
        
        if (response.ok) {
          const result = await response.json();
          return result;
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to cancel booking');
        }
      } catch (error) {
        console.error('Error cancelling booking:', error);
        throw error;
      }
    },

    reschedule: async ({ bookingId, newStartISO, userId }: { bookingId: string; newStartISO: string; userId: string }) => {
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, use mock implementation
        await delay(800);
        return { booking: { id: bookingId, startISO: newStartISO, status: 'confirmed' } };
      }

      try {
        const response = await fetch(`${backendUrl}/api/bookings/reschedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId, newStartISO, userId }),
        });
        
        if (response.ok) {
          const result = await response.json();
          return result;
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to reschedule booking');
        }
      } catch (error) {
        console.error('Error rescheduling booking:', error);
        throw error;
      }
    },

    create: async (data: { barberId?: string; serviceId?: string; startISO?: string; clientName?: string; clientPhone?: string; clientUserId?: string; note?: string; }) => {
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, use mock implementation
        await delay(1000);
        const booking: Booking = {
          id: Date.now().toString(),
          barberId: data.barberId || '',
          serviceId: data.serviceId || '',
          startISO: data.startISO || new Date().toISOString(),
          endISO: new Date(new Date(data.startISO || new Date()).getTime() + 30 * 60000).toISOString(),
          clientName: data.clientName || '',
          clientPhone: data.clientPhone || '',
          clientUserId: data.clientUserId,
          note: data.note,
          status: "pending",
          createdAtISO: new Date().toISOString(),
        };
        return booking;
      }

      try {
        const response = await fetch(`${backendUrl}/api/bookings/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        
        if (response.ok) {
          const result = await response.json();
          return result.booking;
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create booking');
        }
      } catch (error) {
        console.error('Error creating booking:', error);
        throw error;
      }
    },

    list: async ({ userId, barberId, range }: { userId?: string; barberId?: string; range?: string; }) => {
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, use seed data
        await delay(500);
        return seedData.bookings.filter(b => {
          if (barberId && b.barberId !== barberId) return false;
          return true;
        });
      }

      try {
        const response = await fetch(`${backendUrl}/api/bookings/list`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, barberId, range }),
        });
        
        if (response.ok) {
          const result = await response.json();
          return result.bookings;
        } else {
          console.error('Failed to fetch bookings');
          // Fallback to seed data
          await delay(500);
          return seedData.bookings.filter(b => {
            if (barberId && b.barberId !== barberId) return false;
            return true;
          });
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        // Fallback to seed data
        await delay(500);
        return seedData.bookings.filter(b => {
          if (barberId && b.barberId !== barberId) return false;
          return true;
        });
      }
    },
  },

  availability: {
    list: async ({ barberId, startISO, endISO }: { barberId: string; startISO: string; endISO: string }) => {
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, return empty blocks
        await delay(300);
        return { blocks: [] };
      }

      try {
        const response = await fetch(`${backendUrl}/api/availability/list`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barberId, startISO, endISO }),
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data;
          } else {
            console.warn('Backend returned non-JSON response for availability list, using fallback data');
            throw new Error('Non-JSON response');
          }
        } else {
          console.error('Failed to fetch availability blocks, status:', response.status);
          throw new Error('API request failed');
        }
      } catch (error) {
        console.error('Error fetching availability blocks:', error);
        // Fallback to empty blocks
        await delay(300);
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
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, use mock implementation
        await delay(500);
        return {
          block: {
            id: Date.now().toString(),
            barberId,
            startISO,
            endISO,
            reason,
            createdAtISO: new Date().toISOString(),
          }
        };
      }

      try {
        const response = await fetch(`${backendUrl}/api/availability/block`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barberId, startISO, endISO, reason }),
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data;
          } else {
            console.warn('Backend returned non-JSON response for availability block, using fallback data');
            throw new Error('Non-JSON response');
          }
        } else {
          console.error('Failed to block time, status:', response.status);
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'API request failed');
        }
      } catch (error) {
        console.error('Error blocking time:', error);
        throw error;
      }
    },

    unblock: async ({ barberId, blockId }: { barberId: string; blockId: string }) => {
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, use mock implementation
        await delay(300);
        return { ok: true };
      }

      try {
        const response = await fetch(`${backendUrl}/api/availability/unblock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barberId, blockId }),
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data;
          } else {
            console.warn('Backend returned non-JSON response for availability unblock, using fallback data');
            throw new Error('Non-JSON response');
          }
        } else {
          console.error('Failed to unblock time, status:', response.status);
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'API request failed');
        }
      } catch (error) {
        console.error('Error unblocking time:', error);
        throw error;
      }
    },
  },

  payments: {
    createIntent: async ({ bookingId }: { bookingId: string }) => {
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, use mock implementation
        await delay(1500);
        return {
          clientSecret: "pi_test_" + Date.now(),
          paymentIntentId: "pi_" + Date.now(),
        };
      }

      try {
        const response = await fetch(`${backendUrl}/api/payments/create-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId }),
        });
        
        if (response.ok) {
          const result = await response.json();
          return result;
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create payment intent');
        }
      } catch (error) {
        console.error('Error creating payment intent:', error);
        throw error;
      }
    },
  },

  earnings: {
    summary: async ({ barberId, range }: { barberId: string; range: 'today' | 'week' | 'month' }) => {
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, use mock data
        await delay(500);
        const amounts = {
          today: { gross: 8500, fees: 500, net: 8000 },
          week: { gross: 125000, fees: 7500, net: 117500 },
          month: { gross: 542000, fees: 32500, net: 509500 },
        };
        return amounts[range] || amounts.month;
      }

      try {
        const response = await fetch(
          `${backendUrl}/api/earnings/summary?barberId=${barberId}&range=${range}`
        );
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return {
              gross: data.grossCents,
              fees: data.feesCents,
              net: data.netCents,
            };
          } else {
            console.warn('Backend returned non-JSON response for earnings summary, using fallback data');
            throw new Error('Non-JSON response');
          }
        } else {
          console.error('Failed to fetch earnings summary, status:', response.status);
          throw new Error('API request failed');
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
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, use mock data
        await delay(500);
        return [
          { id: "1", amount: 117500, date: "2024-03-10", status: "completed" },
          { id: "2", amount: 98000, date: "2024-03-03", status: "completed" },
        ];
      }

      try {
        const response = await fetch(
          `${backendUrl}/api/payouts/list?barberId=${barberId}`
        );
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data.payouts.map((payout: any) => ({
              id: payout.id,
              amount: payout.amountCents,
              date: payout.createdAtISO.split('T')[0],
              status: payout.status === 'paid' ? 'completed' : payout.status,
              arrivalDate: payout.arrivalDateISO,
            }));
          } else {
            console.warn('Backend returned non-JSON response for payouts list, using fallback data');
            throw new Error('Non-JSON response');
          }
        } else {
          console.error('Failed to fetch payouts, status:', response.status);
          throw new Error('API request failed');
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
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, use mock data
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

      try {
        const response = await fetch(
          `${backendUrl}/api/analytics/summary?barberId=${barberId}&range=${range}`
        );
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data;
          } else {
            console.warn('Backend returned non-JSON response for analytics summary, using fallback data');
            throw new Error('Non-JSON response');
          }
        } else {
          console.error('Failed to fetch analytics summary, status:', response.status);
          throw new Error('API request failed');
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
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, use mock data
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

      try {
        const params = new URLSearchParams({
          barberId,
          start,
          end,
          bucket,
        });
        
        const response = await fetch(
          `${backendUrl}/api/analytics/timeseries?${params}`
        );
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data;
          } else {
            console.warn('Backend returned non-JSON response for analytics timeseries, using fallback data');
            throw new Error('Non-JSON response');
          }
        } else {
          console.error('Failed to fetch analytics timeseries, status:', response.status);
          throw new Error('API request failed');
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
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, use mock data
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

      try {
        const params = new URLSearchParams({
          barberId,
          range,
        });
        
        const response = await fetch(
          `${backendUrl}/api/analytics/top-services?${params}`
        );
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data;
          } else {
            console.warn('Backend returned non-JSON response for top services, using fallback data');
            throw new Error('Non-JSON response');
          }
        } else {
          console.error('Failed to fetch top services, status:', response.status);
          throw new Error('API request failed');
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

  gallery: {
    list: async ({ barberId }: { barberId: string }) => {
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, return mock gallery items
        await delay(500);
        return [
          {
            url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
            path: 'gallery/mock/1.jpg',
            createdAtISO: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop',
            path: 'gallery/mock/2.jpg',
            createdAtISO: new Date(Date.now() - 172800000).toISOString(),
          },
          {
            url: 'https://images.unsplash.com/photo-1521490878405-2fc9feb1d5d5?w=400&h=400&fit=crop',
            path: 'gallery/mock/3.jpg',
            createdAtISO: new Date(Date.now() - 259200000).toISOString(),
          },
        ];
      }

      try {
        const response = await fetch(`${backendUrl}/api/gallery/list`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barberId }),
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data.items || [];
          } else {
            console.warn('Backend returned non-JSON response for gallery list, using fallback data');
            throw new Error('Non-JSON response');
          }
        } else {
          console.error('Failed to fetch gallery list, status:', response.status);
          throw new Error('API request failed');
        }
      } catch (error) {
        console.error('Error fetching gallery list:', error);
        // Fallback to mock data
        await delay(500);
        return [
          {
            url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
            path: 'gallery/mock/1.jpg',
            createdAtISO: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop',
            path: 'gallery/mock/2.jpg',
            createdAtISO: new Date(Date.now() - 172800000).toISOString(),
          },
          {
            url: 'https://images.unsplash.com/photo-1521490878405-2fc9feb1d5d5?w=400&h=400&fit=crop',
            path: 'gallery/mock/3.jpg',
            createdAtISO: new Date(Date.now() - 259200000).toISOString(),
          },
        ];
      }
    },

    upload: async ({ barberId, file, path }: { barberId: string; file: any; path: string }) => {
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, simulate upload with mock data
        await delay(1500);
        return {
          item: {
            url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
            path: `gallery/mock/${Date.now()}.jpg`,
            createdAtISO: new Date().toISOString(),
          }
        };
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', path);
        formData.append('barberId', barberId);

        const response = await fetch(`${backendUrl}/api/gallery/upload`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data;
          } else {
            console.warn('Backend returned non-JSON response for gallery upload, using fallback data');
            throw new Error('Non-JSON response');
          }
        } else {
          console.error('Failed to upload image, status:', response.status);
          const errorText = await response.text();
          console.error('Upload error details:', errorText);
          throw new Error('Upload failed');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
    },

    delete: async ({ barberId, path }: { barberId: string; path: string }) => {
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, simulate deletion
        await delay(500);
        return { ok: true };
      }

      try {
        const response = await fetch(`${backendUrl}/api/gallery/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barberId, path }),
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data;
          } else {
            console.warn('Backend returned non-JSON response for gallery delete, using fallback data');
            throw new Error('Non-JSON response');
          }
        } else {
          console.error('Failed to delete image, status:', response.status);
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'API request failed');
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        throw error;
      }
    },
  },

  stripe: {
    createOrFetchAccount: async ({ barberId }: { barberId: string }) => {
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // Fallback to mock data
        await delay(800);
        return {
          accountId: `acct_mock_${barberId}_${Date.now()}`
        };
      }

      try {
        const response = await fetch(`${backendUrl}/api/stripe/create-or-fetch-account`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barberId })
        });
        
        if (response.ok) {
          const data = await response.json();
          return data;
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create/fetch account');
        }
      } catch (error) {
        console.error('Error creating/fetching Stripe account:', error);
        throw error;
      }
    },

    createAccountLink: async ({ barberId, refreshUrl, returnUrl }: { 
      barberId: string; 
      refreshUrl?: string; 
      returnUrl?: string; 
    }) => {
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // Fallback to mock data
        await delay(500);
        return {
          url: `https://connect.stripe.com/express/oauth/authorize?client_id=mock&state=${barberId}&redirect_uri=${encodeURIComponent(returnUrl || '')}`
        };
      }

      try {
        const response = await fetch(`${backendUrl}/api/stripe/account-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barberId, refreshUrl, returnUrl })
        });
        
        if (response.ok) {
          const data = await response.json();
          return data;
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create account link');
        }
      } catch (error) {
        console.error('Error creating account link:', error);
        throw error;
      }
    },

    getAccountStatus: async ({ barberId }: { barberId: string }) => {
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // Fallback to mock data
        await delay(300);
        return {
          chargesEnabled: true,
          payoutsEnabled: true
        };
      }

      try {
        const response = await fetch(`${backendUrl}/api/stripe/account-status?barberId=${barberId}`);
        
        if (response.ok) {
          const data = await response.json();
          return data;
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to get account status');
        }
      } catch (error) {
        console.error('Error getting account status:', error);
        throw error;
      }
    },
  },
};