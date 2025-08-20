/**
 * Typed routes for the Kutable app
 * This ensures type safety when navigating between screens
 */

export type AppRoutes = {
  // Root routes
  '/': undefined;
  
  // Tab routes
  '/(tabs)': undefined;
  '/(tabs)/bookings': undefined;
  '/(tabs)/dashboard': undefined;
  '/(tabs)/profile': undefined;

  // Auth routes
  '/auth/welcome': undefined;
  '/auth/client-signup': undefined;
  '/auth/client-signin': undefined;
  '/auth/barber-signup': undefined;
  '/auth/barber-signin': undefined;

  // Barber routes
  '/barber/[id]': { id: string };

  // Booking flow
  '/book/[barberId]': { barberId: string };
  '/booking/service': { barberId: string; serviceId?: string };
  '/booking/time': { barberId: string; serviceId: string };
  '/booking/details': { barberId: string; serviceId: string; timeSlot: string };
  '/booking/payment': { barberId: string; serviceId: string; timeSlot: string };
  '/booking/confirmation': { bookingId: string };

  // Onboarding & Management
  '/barber-onboarding': undefined;
  '/manage-services': undefined;
  '/earnings-details': undefined;

  // Legal
  '/privacy-policy': undefined;
  '/terms-of-service': undefined;

  // Dashboard routes
  '/(tabs)/dashboard/onboarding': undefined;
  '/(tabs)/dashboard/services': undefined;
  '/(tabs)/dashboard/calendar': undefined;
  '/(tabs)/dashboard/gallery': undefined;
  '/(tabs)/dashboard/earnings': undefined;
  '/(tabs)/dashboard/analytics': undefined;
  '/(tabs)/dashboard/system': undefined;
};

/**
 * Helper function to create typed navigation
 */
export function createTypedRoute<T extends keyof AppRoutes>(
  route: T,
  params?: AppRoutes[T]
): string {
  if (params && typeof params === 'object') {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    return queryString ? `${route}?${queryString}` : route;
  }
  return route;
}

/**
 * Route validation helper
 */
export function isValidRoute(route: string): route is keyof AppRoutes {
  const validRoutes: (keyof AppRoutes)[] = [
    '/',
    '/(tabs)',
    '/(tabs)/bookings',
    '/(tabs)/dashboard',
    '/(tabs)/profile',
    '/auth/welcome',
    '/auth/client-signup',
    '/auth/client-signin',
    '/auth/barber-signup',
    '/auth/barber-signin',
    '/barber/[id]',
    '/book/[barberId]',
    '/booking/service',
    '/booking/time',
    '/booking/details',
    '/booking/payment',
    '/booking/confirmation',
    '/barber-onboarding',
    '/manage-services',
    '/earnings-details',
    '/privacy-policy',
    '/terms-of-service',
    '/(tabs)/dashboard/onboarding',
    '/(tabs)/dashboard/services',
    '/(tabs)/dashboard/calendar',
    '/(tabs)/dashboard/gallery',
    '/(tabs)/dashboard/earnings',
    '/(tabs)/dashboard/analytics',
    '/(tabs)/dashboard/system',
  ];
  
  return validRoutes.includes(route as keyof AppRoutes);
}