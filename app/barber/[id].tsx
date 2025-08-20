import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { MapPin, Phone, Star, Clock, DollarSign, User } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { brandColors } from "@/config/brand";
import { api } from "@/lib/api";
import { useBooking } from "@/providers/BookingProvider";
import type { Service, GalleryItem } from "@/types/models";

export default function BarberProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { setSelectedBarber, setSelectedService } = useBooking();

  const { data: barber, isLoading } = useQuery({
    queryKey: ["barber", id],
    queryFn: () => api.barbers.profile({ barberId: id as string }),
  });

  const galleryItems = barber?.galleryTop || [];

  const handleBookService = (service: Service) => {
    setSelectedBarber(barber);
    setSelectedService(service);
    router.push(`/booking/service?barberId=${barber.id}&serviceId=${service.id}`);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={brandColors.primary} />
      </View>
    );
  }

  if (!barber) {
    return (
      <View style={styles.errorContainer}>
        <User size={48} color="#ccc" />
        <Text style={styles.errorTitle}>Barber Not Found</Text>
        <Text style={styles.errorText}>
          The barber profile you&apos;re looking for doesn&apos;t exist or has been removed.
        </Text>
        <TouchableOpacity 
          style={styles.errorButton}
          onPress={() => router.back()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: barber.name }} />
      <ScrollView style={styles.container}>
        <Image source={{ uri: barber.photoUrl }} style={styles.coverPhoto} />
        
        <View style={styles.profileSection}>
          <Text style={styles.barberName}>{barber.name}</Text>
          {barber.shopName && (
            <Text style={styles.shopName}>{barber.shopName}</Text>
          )}
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Star size={16} color="#FFB800" fill="#FFB800" />
              <Text style={styles.infoText}>
                {barber.rating ? `${barber.rating.toFixed(1)} (${barber.reviewCount || 0} reviews)` : 'No reviews yet'}
              </Text>
            </View>
          </View>

          {barber.bio && (
            <Text style={styles.bio}>{barber.bio}</Text>
          )}

          <View style={styles.contactInfo}>
            {barber.shopAddress && (
              <View style={styles.contactRow}>
                <MapPin size={16} color="#666" />
                <Text style={styles.contactText}>{barber.shopAddress}</Text>
              </View>
            )}
            {barber.phone && (
              <View style={styles.contactRow}>
                <Phone size={16} color="#666" />
                <Text style={styles.contactText}>{barber.phone}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Services</Text>
          {barber.services.map((service: Service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                {service.description && (
                  <Text style={styles.serviceDescription}>{service.description}</Text>
                )}
                <View style={styles.serviceMeta}>
                  <View style={styles.metaItem}>
                    <Clock size={14} color="#666" />
                    <Text style={styles.metaText}>{service.durationMinutes} min</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <DollarSign size={14} color="#666" />
                    <Text style={styles.metaText}>
                      ${(service.priceCents / 100).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => handleBookService(service)}
              >
                <Text style={styles.bookButtonText}>Book</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {galleryItems.length > 0 && (
          <View style={styles.gallerySection}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.galleryGrid}>
                {galleryItems.map((item: GalleryItem, index: number) => (
                  <Image
                    key={item.path}
                    source={{ uri: item.url }}
                    style={styles.galleryImage}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          <View style={styles.reviewsPlaceholder}>
            <Text style={styles.placeholderText}>Reviews coming soon</Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  coverPhoto: {
    width: "100%",
    height: 250,
    backgroundColor: "#f0f0f0",
  },
  profileSection: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  barberName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  shopName: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  infoText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 6,
  },
  bio: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    marginBottom: 16,
  },
  contactInfo: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  servicesSection: {
    backgroundColor: "#fff",
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  serviceCard: {
    flexDirection: "row",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  serviceMeta: {
    flexDirection: "row",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
  },
  bookButton: {
    backgroundColor: brandColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "center",
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  reviewsSection: {
    backgroundColor: "#fff",
    marginTop: 12,
    padding: 20,
    marginBottom: 20,
  },
  reviewsPlaceholder: {
    paddingVertical: 40,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: "#999",
  },
  gallerySection: {
    backgroundColor: "#fff",
    marginTop: 12,
    padding: 20,
  },
  galleryGrid: {
    flexDirection: "row",
    gap: 12,
  },
  galleryImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: "#f8f9fa",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: brandColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});