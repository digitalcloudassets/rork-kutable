import React, { createContext, useContext, useState, ReactNode } from "react";
import type { Barber, Service } from "@/types/models";

interface ClientDetails {
  name: string;
  phone: string;
  email?: string;
  note?: string;
}

interface BookingContextType {
  selectedBarber: Barber | null;
  selectedService: Service | null;
  selectedTime: string | null;
  clientDetails: ClientDetails | null;
  setSelectedBarber: (barber: Barber | null) => void;
  setSelectedService: (service: Service | null) => void;
  setSelectedTime: (time: string | null) => void;
  setClientDetails: (details: ClientDetails | null) => void;
  clearBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);

  const clearBooking = () => {
    setSelectedBarber(null);
    setSelectedService(null);
    setSelectedTime(null);
    setClientDetails(null);
  };

  return (
    <BookingContext.Provider
      value={{
        selectedBarber,
        selectedService,
        selectedTime,
        clientDetails,
        setSelectedBarber,
        setSelectedService,
        setSelectedTime,
        setClientDetails,
        clearBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within BookingProvider");
  }
  return context;
}