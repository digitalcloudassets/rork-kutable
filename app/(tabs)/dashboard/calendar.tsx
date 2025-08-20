import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Clock, X, Calendar as CalendarIcon } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatTime, formatDate } from '@/utils/dateHelpers';
import type { AvailabilityBlock } from '@/types/models';
import { api } from '@/lib/api';

type RangeType = 'today' | 'week';

interface BlockFormData {
  startDate: Date;
  startTime: Date;
  endDate: Date;
  endTime: Date;
  reason: string;
}

const PRESET_BLOCKS = [
  {
    id: 'lunch',
    name: 'Lunch',
    duration: 30,
    reason: 'Lunch break',
    getStartTime: () => {
      const now = new Date();
      now.setHours(12, 0, 0, 0);
      return now;
    },
  },
  {
    id: 'personal',
    name: 'Personal (1h)',
    duration: 60,
    reason: 'Personal time',
    getStartTime: () => new Date(),
  },
  {
    id: 'closed',
    name: 'Closed (Full Day)',
    duration: 540, // 9 hours
    reason: 'Closed',
    getStartTime: () => {
      const now = new Date();
      now.setHours(9, 0, 0, 0);
      return now;
    },
  },
];

export default function CalendarScreen() {
  const [selectedRange, setSelectedRange] = useState<RangeType>('today');
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockForm, setBlockForm] = useState<BlockFormData>({
    startDate: new Date(),
    startTime: new Date(),
    endDate: new Date(),
    endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
    reason: '',
  });
  const [showDatePicker, setShowDatePicker] = useState<{
    field: keyof BlockFormData;
    mode: 'date' | 'time';
  } | null>(null);
  const [saving, setSaving] = useState(false);

  // Mock barber ID - in production, get from auth context
  const barberId = 'barber-1';

  const fetchBlocks = useCallback(async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      let startISO: string;
      let endISO: string;
      
      if (selectedRange === 'today') {
        const start = new Date(today);
        start.setHours(0, 0, 0, 0);
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);
        startISO = start.toISOString();
        endISO = end.toISOString();
      } else {
        // Week range
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6); // End of week (Saturday)
        end.setHours(23, 59, 59, 999);
        startISO = start.toISOString();
        endISO = end.toISOString();
      }

      const data = await api.availability.list({ barberId, startISO, endISO });
      setBlocks(data.blocks || []);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [selectedRange, barberId]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const handlePresetBlock = (preset: typeof PRESET_BLOCKS[0]) => {
    const startTime = preset.getStartTime();
    const endTime = new Date(startTime.getTime() + preset.duration * 60 * 1000);
    
    setBlockForm({
      startDate: startTime,
      startTime: startTime,
      endDate: endTime,
      endTime: endTime,
      reason: preset.reason,
    });
    setShowBlockModal(true);
  };

  const handleSaveBlock = async () => {
    try {
      setSaving(true);
      
      // Combine date and time
      const startDateTime = new Date(blockForm.startDate);
      startDateTime.setHours(
        blockForm.startTime.getHours(),
        blockForm.startTime.getMinutes(),
        0,
        0
      );
      
      const endDateTime = new Date(blockForm.endDate);
      endDateTime.setHours(
        blockForm.endTime.getHours(),
        blockForm.endTime.getMinutes(),
        0,
        0
      );
      
      if (startDateTime >= endDateTime) {
        Alert.alert('Invalid Time', 'End time must be after start time');
        return;
      }
      
      await api.availability.block({
        barberId,
        startISO: startDateTime.toISOString(),
        endISO: endDateTime.toISOString(),
        reason: blockForm.reason.trim() || undefined,
      });
      
      setShowBlockModal(false);
      fetchBlocks(); // Refresh the list
      Alert.alert('Success', 'Time blocked successfully');
    } catch (error) {
      console.error('Error blocking time:', error);
      Alert.alert('Error', 'Failed to block time');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlock = (block: AvailabilityBlock) => {
    Alert.alert(
      'Delete Block',
      `Remove "${block.reason || 'Blocked time'}" from ${formatTime(block.startISO)}–${formatTime(block.endISO)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.availability.unblock({ barberId, blockId: block.id });
              fetchBlocks(); // Refresh the list
              Alert.alert('Success', 'Block removed successfully');
            } catch (error) {
              console.error('Error deleting block:', error);
              Alert.alert('Error', 'Failed to remove block');
            }
          },
        },
      ]
    );
  };

  const handleDateTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(null);
    }
    
    if (selectedDate && showDatePicker) {
      setBlockForm(prev => ({
        ...prev,
        [showDatePicker.field]: selectedDate,
      }));
    }
  };

  const groupBlocksByDate = (blocks: AvailabilityBlock[]) => {
    const grouped: { [date: string]: AvailabilityBlock[] } = {};
    
    blocks.forEach(block => {
      const date = new Date(block.startISO).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(block);
    });
    
    return grouped;
  };

  const groupedBlocks = groupBlocksByDate(blocks);
  const dates = Object.keys(groupedBlocks).sort();

  return (
    <SafeAreaView style={styles.container}>
      {/* Range Selector */}
      <View style={styles.rangeSelector}>
        <TouchableOpacity
          style={[
            styles.rangeChip,
            selectedRange === 'today' && styles.rangeChipActive,
          ]}
          onPress={() => setSelectedRange('today')}
        >
          <Text
            style={[
              styles.rangeChipText,
              selectedRange === 'today' && styles.rangeChipTextActive,
            ]}
          >
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.rangeChip,
            selectedRange === 'week' && styles.rangeChipActive,
          ]}
          onPress={() => setSelectedRange('week')}
        >
          <Text
            style={[
              styles.rangeChipText,
              selectedRange === 'week' && styles.rangeChipTextActive,
            ]}
          >
            Week
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading blocks...</Text>
          </View>
        ) : dates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CalendarIcon size={48} color="#999" />
            <Text style={styles.emptyText}>No blocked time</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to block time
            </Text>
          </View>
        ) : (
          dates.map(date => (
            <View key={date} style={styles.daySection}>
              <Text style={styles.dayHeader}>{formatDate(new Date(date).toISOString())}</Text>
              {groupedBlocks[date].map(block => (
                <TouchableOpacity
                  key={block.id}
                  style={styles.blockPill}
                  onLongPress={() => handleDeleteBlock(block)}
                  delayLongPress={500}
                >
                  <View style={styles.blockContent}>
                    <Clock size={16} color="#666" />
                    <Text style={styles.blockTime}>
                      {formatTime(block.startISO)}–{formatTime(block.endISO)}
                    </Text>
                    {block.reason && (
                      <Text style={styles.blockReason}>{block.reason}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Quick Presets */}
      <View style={styles.presetsContainer}>
        <Text style={styles.presetsTitle}>Quick Block:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {PRESET_BLOCKS.map(preset => (
            <TouchableOpacity
              key={preset.id}
              style={styles.presetButton}
              onPress={() => handlePresetBlock(preset)}
            >
              <Text style={styles.presetButtonText}>{preset.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowBlockModal(true)}
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>

      {/* Block Time Modal */}
      <Modal
        visible={showBlockModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBlockModal(false)}>
              <X size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Block Time</Text>
            <TouchableOpacity
              onPress={handleSaveBlock}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.saveButton}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Start Date & Time */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Start</Text>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker({ field: 'startDate', mode: 'date' })}
                >
                  <Text style={styles.dateTimeButtonText}>
                    {blockForm.startDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker({ field: 'startTime', mode: 'time' })}
                >
                  <Text style={styles.dateTimeButtonText}>
                    {formatTime(blockForm.startTime.toISOString())}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* End Date & Time */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>End</Text>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker({ field: 'endDate', mode: 'date' })}
                >
                  <Text style={styles.dateTimeButtonText}>
                    {blockForm.endDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker({ field: 'endTime', mode: 'time' })}
                >
                  <Text style={styles.dateTimeButtonText}>
                    {formatTime(blockForm.endTime.toISOString())}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Reason */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Reason (optional)</Text>
              <TextInput
                style={styles.reasonInput}
                value={blockForm.reason}
                onChangeText={(text) => setBlockForm(prev => ({ ...prev, reason: text }))}
                placeholder="e.g., Lunch, Personal, Closed"
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Date/Time Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={blockForm[showDatePicker.field] as Date}
          mode={showDatePicker.mode}
          display="default"
          onChange={handleDateTimeChange}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  rangeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  rangeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
  },
  rangeChipActive: {
    backgroundColor: '#007AFF',
  },
  rangeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  rangeChipTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
  },
  daySection: {
    marginBottom: 24,
  },
  dayHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  blockPill: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  blockContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  blockReason: {
    fontSize: 14,
    color: '#666',
    marginLeft: 'auto',
  },
  presetsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    backgroundColor: 'white',
  },
  presetsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  presetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginRight: 8,
  },
  presetButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#495057',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  reasonInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dee2e6',
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 80,
  },
});