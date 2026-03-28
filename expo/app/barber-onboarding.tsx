import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Scissors, Store, Phone, MapPin } from "lucide-react-native";
import { brandColors } from "@/config/brand";
import { useAuth } from "@/providers/AuthProvider";

export default function BarberOnboardingScreen() {
  const router = useRouter();
  const { setUser } = useAuth();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    shopName: "",
    shopAddress: "",
    phone: "",
    bio: "",
    yearsExperience: "",
  });

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    setUser({
      id: "barber-1",
      role: "barber",
      name: formData.name,
      phone: formData.phone,
      email: `${formData.name.toLowerCase().replace(" ", ".")}@kutable.com`,
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    });
    
    Alert.alert(
      "Welcome to Kutable!",
      "Your barber profile has been created. You can now manage your services and bookings.",
      [{ text: "OK", onPress: () => router.replace("/(tabs)/dashboard") }]
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Personal Information</Text>
            <Text style={styles.stepSubtitle}>Let's start with your basic details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="John Doe"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="(555) 123-4567"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Years of Experience</Text>
              <TextInput
                style={styles.input}
                value={formData.yearsExperience}
                onChangeText={(text) => setFormData({ ...formData, yearsExperience: text })}
                placeholder="5"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
          </View>
        );
      
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Shop Information</Text>
            <Text style={styles.stepSubtitle}>Tell us about your workplace</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Shop Name (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.shopName}
                onChangeText={(text) => setFormData({ ...formData, shopName: text })}
                placeholder="Elite Cuts Barbershop"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Shop Address</Text>
              <TextInput
                style={styles.input}
                value={formData.shopAddress}
                onChangeText={(text) => setFormData({ ...formData, shopAddress: text })}
                placeholder="123 Main St, Downtown"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>About You</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                placeholder="Tell clients about your specialties and style..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        );
      
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Stripe Connect</Text>
            <Text style={styles.stepSubtitle}>Set up payments to receive earnings</Text>
            
            <View style={styles.stripeInfo}>
              <Text style={styles.infoText}>
                To receive payments from clients, you'll need to connect your Stripe account.
              </Text>
              <Text style={styles.infoText}>
                This allows secure, direct deposits of your earnings.
              </Text>
            </View>

            <TouchableOpacity style={styles.stripeButton}>
              <Text style={styles.stripeButtonText}>Connect with Stripe</Text>
            </TouchableOpacity>

            <Text style={styles.skipText}>
              You can set this up later in your profile settings
            </Text>
          </View>
        );
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Scissors size={32} color={brandColors.primary} />
          <Text style={styles.headerTitle}>Become a Barber</Text>
          <Text style={styles.headerSubtitle}>Join Kutable and grow your business</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>Step {step} of 3</Text>
        </View>

        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setStep(step - 1)}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {step === 3 ? "Complete Setup" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  progressContainer: {
    padding: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: brandColors.primary,
  },
  progressText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  stripeInfo: {
    backgroundColor: "#F0FDF4",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: "#065F46",
    lineHeight: 20,
    marginBottom: 8,
  },
  stripeButton: {
    backgroundColor: "#635BFF",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  stripeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  skipText: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  nextButton: {
    flex: 2,
    backgroundColor: brandColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});