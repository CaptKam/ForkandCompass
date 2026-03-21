import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import { COUNTRIES, ONBOARDING_IMAGES, type Country } from "@/constants/data";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const EDITORIAL_BLURBS: Record<string, string> = {
  italy: "Tonight, wander the cobblestoned lanes of Tuscany. Handmade pasta, bold Chianti, and the golden light of a Roman sunset.",
  japan: "Enter the quiet precision of a Tokyo kitchen. Sushi, ramen, and the art of simplicity \u2014 every bite a meditation.",
  morocco: "Tonight, lose yourself in the warmth of Marrakech. Tagine, mint tea, and stories from the medina.",
  mexico: "Feel the pulse of Oaxaca. Smoky mole, fresh guacamole, and flavors that trace back to the Aztecs.",
  india: "Discover the fire and soul of Delhi\u2019s kitchens. Butter chicken, chai, and spices that awaken every sense.",
  thailand: "Drift through Bangkok\u2019s glowing streets. Pad Thai, Tom Yum, and the perfect balance of sweet, sour, and heat.",
};

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { selectedCountryIds } = useApp();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Country>>(null);

  const sortedCountries = React.useMemo(() => {
    if (selectedCountryIds.length === 0) return COUNTRIES;
    const selected = COUNTRIES.filter((c) => selectedCountryIds.includes(c.id));
    const rest = COUNTRIES.filter((c) => !selectedCountryIds.includes(c.id));
    return [...selected, ...rest];
  }, [selectedCountryIds]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const renderItem = useCallback(
    ({ item }: { item: Country }) => (
      <DiscoveryCard
        country={item}
        topPadding={topPadding}
        bottomPadding={insets.bottom}
      />
    ),
    [topPadding, insets.bottom]
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <FlatList
        ref={flatListRef}
        data={sortedCountries}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />

      <View style={[styles.topBar, { paddingTop: topPadding + 12 }]}>
        <View style={{ width: 32 }} />
        <Text style={styles.topBarTitle}>The Culinary Editorial</Text>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={16} color="rgba(255,255,255,0.8)" />
        </View>
      </View>

      <View style={styles.pageIndicators}>
        {sortedCountries.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function DiscoveryCard({
  country,
  topPadding,
  bottomPadding,
}: {
  country: Country;
  topPadding: number;
  bottomPadding: number;
}) {
  const { isSaved, toggleSaved } = useApp();
  const firstRecipeId = country.recipes[0]?.id;
  const saved = firstRecipeId ? isSaved(firstRecipeId) : false;
  const heroImage = ONBOARDING_IMAGES[country.id] || country.heroImage;
  const blurb = EDITORIAL_BLURBS[country.id] || country.description;

  const handleGo = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/country/[id]", params: { id: country.id } });
  };

  const handleBookmark = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (firstRecipeId) toggleSaved(firstRecipeId);
  };

  return (
    <View style={[styles.cardContainer, { height: SCREEN_HEIGHT }]}>
      <Image
        source={{ uri: heroImage }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={400}
      />
      <LinearGradient
        colors={["transparent", "transparent", "rgba(0,0,0,0.8)"]}
        locations={[0, 0.3, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Pressable
        onPress={handleBookmark}
        style={({ pressed }) => [
          styles.bookmarkButton,
          { top: topPadding + 60 },
          pressed && { transform: [{ scale: 0.9 }] },
        ]}
      >
        <Ionicons
          name={saved ? "bookmark" : "bookmark-outline"}
          size={22}
          color="#FFFFFF"
        />
      </Pressable>

      <View style={[styles.cardContent, { paddingBottom: Math.max(bottomPadding, 16) + 90 }]}>
        <View style={styles.flagBadge}>
          <Text style={styles.flagEmoji}>{country.flag}</Text>
          <Text style={styles.flagLabel}>{country.name.toUpperCase()}</Text>
        </View>

        <Text style={styles.countryTitle}>{country.name}</Text>

        <Text style={styles.countryBlurb}>{blurb}</Text>

        <Pressable
          onPress={handleGo}
          style={({ pressed }) => [
            styles.letsGoButton,
            pressed && { transform: [{ scale: 0.95 }] },
          ]}
        >
          <Text style={styles.letsGoText}>Let's Go</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({ pathname: "/country/[id]", params: { id: country.id } });
          }}
        >
          <Text style={styles.browseLink}>Browse all countries</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 12,
    zIndex: 30,
  },
  topBarTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 18,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pageIndicators: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -40 }],
    gap: 10,
    alignItems: "center",
    zIndex: 30,
  },
  dot: {
    borderRadius: 4,
  },
  dotActive: {
    width: 5,
    height: 20,
    backgroundColor: "#FFFFFF",
  },
  dotInactive: {
    width: 5,
    height: 5,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  cardContainer: {
    width: SCREEN_WIDTH,
    backgroundColor: "#000000",
  },
  bookmarkButton: {
    position: "absolute",
    right: 24,
    zIndex: 30,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  flagBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginBottom: 16,
  },
  flagEmoji: {
    fontSize: 14,
  },
  flagLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  countryTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 42,
    color: "#FFFFFF",
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: 12,
  },
  countryBlurb: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
    marginBottom: 32,
  },
  letsGoButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 28,
    marginBottom: 20,
  },
  letsGoText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: "#1D1B18",
  },
  browseLink: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.3,
    textDecorationLine: "underline",
    textDecorationColor: "rgba(255,255,255,0.3)",
  },
});
