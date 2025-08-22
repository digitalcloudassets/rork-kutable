import { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { api } from '@/lib/api';
import { getUserId } from '@/lib/session';

type Block = { id: string; start_utc: string; end_utc: string; reason?: string };

export default function CalendarScreen() {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);

  const ymd = (d: Date) => d.toISOString().slice(0, 10);

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const uid = await getUserId();
      if (!uid) throw new Error('Not signed in');
      const startISO = new Date(date); 
      startISO.setHours(0, 0, 0, 0);
      const endISO = new Date(date);   
      endISO.setHours(23, 59, 59, 999);
      const res = await api('/api/availability/list', {
        method: 'POST',
        body: JSON.stringify({ barberId: uid, startISO, endISO }),
      });
      setBlocks(res.blocks || []);
    } catch (e: any) {
      console.warn('list blocks failed', e?.message || e);
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchBlocks(); 
  }, [date]);

  const blockTime = async (start: Date, end: Date) => {
    try {
      const uid = await getUserId();
      if (!uid) throw new Error('Not signed in');
      const res = await api('/api/availability/block', {
        method: 'POST',
        body: JSON.stringify({ 
          barberId: uid, 
          startISO: start, 
          endISO: end, 
          reason: 'Blocked' 
        }),
      });
      if (res.error) throw new Error(res.error);
      await fetchBlocks();
    } catch (e: any) {
      Alert.alert('Could not block time', e?.message || 'Try a different range');
    }
  };

  const deleteBlock = async (id: string) => {
    try {
      const uid = await getUserId();
      if (!uid) throw new Error('Not signed in');
      const url = `/api/availability/block/${id}?barberId=${uid}`;
      const res = await api(url, { method: 'DELETE' });
      if (res.error) throw new Error(res.error);
      await fetchBlocks();
    } catch (e: any) {
      Alert.alert('Delete failed', e?.message || 'Try again');
    }
  };

  // Example quick-action: block 1 hour starting now+1h (same day)
  const blockOneHour = () => {
    const start = new Date(date);
    start.setHours(Math.max(9, new Date().getHours() + 1), 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    blockTime(start, end);
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Pressable 
        onPress={() => setShowPicker(true)} 
        style={{ 
          padding: 12, 
          borderRadius: 10, 
          borderWidth: 1, 
          borderColor: '#ccc',
          backgroundColor: '#f9f9f9',
          marginBottom: 16
        }}
      >
        <Text>Select date: {ymd(date)}</Text>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_, d) => { 
            setShowPicker(false); 
            if (d) setDate(d); 
          }}
        />
      )}

      <Pressable 
        onPress={blockOneHour} 
        style={{ 
          marginBottom: 16, 
          padding: 12, 
          borderRadius: 10, 
          backgroundColor: '#007AFF' 
        }}
      >
        <Text style={{ 
          color: '#fff', 
          textAlign: 'center', 
          fontWeight: '700' 
        }}>
          Block 1 hour
        </Text>
      </Pressable>

      <Text style={{ 
        marginBottom: 16, 
        fontWeight: '700', 
        fontSize: 18 
      }}>
        Blocked for {ymd(date)}
      </Text>
      
      {loading ? (
        <Text>Loading…</Text>
      ) : (
        <FlatList
          data={blocks}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => (
            <Pressable
              onLongPress={() => deleteBlock(item.id)}
              style={{ 
                padding: 12, 
                borderRadius: 10, 
                borderWidth: 1, 
                borderColor: '#ddd',
                marginBottom: 8,
                backgroundColor: '#fff'
              }}
            >
              <Text style={{ fontWeight: '600' }}>
                {new Date(item.start_utc).toLocaleTimeString()} – {new Date(item.end_utc).toLocaleTimeString()}
              </Text>
              <Text style={{ color: '#666', marginTop: 4 }}>
                {item.reason || 'Blocked'}
              </Text>
              <Text style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                Long-press to delete
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={{ 
              color: '#666', 
              marginTop: 8, 
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              No blocks yet.
            </Text>
          }
        />
      )}
    </View>
  );
}