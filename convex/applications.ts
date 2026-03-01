import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const applyForJob = mutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || profile.role !== "student") {
      throw new Error("Only students can apply for jobs");
    }

    // Check if already applied
    const existingApplication = await ctx.db
      .query("applications")
      .withIndex("by_student_job", (q) => 
        q.eq("studentId", userId).eq("jobId", args.jobId)
      )
      .unique();

    if (existingApplication) {
      throw new Error("Already applied for this job");
    }

    // Check job eligibility
    const job = await ctx.db.get(args.jobId);
    if (!job || !job.isActive) {
      throw new Error("Job not available");
    }

    if (job.deadline < Date.now()) {
      throw new Error("Application deadline has passed");
    }

    // Check eligibility criteria
    if (profile.cgpa && profile.cgpa < job.eligibilityCriteria.minCgpa) {
      throw new Error("CGPA requirement not met");
    }

    if (profile.branch && !job.eligibilityCriteria.branches.includes(profile.branch)) {
      throw new Error("Branch eligibility not met");
    }

    if (profile.graduationYear && profile.graduationYear !== job.eligibilityCriteria.graduationYear) {
      throw new Error("Graduation year requirement not met");
    }

    return await ctx.db.insert("applications", {
      studentId: userId,
      jobId: args.jobId,
      status: "applied",
      appliedAt: Date.now(),
    });
  },
});

export const getApplications = query({
  args: {
    studentId: v.optional(v.id("users")),
    jobId: v.optional(v.id("jobs")),
    status: v.optional(v.union(
      v.literal("applied"),
      v.literal("shortlisted"),
      v.literal("rejected"),
      v.literal("selected")
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let applications;

    if (args.studentId) {
      applications = await ctx.db
        .query("applications")
        .withIndex("by_student", (q) => q.eq("studentId", args.studentId!))
        .collect();
    } else if (args.jobId) {
      applications = await ctx.db
        .query("applications")
        .withIndex("by_job", (q) => q.eq("jobId", args.jobId!))
        .collect();
    } else if (args.status) {
      applications = await ctx.db
        .query("applications")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      applications = await ctx.db.query("applications").collect();
    }

    // Get job and student details
    const applicationsWithDetails = await Promise.all(
      applications.map(async (app) => {
        const job = await ctx.db.get(app.jobId);
        const studentProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", app.studentId))
          .unique();
        
        const student = await ctx.db.get(app.studentId);

        return {
          ...app,
          job,
          student: {
            ...student,
            profile: studentProfile,
          },
        };
      })
    );

    return applicationsWithDetails;
  },
});

export const updateApplicationStatus = mutation({
  args: {
    applicationId: v.id("applications"),
    status: v.union(
      v.literal("applied"),
      v.literal("shortlisted"),
      v.literal("rejected"),
      v.literal("selected")
    ),
    notes: v.optional(v.string()),
    interviewDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      throw new Error("Application not found");
    }

    const job = await ctx.db.get(application.jobId);
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

    return await ctx.db.patch(args.applicationId, {
      status: args.status,
      notes: args.notes,
      interviewDate: args.interviewDate,
    });
  },
});

export const getMyApplications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const applications = await ctx.db
      .query("applications")
      .withIndex("by_student", (q) => q.eq("studentId", userId))
      .collect();

    const applicationsWithJobs = await Promise.all(
      applications.map(async (app) => {
        const job = await ctx.db.get(app.jobId);
        const companyProfile = job ? await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", job.companyId))
          .unique() : null;

        return {
          ...app,
          job: {
            ...job,
            companyName: companyProfile?.companyName || "Unknown Company",
          },
        };
      })
    );

    return applicationsWithJobs;
  },
});
