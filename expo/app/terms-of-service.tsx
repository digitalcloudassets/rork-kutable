import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
} from "react-native";

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.lastUpdated}>Last updated: January 2025</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing and using Kutable, you accept and agree to be bound by the terms and 
            provision of this agreement. If you do not agree to abide by the above, please do 
            not use this service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Use License</Text>
          <Text style={styles.paragraph}>
            Permission is granted to temporarily use Kutable for personal, non-commercial transitory 
            viewing only. This is the grant of a license, not a transfer of title, and under this 
            license you may not modify or copy the materials.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Bookings</Text>
          <Text style={styles.paragraph}>
            When you book a service through Kutable, you enter into a direct agreement with the 
            service provider. Kutable facilitates the booking but is not responsible for the 
            quality of services provided by independent barbers.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Terms</Text>
          <Text style={styles.paragraph}>
            Payments are processed securely through our payment partners. You agree to pay all 
            charges incurred by you or any users of your account. Refunds are subject to the 
            individual barber&apos;s cancellation policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cancellation Policy</Text>
          <Text style={styles.paragraph}>
            Cancellation policies vary by service provider. Please review the specific cancellation 
            terms before booking. Generally, cancellations made less than 24 hours before the 
            appointment may incur a fee.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prohibited Uses</Text>
          <Text style={styles.paragraph}>
            You may not use Kutable for any unlawful purpose or to solicit others to perform 
            unlawful acts. You may not transmit any worms or viruses or any code of a destructive 
            nature.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disclaimer</Text>
          <Text style={styles.paragraph}>
            The information on this app is provided on an &apos;as is&apos; basis. To the fullest extent 
            permitted by law, Kutable excludes all representations, warranties, conditions and 
            terms relating to our app and the use of this app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions about these Terms of Service, please contact us at:
            {"\n\n"}Email: legal@kutable.com
            {"\n"}Phone: (555) 123-4567
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: "#666",
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: "#333",
  },
});