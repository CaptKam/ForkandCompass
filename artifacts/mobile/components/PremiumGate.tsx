import React from "react";
import { View, Text, Pressable, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface PremiumGateProps {
  feature: string;
  description: string;
  visible: boolean;
  onClose: () => void;
}

export default function PremiumGate({
  feature,
  description,
  visible,
  onClose,
}: PremiumGateProps) {
  const { packages, purchasePackage, restorePurchases, isLoading } =
    useSubscription();

  const monthlyPackage = packages.find((p) => p.packageType === "MONTHLY");
  const annualPackage = packages.find((p) => p.packageType === "ANNUAL");

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={24} color={Colors.light.onSurface} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.kicker}>Fork & Compass Pro</Text>
          <Text style={styles.headline}>Unlock the full culinary world</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        <View style={styles.featureList}>
          {[
            "All 8 destinations — Italy, Japan, Morocco & more",
            "Full week meal planning",
            "Multi-course dinner coordination",
            "Cooking history & favourites",
            "Unlimited grocery lists",
            "New destinations added regularly",
          ].map((feat, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.light.primary} />
              <Text style={styles.featureText}>{feat}</Text>
            </View>
          ))}
        </View>

        <View style={styles.packages}>
          {annualPackage && (
            <Pressable
              style={[styles.packageBtn, styles.packageBtnPrimary]}
              onPress={() => purchasePackage(annualPackage)}
              disabled={isLoading}
            >
              <View>
                <Text style={styles.packageBtnTitle}>Annual — best value</Text>
                <Text style={styles.packageBtnPrice}>
                  {annualPackage.product.priceString} / year
                </Text>
              </View>
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>Save 40%</Text>
              </View>
            </Pressable>
          )}

          {monthlyPackage && (
            <Pressable
              style={styles.packageBtn}
              onPress={() => purchasePackage(monthlyPackage)}
              disabled={isLoading}
            >
              <Text style={styles.packageBtnTitleSecondary}>Monthly</Text>
              <Text style={styles.packageBtnPriceSecondary}>
                {monthlyPackage.product.priceString} / month
              </Text>
            </Pressable>
          )}
        </View>

        <Pressable onPress={restorePurchases} style={styles.restoreBtn}>
          <Text style={styles.restoreText}>Restore purchases</Text>
        </Pressable>

        <Text style={styles.legal}>
          Subscription renews automatically. Cancel anytime in your Apple ID settings.
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 20,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  header: { marginBottom: 28 },
  kicker: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 0.12,
    textTransform: "uppercase",
    color: Colors.light.primary,
    marginBottom: 8,
  },
  headline: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 28,
    color: Colors.light.onSurface,
    lineHeight: 34,
    marginBottom: 10,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.secondary,
    lineHeight: 22,
  },
  featureList: { gap: 12, marginBottom: 28 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.onSurface,
    flex: 1,
  },
  packages: { gap: 10, marginBottom: 16 },
  packageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    borderRadius: 12,
    padding: 16,
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  packageBtnPrimary: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary,
  },
  packageBtnTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.light.onPrimary,
    marginBottom: 2,
  },
  packageBtnPrice: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
  },
  packageBtnTitleSecondary: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.light.onSurface,
    marginBottom: 2,
  },
  packageBtnPriceSecondary: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.secondary,
  },
  savingsBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  savingsText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.light.onPrimary,
  },
  restoreBtn: { alignItems: "center", paddingVertical: 12 },
  restoreText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
    textDecorationLine: "underline",
  },
  legal: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.light.secondary,
    textAlign: "center",
    lineHeight: 16,
    paddingBottom: 32,
  },
});
