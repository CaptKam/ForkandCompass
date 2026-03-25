import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import RecipeContextMenu from "@/components/RecipeContextMenu";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import type { CookSession } from "@/contexts/AppContext";
import { COUNTRIES, ONBOARDING_IMAGES, LANDMARK_IMAGES, getCountryLocations, getRecipeById, type Country, type Recipe } from "@/constants/data";
import { useCountries } from "@/hooks/useCountries";
import { useReducedMotion } from "@/hooks/useReducedMotion";
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

function pickTastingMenu(recipes: Recipe[]): Recipe[] {
  // Try to pick one starter, one main, and one dessert/drink for a balanced menu
  const starter = recipes.find((r) => ["Appetizer", "Side Dish", "Salad", "Soup"].includes(r.category));
  const main = recipes.find((r) => ["Main Course", "Lunch"].includes(r.category) && r !== starter);
  const finish = recipes.find((r) => ["Dessert", "Beverage", "Baked Good"].includes(r.category) && r !== starter && r !== main);
  const picked = [starter, main, finish].filter(Boolean) as Recipe[];
  // Fill remaining slots from unused recipes
  if (picked.length < 3) {
    for (const r of recipes) {
      if (picked.length >= 3) break;
      if (!picked.includes(r)) picked.push(r);
    }
  }
  return picked.slice(0, 3);
}

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
    locations: getCountryLocations(country),
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

// ─── Craving chips helper ─────────────────────────────────────────────────────

interface CravingChip {
  label: string;
  countryId: string;
  isNew: boolean;
}

function getCravingsChips(
  cuisinesExplored: string[],
  countries: Country[],
  recentSessions: CookSession[]
): CravingChip[] {
  const chips: CravingChip[] = [];
  const added = new Set<string>();

  // 1. Discovery: countries the user hasn't explored → labelled "New"
  const unexplored = countries.filter((c) => !cuisinesExplored.includes(c.id));
  for (const c of unexplored.slice(0, 2)) {
    chips.push({ label: `${c.flag} ${c.name}`, countryId: c.id, isNew: true });
    added.add(c.id);
  }

  // 2. Comfort: most-cooked cuisine from recent sessions
  if (recentSessions.length > 0) {
    const counts: Record<string, number> = {};
    for (const s of recentSessions) {
      counts[s.cuisine] = (counts[s.cuisine] || 0) + 1;
    }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const fav = countries.find((c) => c.name === top || c.id === top?.toLowerCase());
    if (fav && !added.has(fav.id)) {
      chips.push({ label: `${fav.flag} ${fav.name}`, countryId: fav.id, isNew: false });
      added.add(fav.id);
    }
  }

  // 3. Fill from explored countries (variety)
  for (const c of countries) {
    if (chips.length >= 6) break;
    if (!added.has(c.id)) {
      chips.push({ label: `${c.flag} ${c.name}`, countryId: c.id, isNew: false });
      added.add(c.id);
    }
  }

  return chips.slice(0, 6);
}

// ─── Editorial picks (static monthly data) ────────────────────────────────────

const EDITORIAL_PICK = {
  theme: "Spring Renewal",
  headline: "Light, vibrant dishes to welcome the new season",
  body: "As the days grow longer, we turn to fresh herbs, bright citrus, and the kind of cooking that celebrates what\u2019s just emerging. Our editors have chosen five recipes that honour both the season and the tradition.",
  cta: "Read the Collection",
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const {
    isCountrySaved,
    toggleSavedCountry,
    savedRecipeIds,
    cookingProfile,
    recentCookSessions,
    currentItinerary,
  } = useApp();
  const { countries } = useCountries();
  const reducedMotion = useReducedMotion();
  const heroScrollRef = useRef<ScrollView>(null);
  const destScrollRef = useRef<ScrollView>(null);
  const isProgrammaticScroll = useRef(false);
  const [activeIndex, setActiveIndex] = useState(2); // default to Morocco (index 2)
  const { width: screenWidth } = useWindowDimensions();

  const DEST_ITEM_WIDTH = 94; // ring width
  const DEST_GAP = 24;
  const DEST_PADDING = 24;

  useEffect(() => {
    if (screenWidth > 0) {
      heroScrollRef.current?.scrollTo({ x: activeIndex * screenWidth, animated: false });
    }
  }, [screenWidth]);

  useEffect(() => {
    // Center the active thumbnail in the strip
    const itemCenter = DEST_PADDING + activeIndex * (DEST_ITEM_WIDTH + DEST_GAP) + DEST_ITEM_WIDTH / 2;
    const scrollX = Math.max(0, itemCenter - screenWidth / 2);
    destScrollRef.current?.scrollTo({ x: scrollX, animated: true });
  }, [activeIndex, screenWidth]);

  const activeCountry = countries[activeIndex] ?? countries[0];
  const editorial = buildDiscoverData(activeCountry);
  const saved = isCountrySaved(activeCountry.id);
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  // ── Derived data for personalized sections ──────────────────────────────
  const todayISO = new Date().toISOString().slice(0, 10);
  const todayPlan = currentItinerary.find((d) => d.date === todayISO) ?? null;
  const todayRecipeId = todayPlan ? (todayPlan.mode === "quick" ? todayPlan.quickRecipeIds[0] : todayPlan.fullRecipeIds[0]) : null;
  const todayRecipe = todayRecipeId ? getRecipeById(todayRecipeId) ?? null : null;
  const todayCountry = todayPlan ? countries.find((c) => c.id === todayPlan.countryId) ?? null : null;

  const savedRecipes = savedRecipeIds
    .map((id) => getRecipeById(id))
    .filter(Boolean) as Recipe[];

  const recentlyCooked = recentCookSessions
    .map((s) => ({ session: s, recipe: getRecipeById(s.recipeId) }))
    .filter((x): x is { session: CookSession; recipe: Recipe } => x.recipe !== undefined)
    .slice(0, 6);

  const cravingChips = getCravingsChips(cookingProfile.cuisinesExplored, countries, recentCookSessions);

  const haptic = (style: "light" | "medium" = "light") => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style === "medium" ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const scrollHeroTo = (idx: number) => {
    isProgrammaticScroll.current = true;
    heroScrollRef.current?.scrollTo({ x: idx * screenWidth, animated: true });
    // Clear the flag after the animation has fully settled
    setTimeout(() => { isProgrammaticScroll.current = false; }, 600);
  };

  const onHeroScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Ignore events fired by our own programmatic scrollTo calls
    if (isProgrammaticScroll.current) return;
    const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    if (idx !== activeIndex && idx >= 0 && idx < countries.length) {
      if (Platform.OS !== "web") Haptics.selectionAsync();
      setActiveIndex(idx);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : insets.bottom + 100 }}
      >

        {/* ── Hero carousel ─────────────────────────────────────── */}
        <View style={styles.heroWrap}>
          {/* Paginated horizontal scroll */}
          <ScrollView
            ref={heroScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onHeroScroll}
            onScrollEndDrag={onHeroScroll}
            scrollEventThrottle={16}
            contentOffset={{ x: activeIndex * screenWidth, y: 0 }}
            style={styles.heroScroll}
          >
            {countries.map((country, idx) => {
              const img = ONBOARDING_IMAGES[country.id] || country.heroImage || country.image;
              const blurb = EDITORIAL_BLURBS[country.id] || country.description;
              const isSaved = isCountrySaved(country.id);
              return (
                <View key={country.id} style={[styles.heroSlide, { width: screenWidth }]}>
                  <Image source={{ uri: img }} style={StyleSheet.absoluteFill} contentFit="cover" transition={reducedMotion ? 0 : 400} placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }} onError={(e) => console.warn("[Image] Failed to load:", e.error)} />
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
                  <View style={styles.heroContent}>
                    <Text style={styles.heroFlag}>{country.flag}</Text>
                    <Text style={styles.heroTitle}>{country.name}</Text>
                    <Text style={styles.heroBlurb}>{blurb}</Text>
                    <View style={styles.heroActions}>
                      <Pressable
                        onPress={() => { haptic("medium"); router.push({ pathname: "/country/[id]", params: { id: country.id } }); }}
                        style={({ pressed }) => [styles.letsGoButton, pressed && !reducedMotion && { transform: [{ scale: 0.95 }] }]}
                      >
                        <Text style={styles.letsGoText}>Let's Go</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => { haptic(); toggleSavedCountry(country.id); }}
                        style={({ pressed }) => [styles.bookmarkButton, pressed && !reducedMotion && { transform: [{ scale: 0.88 }] }]}
                      >
                        <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={20} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Pagination dots */}
          <View style={styles.heroDots}>
            {countries.map((_, idx) => (
              <Pressable
                key={idx}
                onPress={() => { haptic(); setActiveIndex(idx); scrollHeroTo(idx); }}
                style={({ pressed }) => [{ minWidth: 20, minHeight: 44, alignItems: "center", justifyContent: "center" }, pressed && { opacity: 0.6 }]}
              >
                <View style={[styles.heroDot, idx === activeIndex && styles.heroDotActive]} />
              </Pressable>
            ))}
          </View>

        </View>

        {/* ── Explore Destinations ──────────────────────────────────── */}
        <View style={styles.destSection}>
          <View style={styles.destHeader}>
            <Text style={styles.destTitle}>Explore Destinations</Text>
          </View>
          <ScrollView
            ref={destScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.destScroll}
          >
            {countries.map((country, idx) => {
              const isActive = idx === activeIndex;
              return (
                <Pressable
                  key={country.id}
                  onPress={() => { haptic(); setActiveIndex(idx); scrollHeroTo(idx); }}
                  style={styles.destItem}
                >
                  {/* Outer ring — handles the active border without clipping */}
                  <View style={[styles.destRing, isActive && styles.destRingActive]}>
                    {/* Inner circle — clips the image to a circle */}
                    <View style={styles.destCircle}>
                      <Image
                        source={{ uri: LANDMARK_IMAGES[country.id] || country.image }}
                        style={styles.destCircleImg}
                        contentFit="cover"
                        placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
                        onError={(e) => console.warn("[Image] Failed to load:", e.error)}
                      />
                    </View>
                    {/* Flag badge lives outside the clipping view so it's never hidden */}
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

        {/* ── Tonight's Plan ────────────────────────────────────────── */}
        <View style={[styles.section, styles.tonightBg, { paddingHorizontal: 24 }]}>
          <Text style={styles.sectionTitle}>Tonight's Plan</Text>
          {todayRecipe && todayCountry ? (
            <RecipeContextMenu recipe={todayRecipe}>
              <Pressable
                onPress={() => { haptic(); router.push({ pathname: "/recipe/[id]", params: { id: todayRecipe.id } }); }}
                style={({ pressed }) => [styles.tonightCard, pressed && { opacity: 0.88 }]}
              >
                <Image source={{ uri: todayRecipe.image }} style={styles.tonightImg} contentFit="cover" placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }} onError={(e) => console.warn("[Image] Failed to load:", e.error)} />
                <View style={styles.tonightBody}>
                  <View style={styles.tonightMeta}>
                    <Text style={styles.tonightFlag}>{todayCountry.flag}</Text>
                    <Text style={styles.tonightCuisine}>{todayCountry.name}</Text>
                    {todayPlan?.mode === "quick" && (
                      <View style={styles.tonightQuickBadge}>
                        <Ionicons name="flash" size={12} color={Colors.light.primary} />
                        <Text style={styles.tonightQuickText}>Quick</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.tonightName} numberOfLines={2}>{todayRecipe.name}</Text>
                  <Text style={styles.tonightDesc} numberOfLines={1}>{todayRecipe.description}</Text>
                  <Pressable
                    onPress={() => { haptic("medium"); router.push({ pathname: "/cook-mode", params: { recipeId: todayRecipe.id } }); }}
                    style={({ pressed }) => [styles.tonightCookBtn, pressed && { opacity: 0.85 }]}
                  >
                    <Ionicons name="restaurant-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.tonightCookText}>Start Cooking</Text>
                  </Pressable>
                </View>
              </Pressable>
            </RecipeContextMenu>
          ) : (
            <View style={styles.tonightEmpty}>
              <Ionicons name="calendar-outline" size={32} color={Colors.light.primary} style={{ marginBottom: 12 }} />
              <Text style={styles.tonightEmptyTitle}>No plan for tonight yet</Text>
              <Text style={styles.tonightEmptyDesc}>Build a personalised week of cooking in just a minute.</Text>
              <View style={styles.tonightEmptyActions}>
                <Pressable
                  onPress={() => { haptic(); router.push("/(tabs)/plan" as any); }}
                  style={({ pressed }) => [styles.tonightPlanBtn, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.tonightPlanBtnText}>Plan My Week</Text>
                </Pressable>
                <Pressable
                  onPress={() => { haptic(); const r = activeCountry.recipes[Math.floor(Math.random() * activeCountry.recipes.length)]; if (r) router.push({ pathname: "/recipe/[id]", params: { id: r.id } }); }}
                  style={({ pressed }) => [styles.tonightSurpriseBtn, pressed && { opacity: 0.85 }]}
                >
                  <Ionicons name="shuffle-outline" size={16} color={Colors.light.primary} />
                  <Text style={styles.tonightSurpriseBtnText}>Surprise Me</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* ── Recently Cooked ───────────────────────────────────────── */}
        {recentlyCooked.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.rowBetween, { paddingHorizontal: 24 }]}>
              <Text style={styles.sectionTitle}>Recently Cooked</Text>
              <Pressable onPress={() => { haptic(); router.push("/(tabs)/profile" as any); }}>
                <Text style={styles.viewAll}>See All</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentScroll}>
              {recentlyCooked.map(({ session, recipe }) => (
                <RecipeContextMenu key={session.id} recipe={recipe}>
                  <Pressable
                    onPress={() => { haptic(); router.push({ pathname: "/recipe/[id]", params: { id: recipe.id } }); }}
                    style={({ pressed }) => [styles.recentCard, pressed && { opacity: 0.85 }]}
                  >
                    <Image source={{ uri: recipe.image }} style={StyleSheet.absoluteFill} contentFit="cover" placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }} onError={(e) => console.warn("[Image] Failed to load:", e.error)} />
                    <LinearGradient colors={["transparent", "rgba(0,0,0,0.68)"]} style={StyleSheet.absoluteFill} />
                    {session.rating != null && (
                      <View style={styles.recentRatingBadge}>
                        <Ionicons name="star" size={10} color="#F5C842" />
                        <Text style={styles.recentRatingText}>{session.rating}</Text>
                      </View>
                    )}
                    <View style={styles.recentInfo}>
                      <Text style={styles.recentName} numberOfLines={2}>{recipe.name}</Text>
                    </View>
                  </Pressable>
                </RecipeContextMenu>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Cravings / Quick Picks ────────────────────────────────── */}
        <View style={[styles.section, { paddingHorizontal: 24 }]}>
          <Text style={styles.sectionTitle}>
            {cookingProfile.cuisinesExplored.length > 0 ? "Cravings" : "Explore Cuisines"}
          </Text>
          <Text style={styles.cravingsSub}>
            {cookingProfile.cuisinesExplored.length > 0
              ? "Based on your cooking history"
              : "Pick a cuisine to start your culinary journey"}
          </Text>
          <View style={styles.cravingsRow}>
            {cravingChips.map((chip) => (
              <Pressable
                key={chip.countryId}
                onPress={() => { haptic(); router.push({ pathname: "/country/[id]", params: { id: chip.countryId } }); }}
                style={({ pressed }) => [
                  styles.cravingChip,
                  chip.isNew && styles.cravingChipNew,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={[styles.cravingChipText, chip.isNew && styles.cravingChipTextNew]}>
                  {chip.isNew ? `New: ${chip.label}` : chip.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Jump Back In (saved) ──────────────────────────────────── */}
        {savedRecipes.length > 0 && (
          <View style={[styles.section, styles.jumpBg]}>
            <View style={[styles.rowBetween, { paddingHorizontal: 24 }]}>
              <Text style={styles.sectionTitle}>Jump Back In</Text>
              <Pressable onPress={() => { haptic(); router.push("/(tabs)/saved" as any); }}>
                <Text style={styles.viewAll}>View All</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jumpScroll}>
              {savedRecipes.slice(0, 8).map((recipe) => (
                <RecipeContextMenu key={recipe.id} recipe={recipe}>
                  <Pressable
                    onPress={() => { haptic(); router.push({ pathname: "/recipe/[id]", params: { id: recipe.id } }); }}
                    style={({ pressed }) => [styles.jumpCard, pressed && { opacity: 0.88 }]}
                  >
                    <Image source={{ uri: recipe.image }} style={styles.jumpThumb} contentFit="cover" placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }} onError={(e) => console.warn("[Image] Failed to load:", e.error)} />
                    <View style={styles.jumpInfo}>
                      <Text style={styles.jumpCuisine} numberOfLines={1}>{recipe.category}</Text>
                      <Text style={styles.jumpName} numberOfLines={2}>{recipe.name}</Text>
                    </View>
                  </Pressable>
                </RecipeContextMenu>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Featured Locations ────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: 24 }]}>Featured Locations</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.locScroll}>
            {editorial.locations.map((loc, idx) => (
              <Pressable
                key={idx}
                style={({ pressed }) => [styles.locCard, pressed && { opacity: 0.88 }]}
                onPress={() => {
                  haptic();
                  router.push({
                    pathname: "/region/[countryId]/[region]",
                    params: { countryId: activeCountry.id, region: encodeURIComponent(loc.name) },
                  });
                }}
              >
                <Image source={{ uri: loc.image }} style={StyleSheet.absoluteFill} contentFit="cover" placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }} onError={(e) => console.warn("[Image] Failed to load:", e.error)} />
                <LinearGradient colors={["transparent", "rgba(0,0,0,0.72)"]} style={StyleSheet.absoluteFill} />
                <View style={styles.locInfo}>
                  <Text style={styles.locName}>{loc.name}</Text>
                  <Text style={styles.locSub}>{loc.subtitle}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── Tonight's Tasting Menu ────────────────────────────────── */}
        <View style={[styles.section, styles.tastingBg]}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: 24 }]}>Tonight's Tasting Menu</Text>
          <View style={styles.tastingList}>
            {pickTastingMenu(activeCountry.recipes).map((recipe, idx) => (
              <RecipeContextMenu key={recipe.id} recipe={recipe}>
                <Pressable
                  onPress={() => { haptic(); router.push({ pathname: "/recipe/[id]", params: { id: recipe.id } }); }}
                  style={({ pressed }) => [styles.tastingCard, pressed && { opacity: 0.85 }]}
                >
                  <Image source={{ uri: recipe.image }} style={styles.tastingThumb} contentFit="cover" placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }} onError={(e) => console.warn("[Image] Failed to load:", e.error)} />
                  <View style={styles.tastingInfo}>
                    <Text style={styles.tastingCourse}>{recipe.category}</Text>
                    <Text style={styles.tastingName} numberOfLines={2}>{recipe.name}</Text>
                    <Text style={styles.tastingDesc} numberOfLines={1}>{recipe.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.light.outline} />
                </Pressable>
              </RecipeContextMenu>
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
                <Image source={{ uri: spice.image }} style={styles.spiceImg} contentFit="cover" placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }} onError={(e) => console.warn("[Image] Failed to load:", e.error)} />
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
                <Image source={{ uri: item.image }} style={styles.heritageImg} contentFit="cover" placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }} onError={(e) => console.warn("[Image] Failed to load:", e.error)} />
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
            <View style={styles.streetHeader}>
              <Text style={styles.sectionTitle}>Must-Try Street Food</Text>
              <View style={styles.streetCountryBadge}>
                <Text style={styles.streetCountryFlag}>{activeCountry.flag}</Text>
                <Text style={styles.streetCountryName}>{activeCountry.name}</Text>
              </View>
            </View>
            <Text style={styles.streetSub}>The vibrant flavors of the {activeCountry.region}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.streetScroll}>
            {editorial.streetFood.map((food, idx) => {
              const matchedRecipe = activeCountry.recipes.find((r) =>
                r.name.toLowerCase().includes(food.name.toLowerCase().split(" ")[0]) ||
                food.name.toLowerCase().includes(r.name.toLowerCase().split(" ")[0])
              ) ?? activeCountry.recipes[idx % activeCountry.recipes.length];
              return matchedRecipe ? (
                <RecipeContextMenu key={idx} recipe={matchedRecipe}>
                  <Pressable
                    onPress={() => { haptic(); router.push({ pathname: "/recipe/[id]", params: { id: matchedRecipe.id } }); }}
                    style={({ pressed }) => [styles.streetCard, pressed && { opacity: 0.88 }]}
                  >
                    <Image source={{ uri: food.image }} style={StyleSheet.absoluteFill} contentFit="cover" placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }} onError={(e) => console.warn("[Image] Failed to load:", e.error)} />
                    <LinearGradient colors={["transparent", "rgba(0,0,0,0.65)"]} style={StyleSheet.absoluteFill} />
                    <View style={styles.streetInfo}>
                      <Text style={styles.streetName}>{food.name}</Text>
                      <Text style={styles.streetDesc}>{food.description}</Text>
                    </View>
                  </Pressable>
                </RecipeContextMenu>
              ) : (
                <View key={idx} style={styles.streetCard}>
                  <Image source={{ uri: food.image }} style={StyleSheet.absoluteFill} contentFit="cover" placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }} onError={(e) => console.warn("[Image] Failed to load:", e.error)} />
                  <LinearGradient colors={["transparent", "rgba(0,0,0,0.65)"]} style={StyleSheet.absoluteFill} />
                  <View style={styles.streetInfo}>
                    <Text style={styles.streetName}>{food.name}</Text>
                    <Text style={styles.streetDesc}>{food.description}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Editorial / Seasonal Picks ────────────────────────────── */}
        <View style={[styles.section, { paddingHorizontal: 24 }]}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Seasonal Picks</Text>
            <View style={styles.editPickBadge}>
              <Ionicons name="leaf-outline" size={12} color={Colors.light.primary} />
              <Text style={styles.editPickBadgeText}>Editorial</Text>
            </View>
          </View>
          <View style={styles.editPickCard}>
            <View style={styles.editPickTheme}>
              <Text style={styles.editPickThemeText}>{EDITORIAL_PICK.theme}</Text>
            </View>
            <Text style={styles.editPickHeadline}>{EDITORIAL_PICK.headline}</Text>
            <Text style={styles.editPickBody}>{EDITORIAL_PICK.body}</Text>
            <Pressable
              onPress={() => { haptic(); router.push({ pathname: "/country/[id]", params: { id: activeCountry.id } }); }}
              style={({ pressed }) => [styles.editPickCta, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.editPickCtaText}>{EDITORIAL_PICK.cta}</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.light.primary} />
            </Pressable>
          </View>
        </View>

        {/* ── Related Stories ───────────────────────────────────────── */}
        <View style={[styles.section, styles.relatedBg]}>
          <Text style={[styles.relatedLabel, { paddingHorizontal: 24 }]}>{editorial.relatedLabel}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedScroll}>
            {editorial.relatedStories.map((story, idx) => (
              <View key={idx} style={styles.relatedCard}>
                <Image source={{ uri: story.image }} style={styles.relatedImg} contentFit="cover" placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }} onError={(e) => console.warn("[Image] Failed to load:", e.error)} />
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

  // Hero carousel
  heroWrap: {
    height: 560,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  heroScroll: {
    flex: 1,
  },
  heroSlide: {
    height: 560,
  },
  heroDots: {
    position: "absolute",
    bottom: 20,
    left: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  heroDotActive: {
    width: 22,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  heroHeader: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 8,
    zIndex: 10,
  },
  heroAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bookmarkButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  inlineBookmark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  heroContent: {
    position: "absolute",
    bottom: 48,
    left: 32,
    right: 32,
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
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
    fontSize: 17,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 26,
    marginBottom: 28,
  },
  letsGoButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 32,
    height: 52,
    borderRadius: 26,
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
  },
  letsGoText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
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
    fontSize: 14,
    color: "rgba(87,66,56,0.6)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  destDots: {
    flexDirection: "row",
    gap: 8,
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
    gap: 8,
    position: "relative",
  },
  destRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  destRingActive: {
    borderColor: Colors.light.primary,
  },
  destCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: "hidden",
  },
  destCircleImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  destFlagBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 5,
  },
  destFlagEmoji: {
    fontSize: 13,
  },
  destLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.light.onSurface,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    maxWidth: 80,
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
    fontSize: 14,
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
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 20,
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
    gap: 8,
  },
  tastingCourse: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.light.primary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  tastingName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 17,
    color: Colors.light.onSurface,
    lineHeight: 24,
  },
  tastingDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.onSurfaceVariant,
    fontStyle: "italic",
    marginTop: 2,
    lineHeight: 20,
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
    fontSize: 14,
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
    fontSize: 14,
    color: Colors.light.onSurface,
    lineHeight: 20,
  },
  spiceDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 20,
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
    fontSize: 14,
    color: Colors.light.onSurface,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  etiquetteDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
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
    fontSize: 14,
    color: "rgba(87,66,56,0.8)",
    marginTop: -8,
    marginBottom: 16,
    lineHeight: 20,
  },
  heritageScroll: {
    gap: 24,
    paddingHorizontal: 24,
  },
  heritageCard: {
    width: 240,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
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
    fontSize: 14,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 20,
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
    fontSize: 13,
    color: Colors.light.primary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  // Cook's ledger
  starsRow: {
    flexDirection: "row",
    gap: 8,
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
    fontSize: 14,
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
    fontSize: 13,
    color: Colors.light.secondary,
  },
  reviewAuthor: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
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
    fontSize: 14,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 20,
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
    borderRadius: 16,
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
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 20,
  },

  // Related stories
  relatedBg: {
    backgroundColor: "rgba(222,193,179,0.12)",
    paddingBottom: 24,
  },
  relatedLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "rgba(87,66,56,0.6)",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 16,
    lineHeight: 20,
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
    fontSize: 14,
    color: Colors.light.onSurface,
    lineHeight: 20,
  },
  relatedDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 20,
  },

  // ── Tonight's Plan ────────────────────────────────────────────────────────
  tonightBg: {
    backgroundColor: "#FDFAF6",
    borderTopWidth: 1,
    borderTopColor: "rgba(222,193,179,0.2)",
  },
  tonightCard: {
    flexDirection: "row",
    gap: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(222,193,179,0.25)",
    overflow: "hidden",
  },
  tonightImg: {
    width: 128,
    height: 148,
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  tonightBody: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    gap: 6,
    justifyContent: "center",
  },
  tonightMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  tonightFlag: {
    fontSize: 16,
  },
  tonightCuisine: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.light.onSurfaceVariant,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tonightQuickBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(154,65,0,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tonightQuickText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.light.primary,
    letterSpacing: 0.5,
  },
  tonightName: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 17,
    color: Colors.light.onSurface,
    lineHeight: 24,
  },
  tonightDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.onSurfaceVariant,
    fontStyle: "italic",
    lineHeight: 18,
  },
  tonightCookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  tonightCookText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  tonightEmpty: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(222,193,179,0.25)",
    borderStyle: "dashed",
  },
  tonightEmptyTitle: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 17,
    color: Colors.light.onSurface,
    marginBottom: 8,
    textAlign: "center",
  },
  tonightEmptyDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  tonightEmptyActions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  tonightPlanBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 24,
  },
  tonightPlanBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  tonightSurpriseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(154,65,0,0.3)",
  },
  tonightSurpriseBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.light.primary,
  },

  // ── Recently Cooked ───────────────────────────────────────────────────────
  recentScroll: {
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  recentCard: {
    width: 120,
    height: 148,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  recentRatingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 2,
  },
  recentRatingText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#FFFFFF",
  },
  recentInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  recentName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
    lineHeight: 18,
  },

  // ── Cravings / Quick Picks ────────────────────────────────────────────────
  cravingsSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.onSurfaceVariant,
    fontStyle: "italic",
    marginTop: -10,
    marginBottom: 16,
    lineHeight: 18,
  },
  cravingsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  cravingChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderWidth: 1,
    borderColor: "rgba(222,193,179,0.3)",
  },
  cravingChipNew: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
    backgroundColor: "rgba(154,65,0,0.06)",
  },
  cravingChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.onSurface,
  },
  cravingChipTextNew: {
    color: Colors.light.primary,
  },

  // ── Jump Back In ─────────────────────────────────────────────────────────
  jumpBg: {
    backgroundColor: Colors.light.surfaceContainerLow,
    paddingBottom: 24,
  },
  jumpScroll: {
    gap: 12,
    paddingHorizontal: 24,
  },
  jumpCard: {
    width: 152,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(222,193,179,0.2)",
  },
  jumpThumb: {
    width: "100%",
    height: 96,
    backgroundColor: Colors.light.surfaceContainerHigh,
  },
  jumpInfo: {
    padding: 10,
    gap: 4,
  },
  jumpCuisine: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.light.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  jumpName: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.onSurface,
    lineHeight: 18,
  },

  // ── Street Food header additions ──────────────────────────────────────────
  streetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  streetCountryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(154,65,0,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  streetCountryFlag: {
    fontSize: 14,
  },
  streetCountryName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.light.primary,
    letterSpacing: 0.5,
  },

  // ── Editorial / Seasonal Picks ────────────────────────────────────────────
  editPickBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(154,65,0,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  editPickBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.light.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  editPickCard: {
    backgroundColor: "#FCF3E8",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(154,65,0,0.12)",
    padding: 24,
    gap: 12,
  },
  editPickTheme: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  editPickThemeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  editPickHeadline: {
    fontFamily: "NotoSerif_700Bold",
    fontSize: 20,
    color: Colors.light.onSurface,
    lineHeight: 28,
  },
  editPickBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.onSurfaceVariant,
    lineHeight: 22,
  },
  editPickCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  editPickCtaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.light.primary,
    letterSpacing: 0.5,
  },
});
