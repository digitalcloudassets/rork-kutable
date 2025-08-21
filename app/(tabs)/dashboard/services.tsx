import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Plus, Edit3, Trash2, DollarSign, Clock } from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { Tokens } from '@/theme/tokens';
import { apiClient } from '@/lib/api';
import { getUserId } from '@/lib/session';
import type { Service } from '@/types/models';

interface ServiceFormData {
  id?: string;
  name: string;
  durationMinutes: string;
  priceCents: string;
  description: string;
  active: boolean;
}

interface FormErrors {
  name?: string;
  durationMinutes?: string;
  priceCents?: string;
}

export default function ServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    durationMinutes: '',
    priceCents: '',
    description: '',
    active: true,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading services...');
      console.log('apiClient:', apiClient);
      console.log('apiClient.services:', apiClient?.services);
      
      // Test the apiClient
      try {
        const testResult = apiClient.test();
        console.log('API Client test result:', testResult);
      } catch (testError) {
        console.error('API Client test failed:', testError);
      }
      
      const uid = await getUserId();
      if (!uid) throw new Error('Not signed in');
      
      if (!apiClient || !apiClient.services) {
        throw new Error('API client not properly initialized');
      }
      
      const servicesList = await apiClient.services.list({ barberId: uid });
      setServices(servicesList);
    } catch (error) {
      console.error('Failed to load services:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load services';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  }, [loadServices]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Service name is required';
    }

    const duration = parseInt(formData.durationMinutes);
    if (!formData.durationMinutes || isNaN(duration) || duration <= 0) {
      errors.durationMinutes = 'Valid duration in minutes is required';
    }

    const price = parseFloat(formData.priceCents);
    if (!formData.priceCents || isNaN(price) || price < 0) {
      errors.priceCents = 'Valid price is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      
      const uid = await getUserId();
      if (!uid) throw new Error('Not signed in');

      let savedService: Service;
      
      if (editingService) {
        // Update existing service
        savedService = await apiClient.services.update({
          id: editingService.id,
          barberId: uid,
          name: formData.name.trim(),
          durationMinutes: parseInt(formData.durationMinutes),
          priceCents: Math.round(parseFloat(formData.priceCents) * 100), // Convert dollars to cents
          description: formData.description.trim() || undefined,
          active: formData.active,
        });
        setServices(prev => prev.map(s => s.id === savedService.id ? savedService : s));
      } else {
        // Create new service
        savedService = await apiClient.services.create({
          barberId: uid,
          name: formData.name.trim(),
          durationMinutes: parseInt(formData.durationMinutes),
          priceCents: Math.round(parseFloat(formData.priceCents) * 100), // Convert dollars to cents
          description: formData.description.trim() || undefined,
        });
        setServices(prev => [savedService, ...prev]);
      }

      handleCloseModal();
      console.log(`Service ${editingService ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Failed to save service:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save service';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (service: Service) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const uid = await getUserId();
              if (!uid) throw new Error('Not signed in');
              await apiClient.services.delete({ barberId: uid, serviceId: service.id });
              setServices(prev => prev.filter(s => s.id !== service.id));
              console.log('Service deleted successfully');
            } catch (error) {
              console.error('Failed to delete service:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to delete service';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      id: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes.toString(),
      priceCents: (service.priceCents / 100).toFixed(2), // Convert cents to dollars
      description: service.description || '',
      active: service.active,
    });
    setFormErrors({});
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingService(null);
    setFormData({
      name: '',
      durationMinutes: '',
      priceCents: '',
      description: '',
      active: true,
    });
    setFormErrors({});
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingService(null);
    setFormData({
      name: '',
      durationMinutes: '',
      priceCents: '',
      description: '',
      active: true,
    });
    setFormErrors({});
  };

  const formatPrice = (priceCents: number): string => {
    return `$${(priceCents / 100).toFixed(2)}`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const renderServiceItem = ({ item }: { item: Service }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.serviceDescription}>{item.description}</Text>
          )}
        </View>
        <View style={styles.serviceActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(item)}
            testID={`edit-service-${item.id}`}
            accessibilityLabel={`Edit ${item.name}`}
            accessibilityHint="Opens edit form for this service"
          >
            <Edit3 size={18} color={Tokens.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
            testID={`delete-service-${item.id}`}
            accessibilityLabel={`Delete ${item.name}`}
            accessibilityHint="Deletes this service permanently"
          >
            <Trash2 size={18} color={Tokens.error} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.serviceDetails}>
        <View style={styles.detailItem}>
          <DollarSign size={16} color={Tokens.textMuted} />
          <Text style={styles.detailText}>{formatPrice(item.priceCents)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Clock size={16} color={Tokens.textMuted} />
          <Text style={styles.detailText}>{formatDuration(item.durationMinutes)}</Text>
        </View>
        <View style={[styles.statusBadge, item.active ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={[styles.statusText, item.active ? styles.activeText : styles.inactiveText]}>
            {item.active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Tokens.accent} />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Services</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
          testID="add-service-button"
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Service</Text>
        </TouchableOpacity>
      </View>

      {services.length === 0 ? (
        <ScrollView
          style={{ flex: 1, backgroundColor: Tokens.bg }}
          contentContainerStyle={{ flex: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Services Yet</Text>
            <Text style={styles.emptyDescription}>
              Add your first service to start accepting bookings
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAdd}>
              <Plus size={20} color={Tokens.accent} />
              <Text style={styles.emptyButtonText}>Add Service</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <FlashList
          data={services}
          renderItem={renderServiceItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={120}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <Screen style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCloseModal}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingService ? 'Edit Service' : 'Add Service'}
            </Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={submitting}
              style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Service Name *</Text>
              <TextInput
                style={[styles.input, formErrors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="e.g., Haircut & Style"
                testID="service-name-input"
              />
              {formErrors.name && (
                <Text style={styles.errorText}>{formErrors.name}</Text>
              )}
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={styles.label}>Duration (minutes) *</Text>
                <TextInput
                  style={[styles.input, formErrors.durationMinutes && styles.inputError]}
                  value={formData.durationMinutes}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, durationMinutes: text }))}
                  placeholder="30"
                  keyboardType="numeric"
                  testID="service-duration-input"
                />
                {formErrors.durationMinutes && (
                  <Text style={styles.errorText}>{formErrors.durationMinutes}</Text>
                )}
              </View>

              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={styles.label}>Price ($) *</Text>
                <TextInput
                  style={[styles.input, formErrors.priceCents && styles.inputError]}
                  value={formData.priceCents}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, priceCents: text }))}
                  placeholder="25.00"
                  keyboardType="decimal-pad"
                  testID="service-price-input"
                />
                {formErrors.priceCents && (
                  <Text style={styles.errorText}>{formErrors.priceCents}</Text>
                )}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Optional description of the service..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                testID="service-description-input"
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Active</Text>
                <Switch
                  value={formData.active}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, active: value }))}
                  testID="service-active-switch"
                />
              </View>
              <Text style={styles.helpText}>
                Inactive services won't be available for booking
              </Text>
            </View>
          </ScrollView>
        </Screen>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Tokens.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Tokens.textMuted,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Tokens.surface,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Tokens.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Tokens.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Tokens.text,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: Tokens.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Tokens.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Tokens.accent,
  },
  emptyButtonText: {
    color: Tokens.accent,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  serviceCard: {
    backgroundColor: Tokens.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: Tokens.text,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: Tokens.textMuted,
    lineHeight: 18,
  },
  serviceActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: Tokens.textMuted,
    marginLeft: 4,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  activeBadge: {
    backgroundColor: Tokens.success + '20',
  },
  inactiveBadge: {
    backgroundColor: Tokens.error + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: Tokens.success,
  },
  inactiveText: {
    color: Tokens.error,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Tokens.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Tokens.surface,
    borderBottomWidth: 1,
    borderBottomColor: Tokens.border,
  },
  cancelButton: {
    fontSize: 16,
    color: Tokens.accent,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Tokens.text,
  },
  saveButton: {
    backgroundColor: Tokens.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Tokens.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Tokens.surface,
    borderWidth: 1,
    borderColor: Tokens.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Tokens.text,
  },
  inputError: {
    borderColor: Tokens.error,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 14,
    color: Tokens.error,
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: Tokens.textMuted,
    lineHeight: 18,
  },
});