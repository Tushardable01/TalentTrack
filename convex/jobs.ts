import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createJob = mutation({
  args: {
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
    maxApplications: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || profile.role !== "company" || !profile.isApproved) {
      throw new Error("Only approved companies can post jobs");
    }

    return await ctx.db.insert("jobs", {
      companyId: userId,
      isActive: true,
      ...args,
    });
  },
});

export const getJobs = query({
  args: {
    companyId: v.optional(v.id("users")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let jobs;

    if (args.companyId) {
      jobs = await ctx.db
        .query("jobs")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId!))
        .collect();
    } else if (args.isActive !== undefined) {
      jobs = await ctx.db
        .query("jobs")
        .withIndex("by_active", (q) => q.eq("isActive", args.isActive!))
        .collect();
    } else {
      jobs = await ctx.db.query("jobs").collect();
    }

    // Get company details for each job
    const jobsWithCompany = await Promise.all(
      jobs.map(async (job) => {
        const companyProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", job.companyId))
          .unique();
        
        const applicationCount = await ctx.db
          .query("applications")
          .withIndex("by_job", (q) => q.eq("jobId", job._id))
          .collect();

        return {
          ...job,
          companyName: companyProfile?.companyName || "Unknown Company",
          applicationCount: applicationCount.length,
        };
      })
    );

    return jobsWithCompany;
  },
});

export const getJobById = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      return null;
    }

    const companyProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", job.companyId))
      .unique();

    const applicationCount = await ctx.db
      .query("applications")
      .withIndex("by_job", (q) => q.eq("jobId", job._id))
      .collect();

    return {
      ...job,
      companyName: companyProfile?.companyName || "Unknown Company",
      companyDescription: companyProfile?.companyDescription,
      applicationCount: applicationCount.length,
    };
  },
});

export const updateJobStatus = mutation({
  args: {
    jobId: v.id("jobs"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || (profile.role !== "admin" && job.companyId !== userId)) {
      throw new Error("Not authorized");
    }

    return await ctx.db.patch(args.jobId, { isActive: args.isActive });
  },
});
