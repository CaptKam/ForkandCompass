import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Colors from "@/constants/colors";
import { SCAN_ZONES, type InventoryItem, type ScanZone } from "@/constants/inventory";
import { useApp } from "@/contexts/AppContext";
import { productCatalog, type CatalogStats } from "@/services/productCatalog";

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface ZoneGroup {
  zone: ScanZone;
  emoji: string;
  label: string;
  items: InventoryItem[];
}

export default function InventoryPanel() {
  const { inventoryItems, removeInventoryItem, clearInventory, clearInventoryZone, lastScanTimestamp } = useApp();
  const [expandedZone, setExpandedZone] = useState<ScanZone | null>(null);
  const [catalogStats, setCatalogStats] = useState<CatalogStats | null>(null);

  // Load catalog stats
  useEffect(() => {
    productCatalog.getStats().then(setCatalogStats).catch(() => {});
  }, [inventoryItems]); // Refresh when inventory changes (after a scan)

  const zoneGroups = useMemo(() => {
    const groups: Record<string, ZoneGroup> = {};
    for (const item of inventoryItems) {
      const zoneInfo = SCAN_ZONES.find((z) => z.key === item.zone);
      if (!groups[item.zone]) {
        groups[item.zone] = {
          zone: item.zone,
          emoji: zoneInfo?.emoji ?? "\u{1F4E6}",
          label: zoneInfo?.label ?? "Other",
          items: [],
        };
      }
      groups[item.zone].items.push(item);
    }
    // Sort by SCAN_ZONES order
    const order = SCAN_ZONES.map((z) => z.key);
    return Object.values(groups).sort(
      (a, b) => order.indexOf(a.zone) - order.indexOf(b.zone)
    );
  }, [inventoryItems]);

  const handleClearAll = () => {
    if (Platform.OS === "web") {
      clearInventory();
      return;
    }
    Alert.alert("Clear Inventory", "Remove all scanned items?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: clearInventory },
    ]);
  };

  const handleClearZone = (zone: ScanZone, label: string) => {
    if (Platform.OS === "web") {
      clearInventoryZone(zone);
      return;
    }
    Alert.alert(`Clear ${label}`, `Remove all items from ${label}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => clearInventoryZone(zone) },
    ]);
  };

  if (inventoryItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.scannerPromo}>
          <View style={styles.promoIconRow}>
            <Text style={styles.promoEmoji}>{"\u{1F9CA}"}</Text>
            <Text style={styles.promoEmoji}>{"\u{1FAD8}"}</Text>
            <Text style={styles.promoEmoji}>{"\u{1F9C2}"}</Text>
          </View>
          <View style={styles.promoBetaBadge}>
            <Text style={styles.promoBetaText}>BETA</Text>
          </View>
          <Text style={styles.promoTitle}>Kitchen Inventory Scanner</Text>
          <Text style={styles.promoSubtitle}>
            Scan your fridge, pantry, and spice rack to track what you already have. We'll
            detect brands and quantities in real-time.
          </Text>
          <Pressable
            style={styles.promoButton}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/kitchen-scanner");
            }}
          >
            <Ionicons name="scan" size={20} color="#FFFFFF" />
            <Text style={styles.promoButtonText}>Scan My Kitchen</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.inventoryHeader}>
        <View style={styles.inventoryHeaderLeft}>
          <Text style={styles.inventoryTitle}>My Kitchen</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{inventoryItems.length}</Text>
          </View>
        </View>
        <View style={styles.inventoryHeaderRight}>
          {lastScanTimestamp && (
            <Text style={styles.lastScanText}>
              Scanned {timeAgo(lastScanTimestamp)}
            </Text>
          )}
          <Pressable onPress={handleClearAll} hitSlop={8}>
            <Ionicons name="trash-outline" size={18} color={Colors.light.secondary} />
          </Pressable>
        </View>
      </View>

      {/* Zone groups */}
      {zoneGroups.map((group) => (
        <View key={group.zone} style={styles.zoneSection}>
          <Pressable
            style={styles.zoneSectionHeader}
            onPress={() => {
              setExpandedZone(expandedZone === group.zone ? null : group.zone);
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={styles.zoneSectionLeft}>
              <Text style={styles.zoneSectionEmoji}>{group.emoji}</Text>
              <Text style={styles.zoneSectionLabel}>{group.label}</Text>
              <Text style={styles.zoneSectionCount}>{group.items.length}</Text>
            </View>
            <View style={styles.zoneSectionRight}>
              <Pressable
                hitSlop={8}
                onPress={() => handleClearZone(group.zone, group.label)}
              >
                <Ionicons name="close-circle-outline" size={16} color={Colors.light.outlineVariant} />
              </Pressable>
              <Ionicons
                name={expandedZone === group.zone ? "chevron-up" : "chevron-down"}
                size={18}
                color={Colors.light.secondary}
              />
            </View>
          </Pressable>

          {expandedZone === group.zone && (
            <View style={styles.zoneItems}>
              {group.items.map((item) => (
                <View key={item.id} style={styles.inventoryRow}>
                  <View style={styles.inventoryRowLeft}>
                    <View
                      style={[
                        styles.confidenceIndicator,
                        {
                          backgroundColor:
                            item.confidence > 0.85
                              ? "#4ADE80"
                              : item.confidence > 0.7
                                ? "#FBBF24"
                                : "#F87171",
                        },
                      ]}
                    />
                    <View style={styles.inventoryRowInfo}>
                      <Text style={styles.inventoryItemName}>{item.name}</Text>
                      {item.brand && (
                        <Text style={styles.inventoryItemBrand}>{item.brand}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.inventoryRowRight}>
                    <Text style={styles.inventoryItemQty}>
                      {item.quantity} {item.unit}
                    </Text>
                    <Pressable
                      hitSlop={8}
                      onPress={() => {
                        if (Platform.OS !== "web")
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        removeInventoryItem(item.id);
                      }}
                    >
                      <Ionicons name="close" size={16} color={Colors.light.outlineVariant} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}

      {/* Re-scan button */}
      <Pressable
        style={styles.rescanRow}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/kitchen-scanner");
        }}
      >
        <Ionicons name="scan-outline" size={18} color={Colors.light.primary} />
        <Text style={styles.rescanText}>Scan Again</Text>
      </Pressable>

      {/* Product Catalog stats */}
      {catalogStats && catalogStats.totalProducts > 0 && (
        <View style={styles.catalogCard}>
          <View style={styles.catalogHeader}>
            <Ionicons name="images-outline" size={16} color={Colors.light.secondary} />
            <Text style={styles.catalogTitle}>Product Catalog</Text>
          </View>
          <View style={styles.catalogStatsRow}>
            <View style={styles.catalogStat}>
              <Text style={styles.catalogStatValue}>{catalogStats.totalProducts}</Text>
              <Text style={styles.catalogStatLabel}>Products</Text>
            </View>
            <View style={styles.catalogStatDivider} />
            <View style={styles.catalogStat}>
              <Text style={styles.catalogStatValue}>{catalogStats.totalImages}</Text>
              <Text style={styles.catalogStatLabel}>Images</Text>
            </View>
          </View>
          {catalogStats.topProducts.length > 0 && (
            <View style={styles.catalogTopList}>
              <Text style={styles.catalogTopLabel}>Most seen</Text>
              {catalogStats.topProducts.slice(0, 3).map((p, i) => (
                <Text key={i} style={styles.catalogTopItem}>
                  {p.name}{p.brand ? ` (${p.brand})` : ""} — {p.timesDetected}x
                </Text>
              ))}
            </View>
          )}
          <Text style={styles.catalogFooter}>
            Each scan builds your product reference library
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  emptyContainer: {},
  // Promo card (shown when no inventory)
  scannerPromo: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(222,193,179,0.2)",
  },
  promoIconRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  promoEmoji: {
    fontSize: 28,
  },
  promoBetaBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 10,
  },
  promoBetaText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    lineHeight: 18,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  promoTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 18,
    color: Colors.light.onSurface,
    marginBottom: 6,
    textAlign: "center",
  },
  promoSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.secondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 18,
  },
  promoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingHorizontal: 28,
    height: 48,
  },
  promoButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  // Inventory header
  inventoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  inventoryHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inventoryTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontStyle: "italic",
    fontSize: 18,
    color: Colors.light.secondary,
  },
  countBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    lineHeight: 18,
    color: "#FFFFFF",
  },
  inventoryHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  lastScanText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.outlineVariant,
  },
  // Zone sections
  zoneSection: {
    marginBottom: 6,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 14,
    overflow: "hidden",
  },
  zoneSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  zoneSectionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  zoneSectionEmoji: {
    fontSize: 18,
  },
  zoneSectionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.onSurface,
  },
  zoneSectionCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.secondary,
  },
  zoneSectionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  // Zone items
  zoneItems: {
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  inventoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.outlineVariant,
  },
  inventoryRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  confidenceIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  inventoryRowInfo: {
    flex: 1,
  },
  inventoryItemName: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.onSurface,
  },
  inventoryItemBrand: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.secondary,
    marginTop: 1,
  },
  inventoryRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inventoryItemQty: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.onSurfaceVariant,
  },
  // Re-scan
  rescanRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(222,193,179,0.3)",
    borderRadius: 14,
  },
  rescanText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.primary,
  },
  // Product Catalog stats
  catalogCard: {
    marginTop: 12,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.15)",
  },
  catalogHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  catalogTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.secondary,
  },
  catalogStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginBottom: 10,
  },
  catalogStat: {
    alignItems: "center",
  },
  catalogStatValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
    color: Colors.light.onSurface,
  },
  catalogStatLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.secondary,
  },
  catalogStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.light.outlineVariant,
  },
  catalogTopList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.outlineVariant,
    paddingTop: 8,
    marginBottom: 6,
  },
  catalogTopLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  catalogTopItem: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.onSurfaceVariant,
    paddingVertical: 2,
  },
  catalogFooter: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.outlineVariant,
    textAlign: "center",
    fontStyle: "italic",
  },
});
