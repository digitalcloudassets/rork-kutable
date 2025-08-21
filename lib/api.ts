import type { Service, Booking } from "@/types/models";
import { seedData } from "@/lib/seedData";
import { DATA_MODE, logFallback } from "@/config/dataMode";
import { env } from '@/config/env';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simplified API helper that matches the requested interface
export async function api(path: string, init?: RequestInit) {
  const base = env.API_URL || 'https://kutable.rork.app';
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers||{}) },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${path} ${res.status}`);
  return res.json();
}

// Generic API function for live mode (legacy)
export async function apiRequest(path: string, init?: RequestInit) {
  const base = env.API_URL;
  if (!base) throw new Error('API base URL not configured');
  const url = `${base}${path}`;
  const res = await fetch(url, { 
    ...init, 
    headers: { 
      'Content-Type': 'application/json', 
      ...(init?.headers || {}) 
    } 
  });
  if (!res.ok) throw new Error(`API ${path} ${res.status}`);
  return res.json();
}

// Get backend URL with fallback
const getBackendUrl = () => {
  const backendUrl = env.API_URL;
  if (!backendUrl) {
    console.warn('EXPO_PUBLIC_API_URL not configured, using fallback data');
    return null;
  }
  return backendUrl;
};

export const apiClient = {
  barbers: {
    search: async ({ q, serviceId }: { q?: string; serviceId?: string }) => {
      let data;
      let mockBarbers = seedData.barbers;
      if (q) {
        mockBarbers = mockBarbers.filter(b => 
          b.name.toLowerCase().includes(q.toLowerCase()) ||
          b.shopName?.toLowerCase().includes(q.toLowerCase()) ||
          b.services.some(s => s.name.toLowerCase().includes(q.toLowerCase()))
        );
      }
      if (serviceId) {
        mockBarbers = mockBarbers.filter(b => 
          b.services.some(s => s.id === serviceId)
        );
      }

      if (DATA_MODE === 'live') {
        try {
          data = await apiRequest('/api/barbers/search', {
            method: 'POST',
            body: JSON.stringify({ q, serviceId })
          });
          return data.barbers;
        } catch (error) {
          logFallback('/api/barbers/search', error);
          data = mockBarbers;
        }
      } else {
        await delay(500);
        data = mockBarbers;
      }
      
      return data;
    },

    list: async ({ search }: { search?: string }) => {
      // Deprecated: use search instead
      return apiClient.barbers.search({ q: search });
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
            // Backend now returns the combined format directly
            return data;
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
        console.log('No backend URL configured, using seed data for services');
        await delay(300);
        const barber = seedData.barbers.find(b => b.id === barberId);
        return barber?.services || [];
      }

      try {
        console.log(`Fetching services from: ${backendUrl}/api/services/list`);
        const response = await fetch(`${backendUrl}/api/services/list`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barberId }),
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log('Successfully fetched services:', data.services?.length || 0, 'services');
            return data.services || [];
          } else {
            console.warn('Backend returned non-JSON response for services list, using fallback data');
            throw new Error('Non-JSON response');
          }
        } else {
          console.error(`Failed to fetch services list, status: ${response.status}, URL: ${backendUrl}/api/services/list`);
          throw new Error(`API request failed with status ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching services list:', error);
        console.log('Falling back to seed data for services');
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

    create: async ({ barberId, name, durationMinutes, priceCents, description }: { 
      barberId: string; 
      name: string; 
      durationMinutes: number; 
      priceCents: number; 
      description?: string; 
    }) => {
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, use mock implementation
        await delay(500);
        const service: Service = {
          id: Date.now().toString(),
          barberId,
          name,
          durationMinutes,
          priceCents,
          description,
          active: true,
        };
        return service;
      }

      try {
        const response = await fetch(`${backendUrl}/api/services/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barberId, name, durationMinutes, priceCents, description }),
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data.service;
          } else {
            console.warn('Backend returned non-JSON response for service create, using fallback data');
            throw new Error('Non-JSON response');
          }
        } else {
          console.error('Failed to create service, status:', response.status);
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'API request failed');
        }
      } catch (error) {
        console.error('Error creating service:', error);
        throw error;
      }
    },

    update: async ({ id, barberId, name, durationMinutes, priceCents, description, active }: { 
      id: string;
      barberId: string; 
      name: string; 
      durationMinutes: number; 
      priceCents: number; 
      description?: string;
      active?: boolean;
    }) => {
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, use mock implementation
        await delay(500);
        const service: Service = {
          id,
          barberId,
          name,
          durationMinutes,
          priceCents,
          description,
          active: active !== undefined ? active : true,
        };
        return service;
      }

      try {
        const response = await fetch(`${backendUrl}/api/services/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, barberId, name, durationMinutes, priceCents, description, active }),
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data.service;
          } else {
            console.warn('Backend returned non-JSON response for service update, using fallback data');
            throw new Error('Non-JSON response');
          }
        } else {
          console.error('Failed to update service, status:', response.status);
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'API request failed');
        }
      } catch (error) {
        console.error('Error updating service:', error);
        throw error;
      }
    },

    toggle: async ({ id, barberId, active }: { id: string; barberId: string; active: boolean }) => {
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        // No backend configured, use mock implementation
        await delay(300);
        return {
          id,
          barberId,
          name: 'Mock Service',
          durationMinutes: 30,
          priceCents: 2500,
          active,
        } as Service;
      }

      try {
        const response = await fetch(`${backendUrl}/api/services/toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, barberId, active }),
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data.service;
          } else {
            console.warn('Backend returned non-JSON response for service toggle, using fallback data');
            throw new Error('Non-JSON response');
          }
        } else {
          console.error('Failed to toggle service, status:', response.status);
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'API request failed');
        }
      } catch (error) {
        console.error('Error toggling service:', error);
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
      let data;
      const mockBookings = seedData.bookings.filter(b => {
        if (barberId && b.barberId !== barberId) return false;
        return true;
      });

      if (DATA_MODE === 'live') {
        try {
          data = await apiRequest('/api/bookings/list', {
            method: 'POST',
            body: JSON.stringify({ userId, barberId, range })
          });
          return data.bookings;
        } catch (error) {
          logFallback('/api/bookings/list', error);
          data = mockBookings;
        }
      } else {
        await delay(500);
        data = mockBookings;
      }
      
      return data;
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
      let data;
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
      const mockData = { slots: mockSlots };

      if (DATA_MODE === 'live') {
        try {
          const params = new URLSearchParams({
            barberId,
            serviceId,
            date,
            ...(tz && { tz }),
          });
          data = await apiRequest(`/api/availability/open-slots?${params}`);
          return data;
        } catch (error) {
          logFallback('/api/availability/open-slots', error);
          data = mockData;
        }
      } else {
        await delay(500);
        data = mockData;
      }
      
      return data;
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
        // Use DELETE endpoint for better REST semantics
        const response = await fetch(`${backendUrl}/api/availability/block/${blockId}?barberId=${barberId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
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
      
      // Always use mock data if no backend URL or in mock mode
      if (!backendUrl || DATA_MODE === 'mock') {
        console.log('Using mock earnings data (no backend or mock mode)');
        await delay(500);
        const amounts = {
          today: { gross: 8500, fees: 500, net: 8000 },
          week: { gross: 125000, fees: 7500, net: 117500 },
          month: { gross: 542000, fees: 32500, net: 509500 },
        };
        return amounts[range] || amounts.month;
      }

      try {
        console.log(`Fetching earnings summary from: ${backendUrl}/api/earnings/summary`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        const response = await fetch(
          `${backendUrl}/api/earnings/summary?barberId=${barberId}&range=${range}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log('Successfully fetched earnings summary:', data);
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
          console.error(`Failed to fetch earnings summary, status: ${response.status}`);
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('Error details:', errorText);
          throw new Error(`API request failed with status ${response.status}`);
        }
      } catch (error: any) {
        console.error('Error fetching earnings summary:', error);
        
        // Provide specific error messages for common issues
        if (error.name === 'AbortError') {
          console.warn('Earnings request timed out, using fallback data');
        } else if (error.message === 'Failed to fetch' || error.message.includes('Network request failed')) {
          console.warn('Network error fetching earnings, using fallback data');
        } else {
          console.warn('Unknown error fetching earnings, using fallback data:', error.message);
        }
        
        // Always fallback to mock data on any error
        await delay(300);
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
      
      // Always use mock data if no backend URL or in mock mode
      if (!backendUrl || DATA_MODE === 'mock') {
        console.log('Using mock payouts data (no backend or mock mode)');
        await delay(500);
        return [
          { id: "1", amount: 117500, date: "2024-03-10", status: "completed" },
          { id: "2", amount: 98000, date: "2024-03-03", status: "completed" },
          { id: "3", amount: 85000, date: "2024-02-24", status: "completed" },
        ];
      }

      try {
        console.log(`Fetching payouts from: ${backendUrl}/api/payouts/list`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        const response = await fetch(
          `${backendUrl}/api/payouts/list?barberId=${barberId}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log('Successfully fetched payouts:', data.payouts?.length || 0, 'payouts');
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
          console.error(`Failed to fetch payouts, status: ${response.status}`);
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('Error details:', errorText);
          throw new Error(`API request failed with status ${response.status}`);
        }
      } catch (error: any) {
        console.error('Error fetching payouts:', error);
        
        // Provide specific error messages for common issues
        if (error.name === 'AbortError') {
          console.warn('Payouts request timed out, using fallback data');
        } else if (error.message === 'Failed to fetch' || error.message.includes('Network request failed')) {
          console.warn('Network error fetching payouts, using fallback data');
        } else {
          console.warn('Unknown error fetching payouts, using fallback data:', error.message);
        }
        
        // Always fallback to mock data on any error
        await delay(300);
        return [
          { id: "1", amount: 117500, date: "2024-03-10", status: "completed" },
          { id: "2", amount: 98000, date: "2024-03-03", status: "completed" },
          { id: "3", amount: 85000, date: "2024-02-24", status: "completed" },
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
      if (!backendUrl || DATA_MODE === 'mock') {
        console.log('No backend URL configured or in mock mode, using mock Stripe account creation');
        await delay(800);
        return {
          accountId: `acct_mock_${barberId}_${Date.now()}`
        };
      }

      try {
        console.log(`Creating/fetching Stripe account for barber: ${barberId}`);
        console.log(`API URL: ${backendUrl}/api/stripe/create-or-fetch-account`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`${backendUrl}/api/stripe/create-or-fetch-account`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ barberId }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Successfully created/fetched Stripe account:', data.accountId);
          return data;
        } else {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: `HTTP ${response.status}: ${errorText}` };
          }
          console.error('Failed to create/fetch Stripe account:', errorData);
          throw new Error(errorData.error || 'Failed to create/fetch account');
        }
      } catch (error: any) {
        console.error('Error creating/fetching Stripe account:', error);
        
        if (error.name === 'AbortError') {
          console.error('Request timed out, falling back to mock data');
          logFallback('/api/stripe/create-or-fetch-account', error);
          await delay(800);
          return {
            accountId: `acct_mock_${barberId}_${Date.now()}`
          };
        }
        
        if (error.message === 'Failed to fetch' || error.message.includes('Network request failed') || error.message.includes('Load failed')) {
          console.error('Network error - falling back to mock data');
          logFallback('/api/stripe/create-or-fetch-account', error);
          await delay(800);
          return {
            accountId: `acct_mock_${barberId}_${Date.now()}`
          };
        }
        
        // For other errors, also fallback to mock data
        logFallback('/api/stripe/create-or-fetch-account', error);
        await delay(800);
        return {
          accountId: `acct_mock_${barberId}_${Date.now()}`
        };
      }
    },

    createAccountLink: async ({ barberId, refreshUrl, returnUrl }: { 
      barberId: string; 
      refreshUrl?: string; 
      returnUrl?: string; 
    }) => {
      const backendUrl = getBackendUrl();
      if (!backendUrl || DATA_MODE === 'mock') {
        console.log('No backend URL configured or in mock mode, using mock Stripe account link');
        await delay(500);
        return {
          url: `https://connect.stripe.com/express/oauth/authorize?client_id=mock&state=${barberId}&redirect_uri=${encodeURIComponent(returnUrl || '')}`
        };
      }

      try {
        console.log(`Creating Stripe account link for barber: ${barberId}`);
        console.log(`API URL: ${backendUrl}/api/stripe/account-link`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${backendUrl}/api/stripe/account-link`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ barberId, refreshUrl, returnUrl }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Successfully created Stripe account link');
          return data;
        } else {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: `HTTP ${response.status}: ${errorText}` };
          }
          console.error('Failed to create Stripe account link:', errorData);
          throw new Error(errorData.error || 'Failed to create account link');
        }
      } catch (error: any) {
        console.error('Error creating account link:', error);
        
        if (error.name === 'AbortError') {
          console.error('Request timed out, falling back to mock data');
          logFallback('/api/stripe/account-link', error);
          await delay(500);
          return {
            url: `https://connect.stripe.com/express/oauth/authorize?client_id=mock&state=${barberId}&redirect_uri=${encodeURIComponent(returnUrl || '')}`
          };
        }
        
        if (error.message === 'Failed to fetch' || error.message.includes('Network request failed') || error.message.includes('Load failed')) {
          console.error('Network error - falling back to mock data');
          logFallback('/api/stripe/account-link', error);
          await delay(500);
          return {
            url: `https://connect.stripe.com/express/oauth/authorize?client_id=mock&state=${barberId}&redirect_uri=${encodeURIComponent(returnUrl || '')}`
          };
        }
        
        // For other errors, also fallback to mock data
        logFallback('/api/stripe/account-link', error);
        await delay(500);
        return {
          url: `https://connect.stripe.com/express/oauth/authorize?client_id=mock&state=${barberId}&redirect_uri=${encodeURIComponent(returnUrl || '')}`
        };
      }
    },

    getAccountStatus: async ({ barberId }: { barberId: string }) => {
      const backendUrl = getBackendUrl();
      if (!backendUrl || DATA_MODE === 'mock') {
        console.log('No backend URL configured or in mock mode, using mock Stripe account status');
        await delay(300);
        return {
          chargesEnabled: false,
          payoutsEnabled: false
        };
      }

      try {
        console.log(`Checking Stripe account status for barber: ${barberId}`);
        console.log(`API URL: ${backendUrl}/api/stripe/account-status?barberId=${barberId}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${backendUrl}/api/stripe/account-status?barberId=${barberId}`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Successfully retrieved Stripe account status:', data);
          return data;
        } else {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: `HTTP ${response.status}: ${errorText}` };
          }
          console.error('Failed to get Stripe account status:', errorData);
          throw new Error(errorData.error || 'Failed to get account status');
        }
      } catch (error: any) {
        console.error('Error getting account status:', error);
        
        if (error.name === 'AbortError') {
          console.error('Request timed out, falling back to mock data');
          logFallback('/api/stripe/account-status', error);
          await delay(300);
          return {
            chargesEnabled: false,
            payoutsEnabled: false
          };
        }
        
        if (error.message === 'Failed to fetch' || error.message.includes('Network request failed') || error.message.includes('Load failed')) {
          console.error('Network error - falling back to mock data');
          logFallback('/api/stripe/account-status', error);
          await delay(300);
          return {
            chargesEnabled: false,
            payoutsEnabled: false
          };
        }
        
        // For other errors, also fallback to mock data
        logFallback('/api/stripe/account-status', error);
        await delay(300);
        return {
          chargesEnabled: false,
          payoutsEnabled: false
        };
      }
    },
  },
};