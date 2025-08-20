import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import { Plus, Trash2, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BRAND } from '../../../config/brand';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/lib/api';
import type { GalleryItem } from '@/types/models';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 60) / 3; // 3 columns with padding

export default function GalleryScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: galleryItems = [], isLoading } = useQuery({
    queryKey: ['gallery', user?.id],
    queryFn: () => api.gallery.list({ barberId: user?.id || '' }),
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: (path: string) => api.gallery.delete({ barberId: user?.id || '', path }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery', user?.id] });
    },
  });

  const handleAddPhoto = async () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => takePhoto() },
        { text: 'Photo Library', onPress: () => pickFromLibrary() },
      ]
    );
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant photo library permissions to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setUploading(true);
      
      // Create unique filename
      const timestamp = Date.now();
      const extension = asset.uri.split('.').pop() || 'jpg';
      const filename = `${timestamp}.${extension}`;
      const path = `gallery/${user?.id}/${filename}`;

      // Create file object for upload
      const file = {
        uri: asset.uri,
        name: filename,
        type: `image/${extension}`,
      } as any;

      // Upload using API
      const data = await api.gallery.upload({ 
        barberId: user?.id || '', 
        file, 
        path 
      });
      
      // Update local cache
      queryClient.setQueryData(['gallery', user?.id], (old: GalleryItem[] = []) => [
        data.item,
        ...old,
      ]);

      Alert.alert('Success', 'Photo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = (item: GalleryItem) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(item.path),
        },
      ]
    );
  };

  const renderGalleryItem = ({ item }: { item: GalleryItem }) => (
    <TouchableOpacity
      style={styles.galleryItem}
      onLongPress={() => handleDeletePhoto(item)}
    >
      <Image source={{ uri: item.url }} style={styles.galleryImage} />
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeletePhoto(item)}
      >
        <Trash2 size={16} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderAddButton = () => (
    <TouchableOpacity
      style={[styles.galleryItem, styles.addButton]}
      onPress={handleAddPhoto}
      disabled={uploading}
    >
      {uploading ? (
        <ActivityIndicator size="small" color={BRAND.ACCENT} />
      ) : (
        <>
          <Plus size={32} color={BRAND.ACCENT} />
          <Text style={styles.addButtonText}>Add Photo</Text>
        </>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRAND.ACCENT} />
      </View>
    );
  }

  if (galleryItems.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title: 'Gallery' }} />
        <View style={styles.container}>
          <View style={styles.emptyState}>
            <Camera size={64} color={BRAND.TEXT_SECONDARY} />
            <Text style={styles.emptyTitle}>No Photos Yet</Text>
            <Text style={styles.emptyText}>
              Showcase your work by adding photos to your gallery. Clients love to see examples of your skills!
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAddPhoto}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={BRAND.TEXT_PRIMARY} />
              ) : (
                <>
                  <Plus size={20} color={BRAND.TEXT_PRIMARY} />
                  <Text style={styles.emptyButtonText}>Add First Photo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Gallery' }} />
      <View style={styles.container}>
        <FlatList
          data={[{ isAddButton: true }, ...galleryItems]}
          renderItem={({ item }) => {
            if ('isAddButton' in item) {
              return renderAddButton();
            }
            return renderGalleryItem({ item: item as GalleryItem });
          }}
          keyExtractor={(item, index) => 
            'isAddButton' in item ? 'add-button' : (item as GalleryItem).path
          }
          numColumns={3}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.BG_DARK,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.BG_DARK,
  },
  grid: {
    padding: 20,
  },
  galleryItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    backgroundColor: BRAND.SURFACE_DARK,
  },
  addButton: {
    backgroundColor: BRAND.SURFACE_DARK,
    borderWidth: 2,
    borderColor: BRAND.ACCENT,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 12,
    color: BRAND.ACCENT,
    marginTop: 4,
    fontWeight: '500',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: BRAND.TEXT_PRIMARY,
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: BRAND.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: BRAND.ACCENT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.TEXT_PRIMARY,
  },
});