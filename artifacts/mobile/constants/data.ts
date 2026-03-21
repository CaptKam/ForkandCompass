export interface Country {
  id: string;
  name: string;
  flag: string;
  tagline: string;
  description: string;
  region: string;
  image: string;
  heroImage: string;
  recipes: Recipe[];
}

export interface Recipe {
  id: string;
  name: string;
  countryId: string;
  countryName: string;
  countryFlag: string;
  category: string;
  time: string;
  difficulty: string;
  image: string;
  description: string;
  culturalNote: string;
  ingredients: Ingredient[];
  steps: CookStep[];
}

export interface Ingredient {
  id: string;
  name: string;
  amount: string;
}

export interface CookStep {
  id: string;
  title: string;
  instruction: string;
  materials: string[];
}

export interface GroceryItem {
  id: string;
  name: string;
  amount: string;
  checked: boolean;
  recipeName: string;
}

export const COUNTRIES: Country[] = [
  {
    id: "italy",
    name: "Italy",
    flag: "\u{1F1EE}\u{1F1F9}",
    tagline: "The art of slow living and pasta alchemy.",
    description: "From the rolling hills of Tuscany to the sun-baked coasts, Italian cuisine is a celebration of seasonal simplicity and regional pride.",
    region: "Tuscany",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQWVDU6vVZyYj8wQg9Ef0kgt9FP8fAFb-FWR8gHDKnDwGdFDod43xmWw-NXORmWr5qYAhRjODEVDZgjP8TYFNzfNEedf1pJzMhR4JbPfGQ-aqP-lKJ9M0hAZANodDbuHwRwpaNEjsEfjWAPAmVAjL22DACiSGJRYiMPAk0zj_5YKdSHHDXntk1LsXeL9HGaPwzz8_cCehuKWODzY9TwKTrQMR84KaeACHDmNFHIk5I5tTPXWBuS-9gDJH6HCH6_IRUPC48JnM6dlmi",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuAN6uRvQVYoOV__jiXbmjHPrWodvz7twFVJmQh24qbFsVR_-M7Fqt-rm84J7kCtmYqIcNkJXCWZrNMloKsxqwviNxTRkQe59h2LqvGx1kTA_mJ0MvswKlQ8gOeFLFlY-kwuDR1RvVEn4gboGxq_xFE2XoOnlpHNPDoHJTS3F39gTxciSP3_IvWJ_8UdUex8P3URVUeFL9UFL4u7bG_hPih3ZCybTBT9588GObL1w-Dy60euwbVRSpglaUmQUyhZtm4KfXWT6QBAA5hi",
    recipes: [
      {
        id: "bruschetta",
        name: "Bruschetta al Pomodoro",
        countryId: "italy",
        countryName: "Italy",
        countryFlag: "\u{1F1EE}\u{1F1F9}",
        category: "Tuscan appetizer",
        time: "20 min",
        difficulty: "Easy",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzVr9pIeSWIRZYeBlea8nDL2QY8XhpE946RMqNqwgJ8TEzD5TB6zY0klcxb8yVwRajjUQjnXUXjDb_nNkHOQHeS-YPJY5h4aAh00nFWVCw-jDI25fWX-jnwXlOcj90g2pkJG-vPqviipMactLT2EoxmhKxZrM51qLe1bLYidVlVvsazZKLaq2oaP9TFldP1S6-2H9X0KRIlj0D0zpWyrmtkQ2o_2kap46ShPkC8DY079sEujjIxaydAhY0uuIHe438InqfETZDH7Qw",
        description: "Simple, rustic bread topped with the season's best tomatoes, garlic, and basil. The essence of Tuscan simplicity.",
        culturalNote: "In Tuscany, bruschetta is called 'fettunta' and was originally a way for olive oil producers to taste the season's new oil.",
        ingredients: [
          { id: "1", name: "Thick sourdough slices", amount: "4 slices" },
          { id: "2", name: "Garlic cloves", amount: "2 cloves" },
          { id: "3", name: "Ripe tomatoes", amount: "500g" },
          { id: "4", name: "Fresh basil leaves", amount: "A handful" },
          { id: "5", name: "Extra virgin olive oil", amount: "3 tbsp" },
          { id: "6", name: "Flaky sea salt", amount: "To taste" },
        ],
        steps: [
          {
            id: "s1",
            title: "Prepare the Base",
            instruction: "Toast the bread slices on a grill or in a toaster until golden brown and crisp on both sides.",
            materials: ["4 slices sourdough bread", "Grill pan or toaster"],
          },
          {
            id: "s2",
            title: "Garlic Infusion",
            instruction: "While still warm, rub each slice generously with a cut garlic clove. The heat will soften the garlic into the bread.",
            materials: ["2 garlic cloves, halved"],
          },
          {
            id: "s3",
            title: "Prepare the Topping",
            instruction: "Dice the tomatoes and toss with torn basil, olive oil, and a pinch of flaky salt. Let sit for 5 minutes.",
            materials: ["500g tomatoes", "Fresh basil", "Olive oil", "Salt"],
          },
          {
            id: "s4",
            title: "Assemble & Serve",
            instruction: "Spoon the tomato mixture generously over each slice. Drizzle with extra olive oil and serve immediately.",
            materials: ["Assembled bruschetta"],
          },
        ],
      },
      {
        id: "costolette",
        name: "Costolette di Maiale",
        countryId: "italy",
        countryName: "Italy",
        countryFlag: "\u{1F1EE}\u{1F1F9}",
        category: "Main Course",
        time: "45 min",
        difficulty: "Medium",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvamJG3ZcuW7UOe34EopYCzC4CGywU8eLCdyYHN9pUvqB-rJNki92qJXEeFOgCXzmiyWpmLNsn5QIFI6zZbWWMDBH7MhKYi5ACkAWNlsqnEHmfTmM37eUvSMUYqaGAVdXHTFUB7GdQZBks2BsaP4HQ_zl--gtdjWeQxfEkVs-793La67J2N8sLzkRxdiYO2qncAgtXixWiCfIfL7WJK1vJocgqCFa_be9VVN6q8RaJsDpHcgK-F5vLZW1aouBPjTYapO4vwfglIm2j",
        description: "Succulent pork ribs braised in a rich tomato and red wine sauce, a hearty Tuscan family favorite.",
        culturalNote: "Sunday lunch in Italy is a sacred family tradition. This slow-cooked dish is often the centerpiece of the table.",
        ingredients: [
          { id: "1", name: "Pork ribs", amount: "1 kg" },
          { id: "2", name: "San Marzano tomatoes", amount: "400g can" },
          { id: "3", name: "Red wine (Chianti)", amount: "200ml" },
          { id: "4", name: "Rosemary sprigs", amount: "2" },
          { id: "5", name: "Garlic cloves", amount: "4" },
          { id: "6", name: "Olive oil", amount: "2 tbsp" },
        ],
        steps: [
          {
            id: "s1",
            title: "Sear the Ribs",
            instruction: "Season ribs with salt and pepper. Sear in a hot pan with olive oil until browned on all sides.",
            materials: ["1 kg pork ribs", "Olive oil", "Salt", "Pepper"],
          },
          {
            id: "s2",
            title: "Build the Sauce",
            instruction: "Add garlic and rosemary, cook until fragrant. Pour in wine and let it reduce by half.",
            materials: ["4 garlic cloves", "Rosemary", "200ml red wine"],
          },
          {
            id: "s3",
            title: "Braise",
            instruction: "Add tomatoes, cover, and simmer on low heat for 35 minutes until the meat is tender and falling off the bone.",
            materials: ["400g San Marzano tomatoes"],
          },
          {
            id: "s4",
            title: "Serve",
            instruction: "Plate the ribs, spoon over the rich sauce, and garnish with fresh rosemary.",
            materials: ["Fresh rosemary for garnish"],
          },
        ],
      },
    ],
  },
  {
    id: "japan",
    name: "Japan",
    flag: "\u{1F1EF}\u{1F1F5}",
    tagline: "Precision, season, and the spirit of Umami.",
    description: "Japanese cuisine is a reverent practice of simplicity and balance, where every ingredient is honored and every dish tells a story of the season.",
    region: "Kyoto",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_SNvP2LkVLJvKf-aX2iT-o-NSsiCks6uaT9cDdkBLKKaez4-e-RWJAx153upL-rjpz-78MTNARVHvXXE8sKcVHmuyADVdPMSTFjawm9E9n2xXV6Z9eFXx1dFgxRgCiodnPlhMOUOebzbX1FLmcziYWoBD9DsEGvIIr7gvkNKQM0JQYmLB8_84wVWV6_gBkI2BnisBfbHhryUpCm6ZckKlHUsP60jyzxE54P1ls4iOZUzbwoW2ShyIsYQae7O1e0sFcEw4GvBLc3E2",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_SNvP2LkVLJvKf-aX2iT-o-NSsiCks6uaT9cDdkBLKKaez4-e-RWJAx153upL-rjpz-78MTNARVHvXXE8sKcVHmuyADVdPMSTFjawm9E9n2xXV6Z9eFXx1dFgxRgCiodnPlhMOUOebzbX1FLmcziYWoBD9DsEGvIIr7gvkNKQM0JQYmLB8_84wVWV6_gBkI2BnisBfbHhryUpCm6ZckKlHUsP60jyzxE54P1ls4iOZUzbwoW2ShyIsYQae7O1e0sFcEw4GvBLc3E2",
    recipes: [
      {
        id: "miso-soup",
        name: "Miso Soup",
        countryId: "japan",
        countryName: "Japan",
        countryFlag: "\u{1F1EF}\u{1F1F5}",
        category: "Traditional soup",
        time: "15 min",
        difficulty: "Easy",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_SNvP2LkVLJvKf-aX2iT-o-NSsiCks6uaT9cDdkBLKKaez4-e-RWJAx153upL-rjpz-78MTNARVHvXXE8sKcVHmuyADVdPMSTFjawm9E9n2xXV6Z9eFXx1dFgxRgCiodnPlhMOUOebzbX1FLmcziYWoBD9DsEGvIIr7gvkNKQM0JQYmLB8_84wVWV6_gBkI2BnisBfbHhryUpCm6ZckKlHUsP60jyzxE54P1ls4iOZUzbwoW2ShyIsYQae7O1e0sFcEw4GvBLc3E2",
        description: "A warming bowl of dashi broth with silky miso paste, tofu, and wakame seaweed. The soul of Japanese comfort food.",
        culturalNote: "Miso soup is served at nearly every Japanese meal, including breakfast. It is considered essential for starting the day with balance.",
        ingredients: [
          { id: "1", name: "Dashi stock", amount: "600ml" },
          { id: "2", name: "White miso paste", amount: "3 tbsp" },
          { id: "3", name: "Silken tofu", amount: "150g" },
          { id: "4", name: "Dried wakame seaweed", amount: "1 tbsp" },
          { id: "5", name: "Spring onions", amount: "2" },
        ],
        steps: [
          { id: "s1", title: "Prepare Dashi", instruction: "Bring the dashi stock to a gentle simmer. Never let it boil vigorously.", materials: ["600ml dashi stock"] },
          { id: "s2", title: "Dissolve Miso", instruction: "Ladle some warm dashi into a small bowl, add miso paste, and whisk until smooth. Pour back into the pot.", materials: ["3 tbsp miso paste"] },
          { id: "s3", title: "Add Ingredients", instruction: "Gently add cubed tofu and rehydrated wakame. Warm through for 1 minute.", materials: ["150g silken tofu", "Wakame seaweed"] },
          { id: "s4", title: "Serve", instruction: "Ladle into bowls and garnish with thinly sliced spring onions. Serve immediately.", materials: ["Spring onions"] },
        ],
      },
      {
        id: "onigiri",
        name: "Onigiri",
        countryId: "japan",
        countryName: "Japan",
        countryFlag: "\u{1F1EF}\u{1F1F5}",
        category: "Snack",
        time: "25 min",
        difficulty: "Easy",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_SNvP2LkVLJvKf-aX2iT-o-NSsiCks6uaT9cDdkBLKKaez4-e-RWJAx153upL-rjpz-78MTNARVHvXXE8sKcVHmuyADVdPMSTFjawm9E9n2xXV6Z9eFXx1dFgxRgCiodnPlhMOUOebzbX1FLmcziYWoBD9DsEGvIIr7gvkNKQM0JQYmLB8_84wVWV6_gBkI2BnisBfbHhryUpCm6ZckKlHUsP60jyzxE54P1ls4iOZUzbwoW2ShyIsYQae7O1e0sFcEw4GvBLc3E2",
        description: "Hand-formed rice balls filled with savory ingredients and wrapped in crisp nori seaweed.",
        culturalNote: "Onigiri are the quintessential Japanese portable food, found in every convenience store and made by every grandmother.",
        ingredients: [
          { id: "1", name: "Japanese short-grain rice", amount: "2 cups" },
          { id: "2", name: "Nori seaweed sheets", amount: "4 sheets" },
          { id: "3", name: "Umeboshi (pickled plum)", amount: "4" },
          { id: "4", name: "Salt", amount: "1 tsp" },
        ],
        steps: [
          { id: "s1", title: "Cook Rice", instruction: "Cook rice according to package directions. Let it cool until just warm enough to handle.", materials: ["2 cups rice"] },
          { id: "s2", title: "Shape", instruction: "Wet your hands with salted water. Take a portion of rice, press a plum into the center, and form into a triangle.", materials: ["Cooked rice", "Umeboshi", "Salt water"] },
          { id: "s3", title: "Wrap", instruction: "Wrap each onigiri with a strip of nori seaweed. The nori should be crisp.", materials: ["Nori sheets"] },
          { id: "s4", title: "Serve", instruction: "Serve immediately or wrap in plastic for a portable snack.", materials: [] },
        ],
      },
    ],
  },
  {
    id: "morocco",
    name: "Morocco",
    flag: "\u{1F1F2}\u{1F1E6}",
    tagline: "Spice markets, tagines, and the warmth of Marrakech.",
    description: "Tonight, lose yourself in the warmth of Marrakech. Tagine, mint tea, and stories from the medina.",
    region: "Marrakech",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCuAaqROW9q8mgNaJigvWmdRpSR03vjO8AItTK4uFQZqAeBjh-IFmXevWe2DNO_XOPiZDVVX8gLKBO4tNAkydUrO70Orkgl0ehXa17P0p2FGLCvPDJSCTDEp-A957C72z6oglWbXbG3XoWuJqZffk9qsAemQ_mr0dBWx_sfMtFFbcV0Qiyo3M4VsjCmBv4GaoCDUbCNMnLtItGfseVndV1vti8Pii47AInX_V9pVWM7Pq65Gjqt9i2LIfCbxkC8yK3bU_EhvatXr5Gm",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCuAaqROW9q8mgNaJigvWmdRpSR03vjO8AItTK4uFQZqAeBjh-IFmXevWe2DNO_XOPiZDVVX8gLKBO4tNAkydUrO70Orkgl0ehXa17P0p2FGLCvPDJSCTDEp-A957C72z6oglWbXbG3XoWuJqZffk9qsAemQ_mr0dBWx_sfMtFFbcV0Qiyo3M4VsjCmBv4GaoCDUbCNMnLtItGfseVndV1vti8Pii47AInX_V9pVWM7Pq65Gjqt9i2LIfCbxkC8yK3bU_EhvatXr5Gm",
    recipes: [
      {
        id: "chicken-tagine",
        name: "Chicken Tagine with Preserved Lemons",
        countryId: "morocco",
        countryName: "Morocco",
        countryFlag: "\u{1F1F2}\u{1F1E6}",
        category: "Main Course",
        time: "55 min",
        difficulty: "Medium",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCuAaqROW9q8mgNaJigvWmdRpSR03vjO8AItTK4uFQZqAeBjh-IFmXevWe2DNO_XOPiZDVVX8gLKBO4tNAkydUrO70Orkgl0ehXa17P0p2FGLCvPDJSCTDEp-A957C72z6oglWbXbG3XoWuJqZffk9qsAemQ_mr0dBWx_sfMtFFbcV0Qiyo3M4VsjCmBv4GaoCDUbCNMnLtItGfseVndV1vti8Pii47AInX_V9pVWM7Pq65Gjqt9i2LIfCbxkC8yK3bU_EhvatXr5Gm",
        description: "A fragrant, slow-simmered chicken dish with preserved lemons and olives, quintessential Moroccan comfort.",
        culturalNote: "Tagine refers to both the dish and the cone-shaped clay pot it's cooked in. The shape circulates steam perfectly.",
        ingredients: [
          { id: "1", name: "Chicken thighs", amount: "6 pieces" },
          { id: "2", name: "Preserved lemons", amount: "2" },
          { id: "3", name: "Green olives", amount: "1 cup" },
          { id: "4", name: "Onion", amount: "2, sliced" },
          { id: "5", name: "Saffron threads", amount: "1/4 tsp" },
          { id: "6", name: "Fresh cilantro", amount: "A bunch" },
        ],
        steps: [
          { id: "s1", title: "Season Chicken", instruction: "Marinate chicken with saffron, ginger, turmeric, salt and pepper. Let rest for 15 minutes.", materials: ["6 chicken thighs", "Spices"] },
          { id: "s2", title: "Build the Base", instruction: "Layer sliced onions in the pot, place chicken on top, add water halfway. Bring to a simmer.", materials: ["2 onions", "Chicken", "Water"] },
          { id: "s3", title: "Add Lemons & Olives", instruction: "After 30 minutes, add preserved lemons and olives. Continue cooking for 15 more minutes.", materials: ["Preserved lemons", "Green olives"] },
          { id: "s4", title: "Garnish & Serve", instruction: "Garnish generously with fresh cilantro and serve with warm crusty bread.", materials: ["Fresh cilantro", "Bread"] },
        ],
      },
      {
        id: "mint-tea",
        name: "Moroccan Mint Tea",
        countryId: "morocco",
        countryName: "Morocco",
        countryFlag: "\u{1F1F2}\u{1F1E6}",
        category: "Beverage",
        time: "10 min",
        difficulty: "Easy",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCuAaqROW9q8mgNaJigvWmdRpSR03vjO8AItTK4uFQZqAeBjh-IFmXevWe2DNO_XOPiZDVVX8gLKBO4tNAkydUrO70Orkgl0ehXa17P0p2FGLCvPDJSCTDEp-A957C72z6oglWbXbG3XoWuJqZffk9qsAemQ_mr0dBWx_sfMtFFbcV0Qiyo3M4VsjCmBv4GaoCDUbCNMnLtItGfseVndV1vti8Pii47AInX_V9pVWM7Pq65Gjqt9i2LIfCbxkC8yK3bU_EhvatXr5Gm",
        description: "Sweet, aromatic green tea with fresh mint, poured from a height for the perfect froth.",
        culturalNote: "Moroccan mint tea is poured three times, each with a different meaning: the first glass is gentle as life, the second strong as love, the third bitter as death.",
        ingredients: [
          { id: "1", name: "Chinese gunpowder green tea", amount: "2 tbsp" },
          { id: "2", name: "Fresh mint leaves", amount: "A large bunch" },
          { id: "3", name: "Sugar", amount: "To taste" },
          { id: "4", name: "Boiling water", amount: "1 liter" },
        ],
        steps: [
          { id: "s1", title: "Rinse the Tea", instruction: "Add tea leaves to the pot, pour a small amount of boiling water, swirl and discard. This removes bitterness.", materials: ["2 tbsp green tea", "Boiling water"] },
          { id: "s2", title: "Brew", instruction: "Add mint leaves and sugar to the pot. Pour boiling water and steep for 3-4 minutes.", materials: ["Fresh mint", "Sugar", "Boiling water"] },
          { id: "s3", title: "Pour from Height", instruction: "Pour into glasses from a height of about 30cm to create a light froth. Pour back and forth between pot and glass to mix.", materials: ["Tea glasses"] },
          { id: "s4", title: "Serve", instruction: "Serve hot with additional mint leaves as garnish.", materials: ["Fresh mint garnish"] },
        ],
      },
    ],
  },
  {
    id: "mexico",
    name: "Mexico",
    flag: "\u{1F1F2}\u{1F1FD}",
    tagline: "Bold flavors born from ancient traditions.",
    description: "Mexican cuisine is a vibrant tapestry of indigenous and colonial influences, where corn, chili, and chocolate weave together in celebration.",
    region: "Oaxaca",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQWVDU6vVZyYj8wQg9Ef0kgt9FP8fAFb-FWR8gHDKnDwGdFDod43xmWw-NXORmWr5qYAhRjODEVDZgjP8TYFNzfNEedf1pJzMhR4JbPfGQ-aqP-lKJ9M0hAZANodDbuHwRwpaNEjsEfjWAPAmVAjL22DACiSGJRYiMPAk0zj_5YKdSHHDXntk1LsXeL9HGaPwzz8_cCehuKWODzY9TwKTrQMR84KaeACHDmNFHIk5I5tTPXWBuS-9gDJH6HCH6_IRUPC48JnM6dlmi",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQWVDU6vVZyYj8wQg9Ef0kgt9FP8fAFb-FWR8gHDKnDwGdFDod43xmWw-NXORmWr5qYAhRjODEVDZgjP8TYFNzfNEedf1pJzMhR4JbPfGQ-aqP-lKJ9M0hAZANodDbuHwRwpaNEjsEfjWAPAmVAjL22DACiSGJRYiMPAk0zj_5YKdSHHDXntk1LsXeL9HGaPwzz8_cCehuKWODzY9TwKTrQMR84KaeACHDmNFHIk5I5tTPXWBuS-9gDJH6HCH6_IRUPC48JnM6dlmi",
    recipes: [
      {
        id: "guacamole",
        name: "Guacamole Tradicional",
        countryId: "mexico",
        countryName: "Mexico",
        countryFlag: "\u{1F1F2}\u{1F1FD}",
        category: "Appetizer",
        time: "10 min",
        difficulty: "Easy",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQWVDU6vVZyYj8wQg9Ef0kgt9FP8fAFb-FWR8gHDKnDwGdFDod43xmWw-NXORmWr5qYAhRjODEVDZgjP8TYFNzfNEedf1pJzMhR4JbPfGQ-aqP-lKJ9M0hAZANodDbuHwRwpaNEjsEfjWAPAmVAjL22DACiSGJRYiMPAk0zj_5YKdSHHDXntk1LsXeL9HGaPwzz8_cCehuKWODzY9TwKTrQMR84KaeACHDmNFHIk5I5tTPXWBuS-9gDJH6HCH6_IRUPC48JnM6dlmi",
        description: "The original guacamole, with ripe avocados, lime, cilantro, and just the right amount of heat.",
        culturalNote: "The word guacamole comes from the Aztec word 'ahuacamolli', meaning avocado sauce. It has been made for over 500 years.",
        ingredients: [
          { id: "1", name: "Ripe avocados", amount: "3" },
          { id: "2", name: "Lime juice", amount: "2 tbsp" },
          { id: "3", name: "White onion, diced", amount: "1/4 cup" },
          { id: "4", name: "Serrano chili, minced", amount: "1" },
          { id: "5", name: "Fresh cilantro", amount: "2 tbsp" },
          { id: "6", name: "Salt", amount: "To taste" },
        ],
        steps: [
          { id: "s1", title: "Prepare Avocados", instruction: "Halve and pit the avocados. Scoop flesh into a molcajete or bowl.", materials: ["3 ripe avocados"] },
          { id: "s2", title: "Mash", instruction: "Mash with a fork to desired consistency - leave some chunks for texture.", materials: ["Fork or molcajete"] },
          { id: "s3", title: "Season", instruction: "Add lime juice, onion, chili, cilantro, and salt. Mix gently.", materials: ["Lime", "Onion", "Chili", "Cilantro", "Salt"] },
          { id: "s4", title: "Serve", instruction: "Serve immediately with warm tortilla chips. Cover with plastic directly on surface to prevent browning.", materials: ["Tortilla chips"] },
        ],
      },
    ],
  },
];

export const WELCOME_HERO_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuBNn6amxRklLOG69FpzFwcXZX5f0amiGLTlhj-OK4CKLAIjyld88eF-BtrHONmt69pF3NCPSHevwxzssyeJ5w5VEPOr_80X6OLvGsHb34IEqgiWpCiWubiMQhnstosxqXAbBBiQcEZU-D9RTzfI_NmGNh5z4lYEsg0anY3accSKOTqZq8eXDHA6YRz9F54mcDsybrvMxHqD1TGxK3VUSsKjgta2G468z9ttJssORTCBDgaEojDrgatyIZ3koBd5P5yOCQsaO7I5moy8";

export function getCountryById(id: string): Country | undefined {
  return COUNTRIES.find((c) => c.id === id);
}

export function getRecipeById(id: string): Recipe | undefined {
  for (const country of COUNTRIES) {
    const recipe = country.recipes.find((r) => r.id === id);
    if (recipe) return recipe;
  }
  return undefined;
}

export function getAllRecipes(): Recipe[] {
  return COUNTRIES.flatMap((c) => c.recipes);
}
