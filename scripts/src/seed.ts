import { db, pool, countriesTable, recipesTable } from "@workspace/db";

const COUNTRIES = [
  {
    id: "italy",
    name: "Italy",
    flag: "🇮🇹",
    tagline: "The art of slow living and pasta alchemy.",
    description:
      "From the rolling hills of Tuscany to the sun-baked coasts, Italian cuisine is a celebration of seasonal simplicity and regional pride.",
    region: "Tuscany",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAQWVDU6vVZyYj8wQg9Ef0kgt9FP8fAFb-FWR8gHDKnDwGdFDod43xmWw-NXORmWr5qYAhRjODEVDZgjP8TYFNzfNEedf1pJzMhR4JbPfGQ-aqP-lKJ9M0hAZANodDbuHwRwpaNEjsEfjWAPAmVAjL22DACiSGJRYiMPAk0zj_5YKdSHHDXntk1LsXeL9HGaPwzz8_cCehuKWODzY9TwKTrQMR84KaeACHDmNFHIk5I5tTPXWBuS-9gDJH6HCH6_IRUPC48JnM6dlmi",
    heroImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAN6uRvQVYoOV__jiXbmjHPrWodvz7twFVJmQh24qbFsVR_-M7Fqt-rm84J7kCtmYqIcNkJXCWZrNMloKsxqwviNxTRkQe59h2LqvGx1kTA_mJ0MvswKlQ8gOeFLFlY-kwuDR1RvVEn4gboGxq_xFE2XoOnlpHNPDoHJTS3F39gTxciSP3_IvWJ_8UdUex8P3URVUeFL9UFL4u7bG_hPih3ZCybTBT9588GObL1w-Dy60euwbVRSpglaUmQUyhZtm4KfXWT6QBAA5hi",
    cuisineLabel: "Mediterranean",
    recipes: [
      {
        id: "bruschetta",
        title: "Bruschetta al Pomodoro",
        category: "Tuscan appetizer",
        prepTime: "20 min",
        difficulty: "Easy",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBzVr9pIeSWIRZYeBlea8nDL2QY8XhpE946RMqNqwgJ8TEzD5TB6zY0klcxb8yVwRajjUQjnXUXjDb_nNkHOQHeS-YPJY5h4aAh00nFWVCw-jDI25fWX-jnwXlOcj90g2pkJG-vPqviipMactLT2EoxmhKxZrM51qLe1bLYidVlVvsazZKLaq2oaP9TFldP1S6-2H9X0KRIlj0D0zpWyrmtkQ2o_2kap46ShPkC8DY079sEujjIxaydAhY0uuIHe438InqfETZDH7Qw",
        description:
          "Simple, rustic bread topped with the season's best tomatoes, garlic, and basil. The essence of Tuscan simplicity.",
        culturalNote:
          "In Tuscany, bruschetta is called 'fettunta' and was originally a way for olive oil producers to taste the season's new oil.",
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
            instruction:
              "Toast the bread slices on a grill or in a toaster until golden brown and crisp on both sides.",
            materials: ["4 slices sourdough bread", "Grill pan or toaster"],
          },
          {
            id: "s2",
            title: "Garlic Infusion",
            instruction:
              "While still warm, rub each slice generously with a cut garlic clove. The heat will soften the garlic into the bread.",
            materials: ["2 garlic cloves, halved"],
          },
          {
            id: "s3",
            title: "Prepare the Topping",
            instruction:
              "Dice the tomatoes and toss with torn basil, olive oil, and a pinch of flaky salt. Let sit for 5 minutes.",
            materials: ["500g tomatoes", "Fresh basil", "Olive oil", "Salt"],
          },
          {
            id: "s4",
            title: "Assemble & Serve",
            instruction:
              "Spoon the tomato mixture generously over each slice. Drizzle with extra olive oil and serve immediately.",
            materials: ["Assembled bruschetta"],
          },
        ],
      },
      {
        id: "costolette",
        title: "Costolette di Maiale",
        category: "Main Course",
        prepTime: "45 min",
        difficulty: "Medium",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDvamJG3ZcuW7UOe34EopYCzC4CGywU8eLCdyYHN9pUvqB-rJNki92qJXEeFOgCXzmiyWpmLNsn5QIFI6zZbWWMDBH7MhKYi5ACkAWNlsqnEHmfTmM37eUvSMUYqaGAVdXHTFUB7GdQZBks2BsaP4HQ_zl--gtdjWeQxfEkVs-793La67J2N8sLzkRxdiYO2qncAgtXixWiCfIfL7WJK1vJocgqCFa_be9VVN6q8RaJsDpHcgK-F5vLZW1aouBPjTYapO4vwfglIm2j",
        description:
          "Succulent pork ribs braised in a rich tomato and red wine sauce, a hearty Tuscan family favorite.",
        culturalNote:
          "Sunday lunch in Italy is a sacred family tradition. This slow-cooked dish is often the centerpiece of the table.",
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
            instruction:
              "Season ribs with salt and pepper. Heat olive oil in a heavy pot and sear ribs until browned on all sides.",
            materials: ["1kg pork ribs", "Salt", "Pepper", "Olive oil"],
          },
          {
            id: "s2",
            title: "Build the Sauce",
            instruction:
              "Remove ribs, sauté garlic and rosemary. Pour in red wine and let it reduce by half.",
            materials: ["4 garlic cloves", "Rosemary", "200ml Chianti"],
          },
          {
            id: "s3",
            title: "Slow Braise",
            instruction:
              "Add tomatoes and return ribs. Cover and braise over low heat for 1.5 hours until meat is tender.",
            materials: ["San Marzano tomatoes", "Browned ribs"],
          },
          {
            id: "s4",
            title: "Finish & Serve",
            instruction:
              "Plate the ribs, spoon over the rich sauce, and garnish with fresh rosemary.",
            materials: ["Fresh rosemary for garnish"],
          },
        ],
      },
    ],
  },
  {
    id: "japan",
    name: "Japan",
    flag: "🇯🇵",
    tagline: "Precision, season, and the spirit of Umami.",
    description:
      "Japanese cuisine is a reverent practice of simplicity and balance, where every ingredient is honored and every dish tells a story of the season.",
    region: "Kyoto",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB_SNvP2LkVLJvKf-aX2iT-o-NSsiCks6uaT9cDdkBLKKaez4-e-RWJAx153upL-rjpz-78MTNARVHvXXE8sKcVHmuyADVdPMSTFjawm9E9n2xXV6Z9eFXx1dFgxRgCiodnPlhMOUOebzbX1FLmcziYWoBD9DsEGvIIr7gvkNKQM0JQYmLB8_84wVWV6_gBkI2BnisBfbHhryUpCm6ZckKlHUsP60jyzxE54P1ls4iOZUzbwoW2ShyIsYQae7O1e0sFcEw4GvBLc3E2",
    heroImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB_SNvP2LkVLJvKf-aX2iT-o-NSsiCks6uaT9cDdkBLKKaez4-e-RWJAx153upL-rjpz-78MTNARVHvXXE8sKcVHmuyADVdPMSTFjawm9E9n2xXV6Z9eFXx1dFgxRgCiodnPlhMOUOebzbX1FLmcziYWoBD9DsEGvIIr7gvkNKQM0JQYmLB8_84wVWV6_gBkI2BnisBfbHhryUpCm6ZckKlHUsP60jyzxE54P1ls4iOZUzbwoW2ShyIsYQae7O1e0sFcEw4GvBLc3E2",
    cuisineLabel: "East Asian",
    recipes: [
      {
        id: "miso-soup",
        title: "Miso Soup",
        category: "Traditional soup",
        prepTime: "15 min",
        difficulty: "Easy",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuB_SNvP2LkVLJvKf-aX2iT-o-NSsiCks6uaT9cDdkBLKKaez4-e-RWJAx153upL-rjpz-78MTNARVHvXXE8sKcVHmuyADVdPMSTFjawm9E9n2xXV6Z9eFXx1dFgxRgCiodnPlhMOUOebzbX1FLmcziYWoBD9DsEGvIIr7gvkNKQM0JQYmLB8_84wVWV6_gBkI2BnisBfbHhryUpCm6ZckKlHUsP60jyzxE54P1ls4iOZUzbwoW2ShyIsYQae7O1e0sFcEw4GvBLc3E2",
        description:
          "A warming bowl of dashi broth with silky miso paste, tofu, and wakame seaweed. The soul of Japanese comfort food.",
        culturalNote:
          "Miso soup is served at nearly every Japanese meal, including breakfast. It is considered essential for starting the day with balance.",
        ingredients: [
          { id: "1", name: "Dashi stock", amount: "600ml" },
          { id: "2", name: "White miso paste", amount: "3 tbsp" },
          { id: "3", name: "Silken tofu", amount: "150g" },
          { id: "4", name: "Dried wakame seaweed", amount: "1 tbsp" },
          { id: "5", name: "Spring onions", amount: "2" },
        ],
        steps: [
          {
            id: "s1",
            title: "Prepare Dashi",
            instruction:
              "Bring the dashi stock to a gentle simmer. Never let it boil vigorously.",
            materials: ["600ml dashi stock"],
          },
          {
            id: "s2",
            title: "Dissolve Miso",
            instruction:
              "Ladle some warm dashi into a small bowl, add miso paste, and whisk until smooth. Pour back into the pot.",
            materials: ["3 tbsp miso paste"],
          },
          {
            id: "s3",
            title: "Add Ingredients",
            instruction:
              "Gently add cubed tofu and rehydrated wakame. Warm through for 1 minute.",
            materials: ["150g silken tofu", "Wakame seaweed"],
          },
          {
            id: "s4",
            title: "Serve",
            instruction:
              "Ladle into bowls and garnish with thinly sliced spring onions. Serve immediately.",
            materials: ["Spring onions"],
          },
        ],
      },
      {
        id: "onigiri",
        title: "Onigiri",
        category: "Snack",
        prepTime: "25 min",
        difficulty: "Easy",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuB_SNvP2LkVLJvKf-aX2iT-o-NSsiCks6uaT9cDdkBLKKaez4-e-RWJAx153upL-rjpz-78MTNARVHvXXE8sKcVHmuyADVdPMSTFjawm9E9n2xXV6Z9eFXx1dFgxRgCiodnPlhMOUOebzbX1FLmcziYWoBD9DsEGvIIr7gvkNKQM0JQYmLB8_84wVWV6_gBkI2BnisBfbHhryUpCm6ZckKlHUsP60jyzxE54P1ls4iOZUzbwoW2ShyIsYQae7O1e0sFcEw4GvBLc3E2",
        description:
          "Hand-formed rice balls filled with savory ingredients and wrapped in crisp nori seaweed.",
        culturalNote:
          "Onigiri are the quintessential Japanese portable food, found in every convenience store and made by every grandmother.",
        ingredients: [
          { id: "1", name: "Japanese short-grain rice", amount: "2 cups" },
          { id: "2", name: "Nori seaweed sheets", amount: "4 sheets" },
          { id: "3", name: "Umeboshi (pickled plum)", amount: "4" },
          { id: "4", name: "Salt", amount: "1 tsp" },
        ],
        steps: [
          {
            id: "s1",
            title: "Cook Rice",
            instruction:
              "Cook rice according to package directions. Let it cool until just warm enough to handle.",
            materials: ["2 cups rice"],
          },
          {
            id: "s2",
            title: "Shape",
            instruction:
              "Wet your hands with salted water. Take a portion of rice, press a plum into the center, and form into a triangle.",
            materials: ["Cooked rice", "Umeboshi", "Salt water"],
          },
          {
            id: "s3",
            title: "Wrap",
            instruction:
              "Wrap each onigiri with a strip of nori seaweed. The nori should be crisp.",
            materials: ["Nori sheets"],
          },
          {
            id: "s4",
            title: "Serve",
            instruction:
              "Serve immediately or wrap in plastic for a portable snack.",
            materials: [],
          },
        ],
      },
    ],
  },
  {
    id: "morocco",
    name: "Morocco",
    flag: "🇲🇦",
    tagline: "Spice markets, tagines, and the warmth of Marrakech.",
    description:
      "Tonight, lose yourself in the warmth of Marrakech. Tagine, mint tea, and stories from the medina.",
    region: "Marrakech",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCuAaqROW9q8mgNaJigvWmdRpSR03vjO8AItTK4uFQZqAeBjh-IFmXevWe2DNO_XOPiZDVVX8gLKBO4tNAkydUrO70Orkgl0ehXa17P0p2FGLCvPDJSCTDEp-A957C72z6oglWbXbG3XoWuJqZffk9qsAemQ_mr0dBWx_sfMtFFbcV0Qiyo3M4VsjCmBv4GaoCDUbCNMnLtItGfseVndV1vti8Pii47AInX_V9pVWM7Pq65Gjqt9i2LIfCbxkC8yK3bU_EhvatXr5Gm",
    heroImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCuAaqROW9q8mgNaJigvWmdRpSR03vjO8AItTK4uFQZqAeBjh-IFmXevWe2DNO_XOPiZDVVX8gLKBO4tNAkydUrO70Orkgl0ehXa17P0p2FGLCvPDJSCTDEp-A957C72z6oglWbXbG3XoWuJqZffk9qsAemQ_mr0dBWx_sfMtFFbcV0Qiyo3M4VsjCmBv4GaoCDUbCNMnLtItGfseVndV1vti8Pii47AInX_V9pVWM7Pq65Gjqt9i2LIfCbxkC8yK3bU_EhvatXr5Gm",
    cuisineLabel: "North African",
    recipes: [
      {
        id: "chicken-tagine",
        title: "Chicken Tagine with Preserved Lemons",
        category: "Main Course",
        prepTime: "55 min",
        difficulty: "Medium",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCuAaqROW9q8mgNaJigvWmdRpSR03vjO8AItTK4uFQZqAeBjh-IFmXevWe2DNO_XOPiZDVVX8gLKBO4tNAkydUrO70Orkgl0ehXa17P0p2FGLCvPDJSCTDEp-A957C72z6oglWbXbG3XoWuJqZffk9qsAemQ_mr0dBWx_sfMtFFbcV0Qiyo3M4VsjCmBv4GaoCDUbCNMnLtItGfseVndV1vti8Pii47AInX_V9pVWM7Pq65Gjqt9i2LIfCbxkC8yK3bU_EhvatXr5Gm",
        description:
          "A fragrant, slow-simmered chicken dish with preserved lemons and olives, quintessential Moroccan comfort.",
        culturalNote:
          "Tagine refers to both the dish and the cone-shaped clay pot it's cooked in. The shape circulates steam perfectly.",
        ingredients: [
          { id: "1", name: "Chicken thighs", amount: "6 pieces" },
          { id: "2", name: "Preserved lemons", amount: "2" },
          { id: "3", name: "Green olives", amount: "1 cup" },
          { id: "4", name: "Onion", amount: "2, sliced" },
          { id: "5", name: "Saffron threads", amount: "1/4 tsp" },
          { id: "6", name: "Fresh cilantro", amount: "A bunch" },
        ],
        steps: [
          {
            id: "s1",
            title: "Season Chicken",
            instruction:
              "Marinate chicken with saffron, ginger, turmeric, salt and pepper. Let rest for 15 minutes.",
            materials: ["6 chicken thighs", "Spices"],
          },
          {
            id: "s2",
            title: "Build the Base",
            instruction:
              "Layer sliced onions in the pot, place chicken on top, add water halfway. Bring to a simmer.",
            materials: ["2 onions", "Chicken", "Water"],
          },
          {
            id: "s3",
            title: "Add Lemons & Olives",
            instruction:
              "After 30 minutes, add preserved lemons and olives. Continue cooking for 15 more minutes.",
            materials: ["Preserved lemons", "Green olives"],
          },
          {
            id: "s4",
            title: "Garnish & Serve",
            instruction:
              "Garnish generously with fresh cilantro and serve with warm crusty bread.",
            materials: ["Fresh cilantro", "Bread"],
          },
        ],
      },
      {
        id: "mint-tea",
        title: "Moroccan Mint Tea",
        category: "Beverage",
        prepTime: "10 min",
        difficulty: "Easy",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCuAaqROW9q8mgNaJigvWmdRpSR03vjO8AItTK4uFQZqAeBjh-IFmXevWe2DNO_XOPiZDVVX8gLKBO4tNAkydUrO70Orkgl0ehXa17P0p2FGLCvPDJSCTDEp-A957C72z6oglWbXbG3XoWuJqZffk9qsAemQ_mr0dBWx_sfMtFFbcV0Qiyo3M4VsjCmBv4GaoCDUbCNMnLtItGfseVndV1vti8Pii47AInX_V9pVWM7Pq65Gjqt9i2LIfCbxkC8yK3bU_EhvatXr5Gm",
        description:
          "Sweet, aromatic green tea with fresh mint, poured from a height for the perfect froth.",
        culturalNote:
          "Moroccan mint tea is poured three times, each with a different meaning: the first glass is gentle as life, the second strong as love, the third bitter as death.",
        ingredients: [
          {
            id: "1",
            name: "Chinese gunpowder green tea",
            amount: "2 tbsp",
          },
          { id: "2", name: "Fresh mint leaves", amount: "A large bunch" },
          { id: "3", name: "Sugar", amount: "To taste" },
          { id: "4", name: "Boiling water", amount: "1 liter" },
        ],
        steps: [
          {
            id: "s1",
            title: "Rinse the Tea",
            instruction:
              "Add tea leaves to the pot, pour a small amount of boiling water, swirl and discard. This removes bitterness.",
            materials: ["2 tbsp green tea", "Boiling water"],
          },
          {
            id: "s2",
            title: "Brew",
            instruction:
              "Add mint leaves and sugar to the pot. Pour boiling water and steep for 3-4 minutes.",
            materials: ["Fresh mint", "Sugar", "Boiling water"],
          },
          {
            id: "s3",
            title: "Pour from Height",
            instruction:
              "Pour into glasses from a height of about 30cm to create a light froth. Pour back and forth between pot and glass to mix.",
            materials: ["Tea glasses"],
          },
          {
            id: "s4",
            title: "Serve",
            instruction:
              "Serve hot with additional mint leaves as garnish.",
            materials: ["Fresh mint garnish"],
          },
        ],
      },
    ],
  },
  {
    id: "mexico",
    name: "Mexico",
    flag: "🇲🇽",
    tagline: "Bold flavors born from ancient traditions.",
    description:
      "Mexican cuisine is a vibrant tapestry of indigenous and colonial influences, where corn, chili, and chocolate weave together in celebration.",
    region: "Oaxaca",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAQWVDU6vVZyYj8wQg9Ef0kgt9FP8fAFb-FWR8gHDKnDwGdFDod43xmWw-NXORmWr5qYAhRjODEVDZgjP8TYFNzfNEedf1pJzMhR4JbPfGQ-aqP-lKJ9M0hAZANodDbuHwRwpaNEjsEfjWAPAmVAjL22DACiSGJRYiMPAk0zj_5YKdSHHDXntk1LsXeL9HGaPwzz8_cCehuKWODzY9TwKTrQMR84KaeACHDmNFHIk5I5tTPXWBuS-9gDJH6HCH6_IRUPC48JnM6dlmi",
    heroImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAQWVDU6vVZyYj8wQg9Ef0kgt9FP8fAFb-FWR8gHDKnDwGdFDod43xmWw-NXORmWr5qYAhRjODEVDZgjP8TYFNzfNEedf1pJzMhR4JbPfGQ-aqP-lKJ9M0hAZANodDbuHwRwpaNEjsEfjWAPAmVAjL22DACiSGJRYiMPAk0zj_5YKdSHHDXntk1LsXeL9HGaPwzz8_cCehuKWODzY9TwKTrQMR84KaeACHDmNFHIk5I5tTPXWBuS-9gDJH6HCH6_IRUPC48JnM6dlmi",
    cuisineLabel: "Latin American",
    recipes: [
      {
        id: "guacamole",
        title: "Guacamole Tradicional",
        category: "Appetizer",
        prepTime: "10 min",
        difficulty: "Easy",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuAQWVDU6vVZyYj8wQg9Ef0kgt9FP8fAFb-FWR8gHDKnDwGdFDod43xmWw-NXORmWr5qYAhRjODEVDZgjP8TYFNzfNEedf1pJzMhR4JbPfGQ-aqP-lKJ9M0hAZANodDbuHwRwpaNEjsEfjWAPAmVAjL22DACiSGJRYiMPAk0zj_5YKdSHHDXntk1LsXeL9HGaPwzz8_cCehuKWODzY9TwKTrQMR84KaeACHDmNFHIk5I5tTPXWBuS-9gDJH6HCH6_IRUPC48JnM6dlmi",
        description:
          "The original guacamole, with ripe avocados, lime, cilantro, and just the right amount of heat.",
        culturalNote:
          "The word guacamole comes from the Aztec word 'ahuacamolli', meaning avocado sauce. It has been made for over 500 years.",
        ingredients: [
          { id: "1", name: "Ripe avocados", amount: "3" },
          { id: "2", name: "Lime juice", amount: "2 tbsp" },
          { id: "3", name: "White onion, diced", amount: "1/4 cup" },
          { id: "4", name: "Serrano chili, minced", amount: "1" },
          { id: "5", name: "Fresh cilantro", amount: "2 tbsp" },
          { id: "6", name: "Salt", amount: "To taste" },
        ],
        steps: [
          {
            id: "s1",
            title: "Prepare Avocados",
            instruction:
              "Halve and pit the avocados. Scoop flesh into a molcajete or bowl.",
            materials: ["3 ripe avocados"],
          },
          {
            id: "s2",
            title: "Mash",
            instruction:
              "Mash with a fork to desired consistency - leave some chunks for texture.",
            materials: ["Fork or molcajete"],
          },
          {
            id: "s3",
            title: "Season",
            instruction:
              "Add lime juice, onion, chili, cilantro, and salt. Mix gently.",
            materials: ["Lime", "Onion", "Chili", "Cilantro", "Salt"],
          },
          {
            id: "s4",
            title: "Serve",
            instruction:
              "Serve immediately with warm tortilla chips. Cover with plastic directly on surface to prevent browning.",
            materials: ["Tortilla chips"],
          },
        ],
      },
    ],
  },
  {
    id: "india",
    name: "India",
    flag: "🇮🇳",
    tagline: "A symphony of spices, colors, and centuries of flavor.",
    description:
      "Indian cuisine is a vast tapestry of regional traditions, where every state has its own culinary identity, united by a fearless use of spice and a deep respect for vegetarian cooking.",
    region: "Delhi",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBN1otg8SY3H_Dxl5JDkMhBhlxkUNAMmtNPZumgtv7NEHzaxNjBID2NvUbMf59nTvrecTodf3buW7xhkdqc2nE7si05Xcu0lALwuYI1LVtG3s0JfdO7l9tyazx5Wau28Rvc5-BJPyoT3TSnoS9icE8oyOdqt6mAgaChjPnK27ln3g7Mpp582waPmuvXGNZJ9AU9kn7VKa_UGt2z4DiSqpveKJ2e-Ge8RohrT3tnHt7Le--79e06APS_NuqVNMo01HzEdBAwCFtcI3pR",
    heroImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBN1otg8SY3H_Dxl5JDkMhBhlxkUNAMmtNPZumgtv7NEHzaxNjBID2NvUbMf59nTvrecTodf3buW7xhkdqc2nE7si05Xcu0lALwuYI1LVtG3s0JfdO7l9tyazx5Wau28Rvc5-BJPyoT3TSnoS9icE8oyOdqt6mAgaChjPnK27ln3g7Mpp582waPmuvXGNZJ9AU9kn7VKa_UGt2z4DiSqpveKJ2e-Ge8RohrT3tnHt7Le--79e06APS_NuqVNMo01HzEdBAwCFtcI3pR",
    cuisineLabel: "South Asian",
    recipes: [
      {
        id: "butter-chicken",
        title: "Butter Chicken",
        category: "Main Course",
        prepTime: "45 min",
        difficulty: "Medium",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBN1otg8SY3H_Dxl5JDkMhBhlxkUNAMmtNPZumgtv7NEHzaxNjBID2NvUbMf59nTvrecTodf3buW7xhkdqc2nE7si05Xcu0lALwuYI1LVtG3s0JfdO7l9tyazx5Wau28Rvc5-BJPyoT3TSnoS9icE8oyOdqt6mAgaChjPnK27ln3g7Mpp582waPmuvXGNZJ9AU9kn7VKa_UGt2z4DiSqpveKJ2e-Ge8RohrT3tnHt7Le--79e06APS_NuqVNMo01HzEdBAwCFtcI3pR",
        description:
          "Tender chicken simmered in a rich, creamy tomato sauce with warming spices and a touch of butter.",
        culturalNote:
          "Butter chicken was invented in the 1950s at Moti Mahal restaurant in Delhi, when leftover tandoori chicken was mixed with a tomato-butter gravy.",
        ingredients: [
          { id: "1", name: "Chicken thighs, cubed", amount: "600g" },
          { id: "2", name: "Yogurt", amount: "1/2 cup" },
          { id: "3", name: "Tomato puree", amount: "400g" },
          { id: "4", name: "Butter", amount: "3 tbsp" },
          { id: "5", name: "Heavy cream", amount: "1/2 cup" },
          { id: "6", name: "Garam masala", amount: "2 tsp" },
          { id: "7", name: "Kashmiri chili powder", amount: "1 tsp" },
        ],
        steps: [
          {
            id: "s1",
            title: "Marinate",
            instruction:
              "Mix chicken with yogurt, garam masala, chili powder, salt and lemon juice. Rest for 20 minutes.",
            materials: ["Chicken", "Yogurt", "Spices"],
          },
          {
            id: "s2",
            title: "Sear the Chicken",
            instruction:
              "Cook marinated chicken in butter over high heat until lightly charred. Set aside.",
            materials: ["Marinated chicken", "Butter"],
          },
          {
            id: "s3",
            title: "Make the Sauce",
            instruction:
              "In the same pan, add tomato puree, ginger-garlic paste, and simmer for 15 minutes until thickened.",
            materials: ["Tomato puree", "Ginger-garlic paste"],
          },
          {
            id: "s4",
            title: "Finish & Serve",
            instruction:
              "Add chicken back, stir in cream and butter. Simmer 5 minutes. Serve with naan or basmati rice.",
            materials: ["Chicken", "Cream", "Butter", "Naan"],
          },
        ],
      },
      {
        id: "masala-chai",
        title: "Masala Chai",
        category: "Beverage",
        prepTime: "10 min",
        difficulty: "Easy",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBN1otg8SY3H_Dxl5JDkMhBhlxkUNAMmtNPZumgtv7NEHzaxNjBID2NvUbMf59nTvrecTodf3buW7xhkdqc2nE7si05Xcu0lALwuYI1LVtG3s0JfdO7l9tyazx5Wau28Rvc5-BJPyoT3TSnoS9icE8oyOdqt6mAgaChjPnK27ln3g7Mpp582waPmuvXGNZJ9AU9kn7VKa_UGt2z4DiSqpveKJ2e-Ge8RohrT3tnHt7Le--79e06APS_NuqVNMo01HzEdBAwCFtcI3pR",
        description:
          "A warming spiced tea brewed with cardamom, cinnamon, ginger, and whole milk.",
        culturalNote:
          "Chai wallahs (tea vendors) are found on every corner in India. Each has their own secret spice blend passed down through generations.",
        ingredients: [
          { id: "1", name: "Black tea leaves", amount: "2 tsp" },
          { id: "2", name: "Whole milk", amount: "1 cup" },
          { id: "3", name: "Green cardamom pods", amount: "3" },
          { id: "4", name: "Fresh ginger, sliced", amount: "1 inch" },
          { id: "5", name: "Cinnamon stick", amount: "1 small" },
          { id: "6", name: "Sugar", amount: "To taste" },
        ],
        steps: [
          {
            id: "s1",
            title: "Crush Spices",
            instruction:
              "Lightly crush cardamom pods and break the cinnamon stick. Slice the ginger.",
            materials: ["Cardamom", "Cinnamon", "Ginger"],
          },
          {
            id: "s2",
            title: "Simmer",
            instruction:
              "Add 1 cup water, spices, and tea leaves to a saucepan. Bring to a rolling boil.",
            materials: ["Water", "Spices", "Tea leaves"],
          },
          {
            id: "s3",
            title: "Add Milk",
            instruction:
              "Pour in the milk and return to a boil. Reduce heat and simmer for 2-3 minutes.",
            materials: ["Whole milk"],
          },
          {
            id: "s4",
            title: "Strain & Serve",
            instruction:
              "Strain into cups. Add sugar to taste. Serve hot.",
            materials: ["Strainer", "Cups", "Sugar"],
          },
        ],
      },
    ],
  },
  {
    id: "thailand",
    name: "Thailand",
    flag: "🇹🇭",
    tagline: "A balance of sweet, sour, salty, and spicy in every bite.",
    description:
      "Thai cuisine is the art of balance, where fiery chilis meet cooling herbs, tangy lime meets sweet palm sugar, and every dish dances between four fundamental flavors.",
    region: "Bangkok",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC0kLX0wrOqVM8OYMZzQjhlOT9QkcfuiC83aGL_WpFkZ3Evb2Zd1X61QaShAQ_B_t4HyA4PJnLiCGatfauqjdXIrmI2tNBj6lrGO-dsaZS0DbQTHp-wAir35wa0wSp15F0DcEQlFyeydaNOIK8gYJHZmrMNFd_YOMeQQMNayZv1wIFAahpRNPkSXh8NaztGmLljxA60FD28RwFxzD_KXCTG4Y8xdeX0XE4fquIorYY9wDhR1oedLaHjMBaNY4cKu2oLWWmosUjo_lIs",
    heroImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC0kLX0wrOqVM8OYMZzQjhlOT9QkcfuiC83aGL_WpFkZ3Evb2Zd1X61QaShAQ_B_t4HyA4PJnLiCGatfauqjdXIrmI2tNBj6lrGO-dsaZS0DbQTHp-wAir35wa0wSp15F0DcEQlFyeydaNOIK8gYJHZmrMNFd_YOMeQQMNayZv1wIFAahpRNPkSXh8NaztGmLljxA60FD28RwFxzD_KXCTG4Y8xdeX0XE4fquIorYY9wDhR1oedLaHjMBaNY4cKu2oLWWmosUjo_lIs",
    cuisineLabel: "Southeast Asian",
    recipes: [
      {
        id: "pad-thai",
        title: "Pad Thai",
        category: "Main Course",
        prepTime: "30 min",
        difficulty: "Medium",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuC0kLX0wrOqVM8OYMZzQjhlOT9QkcfuiC83aGL_WpFkZ3Evb2Zd1X61QaShAQ_B_t4HyA4PJnLiCGatfauqjdXIrmI2tNBj6lrGO-dsaZS0DbQTHp-wAir35wa0wSp15F0DcEQlFyeydaNOIK8gYJHZmrMNFd_YOMeQQMNayZv1wIFAahpRNPkSXh8NaztGmLljxA60FD28RwFxzD_KXCTG4Y8xdeX0XE4fquIorYY9wDhR1oedLaHjMBaNY4cKu2oLWWmosUjo_lIs",
        description:
          "Stir-fried rice noodles with shrimp, tofu, peanuts, and the perfect sweet-tangy sauce.",
        culturalNote:
          "Pad Thai was promoted as Thailand's national dish in the 1930s as part of a campaign to build national identity and reduce rice consumption.",
        ingredients: [
          { id: "1", name: "Rice noodles (flat)", amount: "200g" },
          { id: "2", name: "Shrimp", amount: "200g" },
          { id: "3", name: "Firm tofu, cubed", amount: "100g" },
          { id: "4", name: "Tamarind paste", amount: "3 tbsp" },
          { id: "5", name: "Fish sauce", amount: "2 tbsp" },
          { id: "6", name: "Roasted peanuts, crushed", amount: "1/4 cup" },
          { id: "7", name: "Bean sprouts", amount: "1 cup" },
          { id: "8", name: "Lime", amount: "2 wedges" },
        ],
        steps: [
          {
            id: "s1",
            title: "Soak Noodles",
            instruction:
              "Soak rice noodles in warm water for 20 minutes until pliable. Drain.",
            materials: ["200g rice noodles", "Warm water"],
          },
          {
            id: "s2",
            title: "Make the Sauce",
            instruction:
              "Mix tamarind paste, fish sauce, sugar, and a splash of water.",
            materials: ["Tamarind paste", "Fish sauce", "Sugar"],
          },
          {
            id: "s3",
            title: "Stir-Fry",
            instruction:
              "Fry tofu until golden, add shrimp until pink. Push aside, scramble an egg, then add noodles and sauce. Toss everything together.",
            materials: ["Tofu", "Shrimp", "Egg", "Noodles", "Sauce"],
          },
          {
            id: "s4",
            title: "Serve",
            instruction:
              "Top with crushed peanuts, bean sprouts, lime wedges, and fresh cilantro.",
            materials: ["Peanuts", "Bean sprouts", "Lime", "Cilantro"],
          },
        ],
      },
      {
        id: "tom-yum",
        title: "Tom Yum Goong",
        category: "Soup",
        prepTime: "25 min",
        difficulty: "Easy",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuC0kLX0wrOqVM8OYMZzQjhlOT9QkcfuiC83aGL_WpFkZ3Evb2Zd1X61QaShAQ_B_t4HyA4PJnLiCGatfauqjdXIrmI2tNBj6lrGO-dsaZS0DbQTHp-wAir35wa0wSp15F0DcEQlFyeydaNOIK8gYJHZmrMNFd_YOMeQQMNayZv1wIFAahpRNPkSXh8NaztGmLljxA60FD28RwFxzD_KXCTG4Y8xdeX0XE4fquIorYY9wDhR1oedLaHjMBaNY4cKu2oLWWmosUjo_lIs",
        description:
          "A hot and sour Thai soup with plump shrimp, mushrooms, lemongrass, and kaffir lime leaves.",
        culturalNote:
          "Tom Yum is one of the most requested soups in the world and was proposed for UNESCO Intangible Cultural Heritage status.",
        ingredients: [
          { id: "1", name: "Large shrimp", amount: "300g" },
          { id: "2", name: "Lemongrass stalks", amount: "3" },
          { id: "3", name: "Kaffir lime leaves", amount: "5" },
          { id: "4", name: "Galangal, sliced", amount: "5 slices" },
          {
            id: "5",
            name: "Thai chili paste (nam prik pao)",
            amount: "2 tbsp",
          },
          { id: "6", name: "Lime juice", amount: "3 tbsp" },
          { id: "7", name: "Fish sauce", amount: "2 tbsp" },
          { id: "8", name: "Straw mushrooms", amount: "1 cup" },
        ],
        steps: [
          {
            id: "s1",
            title: "Prepare Aromatics",
            instruction:
              "Bruise lemongrass, tear lime leaves, slice galangal. These are the soul of the soup.",
            materials: ["Lemongrass", "Lime leaves", "Galangal"],
          },
          {
            id: "s2",
            title: "Build the Broth",
            instruction:
              "Bring 4 cups of water to a boil, add aromatics and simmer for 5 minutes.",
            materials: ["Water", "Aromatics"],
          },
          {
            id: "s3",
            title: "Cook Shrimp",
            instruction:
              "Add mushrooms and shrimp. Cook until shrimp turn pink, about 3 minutes. Stir in chili paste.",
            materials: ["Shrimp", "Mushrooms", "Chili paste"],
          },
          {
            id: "s4",
            title: "Season & Serve",
            instruction:
              "Remove from heat. Add lime juice and fish sauce. Garnish with cilantro and Thai chilies.",
            materials: ["Lime juice", "Fish sauce", "Cilantro"],
          },
        ],
      },
    ],
  },
];

async function seed() {
  console.log("🌱 Starting seed...");

  for (const country of COUNTRIES) {
    const { recipes, ...countryData } = country;

    await db
      .insert(countriesTable)
      .values({
        ...countryData,
        recipeCount: recipes.length,
      })
      .onConflictDoUpdate({
        target: countriesTable.id,
        set: {
          name: countryData.name,
          flag: countryData.flag,
          tagline: countryData.tagline,
          description: countryData.description,
          region: countryData.region,
          image: countryData.image,
          heroImage: countryData.heroImage,
          cuisineLabel: countryData.cuisineLabel,
          recipeCount: recipes.length,
        },
      });

    console.log(`  ✓ Country: ${country.name}`);

    for (const recipe of recipes) {
      await db
        .insert(recipesTable)
        .values({
          ...recipe,
          countryId: country.id,
        })
        .onConflictDoUpdate({
          target: recipesTable.id,
          set: {
            title: recipe.title,
            description: recipe.description,
            image: recipe.image,
            category: recipe.category,
            prepTime: recipe.prepTime,
            difficulty: recipe.difficulty,
            ingredients: recipe.ingredients,
            steps: recipe.steps,
            culturalNote: recipe.culturalNote,
          },
        });

      console.log(`    ✓ Recipe: ${recipe.title}`);
    }
  }

  console.log(`\n✅ Seeded ${COUNTRIES.length} countries and ${COUNTRIES.reduce((acc, c) => acc + c.recipes.length, 0)} recipes`);
  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
