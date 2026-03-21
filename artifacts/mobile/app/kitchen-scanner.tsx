import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { Accelerometer } from "expo-sensors";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import {
  COMMON_KITCHEN_ITEMS,
  SCAN_ZONES,
  SPEED_THRESHOLDS,
  type DetectedItem,
  type InventoryItem,
  type ScanZone,
  type ScannerSpeed,
} from "@/constants/inventory";
import { useApp } from "@/contexts/AppContext";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// Mock detection engine — simulates AI item recognition
// In production this would call a vision API with captured frames
function simulateDetection(zone: ScanZone, frameIndex: number): DetectedItem[] {
  const zoneItems = COMMON_KITCHEN_ITEMS.filter((i) => i.zone === zone);
  if (zoneItems.length === 0) return [];

  // Progressively "discover" items as user scans
  const discoveryRate = Math.min(frameIndex * 2, zoneItems.length);
  const discovered: DetectedItem[] = [];

  for (let i = 0; i < discoveryRate; i++) {
    const item = zoneItems[i];
    const brandIdx = Math.floor(Math.random() * Math.max(1, item.brands.length));
    const confidence = 0.72 + Math.random() * 0.26; // 0.72 - 0.98

    discovered.push({
      label: item.name,
      brand: item.brands[brandIdx] ?? null,
      quantity: Math.ceil(Math.random() * 3),
      unit: item.defaultUnit,
      confidence,
      boundingBox: {
        x: 0.1 + Math.random() * 0.5,
        y: 0.1 + Math.random() * 0.6,
        width: 0.15 + Math.random() * 0.2,
        height: 0.1 + Math.random() * 0.15,
      },
    });
  }
  return discovered;
}

export default function KitchenScannerScreen() {
  const insets = useSafeAreaInsets();
  const { addInventoryItems } = useApp();
  const [permission, requestPermission] = useCameraPermissions();

  // Scanner state
  const [phase, setPhase] = useState<"zone_select" | "scanning" | "review">("zone_select");
  const [selectedZone, setSelectedZone] = useState<ScanZone>("fridge");
  const [scanning, setScanning] = useState(false);
  const [speed, setSpeed] = useState<ScannerSpeed>("good");
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [frameCount, setFrameCount] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [showSpeedWarning, setShowSpeedWarning] = useState(false);

  // Animation refs
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const speedWarningOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Accelerometer tracking
  const lastAccel = useRef({ x: 0, y: 0, z: 0 });
  const accelSubscription = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);

  // Scanning interval
  const scanInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start accelerometer monitoring
  useEffect(() => {
    if (scanning) {
      Accelerometer.setUpdateInterval(100);
      accelSubscription.current = Accelerometer.addListener((data) => {
        const dx = Math.abs(data.x - lastAccel.current.x);
        const dy = Math.abs(data.y - lastAccel.current.y);
        const dz = Math.abs(data.z - lastAccel.current.z);
        const delta = Math.sqrt(dx * dx + dy * dy + dz * dz);
        lastAccel.current = data;

        let newSpeed: ScannerSpeed = "good";
        if (delta > SPEED_THRESHOLDS.tooFast) {
          newSpeed = "too_fast";
        } else if (delta > SPEED_THRESHOLDS.fast) {
          newSpeed = "fast";
        }

        setSpeed(newSpeed);

        if (newSpeed === "too_fast" || newSpeed === "fast") {
          setShowSpeedWarning(true);
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(
              newSpeed === "too_fast"
                ? Haptics.NotificationFeedbackType.Error
                : Haptics.NotificationFeedbackType.Warning
            );
          }
        } else {
          setShowSpeedWarning(false);
        }
      });
    }

    return () => {
      accelSubscription.current?.remove();
      accelSubscription.current = null;
    };
  }, [scanning]);

  // Speed warning animation
  useEffect(() => {
    Animated.timing(speedWarningOpacity, {
      toValue: showSpeedWarning ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showSpeedWarning, speedWarningOpacity]);

  // Scan line animation
  useEffect(() => {
    if (scanning) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      scanLineAnim.setValue(0);
    }
  }, [scanning, scanLineAnim]);

  // Pulse animation for detection indicators
  useEffect(() => {
    if (scanning) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [scanning, pulseAnim]);

  // Frame capture simulation (mock detection every 1.5s)
  useEffect(() => {
    if (scanning && speed !== "too_fast") {
      scanInterval.current = setInterval(() => {
        setFrameCount((prev) => {
          const next = prev + 1;
          const newItems = simulateDetection(selectedZone, next);

          setDetectedItems((existing) => {
            // Merge: keep highest confidence per item name
            const merged = [...existing];
            for (const item of newItems) {
              const idx = merged.findIndex(
                (e) => e.label.toLowerCase() === item.label.toLowerCase()
              );
              if (idx >= 0) {
                if (item.confidence > merged[idx].confidence) {
                  merged[idx] = item;
                }
              } else {
                merged.push(item);
              }
            }
            return merged;
          });

          // Progress based on items found vs total in zone
          const zoneTotal = COMMON_KITCHEN_ITEMS.filter((i) => i.zone === selectedZone).length;
          setScanProgress(Math.min(1, next / Math.max(zoneTotal / 2, 5)));

          return next;
        });

        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }, 1500);
    }

    return () => {
      if (scanInterval.current) clearInterval(scanInterval.current);
    };
  }, [scanning, speed, selectedZone]);

  // Progress bar animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: scanProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [scanProgress, progressAnim]);

  const startScanning = useCallback(() => {
    setPhase("scanning");
    setScanning(true);
    setDetectedItems([]);
    setFrameCount(0);
    setScanProgress(0);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const stopScanning = useCallback(() => {
    setScanning(false);
    setPhase("review");
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const saveAndClose = useCallback(() => {
    const inventoryItems: InventoryItem[] = detectedItems.map((item, idx) => ({
      id: `scan-${selectedZone}-${Date.now()}-${idx}`,
      name: item.label,
      brand: item.brand,
      quantity: item.quantity ?? 1,
      unit: item.unit ?? "item",
      zone: selectedZone,
      confidence: item.confidence,
      scannedAt: Date.now(),
      expiresAt: null,
      imageUri: null,
    }));

    addInventoryItems(inventoryItems);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.back();
  }, [detectedItems, selectedZone, addInventoryItems]);

  const scanAgain = useCallback(() => {
    setPhase("zone_select");
    setDetectedItems([]);
    setFrameCount(0);
    setScanProgress(0);
  }, []);

  // Permission screen
  if (!permission?.granted && phase !== "zone_select") {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.permissionContainer}>
          <View style={styles.permissionIcon}>
            <Ionicons name="camera-outline" size={48} color={Colors.light.primary} />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionSubtitle}>
            We need camera access to scan your kitchen and identify items.
          </Text>
          <Pressable style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
          </Pressable>
          <Pressable style={styles.backButtonSmall} onPress={() => router.back()}>
            <Text style={styles.backButtonSmallText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // PHASE 1: Zone selection
  if (phase === "zone_select") {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={28} color={Colors.light.onSurface} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={styles.betaBadge}>
              <Text style={styles.betaBadgeText}>BETA</Text>
            </View>
            <Text style={styles.headerTitle}>Kitchen Scanner</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>

        {/* Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>{"\u{1F4F7}"}</Text>
          <Text style={styles.heroTitle}>Scan What You Have</Text>
          <Text style={styles.heroSubtitle}>
            Walk slowly around your kitchen. We'll detect brands, quantities, and build your
            inventory in real-time.
          </Text>
        </View>

        {/* Zone picker */}
        <Text style={styles.sectionLabel}>Where are you scanning?</Text>
        <View style={styles.zoneGrid}>
          {SCAN_ZONES.map((zone) => (
            <Pressable
              key={zone.key}
              style={[
                styles.zoneCard,
                selectedZone === zone.key && styles.zoneCardSelected,
              ]}
              onPress={() => {
                setSelectedZone(zone.key);
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={styles.zoneEmoji}>{zone.emoji}</Text>
              <Text
                style={[
                  styles.zoneLabel,
                  selectedZone === zone.key && styles.zoneLabelSelected,
                ]}
              >
                {zone.label}
              </Text>
              {selectedZone === zone.key && (
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={Colors.light.primary}
                  style={styles.zoneCheck}
                />
              )}
            </Pressable>
          ))}
        </View>

        {/* Zone description */}
        <View style={styles.tipBox}>
          <Ionicons name="bulb-outline" size={18} color={Colors.light.secondary} />
          <Text style={styles.tipText}>
            {SCAN_ZONES.find((z) => z.key === selectedZone)?.description}
          </Text>
        </View>

        {/* Start button */}
        <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={styles.startButton}
            onPress={async () => {
              if (!permission?.granted) {
                await requestPermission();
              }
              startScanning();
            }}
          >
            <Ionicons name="scan" size={22} color="#FFFFFF" />
            <Text style={styles.startButtonText}>Start Scanning</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // PHASE 2: Active scanning
  if (phase === "scanning") {
    const scanLineTranslate = scanLineAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, SCREEN_H * 0.5],
    });

    return (
      <View style={styles.scannerContainer}>
        {/* Camera view */}
        {Platform.OS !== "web" && permission?.granted ? (
          <CameraView style={StyleSheet.absoluteFill} facing="back" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.mockCamera]}>
            <Text style={styles.mockCameraText}>
              {Platform.OS === "web" ? "Camera Preview" : "Loading camera..."}
            </Text>
            <Text style={styles.mockCameraSubtext}>
              {Platform.OS === "web"
                ? "Camera not available on web — using simulated scan"
                : ""}
            </Text>
          </View>
        )}

        {/* Scanning overlay */}
        <View style={StyleSheet.absoluteFill}>
          {/* Corner brackets */}
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />

          {/* Scan line */}
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [{ translateY: scanLineTranslate }],
              },
            ]}
          />

          {/* Detection indicators (bounding boxes) */}
          {detectedItems.slice(-5).map((item, idx) => (
            <Animated.View
              key={`${item.label}-${idx}`}
              style={[
                styles.detectionBox,
                {
                  left: `${item.boundingBox.x * 100}%` as unknown as number,
                  top: `${item.boundingBox.y * 100}%` as unknown as number,
                  width: `${item.boundingBox.width * 100}%` as unknown as number,
                  height: `${item.boundingBox.height * 100}%` as unknown as number,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <View style={styles.detectionLabel}>
                <Text style={styles.detectionLabelText} numberOfLines={1}>
                  {item.label}
                  {item.brand ? ` · ${item.brand}` : ""}
                </Text>
                <Text style={styles.detectionConfidence}>
                  {Math.round(item.confidence * 100)}%
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Top status bar */}
        <View style={[styles.scannerTopBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => { setScanning(false); setPhase("zone_select"); }} hitSlop={12}>
            <View style={styles.scannerCloseButton}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </View>
          </Pressable>

          <View style={styles.scannerStatusCenter}>
            <View style={styles.scannerZoneBadge}>
              <Text style={styles.scannerZoneBadgeText}>
                {SCAN_ZONES.find((z) => z.key === selectedZone)?.emoji}{" "}
                {SCAN_ZONES.find((z) => z.key === selectedZone)?.label}
              </Text>
            </View>
            <Text style={styles.scannerItemCount}>
              {detectedItems.length} items detected
            </Text>
          </View>

          <View style={styles.scannerLiveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Speed warning overlay */}
        <Animated.View
          style={[
            styles.speedWarning,
            { opacity: speedWarningOpacity },
          ]}
          pointerEvents="none"
        >
          <View style={[
            styles.speedWarningInner,
            speed === "too_fast" && styles.speedWarningCritical,
          ]}>
            <Ionicons
              name={speed === "too_fast" ? "hand-left" : "speedometer-outline"}
              size={28}
              color="#FFFFFF"
            />
            <Text style={styles.speedWarningText}>
              {speed === "too_fast" ? "Too fast! Scanning paused" : "Slow down for better results"}
            </Text>
          </View>
        </Animated.View>

        {/* Progress bar + item ticker at bottom */}
        <View style={[styles.scannerBottomBar, { paddingBottom: insets.bottom + 16 }]}>
          {/* Latest detected item */}
          {detectedItems.length > 0 && (
            <View style={styles.latestItem}>
              <Ionicons name="checkmark-circle" size={18} color="#4ADE80" />
              <Text style={styles.latestItemText} numberOfLines={1}>
                {detectedItems[detectedItems.length - 1].label}
                {detectedItems[detectedItems.length - 1].brand
                  ? ` — ${detectedItems[detectedItems.length - 1].brand}`
                  : ""}
                {detectedItems[detectedItems.length - 1].quantity
                  ? ` (×${detectedItems[detectedItems.length - 1].quantity})`
                  : ""}
              </Text>
            </View>
          )}

          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(scanProgress * 100)}% scanned
            </Text>
          </View>

          {/* Stop button */}
          <Pressable style={styles.stopButton} onPress={stopScanning}>
            <Ionicons name="stop-circle" size={22} color="#FFFFFF" />
            <Text style={styles.stopButtonText}>Done Scanning</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // PHASE 3: Review detected items
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={28} color={Colors.light.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Scan Results</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Summary */}
      <View style={styles.reviewSummary}>
        <View style={styles.reviewSummaryIcon}>
          <Ionicons name="checkmark-circle" size={40} color="#4ADE80" />
        </View>
        <Text style={styles.reviewSummaryTitle}>
          {detectedItems.length} Items Found
        </Text>
        <Text style={styles.reviewSummarySubtitle}>
          in your {SCAN_ZONES.find((z) => z.key === selectedZone)?.label.toLowerCase()} ·{" "}
          {frameCount} frames captured
        </Text>
      </View>

      {/* Item list */}
      <View style={styles.reviewList}>
        {detectedItems.map((item, idx) => (
          <View key={`${item.label}-${idx}`} style={styles.reviewItem}>
            <View style={styles.reviewItemLeft}>
              <View style={[
                styles.confidenceDot,
                { backgroundColor: item.confidence > 0.85 ? "#4ADE80" : item.confidence > 0.7 ? "#FBBF24" : "#F87171" },
              ]} />
              <View>
                <Text style={styles.reviewItemName}>{item.label}</Text>
                {item.brand && (
                  <Text style={styles.reviewItemBrand}>{item.brand}</Text>
                )}
              </View>
            </View>
            <View style={styles.reviewItemRight}>
              {item.quantity && (
                <Text style={styles.reviewItemQty}>
                  ×{item.quantity} {item.unit}
                </Text>
              )}
              <Text style={styles.reviewItemConfidence}>
                {Math.round(item.confidence * 100)}%
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={[styles.reviewActions, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.saveButton} onPress={saveAndClose}>
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Add to My Kitchen</Text>
        </Pressable>
        <Pressable style={styles.rescanButton} onPress={scanAgain}>
          <Ionicons name="refresh-outline" size={18} color={Colors.light.secondary} />
          <Text style={styles.rescanButtonText}>Scan Another Area</Text>
        </Pressable>
      </View>
    </View>
  );
}

const CORNER_SIZE = 40;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 20,
    color: Colors.light.onSurface,
  },
  betaBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  betaBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  // Hero
  heroSection: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 24,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  heroTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 24,
    color: Colors.light.onSurface,
    marginBottom: 8,
    textAlign: "center",
  },
  heroSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  // Zone selection
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.light.onSurfaceVariant,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  zoneGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 10,
  },
  zoneCard: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  zoneCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: "rgba(154,65,0,0.06)",
  },
  zoneEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  zoneLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.onSurface,
  },
  zoneLabelSelected: {
    color: Colors.light.primary,
    fontFamily: "Inter_600SemiBold",
  },
  zoneCheck: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  // Tip box
  tipBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 24,
    marginTop: 20,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: 12,
    padding: 14,
  },
  tipText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.secondary,
    lineHeight: 18,
  },
  // Bottom actions
  bottomActions: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    height: 56,
  },
  startButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  // Permission
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  permissionIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  permissionTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 22,
    color: Colors.light.onSurface,
    marginBottom: 8,
    textAlign: "center",
  },
  permissionSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  permissionButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginBottom: 12,
  },
  permissionButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  backButtonSmall: {
    paddingVertical: 10,
  },
  backButtonSmallText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.secondary,
  },
  // Scanner
  scannerContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  mockCamera: {
    backgroundColor: "#1A1A2E",
    alignItems: "center",
    justifyContent: "center",
  },
  mockCameraText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 4,
  },
  mockCameraSubtext: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
  },
  // Corner brackets
  cornerTopLeft: {
    position: "absolute",
    top: "15%",
    left: "8%",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: "#FFFFFF",
    borderTopLeftRadius: 4,
  },
  cornerTopRight: {
    position: "absolute",
    top: "15%",
    right: "8%",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: "#FFFFFF",
    borderTopRightRadius: 4,
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: "25%",
    left: "8%",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: "25%",
    right: "8%",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: "#FFFFFF",
    borderBottomRightRadius: 4,
  },
  // Scan line
  scanLine: {
    position: "absolute",
    top: "15%",
    left: "8%",
    right: "8%",
    height: 2,
    backgroundColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  // Detection boxes
  detectionBox: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: "#4ADE80",
    borderRadius: 6,
  },
  detectionLabel: {
    position: "absolute",
    top: -24,
    left: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  detectionLabelText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "#FFFFFF",
    maxWidth: 140,
  },
  detectionConfidence: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#4ADE80",
  },
  // Scanner top bar
  scannerTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  scannerCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  scannerStatusCenter: {
    alignItems: "center",
  },
  scannerZoneBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 4,
  },
  scannerZoneBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#FFFFFF",
  },
  scannerItemCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  scannerLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(239,68,68,0.9)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  liveText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  // Speed warning
  speedWarning: {
    position: "absolute",
    top: "40%",
    left: 24,
    right: 24,
    alignItems: "center",
  },
  speedWarningInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(251,191,36,0.9)",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  speedWarningCritical: {
    backgroundColor: "rgba(239,68,68,0.9)",
  },
  speedWarningText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  // Scanner bottom bar
  scannerBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  latestItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  latestItemText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#FFFFFF",
    flex: 1,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  progressText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    minWidth: 80,
    textAlign: "right",
  },
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    height: 52,
  },
  stopButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  // Review screen
  reviewSummary: {
    alignItems: "center",
    paddingVertical: 24,
  },
  reviewSummaryIcon: {
    marginBottom: 12,
  },
  reviewSummaryTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 24,
    color: Colors.light.onSurface,
    marginBottom: 4,
  },
  reviewSummarySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.secondary,
  },
  reviewList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  reviewItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.outlineVariant,
  },
  reviewItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  reviewItemName: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.light.onSurface,
  },
  reviewItemBrand: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.secondary,
    marginTop: 1,
  },
  reviewItemRight: {
    alignItems: "flex-end",
  },
  reviewItemQty: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.onSurface,
  },
  reviewItemConfidence: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.light.secondary,
  },
  // Review actions
  reviewActions: {
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 10,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    height: 56,
  },
  saveButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  rescanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.light.outlineVariant,
    borderRadius: 14,
    height: 48,
  },
  rescanButtonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.secondary,
  },
});
