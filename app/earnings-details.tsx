import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { TrendingUp, DollarSign, Calendar, Download } from "lucide-react-native";
import { brandColors } from "@/config/brand";

const { width } = Dimensions.get("window");

export default function EarningsDetailsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "year">("month");

  const earnings = {
    week: { gross: 1250, fees: 75, net: 1175 },
    month: { gross: 5420, fees: 325, net: 5095 },
    year: { gross: 65040, fees: 3902, net: 61138 },
  };

  const currentEarnings = earnings[selectedPeriod];

  const recentTransactions = [
    { id: "1", date: "Mar 14", client: "John Smith", service: "Haircut", amount: 35 },
    { id: "2", date: "Mar 14", client: "Mike Johnson", service: "Beard Trim", amount: 25 },
    { id: "3", date: "Mar 13", client: "David Lee", service: "Full Service", amount: 60 },
    { id: "4", date: "Mar 13", client: "Chris Brown", service: "Haircut", amount: 35 },
    { id: "5", date: "Mar 12", client: "Tom Wilson", service: "Kids Cut", amount: 25 },
  ];

  const chartData = [
    { day: "Mon", amount: 180 },
    { day: "Tue", amount: 220 },
    { day: "Wed", amount: 195 },
    { day: "Thu", amount: 250 },
    { day: "Fri", amount: 320 },
    { day: "Sat", amount: 380 },
    { day: "Sun", amount: 150 },
  ];

  const maxAmount = Math.max(...chartData.map(d => d.amount));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.periodSelector}>
        {(["week", "month", "year"] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[styles.periodButton, selectedPeriod === period && styles.activePeriod]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[styles.periodText, selectedPeriod === period && styles.activePeriodText]}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.earningsCard}>
        <Text style={styles.cardTitle}>Total Earnings</Text>
        <Text style={styles.earningsAmount}>${currentEarnings.net.toLocaleString()}</Text>
        <View style={styles.earningsBreakdown}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Gross</Text>
            <Text style={styles.breakdownValue}>${currentEarnings.gross.toLocaleString()}</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Fees</Text>
            <Text style={[styles.breakdownValue, styles.feesText]}>
              -${currentEarnings.fees.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>Weekly Overview</Text>
        <View style={styles.chart}>
          {chartData.map((data, index) => (
            <View key={index} style={styles.chartBar}>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar, 
                    { height: `${(data.amount / maxAmount) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.chartLabel}>{data.day}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.transactionsCard}>
        <View style={styles.transactionsHeader}>
          <Text style={styles.cardTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Download size={20} color={brandColors.primary} />
          </TouchableOpacity>
        </View>
        
        {recentTransactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              <Text style={styles.transactionClient}>{transaction.client}</Text>
              <Text style={styles.transactionService}>{transaction.service}</Text>
              <Text style={styles.transactionDate}>{transaction.date}</Text>
            </View>
            <Text style={styles.transactionAmount}>+${transaction.amount}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.payoutButton}>
        <DollarSign size={20} color="#fff" />
        <Text style={styles.payoutButtonText}>Request Payout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  activePeriod: {
    backgroundColor: brandColors.primaryLight,
  },
  periodText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  activePeriodText: {
    color: brandColors.primary,
  },
  earningsCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 20,
  },
  earningsBreakdown: {
    flexDirection: "row",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 13,
    color: "#999",
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  feesText: {
    color: "#EF4444",
  },
  breakdownDivider: {
    width: 1,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 20,
  },
  chartCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chart: {
    flexDirection: "row",
    height: 150,
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  chartBar: {
    flex: 1,
    alignItems: "center",
  },
  barContainer: {
    flex: 1,
    width: "60%",
    justifyContent: "flex-end",
  },
  bar: {
    backgroundColor: brandColors.primary,
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 11,
    color: "#999",
    marginTop: 8,
  },
  transactionsCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  transactionLeft: {
    flex: 1,
  },
  transactionClient: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  transactionService: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: "#999",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
  },
  payoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: brandColors.primary,
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  payoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
});