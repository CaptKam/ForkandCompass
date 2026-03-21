import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";
import { COUNTRIES, WELCOME_HERO_IMAGE, type Country } from "@/constants/data";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const CARD_SPACING = 16;

const HERO_IMAGE = WELCOME_HERO_IMAGE;

const CONCEPT_IMAGES = {
  step1:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA2npE6pmoYnday6-Y_mHRUn0XH-wJrtvbJvhiUkLWgpGe1ekrVhjYhFoEd7GM0FpYMGj7NjRlnr-m6Yc7zSkEv87aklB1BvWDLyhN7b2nK8czYU1qERFkCbGq1gmuWHMBulCysHGF7PlTa0cc-A41HFNrKRq2J0EZDhRb9MOuFSxJ2D-na7P4M3hjeipAZLWDtZPcFWxNFB6Sh8P9mlpLVRJZiybKeVhbnxpMDlAMyWBliODvdGQsGVo-FXTWlw4QvipmsloRbrS25",
  step2:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC80-dqeKUxvOSGzprztG5J8CT7StytkU8SOjUzJxP2ADLsIVM95M5RUcra-xaWElAB65hCgWj688nF8d90ZlRQtymbOa4DG7KBYAtbGK7ZWYbWHNUruHN0Wh7MjBb2z_GmVb8RzczHPYGtX0jRo_H_EHmxfNfC47RwNqeJ4KTOQRaVIMfwIabemGugGAX6Jdilk70u1n-zXBO7OWu9L8Ij_BtkBcy0qVCA1Uf7W6QN5n4hcLcUuqaiB5wHWT2gvP2aH-wHUfbkcui3",
  step3:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCTXP5zMxcfLMYxx6jVi0zC-Yg53e-uyQhUyo_MU7Ldc4FAxikKScNGKc1RgYF2H5_tgWj0xugSFDwH2ztrmwa6hy4d_4RDnjD40JlNLENxe5BXQpjVMjEqkFQY9MOgH1fhHmbAvmXZwmTFCd7RyMOeCsEJw9IHVH2emtw4F-LIBCiN4fY965sRR9R0iTvE3FqGm1mLMiXtxotRbAyIGUnQt2p97L_pRE8JIdeMJDDTRTfkus8WCxBUWrNg9_rELYe0fU3RMi1Dyu9n",
};

const FEATURED_JOURNALS = [
  {
    id: "italy",
    issue: "Issue 04",
    title: "The Tuscan Sun",
    subtitle:
      "Exploring the heritage of slow-simmered rag\u00f9 and rustic pecorino.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDk0nfDwTICXu1tWtxIez15PWQe1K7cwMyoKXzL4Z89PU-fEKTxhErNuSuFSLMEJHQxV9bWzWMHV0Kj-hGtAet0rHxk8IFM4WCp0qEpovKUuGpttZZd9qTjsvmrWbduW5WhY8nfgC_nVl3FvKrp6Z8kHJnhTvCTwNyGBqroF8og1X63RTRuKCdDrX_XHkokXE5bGJS_VO7CIoDYd9_y69olel9b8NY9bKlgZNe7XtuqAUsdVP0UPLvHZVu33WK1u1m",
  },
  {
    id: "japan",
    issue: "Issue 05",
    title: "Kyoto Mornings",
    subtitle:
      "The zen of dashi, seasonal pickles, and the perfect bowl of rice.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAKGRmXhb_ylXaZO2c_OzotOxNO_0Ygjns7bfnPa1mwZ2bIrt6kPLU3uaDDAb1mJBogqZSDTsmIRa2z0asqTa2oB7Sdy4wjwctXKWxM7cHeX7TM9iwKJe_skeOJ0Q5Bw0uox0kfquVDT7TBxs83iZK1O-Y13RoNPb6rrOpGqPusGL3kYMIXbIQlJ1MAkj3GxUddWA_pQsMra-DG9QH1TgkbZcNy32cVmOyJhLxf31gEDnDaEmsBriUBOdZoRasLknuHCcVfpN_4nR1-",
  },
  {
    id: "morocco",
    issue: "Issue 06",
    title: "Marrakech Spice",
    subtitle:
      "A fragrant deep-dive into saffron, preserved lemons, and fire-baked breads.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBnYwhKn4JTpQpyuqaJb9anIMF1SRTaroynyqwhJ1fwa4TbQJGfKOGZEFdJ1vaS68dF69cG6SMS2256GgcPCwOtj7PDbz1BNrdI39zZ4fUC-T2V_zu3Rz0igAFKv7aDB8XW8LHNlDuBb0EarAQn9WAZvwZkrgbfJ-pUWUaZ-CC-8N_n-rwfQuwtInWRAJ_9e4yEyCqkdjs-sa6SaqJFSTck_r_38f6Km0K2OLyIJqLEQ9wH9uQf4z3a_2zhOazuxbuyTS0aYaj7csqr",
  },
];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Math.max(insets.bottom, 16) + 84;

  const handleCountryPress = (countryId: string) => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/country/[id]", params: { id: countryId } });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={[styles.topBar, { paddingTop: topPadding + 12 }]}>
        <Pressable style={styles.topBarIcon}>
          <Ionicons name="menu" size={24} color="#9A4100" />
        </Pressable>
        <Text style={styles.topBarTitle}>The Culinary Editorial</Text>
        <Pressable style={styles.topBarIcon}>
          <Ionicons name="search" size={24} color="#9A4100" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
      >
        <HeroSection topPadding={topPadding} />
        <ConceptSection />
        <FeaturedSection onCardPress={handleCountryPress} />
        <TestimonialSection />
        <CTASection />
        <FooterSection />
      </ScrollView>
    </View>
  );
}

function HeroSection({ topPadding }: { topPadding: number }) {
  return (
    <View style={styles.heroContainer}>
      <Image
        source={{ uri: HERO_IMAGE }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={600}
      />
      <LinearGradient
        colors={["transparent", "rgba(29,27,24,0.4)", "rgba(29,27,24,0.8)"]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.heroContent, { paddingTop: topPadding + 60 }]}>
        <Text style={styles.heroTitle}>
          Eat Your Way{"\n"}Across the Globe.
        </Text>
        <Text style={styles.heroSubtitle}>
          Pick a country, cook a dinner, feel like you traveled.
        </Text>
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web")
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push({ pathname: "/country/[id]", params: { id: "italy" } });
          }}
          style={({ pressed }) => [
            styles.heroButton,
            pressed && { transform: [{ scale: 0.95 }], opacity: 0.9 },
          ]}
        >
          <Text style={styles.heroButtonText}>Start Your Journey</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

function ConceptSection() {
  const steps = [
    {
      image: CONCEPT_IMAGES.step1,
      number: "1",
      title: "Choose a Destination",
      description:
        "Select from our curated monthly journals, each focusing on a single culture\u2019s soul.",
    },
    {
      image: CONCEPT_IMAGES.step2,
      number: "2",
      title: "Get the Ingredients",
      description:
        "Receive a smart shopping list of authentic essentials found in your local market.",
    },
    {
      image: CONCEPT_IMAGES.step3,
      number: "3",
      title: "Follow the Journey",
      description:
        "Immerse yourself in step-by-step editorial instructions and regional soundscapes.",
    },
  ];

  return (
    <View style={styles.conceptSection}>
      <Text style={styles.conceptLabel}>THE CURATOR'S METHOD</Text>
      <Text style={styles.conceptTitle}>Travel from your kitchen.</Text>

      <View style={styles.stepsContainer}>
        {steps.map((step) => (
          <View key={step.number} style={styles.stepItem}>
            <View style={styles.stepImageContainer}>
              <Image
                source={{ uri: step.image }}
                style={styles.stepImage}
                contentFit="cover"
                transition={400}
              />
            </View>
            <Text style={styles.stepTitle}>
              {step.number}. {step.title}
            </Text>
            <Text style={styles.stepDescription}>{step.description}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function FeaturedSection({
  onCardPress,
}: {
  onCardPress: (id: string) => void;
}) {
  return (
    <View style={styles.featuredSection}>
      <View style={styles.featuredHeader}>
        <View>
          <Text style={styles.featuredLabel}>ACTIVE JOURNALS</Text>
          <Text style={styles.featuredTitle}>Featured Destinations</Text>
        </View>
        <Pressable style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.light.primary} />
        </Pressable>
      </View>

      <FlatList
        data={FEATURED_JOURNALS}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsContainer}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate="fast"
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onCardPress(item.id)}
            style={({ pressed }) => [
              styles.journalCard,
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
          >
            <View style={styles.journalImageContainer}>
              <Image
                source={{ uri: item.image }}
                style={styles.journalImage}
                contentFit="cover"
                transition={400}
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.6)"]}
                locations={[0.4, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.journalOverlay}>
                <Text style={styles.journalIssue}>{item.issue}</Text>
                <Text style={styles.journalTitle}>{item.title}</Text>
              </View>
            </View>
            <Text style={styles.journalSubtitle}>{item.subtitle}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

function TestimonialSection() {
  return (
    <View style={styles.testimonialSection}>
      <View style={styles.testimonialCard}>
        <Text style={styles.testimonialQuoteMark}>{"\u201C"}</Text>
        <Text style={styles.testimonialText}>
          The Culinary Editorial isn't just about the food {"\u2014"} it's about
          the feeling of being somewhere else entirely for an evening.
        </Text>
        <View style={styles.testimonialDivider} />
        <Text style={styles.testimonialAuthor}>ELENA, ROME</Text>
      </View>
    </View>
  );
}

function CTASection() {
  return (
    <View style={styles.ctaSection}>
      <Text style={styles.ctaTitle}>Bring the World to Your Table</Text>
      <Text style={styles.ctaSubtitle}>
        Join 50,000+ digital travelers discovering the soul of global cuisines
        from the comfort of their own home.
      </Text>
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web")
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push({ pathname: "/country/[id]", params: { id: "italy" } });
        }}
        style={({ pressed }) => [
          styles.ctaButton,
          pressed && { transform: [{ scale: 0.95 }] },
        ]}
      >
        <Text style={styles.ctaButtonText}>Start Your First Journey</Text>
      </Pressable>
      <Text style={styles.ctaNote}>
        NO SUBSCRIPTION REQUIRED FOR INDIVIDUAL JOURNALS
      </Text>
    </View>
  );
}

function FooterSection() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerTitle}>The Culinary Editorial</Text>
      <View style={styles.footerLinks}>
        <Text style={styles.footerLink}>JOURNAL</Text>
        <Text style={styles.footerLink}>ETHOS</Text>
        <Text style={styles.footerLink}>PRIVACY</Text>
        <Text style={styles.footerLink}>CONTACT</Text>
      </View>
      <Text style={styles.footerCopyright}>
        {"\u00A9"} 2024 THE CULINARY EDITORIAL. A CURATOR'S GUIDE.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  scrollView: {
    flex: 1,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 50,
    backgroundColor: "rgba(254,249,243,0.7)",
  },
  topBarIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    fontFamily: "NotoSerif_600SemiBold_Italic",
    fontSize: 20,
    color: Colors.light.onSurface,
    letterSpacing: -0.3,
  },

  heroContainer: {
    height: 680,
    width: "100%",
    justifyContent: "flex-end",
  },
  heroContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  heroTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 44,
    color: "#FFFFFF",
    lineHeight: 52,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 18,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 26,
    marginBottom: 28,
    maxWidth: 300,
  },
  heroButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    elevation: 8,
  },
  heroButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: "#FFFFFF",
  },

  conceptSection: {
    paddingVertical: 56,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  conceptLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.light.primary,
    letterSpacing: 3,
    marginBottom: 12,
  },
  conceptTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 30,
    color: Colors.light.onSurface,
    textAlign: "center",
    marginBottom: 40,
  },
  stepsContainer: {
    width: "100%",
    gap: 36,
  },
  stepItem: {
    width: "100%",
  },
  stepImageContainer: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerLow,
    marginBottom: 16,
  },
  stepImage: {
    width: "100%",
    height: "100%",
  },
  stepTitle: {
    fontFamily: "NotoSerif_600SemiBold_Italic",
    fontSize: 19,
    color: Colors.light.primary,
    marginBottom: 8,
  },
  stepDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 23,
  },

  featuredSection: {
    paddingVertical: 56,
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  featuredHeader: {
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 24,
  },
  featuredLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.light.secondary,
    letterSpacing: 3,
    marginBottom: 4,
  },
  featuredTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 30,
    color: Colors.light.onSurface,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewAllText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.primary,
  },
  cardsContainer: {
    paddingHorizontal: 24,
    gap: CARD_SPACING,
  },
  journalCard: {
    width: CARD_WIDTH,
  },
  journalImageContainer: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 12,
  },
  journalImage: {
    width: "100%",
    height: "100%",
  },
  journalOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  journalIssue: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: "#FFFFFF",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  journalTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 28,
    color: "#FFFFFF",
  },
  journalSubtitle: {
    fontFamily: "NotoSerif_400Regular_Italic",
    fontSize: 15,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 22,
  },

  testimonialSection: {
    paddingVertical: 56,
    paddingHorizontal: 24,
  },
  testimonialCard: {
    backgroundColor: Colors.light.surfaceContainerHigh,
    borderRadius: 32,
    paddingVertical: 48,
    paddingHorizontal: 28,
    alignItems: "center",
    overflow: "hidden",
  },
  testimonialQuoteMark: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 96,
    color: "rgba(154,65,0,0.1)",
    lineHeight: 80,
    marginBottom: 8,
  },
  testimonialText: {
    fontFamily: "NotoSerif_400Regular_Italic",
    fontSize: 22,
    color: Colors.light.onSurface,
    lineHeight: 34,
    textAlign: "center",
    marginBottom: 28,
  },
  testimonialDivider: {
    width: 48,
    height: 1,
    backgroundColor: "rgba(154,65,0,0.3)",
    marginBottom: 16,
  },
  testimonialAuthor: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.light.secondary,
    letterSpacing: 3,
  },

  ctaSection: {
    paddingVertical: 56,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  ctaTitle: {
    fontFamily: "NotoSerif_600SemiBold",
    fontSize: 32,
    color: Colors.light.onSurface,
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 16,
  },
  ctaSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.light.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  ctaButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 32,
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
    elevation: 6,
  },
  ctaButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: "#FFFFFF",
  },
  ctaNote: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.light.secondary,
    letterSpacing: 1,
  },

  footer: {
    paddingVertical: 48,
    paddingHorizontal: 32,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: "center",
    gap: 24,
  },
  footerTitle: {
    fontFamily: "NotoSerif_600SemiBold_Italic",
    fontSize: 22,
    color: Colors.light.onSurface,
  },
  footerLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 24,
  },
  footerLink: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.light.secondary,
    letterSpacing: 2,
  },
  footerCopyright: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.light.secondary,
    letterSpacing: 2,
  },
});
