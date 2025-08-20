import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import dayjs from 'dayjs';
import { Screen } from '@/components/Screen';
import { Tokens } from '@/theme/tokens';
import { api } from '@/lib/api';
import { getUserId } from '@/lib/session';

type Block = { id: string; start_utc: string; end_utc: string; reason?: string };

export default function CalendarAvailability() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const start = dayjs().startOf('day').toISOString();
  const end = dayjs().add(14, 'day').endOf('day').toISOString();

  const loadBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const uid = await getUserId();
      if (!uid) throw new Error('Not signed in');
      const data = await api.availability.list({ 
        barberId: uid, 
        startISO: start, 
        endISO: end 
      });
      setBlocks(data.blocks || []);
    } catch (error) {
      console.error('Failed to load availability blocks:', error);
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBlocks();
    setRefreshing(false);
  }, [loadBlocks]);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  return (
    <Screen>
      <ScrollView 
        style={{ flex: 1, backgroundColor: Tokens.bg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ padding: 16 }}>
          <Text style={{ 
            color: Tokens.text, 
            fontSize: 22, 
            fontWeight: '700', 
            marginBottom: 12 
          }}>
            Calendar & Availability
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color={Tokens.accent} />
          ) : blocks.length === 0 ? (
            <View style={{ 
              padding: 16, 
              borderRadius: 12, 
              backgroundColor: Tokens.surface, 
              borderColor: Tokens.border, 
              borderWidth: 1 
            }}>
              <Text style={{ color: Tokens.textMuted }}>
                No blocked time in the next 14 days.
              </Text>
            </View>
          ) : (
            blocks.map(b => (
              <View 
                key={b.id} 
                style={{ 
                  padding: 16, 
                  borderRadius: 12, 
                  backgroundColor: Tokens.surface, 
                  borderWidth: 1, 
                  borderColor: Tokens.border, 
                  marginBottom: 12 
                }}
              >
                <Text style={{ color: Tokens.text, fontWeight: '700' }}>
                  {dayjs(b.start_utc).format('ddd, MMM D • h:mm A')} → {dayjs(b.end_utc).format('h:mm A')}
                </Text>
                {b.reason && (
                  <Text style={{ color: Tokens.textMuted, marginTop: 6 }}>
                    {b.reason}
                  </Text>
                )}
              </View>
            ))
          )}

          <TouchableOpacity 
            style={{ 
              marginTop: 16, 
              padding: 16, 
              borderRadius: 12, 
              backgroundColor: Tokens.accent, 
              alignItems: 'center' 
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
              Block Time
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}