import { z } from "zod";

export const leadSubmissionSchema = z.object({
  fullName: z
    .string({ required_error: "Full name is required" })
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters"),

  companyName: z
    .string({ required_error: "Company name is required" })
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must not exceed 100 characters"),

  email: z
    .string({ required_error: "Work email is required" })
    .trim()
    .email("Please provide a valid corporate email address")
    .max(150, "Email must not exceed 150 characters"),

  phone: z
    .string()
    .trim()
    .max(30, "Phone number must not exceed 30 characters")
    .regex(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,20}$/,
      "Please provide a valid phone number"
    )
    .optional()
    .or(z.literal("")),

  website: z
    .string()
    .trim()
    .max(200, "Website URL must not exceed 200 characters")
    .refine(
      (val) => {
        if (!val || val.length === 0) return true;
        return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i.test(val);
      },
      { message: "Please provide a valid domain or URL (e.g. company.com or https://company.com)" }
    )
    .optional()
    .or(z.literal("")),

  industry: z
    .string({ required_error: "Industry is required" })
    .trim()
    .min(1, "Please select your primary industry")
    .max(100, "Industry must not exceed 100 characters"),

  employees: z
    .string({ required_error: "Employee count is required" })
    .trim()
    .min(1, "Please select employee count range")
    .max(50, "Employee count must not exceed 50 characters"),

  monthlyLeadVolume: z
    .string({ required_error: "Monthly lead volume is required" })
    .trim()
    .min(1, "Please select monthly lead volume range")
    .max(50, "Monthly lead volume must not exceed 50 characters"),

  biggestProblem: z
    .string({ required_error: "Business problem description is required" })
    .trim()
    .min(10, "Please describe the business problem in at least 10 characters")
    .max(3000, "Description must not exceed 3000 characters"),

  currentTools: z
    .string({ required_error: "Current tools are required" })
    .trim()
    .min(2, "Please specify current tools or stack")
    .max(500, "Current tools must not exceed 500 characters"),

  additionalInformation: z
    .string()
    .trim()
    .max(3000, "Additional information must not exceed 3000 characters")
    .optional()
    .or(z.literal("")),
});

export type ValidatedLeadInput = z.infer<typeof leadSubmissionSchema>;
