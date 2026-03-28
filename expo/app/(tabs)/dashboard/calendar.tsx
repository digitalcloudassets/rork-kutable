import { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, Alert, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar as CalendarIcon, Clock, Plus } from 'lucide-react-native';
import { apiClient } from '@/lib/api';
import { getUserId } from '@/lib/session';
import { EmptyCard } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Tokens } from '@/theme/tokens';

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
      if (!uid) {
        console.warn('User not signed in');
        setBlocks([]);
        return;
      }
      const startISO = new Date(date); 
      startISO.setHours(0, 0, 0, 0);
      const endISO = new Date(date);   
      endISO.setHours(23, 59, 59, 999);
      const res = await apiClient.availability.list({ 
        barberId: uid, 
        startISO: startISO.toISOString(), 
        endISO: endISO.toISOString() 
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
      await apiClient.availability.block({ 
        barberId: uid, 
        startISO: start.toISOString(), 
        endISO: end.toISOString(), 
        reason: 'Blocked' 
      });
      await fetchBlocks();
    } catch (e: any) {
      Alert.alert('Could not block time', e?.message || 'Try a different range');
    }
  };

  const deleteBlock = async (id: string) => {
    try {
      const uid = await getUserId();
      if (!uid) throw new Error('Not signed in');
      await apiClient.availability.unblock({ barberId: uid, blockId: id });
      await fetchBlocks();
    } catch (e: any) {
      Alert.alert('Delete failed', e?.message || 'Try again');
    }
  };

  const blockOneHour = () => {
    const start = new Date(date);
    start.setHours(Math.max(9, new Date().getHours() + 1), 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    blockTime(start, end);
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Pressable 
          onPress={() => setShowPicker(true)} 
          style={styles.dateSelector}
        >
          <CalendarIcon size={20} color={Tokens.accent} />
          <Text style={styles.dateSelectorText}>Select date: {ymd(date)}</Text>
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
          style={styles.blockButton}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.blockButtonText}>
            Block 1 hour
          </Text>
        </Pressable>

        <Text style={styles.sectionTitle}>
          Blocked for {ymd(date)}
        </Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Tokens.accent} />
            <Text style={styles.loadingText}>Loading availability...</Text>
          </View>
        ) : (
          <FlatList
            data={blocks}
            keyExtractor={(b) => b.id}
            renderItem={({ item }) => (
              <Pressable
                onLongPress={() => deleteBlock(item.id)}
                style={styles.blockCard}
              >
                <View style={styles.blockHeader}>
                  <Clock size={16} color={Tokens.textMuted} />
                  <Text style={styles.blockTime}>
                    {new Date(item.start_utc).toLocaleTimeString()} – {new Date(item.end_utc).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={styles.blockReason}>
                  {item.reason || 'Blocked'}
                </Text>
                <Text style={styles.blockHint}>
                  Long-press to delete
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <EmptyCard
                icon={CalendarIcon}
                title="No blocked times"
                subtitle="Your availability is completely open for this day. Block specific times when you're unavailable."
                actionLabel="Block 1 Hour"
                onAction={blockOneHour}
                testID="calendar-empty-blocks"
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Tokens.border,
    backgroundColor: Tokens.surface,
    marginBottom: 16,
  },
  dateSelectorText: {
    fontSize: 16,
    color: Tokens.text,
    marginLeft: 8,
    fontWeight: '500',
  },
  blockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Tokens.accent,
    gap: 8,
  },
  blockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '700',
    fontSize: 20,
    color: Tokens.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Tokens.textMuted,
  },
  blockCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Tokens.border,
    marginBottom: 12,
    backgroundColor: Tokens.surface,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  blockTime: {
    fontSize: 16,
    fontWeight: '600',
    color: Tokens.text,
    marginLeft: 8,
  },
  blockReason: {
    fontSize: 14,
    color: Tokens.textMuted,
    marginBottom: 4,
  },
  blockHint: {
    fontSize: 12,
    color: Tokens.textMuted,
    fontStyle: 'italic',
  },
});