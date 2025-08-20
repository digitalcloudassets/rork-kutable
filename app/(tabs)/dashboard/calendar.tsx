import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity, RefreshControl, Pressable, Alert, TextInput, Modal } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Toast from 'react-native-toast-message';
import dayjs from 'dayjs';
import { Screen } from '@/components/Screen';
import { Tokens } from '@/theme/tokens';
import { apiClient } from '@/lib/api';
import { getUserId } from '@/lib/session';
import { Clock, Plus, Trash2 } from 'lucide-react-native';

type Block = { id: string; start_utc: string; end_utc: string; reason?: string };

export default function CalendarAvailability() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const start = dayjs().startOf('day').toISOString();
  const end = dayjs().add(14, 'day').endOf('day').toISOString();

  // Block time modal state
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [blockStart, setBlockStart] = useState<Date | null>(null);
  const [blockEnd, setBlockEnd] = useState<Date | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [blocking, setBlocking] = useState(false);

  const loadBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const uid = await getUserId();
      if (!uid) throw new Error('Not signed in');
      const data = await apiClient.availability.list({ 
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

  const resetBlockForm = () => {
    setBlockStart(null);
    setBlockEnd(null);
    setBlockReason('');
    setShowBlockModal(false);
  };

  const handleBlockTime = async () => {
    if (!blockStart || !blockEnd) {
      Alert.alert('Error', 'Please select both start and end times');
      return;
    }

    if (blockStart >= blockEnd) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    setBlocking(true);
    try {
      const uid = await getUserId();
      if (!uid) {
        Alert.alert('Error', 'Please sign in');
        return;
      }

      await apiClient.availability.block({
        barberId: uid,
        startISO: blockStart.toISOString(),
        endISO: blockEnd.toISOString(),
        reason: blockReason.trim() || undefined,
      });

      resetBlockForm();
      await loadBlocks();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Time has been blocked successfully',
      });
    } catch (error: any) {
      console.error('Error blocking time:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to block time. Please try again.',
      });
    } finally {
      setBlocking(false);
    }
  };

  const handleDeleteBlock = (blockId: string) => {
    Alert.alert(
      'Delete Block',
      'Are you sure you want to delete this blocked time?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const uid = await getUserId();
              if (!uid) return;
              
              await apiClient.availability.unblock({
                barberId: uid,
                blockId,
              });
              
              await loadBlocks();
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Blocked time has been deleted',
              });
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to delete block',
              });
            }
          },
        },
      ]
    );
  };

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
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: 20 
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Clock size={24} color={Tokens.text} style={{ marginRight: 8 }} />
              <Text style={{ 
                color: Tokens.text, 
                fontSize: 22, 
                fontWeight: '700' 
              }}>
                Calendar & Availability
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowBlockModal(true)}
              style={{ 
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: Tokens.accent,
              }}
            >
              <Plus size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>
                Block Time
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Tokens.accent} />
          ) : blocks.length === 0 ? (
            <View style={{ 
              padding: 24, 
              borderRadius: 12, 
              backgroundColor: Tokens.surface, 
              borderColor: Tokens.border, 
              borderWidth: 1,
              alignItems: 'center' 
            }}>
              <Clock size={48} color={Tokens.textMuted} style={{ marginBottom: 12 }} />
              <Text style={{ 
                color: Tokens.text, 
                fontSize: 16, 
                fontWeight: '600',
                marginBottom: 4 
              }}>
                No blocked time
              </Text>
              <Text style={{ 
                color: Tokens.textMuted, 
                textAlign: 'center',
                lineHeight: 20 
              }}>
                You haven't blocked any time in the next 14 days. Tap "Block Time" to add unavailable periods.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {blocks.map(b => (
                <View 
                  key={b.id}
                  style={{ 
                    padding: 16, 
                    borderRadius: 12, 
                    backgroundColor: Tokens.surface, 
                    borderWidth: 1, 
                    borderColor: Tokens.border,
                  }}
                >
                  <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start' 
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ 
                        color: Tokens.text, 
                        fontWeight: '700',
                        fontSize: 16,
                        marginBottom: 4 
                      }}>
                        {dayjs(b.start_utc).format('ddd, MMM D')}
                      </Text>
                      <Text style={{ 
                        color: Tokens.textMuted, 
                        fontSize: 14,
                        marginBottom: b.reason ? 8 : 0 
                      }}>
                        {dayjs(b.start_utc).format('h:mm A')} → {dayjs(b.end_utc).format('h:mm A')}
                      </Text>
                      {b.reason && (
                        <Text style={{ 
                          color: Tokens.text, 
                          fontSize: 14,
                          fontStyle: 'italic' 
                        }}>
                          {b.reason}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteBlock(b.id)}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        backgroundColor: '#FF3B3020',
                      }}
                    >
                      <Trash2 size={16} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}


        </View>
      </ScrollView>

      {/* Block Time Modal */}
      <Modal
        visible={showBlockModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={resetBlockForm}
      >
        <View style={{ flex: 1, backgroundColor: Tokens.bg }}>
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: 16, 
            borderBottomWidth: 1, 
            borderBottomColor: Tokens.border 
          }}>
            <TouchableOpacity onPress={resetBlockForm}>
              <Text style={{ color: Tokens.accent, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ color: Tokens.text, fontSize: 18, fontWeight: '700' }}>
              Block Time
            </Text>
            <TouchableOpacity 
              onPress={handleBlockTime}
              disabled={blocking || !blockStart || !blockEnd}
            >
              <Text style={{ 
                color: (blocking || !blockStart || !blockEnd) ? Tokens.textMuted : Tokens.accent, 
                fontSize: 16, 
                fontWeight: '600' 
              }}>
                {blocking ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, padding: 16 }}>
            <View style={{ gap: 20 }}>
              {/* Start Time */}
              <View>
                <Text style={{ color: Tokens.text, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                  Start Time
                </Text>
                <TouchableOpacity
                  onPress={() => setShowStartPicker(true)}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: Tokens.surface,
                    borderWidth: 1,
                    borderColor: Tokens.border,
                  }}
                >
                  <Text style={{ color: blockStart ? Tokens.text : Tokens.textMuted }}>
                    {blockStart ? dayjs(blockStart).format('ddd, MMM D • h:mm A') : 'Select start time'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* End Time */}
              <View>
                <Text style={{ color: Tokens.text, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                  End Time
                </Text>
                <TouchableOpacity
                  onPress={() => setShowEndPicker(true)}
                  disabled={!blockStart}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: blockStart ? Tokens.surface : Tokens.bg,
                    borderWidth: 1,
                    borderColor: Tokens.border,
                    opacity: blockStart ? 1 : 0.5,
                  }}
                >
                  <Text style={{ color: blockEnd ? Tokens.text : Tokens.textMuted }}>
                    {blockEnd ? dayjs(blockEnd).format('ddd, MMM D • h:mm A') : 'Select end time'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Reason */}
              <View>
                <Text style={{ color: Tokens.text, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                  Reason (Optional)
                </Text>
                <TextInput
                  value={blockReason}
                  onChangeText={setBlockReason}
                  placeholder="e.g., Lunch break, Personal appointment"
                  placeholderTextColor={Tokens.textMuted}
                  multiline
                  numberOfLines={3}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: Tokens.surface,
                    borderWidth: 1,
                    borderColor: Tokens.border,
                    color: Tokens.text,
                    textAlignVertical: 'top',
                    minHeight: 80,
                  }}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Date/Time Pickers */}
      <DateTimePickerModal
        isVisible={showStartPicker}
        mode="datetime"
        minimumDate={new Date()}
        onConfirm={(date) => {
          setBlockStart(date);
          setShowStartPicker(false);
          // Auto-set end time to 1 hour later if not set
          if (!blockEnd) {
            const endTime = new Date(date.getTime() + 60 * 60 * 1000);
            setBlockEnd(endTime);
          }
        }}
        onCancel={() => setShowStartPicker(false)}
      />

      <DateTimePickerModal
        isVisible={showEndPicker}
        mode="datetime"
        minimumDate={blockStart || new Date()}
        onConfirm={(date) => {
          setBlockEnd(date);
          setShowEndPicker(false);
        }}
        onCancel={() => setShowEndPicker(false)}
      />
    </Screen>
  );
}