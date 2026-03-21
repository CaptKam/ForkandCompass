import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import { COUNTRIES, ONBOARDING_IMAGES, type Country } from "@/constants/data";
import { useCountries } from "@/hooks/useCountries";
import Colors from "@/constants/colors";

// ─── Static editorial blurbs per country ─────────────────────────────────────

const EDITORIAL_BLURBS: Record<string, string> = {
  italy: "Tonight, wander the cobblestoned lanes of Tuscany. Handmade pasta, bold Chianti, and the golden light of a Roman sunset.",
  japan: "Enter the quiet precision of a Tokyo kitchen. Sushi, ramen, and the art of simplicity \u2014 every bite a meditation.",
  morocco: "Tonight, lose yourself in the warmth of Marrakech. Tagine, mint tea, and stories from the medina.",
  mexico: "Feel the pulse of Oaxaca. Smoky mole, fresh guacamole, and flavors that trace back to the Aztecs.",
  india: "Discover the fire and soul of Delhi\u2019s kitchens. Butter chicken, chai, and spices that awaken every sense.",
  thailand: "Drift through Bangkok\u2019s glowing streets. Pad Thai, Tom Yum, and the perfect balance of sweet, sour, and heat.",
};

const TASTING_COURSES = ["Appetizer", "Main Course", "Dessert", "Signature Dish", "Special"];

// ─── Per-country editorial data ───────────────────────────────────────────────

interface DiscoverEditorial {
  locations: Array<{ name: string; subtitle: string; image: string }>;
  quote: string;
  quoteAttrib: string;
  etiquette: Array<{ icon: string; title: string; description: string }>;
  spiceMarket: Array<{ name: string; description: string; image: string }>;
  heritageItems: Array<{ name: string; description: string; badge: string; image: string }>;
  reviews: Array<{ text: string; author: string; city: string; initials?: string }>;
  streetFood: Array<{ name: string; description: string; image: string }>;
  relatedLabel: string;
  relatedStories: Array<{ country: string; description: string; image: string }>;
}

function buildDiscoverData(country: Country): DiscoverEditorial {
  const img = ONBOARDING_IMAGES[country.id] || country.heroImage || country.image;
  const imgAlt = country.image;

  const byCountry: Record<string, Partial<DiscoverEditorial>> = {
    morocco: {
      locations: [
        { name: "Marrakech", subtitle: "The Red City", image: img },
        { name: "Chefchaouen", subtitle: "The Blue Pearl", image: imgAlt },
        { name: "The Atlas Mountains", subtitle: "High Peaks", image: img },
      ],
      quote: "\u201CIn Morocco, a guest is a gift. We do not just share a meal; we share our history, our warmth, and our home through the art of the spice.\u201D",
      quoteAttrib: "The Editorial Team",
      etiquette: [
        { icon: "hand-right-outline", title: "The Right Hand", description: "It is custom to eat from communal dishes using only the thumb and first two fingers of your right hand." },
        { icon: "cafe-outline", title: "The Tea Ceremony", description: "Mint tea is a sign of hospitality. It is poured from a height to create a crown of foam \u2014 never refuse a first cup." },
        { icon: "restaurant-outline", title: "Bread is Life", description: "Bread is often used as a utensil. Treat it with respect; never waste even a small crumb of \u2018Khobz\u2019." },
      ],
      spiceMarket: [
        { name: "Saffron", description: "Hand-picked from the Taliouine region.", image: imgAlt },
        { name: "Cumin", description: "Earthiness central to every tagine.", image: img },
        { name: "Ras el Hanout", description: "\u201CHead of the shop\u201D \u2014 a complex blend.", image: imgAlt },
        { name: "Sweet Paprika", description: "Sun-dried for vibrant color and depth.", image: img },
      ],
      heritageItems: [
        { name: "Ras el Hanout", description: "A complex symphony of up to 30 spices. Floral, earthy, and warm with hints of cardamom and cinnamon.", badge: "Signature Blend", image: imgAlt },
        { name: "Pure Saffron", description: "The world\u2019s most precious spice. Imparts a delicate, honey-like aroma and a brilliant golden hue to couscous.", badge: "Taliouine Gold", image: img },
      ],
      reviews: [
        { text: "\u201CThe Lamb Tagine was a revelation. The balance of salty olives and sweet prunes captured the exact scent of the medina air. A masterpiece of a guide.\u201D", author: "Elena V.", city: "San Francisco" },
        { text: "\u201CIt\u2019s more than a recipe; it\u2019s storytelling. Making the mint tea felt like a meditation. Highly recommend for a slow Sunday.\u201D", author: "Marcus K.", city: "London", initials: "MK" },
      ],
      streetFood: [
        { name: "Sfenj", description: "Honey-soaked airy donuts", image: img },
        { name: "Maakouda", description: "Spiced potato fritters", image: imgAlt },
        { name: "Brochettes", description: "Grilled lamb & beef skewers", image: img },
      ],
      relatedLabel: "Related Mediterranean Stories",
      relatedStories: [
        { country: "Tunisia", description: "The Fire of Harissa", image: ONBOARDING_IMAGES.italy || imgAlt },
        { country: "Greece", description: "Sun-Drenched Herbs", image: ONBOARDING_IMAGES.japan || imgAlt },
        { country: "Spain", description: "The Moorish Legacy", image: ONBOARDING_IMAGES.mexico || imgAlt },
      ],
    },
    italy: {
      locations: [
        { name: "Tuscany", subtitle: "The Eternal Countryside", image: img },
        { name: "Rome", subtitle: "The Eternal City", image: imgAlt },
        { name: "Amalfi Coast", subtitle: "Sun-Kissed Shores", image: img },
      ],
      quote: "\u201CIn Italy, food is love made visible. A meal is never just nourishment; it is a conversation, a memory, a gift.\u201D",
      quoteAttrib: "The Editorial Team",
      etiquette: [
        { icon: "time-outline", title: "No Rush", description: "Italian dining is slow by design. Savour every course; the table is a place to linger, not to hurry." },
        { icon: "wine-outline", title: "Wine Pairing", description: "Each region has its signature wine. Always pair local: Chianti with Tuscan meats, Barolo in Piedmont." },
        { icon: "restaurant-outline", title: "Bread Protocol", description: "Never butter your bread. Use it to scoop sauces \u2014 this act, called \u2018la scarpetta\u2019, is the highest compliment to the cook." },
      ],
      spiceMarket: [
        { name: "Saffron", description: "DOP-certified from Abruzzo.", image: imgAlt },
        { name: "Porcini", description: "King of Italian wild mushrooms.", image: img },
        { name: "Oregano", description: "Sun-dried for full aromatic depth.", image: imgAlt },
        { name: "Chilli Flakes", description: "Calabrian heat, wild and vivid.", image: img },
      ],
      heritageItems: [
        { name: "Pecorino Romano", description: "A sharp, salty sheep\u2019s milk cheese aged at least 5 months. Essential in cacio e pepe and carbonara.", badge: "DOP Certified", image: imgAlt },
        { name: "Parmigiano-Reggiano", description: "Aged 24\u201336 months to develop its crystalline texture. The \u2018King of Cheeses\u2019 with a rich umami finish.", badge: "The King", image: img },
      ],
      reviews: [
        { text: "\u201CThe handmade tagliatelle recipe transported me straight to Bologna. Every instruction was precise and the result was extraordinary.\u201D", author: "Sophie L.", city: "Paris" },
        { text: "\u201CFinally, a guide that explains the \u2018why\u2019 behind Italian cooking, not just the how. I made the best bruschetta of my life.\u201D", author: "David M.", city: "Chicago", initials: "DM" },
      ],
      streetFood: [
        { name: "Supplì", description: "Roman fried risotto balls", image: img },
        { name: "Arancini", description: "Sicilian saffron rice croquettes", image: imgAlt },
        { name: "Porchetta", description: "Slow-roasted herb-crusted pork", image: img },
      ],
      relatedLabel: "Related European Stories",
      relatedStories: [
        { country: "France", description: "The Art of the Brasserie", image: ONBOARDING_IMAGES.japan || imgAlt },
        { country: "Spain", description: "Tapas & Tradition", image: ONBOARDING_IMAGES.mexico || imgAlt },
        { country: "Greece", description: "Sun-Drenched Herbs", image: ONBOARDING_IMAGES.morocco || imgAlt },
      ],
    },
  };

  const override = byCountry[country.id] || {};

  return {
    locations: override.locations || [
      { name: country.region, subtitle: country.tagline, image: img },
      { name: `${country.name} Highlands`, subtitle: "Hidden Gems", image: imgAlt },
      { name: `${country.name} Coast`, subtitle: "By the Sea", image: img },
    ],
    quote: override.quote || `\u201C${country.description}\u201D`,
    quoteAttrib: override.quoteAttrib || "The Editorial Team",
    etiquette: override.etiquette || [
      { icon: "people-outline", title: "Communal Dining", description: `In ${country.name}, sharing food is a cornerstone of culture and hospitality.` },
      { icon: "cafe-outline", title: "Signature Drink", description: `Every meal tells a story through the local beverages of ${country.name}.` },
      { icon: "restaurant-outline", title: "The Sacred Table", description: `Mealtimes in ${country.name} are unhurried moments of connection and gratitude.` },
    ],
    spiceMarket: override.spiceMarket || country.recipes.slice(0, 4).map((r, i) => ({
      name: r.ingredients[0]?.name || r.name,
      description: r.category,
      image: i % 2 === 0 ? img : imgAlt,
    })),
    heritageItems: override.heritageItems || country.recipes.slice(0, 2).map((r, i) => ({
      name: r.name,
      description: r.description,
      badge: r.category,
      image: i % 2 === 0 ? imgAlt : img,
    })),
    reviews: override.reviews || [
      { text: `\u201CAn extraordinary journey through the flavors of ${country.name}. Every recipe told a story I will not forget.\u201D`, author: "A. Chen", city: "New York" },
      { text: `\u201CThe cultural context makes every dish come alive. I felt truly transported to ${country.name}.\u201D`, author: "J. Martin", city: "Paris", initials: "JM" },
    ],
    streetFood: override.streetFood || country.recipes.slice(0, 3).map((r, i) => ({
      name: r.name,
      description: r.category,
      image: i % 2 === 0 ? img : imgAlt,
    })),
    relatedLabel: override.relatedLabel || "Related World Stories",
    relatedStories: override.relatedStories || COUNTRIES.filter((c) => c.id !== country.id).slice(0, 3).map((c) => ({
      country: c.name,
      description: c.tagline,
      image: ONBOARDING_IMAGES[c.id] || c.image,
    })),
  };
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { isCountrySaved, toggleSavedCountry } = useApp();
  const [activeIndex, setActiveIndex] = useState(2); // default to Morocco (index 2)
  const { countries } = useCountries();

  const activeCountry = countries[activeIndex] ?? countries[0];
  const editorial = buildDiscoverData(activeCountry);
  const heroImage = ONBOARDING_IMAGES[activeCountry.id] || activeCountry.heroImage || activeCountry.image;
  const blurb = EDITORIAL_BLURBS[activeCountry.id] || activeCountry.description;
  const saved = isCountrySaved(activeCountry.id);
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const haptic = (style: "light" | "medium" = "light") => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style === "medium" ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : insets.bottom + 100 }}
      >

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <Image source={{ uri: heroImage }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
          <LinearGradient
            colors={["rgba(0,0,0,0.78)", "rgba(0,0,0,0.38)", "transparent"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.4)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[StyleSheet.absoluteFill, { height: 120 }]}
          />

          {/* Header */}
          <View style={[styles.heroHeader, { paddingTop: topPadding + 8 }]}>
            <Pressable onPress={() => haptic()} hitSlop={12}>
              <Ionicons name="menu" size={26} color="#FFFFFF" />
            </Pressable>
            <View style={styles.heroAvatar}>
              <Ionicons name="person" size={15} color="rgba(255,255,255,0.8)" />
            </View>
          </View>

          {/* Bookmark */}
          <Pressable
            onPress={() => { haptic(); toggleSavedCountry(activeCountry.id); }}
            style={({ pressed }) => [styles.bookmarkButton, { top: topPadding + 56 }, pressed && { transform: [{ scale: 0.88 }] }]}
          >
            <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={20} color="#FFFFFF" />
          </Pressable>

          {/* Left-aligned hero content */}
          <View style={styles.heroContent}>
            <Text style={styles.heroFlag}>{activeCountry.flag}</Text>
            <Text style={styles.heroTitle}>{activeCountry.name}</Text>
            <Text style={styles.heroBlurb}>{blurb}</Text>
            <Pressable
              onPress={() => { haptic("medium"); router.push({ pathname: "/country/[id]", params: { id: activeCountry.id } }); }}
              style={({ pressed }) => [styles.letsGoButton, pressed && { transform: [{ scale: 0.95 }] }]}
            >
              <Text style={styles.letsGoText}>Let's Go</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Explore Destinations ──────────────────────────────────── */}
        <View style={styles.destSection}>
          <View style={styles.destHeader}>
            <Text style={styles.destTitle}>Explore Destinations</Text>
            <View style={styles.destDots}>
              {countries.slice(0, 3).map((_, i) => (
                <View key={i} style={[styles.destDot, i === (activeIndex % 3) && styles.destDotActive]} />
              ))}
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.destScroll}
          >
            {countries.map((country, idx) => {
              const isActive = idx === activeIndex;
              return (
                <Pressable
                  key={country.id}
                  onPress={() => { haptic(); setActiveIndex(idx); }}
                  style={styles.destItem}
                >
                  <View style={[styles.destCircle, isActive && styles.destCircleActive]}>
                    <Image
                      source={{ uri: ONBOARDING_IMAGES[country.id] || country.image }}
                      style={styles.destCircleImg}
                      contentFit="cover"
                    />
                    <View style={styles.destFlagBadge}>
                      <Text style={styles.destFlagEmoji}>{country.flag}</Text>
                    </View>
                  </View>
                  <Text style={[styles.destLabel, isActive && styles.destLabelActive]} numberOfLines={1}>
                    {country.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Featured Locations ────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: 24 }]}>Featured Locations</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.locScroll}>
            {editorial.locations.map((loc, idx) => (
              <View key={idx} style={styles.locCard}>
                <Image source={{ uri: loc.image }} style={StyleSheet.absoluteFill} contentFit="cover" />
                <LinearGradient colors={["transparent", "rgba(0,0,0,0.72)"]} style={StyleSheet.absoluteFill} />
                <View style={styles.locInfo}>
                  <Text style={styles.locName}>{loc.name}</Text>
                  <Text style={styles.locSub}>{loc.subtitle}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── Tonight's Tasting Menu ────────────────────────────────── */}
        <View style={[styles.section, styles.tastingBg]}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: 24 }]}>Tonight's Tasting Menu</Text>
          <View style={styles.tastingList}>
            {activeCountry.recipes.slice(0, 3).map((recipe, idx) => (
              <Pressable
                key={recipe.id}
                onPress={() => { haptic(); router.push({ pathname: "/recipe/[id]", params: { id: recipe.id } }); }}
                style={({ pressed }) => [styles.tastingCard, pressed && { opacity: 0.85 }]}
              >
                <Image source={{ uri: recipe.image }} style={styles.tastingThumb} contentFit="cover" />
                <View style={styles.tastingInfo}>
                  <Text style={styles.tastingCourse}>{TASTING_COURSES[idx] || recipe.category}</Text>
                  <Text style={styles.tastingName} numberOfLines={2}>{recipe.name}</Text>
                  <Text style={styles.tastingDesc} numberOfLines={1}>{recipe.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.light.outline} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Editorial Highlight ───────────────────────────────────── */}
        <View style={[styles.section, { paddingHorizontal: 24 }]}>
          <View style={styles.quoteCard}>
            <Ionicons name="chatbubble-ellipses-outline" size={28} color={Colors.light.primary} style={{ marginBottom: 12 }} />
            <Text style={styles.quoteText}>{editorial.quote}</Text>
            <View style={styles.quoteDivider} />
            <Text style={styles.quoteAttrib}>{editorial.quoteAttrib}</Text>
          </View>
        </View>

        {/* ── The Spice Market Grid ─────────────────────────────────── */}
        <View style={[styles.section, { paddingHorizontal: 24 }]}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>The Spice Market</Text>
            <Pressable onPress={() => { haptic(); router.push({ pathname: "/country/[id]", params: { id: activeCountry.id } }); }}>
              <Text style={styles.viewAll}>View All</Text>
            </Pressable>
          </View>
          <View style={styles.spiceGrid}>
            {editorial.spiceMarket.map((spice, idx) => (
              <View key={idx} style={styles.spiceItem}>
                <Image source={{ uri: spice.image }} style={styles.spiceImg} contentFit="cover" />
                <Text style={styles.spiceName}>{spice.name}</Text>
                <Text style={styles.spiceDesc} numberOfLines={2}>{spice.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Cultural Etiquette ────────────────────────────────────── */}
        <View style={[styles.section, styles.etiquetteBg, { paddingHorizontal: 24 }]}>
          <Text style={styles.sectionTitle}>Cultural Etiquette</Text>
          <View style={styles.etiquetteList}>
            {editorial.etiquette.map((item, idx) => (
              <View key={idx} style={styles.etiquetteRow}>
                <View style={styles.etiquetteIcon}>
                  <Ionicons name={item.icon as any} size={20} color={Colors.light.onSecondaryContainer} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.etiquetteTitle}>{item.title}</Text>
                  <Text style={styles.etiquetteDesc}>{item.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Heritage Spices ───────────────────────────────────────── */}
        <View style={[styles.section, styles.heritageBg]}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: 24 }]}>Heritage Spices</Text>
          <Text style={[styles.heritageSubtitle, { paddingHorizontal: 24 }]}>
            The soul of the {activeCountry.region} kitchen
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.heritageScroll}>
            {editorial.heritageItems.map((item, idx) => (
              <View key={idx} style={styles.heritageCard}>
                <Image source={{ uri: item.image }} style={styles.heritageImg} contentFit="cover" />
                <View style={styles.heritageBody}>
                  <Text style={styles.heritageName}>{item.name}</Text>
                  <Text style={styles.heritageDesc} numberOfLines={4}>{item.description}</Text>
                  <View style={styles.heritageBadgeRow}>
                    <View style={styles.heritageDot} />
                    <Text style={styles.heritageBadge}>{item.badge}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── The Cook's Ledger ─────────────────────────────────────── */}
        <View style={[styles.section, { paddingHorizontal: 24 }]}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>The Cook's Ledger</Text>
            <View style={styles.starsRow}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Ionicons key={i} name="star" size={12} color={Colors.light.primary} />
              ))}
            </View>
          </View>
          <View style={styles.reviewList}>
            {editorial.reviews.map((review, idx) => (
              <View key={idx} style={styles.reviewItem}>
                <Text style={styles.reviewText}>{review.text}</Text>
                <View style={styles.reviewAuthorRow}>
                  <View style={styles.reviewAvatar}>
                    {review.initials ? (
                      <Text style={styles.reviewInitials}>{review.initials}</Text>
                    ) : (
                      <Ionicons name="person" size={11} color={Colors.light.onSurfaceVariant} />
                    )}
                  </View>
                  <Text style={styles.reviewAuthor}>{review.author} \u2014 {review.city}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Must-Try Street Food ──────────────────────────────────── */}
        <View style={[styles.section, styles.streetBg]}>
          <View style={{ paddingHorizontal: 24 }}>
            <Text style={styles.sectionTitle}>Must-Try Street Food</Text>
            <Text style={styles.streetSub}>The vibrant flavors of the {activeCountry.region}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.streetScroll}>
            {editorial.streetFood.map((food, idx) => (
              <View key={idx} style={styles.streetCard}>
                <Image source={{ uri: food.image }} style={StyleSheet.absoluteFill} contentFit="cover" />
                <LinearGradient colors={["transparent", "rgba(0,0,0,0.65)"]} style={StyleSheet.absoluteFill} />
                <View style={styles.streetInfo}>
                  <Text style={styles.streetName}>{food.name}</Text>
                  <Text style={styles.streetDesc}>{food.description}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── Related Stories ───────────────────────────────────────── */}
        <View style={[styles.section, styles.relatedBg]}>
          <Text style={[styles.relatedLabel, { paddingHorizontal: 24 }]}>{editorial.relatedLabel}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedScroll}>
            {editorial.relatedStories.map((story, idx) => (
              <View key={idx} style={styles.relatedCard}>
                <Image source={{ uri: story.image }} style={styles.relatedImg} contentFit="cover" />
                <Text style={styles.relatedCountry}>{story.country}</Text>
                <Text style={styles.relatedDesc}>{story.description}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },

  // Hero
  hero: {
    height: 560,
    backgroundColor: "#000",
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 8,
    zIndex: 10,
  },
  heroAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bookmarkButton: {
    position: "absolute",
    right: 24,
    zIndex: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroContent: {
    position: "absolute",
    bottom: 48,
    left: 32,
    right: "30%",
  },
  heroFlag: {
    fontSize: 28,
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 38,
    color: "#FFFFFF",
    letterSpacing: -0.5,
    lineHeight: 44,
    marginBottom: 12,
  },
  heroBlurb: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 22,
    marginBottom: 28,
  },
  letsGoButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    alignSelf: "flex-start",
  },
  letsGoText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#1D1B18",
  },

  // Destinations nav
  destSection: {
    paddingTop: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(222,193,179,0.3)",
  },
  destHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  destTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "rgba(87,66,56,0.6)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  destDots: {
    flexDirection: "row",
    gap: 4,
  },
  destDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(87,66,56,0.2)",
  },
  destDotActive: {
    backgroundColor: Colors.light.primary,
  },
  destScroll: {
    gap: 24,
    paddingHorizontal: 24,
  },
  destItem: {
    alignItems: "center",
    gap: 6,
  },
  destCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "visible",
  },
  destCircleActive: {
    borderColor: Colors.light.primary,
  },
  destCircleImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  destFlagBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 1,
    zIndex: 5,
  },
  destFlagEmoji: {
    fontSize: 12,
  },
  destLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: Colors.light.onSurface,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    maxWidth: 64,
    textAlign: "center",
  },
  destLabelActive: {
    color: Colors.light.primary,
  },

  // Shared section wrapper
  section: {
    paddingTop: 32,
    paddingBottom: 8,
  },

  // Section title
  sectionTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 20,
    color: Colors.light.onSurface,
    marginBottom: 16,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },

  viewAll: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.light.primary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  // Featured locations
  locScroll: {
    gap: 16,
    paddingHorizontal: 24,
  },
  locCard: {
    width: 192,
    height: 256,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  locInfo: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 8,
  },
  locName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 17,
    color: "#FFFFFF",
    marginBottom: 2,
  },
  locSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
  },

  // Tasting menu
  tastingBg: {
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  tastingList: {
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  tastingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(222,193,179,0.2)",
  },
  tastingThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  tastingInfo: {
    flex: 1,
    gap: 2,
  },
  tastingCourse: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: Colors.light.primary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  tastingName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 15,
    color: Colors.light.onSurface,
    lineHeight: 20,
  },
  tastingDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.light.onSurfaceVariant,
    fontStyle: "italic",
    marginTop: 2,
  },

  // Editorial quote
  quoteCard: {
    backgroundColor: "#FCF3E8",
    borderWidth: 1,
    borderColor: "rgba(154,65,0,0.1)",
    padding: 28,
    borderRadius: 20,
    alignItems: "center",
  },
  quoteText: {
    fontFamily: "NotoSerif_600SemiBold",
    fontStyle: "italic",
    fontSize: 17,
    lineHeight: 28,
    color: Colors.light.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 20,
  },
  quoteDivider: {
    width: 32,
    height: 1,
    backgroundColor: "rgba(154,65,0,0.3)",
    marginBottom: 12,
  },
  quoteAttrib: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: "rgba(87,66,56,0.7)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  // Spice market
  spiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  spiceItem: {
    width: "47%",
    gap: 6,
  },
  spiceImg: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  spiceName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.light.onSurface,
  },
  spiceDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 14,
  },

  // Cultural etiquette
  etiquetteBg: {
    borderTopWidth: 1,
    borderTopColor: "rgba(222,193,179,0.2)",
  },
  etiquetteList: {
    gap: 32,
  },
  etiquetteRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
  },
  etiquetteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.secondaryContainer,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  etiquetteTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.light.onSurface,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  etiquetteDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 20,
  },

  // Heritage spices
  heritageBg: {
    backgroundColor: Colors.light.surfaceContainer,
    paddingBottom: 32,
  },
  heritageSubtitle: {
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    fontSize: 11,
    color: "rgba(87,66,56,0.8)",
    marginTop: -8,
    marginBottom: 16,
  },
  heritageScroll: {
    gap: 24,
    paddingHorizontal: 24,
  },
  heritageCard: {
    width: 240,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
  },
  heritageImg: {
    width: "100%",
    height: 176,
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  heritageBody: {
    padding: 20,
  },
  heritageName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 18,
    color: Colors.light.onSurface,
    marginBottom: 8,
  },
  heritageDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 16,
    marginBottom: 12,
  },
  heritageBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heritageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  heritageBadge: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: Colors.light.primary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  // Cook's ledger
  starsRow: {
    flexDirection: "row",
    gap: 2,
    alignItems: "center",
  },
  reviewList: {
    gap: 40,
    marginTop: 8,
  },
  reviewItem: {
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(154,65,0,0.2)",
  },
  reviewText: {
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    fontSize: 13,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reviewAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewInitials: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 8,
    color: Colors.light.secondary,
  },
  reviewAuthor: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: Colors.light.onSurface,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  // Street food
  streetBg: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 32,
  },
  streetSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.light.onSurfaceVariant,
    marginTop: 2,
    marginBottom: 16,
  },
  streetScroll: {
    gap: 16,
    paddingHorizontal: 24,
  },
  streetCard: {
    width: 272,
    height: 176,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  streetInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  streetName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 20,
    color: "#FFFFFF",
    marginBottom: 2,
  },
  streetDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
  },

  // Related stories
  relatedBg: {
    backgroundColor: "rgba(222,193,179,0.12)",
    paddingBottom: 24,
  },
  relatedLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: "rgba(87,66,56,0.6)",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  relatedScroll: {
    gap: 16,
    paddingHorizontal: 24,
  },
  relatedCard: {
    width: 152,
    gap: 8,
  },
  relatedImg: {
    width: "100%",
    height: 96,
    borderRadius: 8,
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  relatedCountry: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.light.onSurface,
  },
  relatedDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 14,
  },
});
