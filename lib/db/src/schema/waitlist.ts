import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";

export const waitlistEmails = pgTable("waitlist_emails", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  source: varchar("source", { length: 50 }).notNull().default("hero"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
