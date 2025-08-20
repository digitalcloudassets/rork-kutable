/**
 * Typed routes for the Kutable app
 * This ensures type safety when navigating between screens
 */

export type AppRoutes = {
  // Tab routes
  '/': undefined;
  '/bookings': undefined;
  '/dashboard': undefined;
  '/profile': undefined;

  // Barber routes
  '/barber/[id]': { id: string };

  // Booking flow
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
  '/dashboard/onboarding': undefined;
  '/dashboard/services': undefined;
  '/dashboard/calendar': undefined;
  '/dashboard/gallery': undefined;
  '/dashboard/earnings': undefined;
  '/dashboard/analytics': undefined;
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
    '/bookings',
    '/dashboard',
    '/profile',
    '/barber/[id]',
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
    '/dashboard/onboarding',
    '/dashboard/services',
    '/dashboard/calendar',
    '/dashboard/gallery',
    '/dashboard/earnings',
    '/dashboard/analytics',
  ];
  
  return validRoutes.includes(route as keyof AppRoutes);
}