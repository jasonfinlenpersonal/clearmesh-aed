import { z } from "zod";
import { inAustralia, normaliseW3w } from "./geo";
import { accessType, reportType } from "./schema";

// Empty form fields arrive as "", which we store as NULL.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters.`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

const coordinates = {
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
};

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal(""), z.boolean()])
  .optional()
  .transform((v) => v === true || v === "on" || v === "true");

const what3words = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    const n = normaliseW3w(v);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "That doesn't look like a what3words address (///word.word.word)." });
      return z.NEVER;
    }
    return n;
  });

const aedFields = {
  title: z.string().trim().min(3, "Give it a short name, e.g. 'Coles Bondi Junction'.").max(120),
  description: optionalText(2000),
  accessNotes: z.string().trim().min(5, "Say where exactly the AED is mounted.").max(1000),
  accessType: z.enum(accessType.enumValues),
  ...coordinates,
  address: optionalText(300),
  what3words,
  openingHours: optionalText(200),
  cabinetLocked: checkbox,
  guardianName: optionalText(200),
};

function australia<T extends { latitude: number; longitude: number }>(v: T, ctx: z.RefinementCtx) {
  if (!inAustralia(v.latitude, v.longitude)) {
    ctx.addIssue({ code: "custom", path: ["latitude"], message: "The pin needs to be in Australia." });
  }
}

export const submissionSchema = z
  .object({ ...aedFields, submittedByName: optionalText(100) })
  .superRefine(australia);

export const adminEditSchema = z
  .object({
    ...aedFields,
    guardianContact: optionalText(200),
    adminNotes: optionalText(4000),
    lastCheckedAt: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use a date."),
  })
  .superRefine(australia);

export const reportSchema = z.object({
  reportType: z.enum(reportType.enumValues),
  details: optionalText(1000),
});

export function firstErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const k = String(issue.path[0] ?? "form");
    out[k] ??= issue.message;
  }
  return out;
}
