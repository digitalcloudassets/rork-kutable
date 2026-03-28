import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Plus, Edit2, Trash2, X, Check } from "lucide-react-native";
import { brandColors } from "@/config/brand";
import type { Service } from "@/types/models";

export default function ManageServicesScreen() {
  const [services, setServices] = useState<Service[]>([
    {
      id: "1",
      barberId: "barber-1",
      name: "Classic Haircut",
      durationMinutes: 30,
      priceCents: 3500,
      description: "Traditional haircut with styling",
      active: true,
    },
    {
      id: "2",
      barberId: "barber-1",
      name: "Beard Trim",
      durationMinutes: 20,
      priceCents: 2500,
      description: "Professional beard shaping and trim",
      active: true,
    },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: "",
    price: "",
  });

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      description: service.description || "",
      duration: service.durationMinutes.toString(),
      price: (service.priceCents / 100).toFixed(2),
    });
  };

  const handleSave = () => {
    if (editingId) {
      setServices(services.map(s => 
        s.id === editingId 
          ? {
              ...s,
              name: formData.name,
              description: formData.description,
              durationMinutes: parseInt(formData.duration),
              priceCents: Math.round(parseFloat(formData.price) * 100),
            }
          : s
      ));
      setEditingId(null);
    } else if (isAdding) {
      const newService: Service = {
        id: Date.now().toString(),
        barberId: "barber-1",
        name: formData.name,
        description: formData.description,
        durationMinutes: parseInt(formData.duration),
        priceCents: Math.round(parseFloat(formData.price) * 100),
        active: true,
      };
      setServices([...services, newService]);
      setIsAdding(false);
    }
    setFormData({ name: "", description: "", duration: "", price: "" });
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Service",
      "Are you sure you want to delete this service?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => setServices(services.filter(s => s.id !== id))
        },
      ]
    );
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ name: "", description: "", duration: "", price: "" });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Services</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsAdding(true)}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Service</Text>
        </TouchableOpacity>
      </View>

      {isAdding && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>New Service</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Service Name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="e.g., Premium Haircut"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Describe the service..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Duration (min)</Text>
              <TextInput
                style={styles.input}
                value={formData.duration}
                onChangeText={(text) => setFormData({ ...formData, duration: text })}
                placeholder="30"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Price ($)</Text>
              <TextInput
                style={styles.input}
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                placeholder="35.00"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <X size={18} color="#666" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Check size={18} color="#fff" />
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.servicesList}>
        {services.map((service) => (
          <View key={service.id} style={styles.serviceCard}>
            {editingId === service.id ? (
              <>
                <View style={styles.editForm}>
                  <TextInput
                    style={[styles.input, styles.editInput]}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder="Service name"
                  />
                  <TextInput
                    style={[styles.input, styles.editInput]}
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    placeholder="Description"
                    multiline
                  />
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, styles.editInput, styles.halfWidth]}
                      value={formData.duration}
                      onChangeText={(text) => setFormData({ ...formData, duration: text })}
                      placeholder="Duration"
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[styles.input, styles.editInput, styles.halfWidth]}
                      value={formData.price}
                      onChangeText={(text) => setFormData({ ...formData, price: text })}
                      placeholder="Price"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
                <View style={styles.editActions}>
                  <TouchableOpacity onPress={handleCancel}>
                    <X size={20} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSave}>
                    <Check size={20} color="#10B981" />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  {service.description && (
                    <Text style={styles.serviceDescription}>{service.description}</Text>
                  )}
                  <View style={styles.serviceMeta}>
                    <Text style={styles.metaText}>{service.durationMinutes} min</Text>
                    <Text style={styles.metaDivider}>•</Text>
                    <Text style={styles.priceText}>
                      ${(service.priceCents / 100).toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={styles.serviceActions}>
                  <TouchableOpacity onPress={() => handleEdit(service)}>
                    <Edit2 size={18} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(service.id)}>
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: brandColors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  formCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#333",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  formActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginLeft: 4,
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: brandColors.primary,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 4,
  },
  servicesList: {
    padding: 16,
  },
  serviceCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  serviceMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 13,
    color: "#999",
  },
  metaDivider: {
    marginHorizontal: 8,
    color: "#ccc",
  },
  priceText: {
    fontSize: 14,
    fontWeight: "600",
    color: brandColors.primary,
  },
  serviceActions: {
    flexDirection: "row",
    gap: 16,
  },
  editForm: {
    flex: 1,
  },
  editInput: {
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
  },
});