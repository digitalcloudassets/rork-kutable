import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabaseClient';

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
  const ext = (asset.fileName?.split('.').pop() || 'jpg').toLowerCase();
  const path = `avatars/${userId}.${ext}`;
  
  const base64 = await FileSystem.readAsStringAsync(asset.uri, { 
    encoding: FileSystem.EncodingType.Base64 
  });
  
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  
  const { error } = await supabase.storage
    .from('barber-media')
    .upload(path, bytes, { 
      upsert: true, 
      contentType: ext === 'png' ? 'image/png' : 'image/jpeg' 
    });
  
  if (error) throw error;
  
  const { data } = supabase.storage
    .from('barber-media')
    .getPublicUrl(path);
  
  return data.publicUrl as string;
}