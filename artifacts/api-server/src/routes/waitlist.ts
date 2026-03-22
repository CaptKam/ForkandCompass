import { Router } from "express";
import { db, waitlistEmails } from "@workspace/db";

const router = Router();

router.post("/waitlist", async (req, res) => {
  try {
    const { email, source } = req.body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }

    await db
      .insert(waitlistEmails)
      .values({ email: email.toLowerCase().trim(), source: source || "hero" })
      .onConflictDoNothing();

    res.json({ success: true });
  } catch (error) {
    console.error("Waitlist signup error:", error);
    res.status(500).json({ error: "Failed to save email" });
  }
});

export default router;
