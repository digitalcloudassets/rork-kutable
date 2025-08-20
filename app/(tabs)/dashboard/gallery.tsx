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
import { Plus, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brandColors } from '@/config/brand';
import { useAuth } from '@/providers/AuthProvider';
import type { GalleryItem } from '@/types/models';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 60) / 3; // 3 columns with padding

export default function GalleryScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: galleryItems = [], isLoading } = useQuery({
    queryKey: ['gallery', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/gallery/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barberId: user?.id }),
      });
      const data = await response.json();
      return data.items || [];
    },
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (path: string) => {
      const response = await fetch('/api/gallery/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barberId: user?.id, path }),
      });
      if (!response.ok) throw new Error('Failed to delete image');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery', user?.id] });
    },
  });

  const handleAddPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
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

      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: filename,
        type: `image/${extension}`,
      } as any);
      formData.append('path', path);
      formData.append('barberId', user?.id || '');

      // Upload to backend
      const response = await fetch('/api/gallery/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
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
        <ActivityIndicator size="small" color={brandColors.primary} />
      ) : (
        <>
          <Plus size={32} color={brandColors.primary} />
          <Text style={styles.addButtonText}>Add Photo</Text>
        </>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={brandColors.primary} />
      </View>
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
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#f0f0f0',
  },
  addButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: brandColors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 12,
    color: brandColors.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});