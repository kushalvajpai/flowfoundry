import { z } from "zod";

/**
 * Zod schema for validating the output returned by the AI qualification engine.
 * Matches the required schema contract:
 * {
 *   "lead_score": 0-100,
 *   "classification": "HOT" | "WARM" | "COLD",
 *   "business_type": string,
 *   "primary_problem": string,
 *   "automation_opportunity": string,
 *   "estimated_priority": "HIGH" | "MEDIUM" | "LOW",
 *   "recommended_next_step": string,
 *   "reasoning": string
 * }
 */
export const aiQualificationSchema = z.object({
  lead_score: z
    .number({ required_error: "lead_score is required" })
    .int("lead_score must be an integer")
    .min(0, "lead_score must be between 0 and 100")
    .max(100, "lead_score must be between 0 and 100"),

  classification: z.enum(["HOT", "WARM", "COLD"], {
    required_error: "classification must be HOT, WARM, or COLD",
  }),

  business_type: z
    .string({ required_error: "business_type is required" })
    .trim()
    .min(1, "business_type cannot be empty"),

  primary_problem: z
    .string({ required_error: "primary_problem is required" })
    .trim()
    .min(1, "primary_problem cannot be empty"),

  automation_opportunity: z
    .string({ required_error: "automation_opportunity is required" })
    .trim()
    .min(1, "automation_opportunity cannot be empty"),

  estimated_priority: z.enum(["HIGH", "MEDIUM", "LOW"], {
    required_error: "estimated_priority must be HIGH, MEDIUM, or LOW",
  }),

  recommended_next_step: z
    .string({ required_error: "recommended_next_step is required" })
    .trim()
    .min(1, "recommended_next_step cannot be empty"),

  reasoning: z
    .string({ required_error: "reasoning is required" })
    .trim()
    .min(1, "reasoning cannot be empty"),
});

export type AIQualification = z.infer<typeof aiQualificationSchema>;
