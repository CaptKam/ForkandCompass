import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

interface GroceryLineItem {
  name: string;
  amount: string;
  recipeName?: string;
}

function parseAmount(raw: string): { quantity: number; unit: string } {
  const cleaned = raw.trim();
  const match = cleaned.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)?/);
  if (match) {
    const quantity = parseFloat(match[1].replace(",", "."));
    const rawUnit = (match[2] ?? "each").toLowerCase();
    const unitMap: Record<string, string> = {
      g: "g", gram: "g", grams: "g",
      kg: "kg", kilogram: "kg", kilograms: "kg",
      ml: "ml", milliliter: "ml", millilitre: "ml",
      l: "l", liter: "l", litre: "l",
      oz: "oz", ounce: "oz", ounces: "oz",
      lb: "lb", lbs: "lb", pound: "lb", pounds: "lb",
      tsp: "tsp", teaspoon: "tsp", teaspoons: "tsp",
      tbsp: "tbsp", tablespoon: "tbsp", tablespoons: "tbsp",
      cup: "cup", cups: "cup",
      clove: "each", cloves: "each",
      bunch: "each", handful: "each", pinch: "each",
    };
    return { quantity: isNaN(quantity) ? 1 : quantity, unit: unitMap[rawUnit] ?? "each" };
  }
  return { quantity: 1, unit: "each" };
}

router.post("/instacart/shopping-list", async (req: Request, res: Response) => {
  const apiKey = process.env["INSTACART_API_KEY"];
  if (!apiKey) {
    return res.status(503).json({ error: "Instacart API key not configured" });
  }

  const { items, title } = req.body as { items: GroceryLineItem[]; title?: string };

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items array is required" });
  }

  const lineItems = items.map((item) => {
    const { quantity, unit } = parseAmount(item.amount);
    return {
      name: item.name,
      display_text: `${item.name} (${item.amount})`,
      quantity,
      unit,
    };
  });

  try {
    const response = await fetch(
      "https://connect.instacart.com/idp/v1/products/products_link",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title ?? "My Culinary Grocery List",
          link_type: "shopping_list",
          line_items: lineItems,
          landing_page_configuration: {
            enable_pantry_items: false,
          },
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = (await response.json()) as { url: string };
    return res.json({ url: data.url });
  } catch (err) {
    return res.status(500).json({ error: "Failed to reach Instacart API" });
  }
});

export default router;
