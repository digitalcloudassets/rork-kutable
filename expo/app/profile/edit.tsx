import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Camera, Save } from "lucide-react-native";
import { pickAndUploadAvatar } from "@/lib/uploadAvatar";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { Tokens } from "@/theme/tokens";
import { formatToE164 } from "@/utils/phoneHelpers";
import { httpsify } from "@/lib/url";

interface BarberProfile {
  id: string;
  name: string;
  bio?: string;
  shop_name?: string;
  shop_address?: string;
  phone_e164?: string;
  photo_url?: string;
  instagram?: string;
  website?: string;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<BarberProfile>({
    id: user?.id || "",
    name: user?.name || "",
    bio: "",
    shop_name: "",
    shop_address: "",
    phone_e164: user?.phone || "",
    photo_url: user?.photoUrl || "",
    instagram: "",
    website: "",
  });

  const isValidUUID = (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const loadBarberProfile = useCallback(async () => {
    if (!user?.id) return;

    // Check if user ID is a valid UUID
    if (!isValidUUID(user.id)) {
      console.error("Invalid user ID format:", user.id);
      Alert.alert(
        "Authentication Error",
        "Invalid user session detected. Please sign in again.",
        [{ text: "OK", onPress: () => router.replace("/auth/welcome") }]
      );
      return;
    }

    try {
      const { data, error } = await supabase
        .from("barbers")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error loading barber profile:", error);
        return;
      }

      if (data) {
        setProfile({
          id: data.id,
          name: data.name || user.name,
          bio: data.bio || "",
          shop_name: data.shop_name || "",
          shop_address: data.shop_address || "",
          phone_e164: data.phone_e164 || user.phone || "",
          photo_url: data.photo_url || user.photoUrl || "",
          instagram: data.instagram || "",
          website: data.website || "",
        });
      }
    } catch (error) {
      console.error("Failed to load barber profile:", error);
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === "barber") {
      loadBarberProfile();
    }
  }, [user, loadBarberProfile]);



  const pickImage = async () => {
    if (!user?.id) return;
    
    setUploading(true);
    try {
      const publicUrl = await pickAndUploadAvatar(user.id);
      if (publicUrl) {
        setProfile(prev => ({ ...prev, photo_url: publicUrl }));
      }
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      Alert.alert(
        "Error", 
        error.message === 'Permission required' 
          ? "Camera roll permission is required to change your profile photo."
          : "Failed to upload image. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };



  const saveProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const updateData = {
        name: profile.name,
        bio: profile.bio || null,
        shop_name: profile.shop_name || null,
        shop_address: profile.shop_address || null,
        phone_e164: profile.phone_e164 || null,
        photo_url: profile.photo_url || null,
        instagram: profile.instagram || null,
        website: profile.website || null,
      };

      if (user.role === "barber") {
        const { error } = await supabase
          .from("barbers")
          .upsert({ id: user.id, ...updateData }, { onConflict: "id" });

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from("clients")
          .upsert({
            id: user.id,
            name: profile.name,
            phone_e164: profile.phone_e164 || null,
          }, { onConflict: "id" });

        if (error) {
          throw error;
        }
      }

      // Refresh auth context to get updated user data
      await refresh();

      Alert.alert(
        "Success",
        "Your profile has been updated successfully!",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert(
        "Error",
        "Failed to save profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneInput = (text: string) => {
    const formatted = formatToE164(text);
    setProfile(prev => ({ ...prev, phone_e164: formatted || text }));
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Edit Profile",
          headerRight: () => (
            <TouchableOpacity
              onPress={saveProfile}
              disabled={loading}
              style={styles.saveButton}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Tokens.accent} />
              ) : (
                <Save size={20} color={Tokens.accent} />
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: httpsify(profile.photo_url) || "https://via.placeholder.com/120",
              }}
              style={styles.avatar}
            />
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={pickImage}
            disabled={uploading}
          >
            <Camera size={16} color={Tokens.accent} />
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={profile.name}
                onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
                placeholder="Enter your name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={profile.phone_e164}
                onChangeText={formatPhoneInput}
                placeholder="(555) 123-4567"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            {user?.role === "barber" && (
              <View style={styles.field}>
                <Text style={styles.label}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={profile.bio}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, bio: text }))}
                  placeholder="Tell clients about yourself and your experience..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            )}
          </View>

          {user?.role === "barber" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Shop Information</Text>
              
              <View style={styles.field}>
                <Text style={styles.label}>Shop Name</Text>
                <TextInput
                  style={styles.input}
                  value={profile.shop_name}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, shop_name: text }))}
                  placeholder="Your barbershop name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Shop Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={profile.shop_address}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, shop_address: text }))}
                  placeholder="123 Main St, City, State 12345"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          )}

          {user?.role === "barber" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Social Media</Text>
              
              <View style={styles.field}>
                <Text style={styles.label}>Instagram</Text>
                <TextInput
                  style={styles.input}
                  value={profile.instagram}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, instagram: text }))}
                  placeholder="@yourusername"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Website</Text>
                <TextInput
                  style={styles.input}
                  value={profile.website}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, website: text }))}
                  placeholder="https://yourwebsite.com"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Tokens.bg,
  },
  saveButton: {
    padding: 8,
  },
  avatarSection: {
    backgroundColor: Tokens.surface,
    alignItems: "center",
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.border,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Tokens.border,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  changePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Tokens.accent,
  },
  changePhotoText: {
    color: Tokens.accent,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  form: {
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Tokens.text,
    marginBottom: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Tokens.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Tokens.surface,
    borderWidth: 1,
    borderColor: Tokens.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Tokens.text,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
});