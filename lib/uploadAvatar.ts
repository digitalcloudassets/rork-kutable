import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabaseClient';

export async function uploadAvatar() {
  const pick = await ImagePicker.launchImageLibraryAsync({ 
    mediaTypes: ImagePicker.MediaTypeOptions.Images, 
    quality: 0.9 
  });
  if (pick.canceled) return;
  
  const file = await fetch(pick.assets[0].uri).then(r => r.blob());

  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id!;
  const path = `${uid}/avatar-${Date.now()}.jpg`;

  const { error } = await supabase.storage.from('avatars').upload(path, file, { 
    upsert: true, 
    contentType: 'image/jpeg' 
  });
  if (error) throw error;

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
  return urlData.publicUrl;
}

export async function uploadGalleryImage(uri: string) {
  const file = await fetch(uri).then(r => r.blob());
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id!;
  const path = `${uid}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from('gallery').upload(path, file, { 
    upsert: true, 
    contentType: 'image/jpeg' 
  });
  if (error) throw error;
  return supabase.storage.from('gallery').getPublicUrl(path).data.publicUrl;
}

// Legacy function for backward compatibility
export async function pickAndUploadAvatar(userId: string) {
  const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!granted) throw new Error('Permission required');
  
  const res = await ImagePicker.launchImageLibraryAsync({ 
    mediaTypes: ImagePicker.MediaTypeOptions.Images, 
    allowsEditing: true, 
    aspect: [1, 1], 
    quality: 0.9 
  });
  
  if (res.canceled) return null;
  
  const asset = res.assets[0];
  const file = await fetch(asset.uri).then(r => r.blob());
  const path = `${userId}/avatar-${Date.now()}.jpg`;
  
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { 
      upsert: true, 
      contentType: 'image/jpeg' 
    });
  
  if (error) throw error;
  
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(path);
  
  return data.publicUrl as string;
}