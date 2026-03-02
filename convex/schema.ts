import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Extended user profiles
  profiles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("student"), v.literal("company"), v.literal("admin")),
    // Student specific fields
    studentId: v.optional(v.string()),
    branch: v.optional(v.string()),
    cgpa: v.optional(v.number()),
    graduationYear: v.optional(v.number()),
    skills: v.optional(v.array(v.string())),
    resumeId: v.optional(v.id("_storage")),
    phone: v.optional(v.string()),
    // Company specific fields
    companyName: v.optional(v.string()),
    companyDescription: v.optional(v.string()),
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
    isApproved: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_role", ["role"])
    .index("by_company_approval", ["role", "isApproved"]),

  // Job postings
  jobs: defineTable({
    companyId: v.id("users"),
    title: v.string(),
    description: v.string(),
    requirements: v.array(v.string()),
    package: v.number(),
    location: v.string(),
    jobType: v.union(v.literal("full-time"), v.literal("internship")),
    eligibilityCriteria: v.object({
      minCgpa: v.number(),
      branches: v.array(v.string()),
      graduationYear: v.number(),
    }),
    deadline: v.number(),
    isActive: v.boolean(),
    maxApplications: v.optional(v.number()),
  })
    .index("by_company", ["companyId"])
    .index("by_active", ["isActive"])
    .index("by_deadline", ["deadline"]),

  // Job applications
  applications: defineTable({
    studentId: v.id("users"),
    jobId: v.id("jobs"),
    status: v.union(
      v.literal("applied"),
      v.literal("shortlisted"),
      v.literal("rejected"),
      v.literal("selected")
    ),
    appliedAt: v.number(),
    notes: v.optional(v.string()),
    interviewDate: v.optional(v.number()),
  })
    .index("by_student", ["studentId"])
    .index("by_job", ["jobId"])
    .index("by_status", ["status"])
    .index("by_student_job", ["studentId", "jobId"]),

  // Placement drives
  drives: defineTable({
    name: v.string(),
    description: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    isActive: v.boolean(),
    jobIds: v.array(v.id("jobs")),
  })
    .index("by_active", ["isActive"])
    .index("by_date", ["startDate"]),

  // Analytics data
  analytics: defineTable({
    type: v.union(
      v.literal("placement"),
      v.literal("application"),
      v.literal("company_visit")
    ),
    data: v.object({
      studentId: v.optional(v.id("users")),
      companyId: v.optional(v.id("users")),
      jobId: v.optional(v.id("jobs")),
      package: v.optional(v.number()),
      branch: v.optional(v.string()),
    }),
    timestamp: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_timestamp", ["timestamp"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
