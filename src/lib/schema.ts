import {
  boolean,
  char,
  date,
  doublePrecision,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Mirrors db/migrations. The PostGIS `location` column is left out on purpose:
// a trigger fills it from latitude/longitude, and spatial queries use raw SQL.

export const aedStatus = pgEnum("aed_status", ["pending", "approved", "rejected"]);
export const accessType = pgEnum("access_type", ["public_24_7", "business_hours", "restricted"]);
export const reportType = pgEnum("report_type", [
  "missing",
  "not_working",
  "moved",
  "access_changed",
  "other",
]);
export const reportStatus = pgEnum("report_status", ["open", "resolved", "dismissed"]);

export const defibrillators = pgTable("defibrillators", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  accessNotes: text("access_notes").notNull(),
  accessType: accessType("access_type").notNull().default("public_24_7"),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  address: text("address"),
  what3words: varchar("what3words", { length: 100 }),
  photoUrl: text("photo_url"),
  status: aedStatus("status").notNull().default("pending"),
  submittedByName: varchar("submitted_by_name", { length: 100 }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedByEmail: varchar("reviewed_by_email", { length: 255 }),
  openingHours: text("opening_hours"),
  cabinetLocked: boolean("cabinet_locked").notNull().default(false),
  guardianName: varchar("guardian_name", { length: 255 }),
  guardianContact: varchar("guardian_contact", { length: 255 }),
  lastCheckedAt: date("last_checked_at", { mode: "string" }),
  adminNotes: text("admin_notes"),
  rejectionReason: text("rejection_reason"),
  submitterIpHash: char("submitter_ip_hash", { length: 64 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const aedReports = pgTable("aed_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  defibrillatorId: uuid("defibrillator_id")
    .notNull()
    .references(() => defibrillators.id, { onDelete: "cascade" }),
  reportType: reportType("report_type").notNull(),
  details: text("details"),
  status: reportStatus("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedByEmail: varchar("resolved_by_email", { length: 255 }),
  reporterIpHash: char("reporter_ip_hash", { length: 64 }),
});

export type Defibrillator = typeof defibrillators.$inferSelect;
export type AedReport = typeof aedReports.$inferSelect;
export type AccessType = (typeof accessType.enumValues)[number];
export type AedStatus = (typeof aedStatus.enumValues)[number];
export type ReportType = (typeof reportType.enumValues)[number];
