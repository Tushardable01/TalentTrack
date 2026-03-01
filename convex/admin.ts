import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const ADMIN_EMAIL = "tushardable04@gmail.com";

const verifyAdminAccess = async (ctx: any) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db.get(userId);
  if (!user || user.email !== ADMIN_EMAIL) {
    throw new Error("Admin access denied - unauthorized user");
  }

  const adminProfile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .unique();

  if (!adminProfile || adminProfile.role !== "admin") {
    throw new Error("Admin profile required");
  }

  return { userId, user, adminProfile };
};

export const approveCompany = mutation({
  args: {
    companyId: v.id("users"),
    isApproved: v.boolean(),
  },
  handler: async (ctx, args) => {
    await verifyAdminAccess(ctx);

    const companyProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.companyId))
      .unique();

    if (!companyProfile || companyProfile.role !== "company") {
      throw new Error("Company not found");
    }

    return await ctx.db.patch(companyProfile._id, { isApproved: args.isApproved });
  },
});

export const getPendingCompanies = query({
  args: {},
  handler: async (ctx) => {
    await verifyAdminAccess(ctx);

    const pendingCompanies = await ctx.db
      .query("profiles")
      .withIndex("by_company_approval", (q) => 
        q.eq("role", "company").eq("isApproved", false)
      )
      .collect();

    const companiesWithUsers = await Promise.all(
      pendingCompanies.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return { ...profile, user };
      })
    );

    return companiesWithUsers;
  },
});

export const getAnalytics = query({
  args: {},
  handler: async (ctx) => {
    await verifyAdminAccess(ctx);

    // Get total counts
    const totalStudents = await ctx.db
      .query("profiles")
      .withIndex("by_role", (q) => q.eq("role", "student"))
      .collect();

    const totalCompanies = await ctx.db
      .query("profiles")
      .withIndex("by_role", (q) => q.eq("role", "company"))
      .collect();

    const totalJobs = await ctx.db.query("jobs").collect();
    const totalApplications = await ctx.db.query("applications").collect();

    // Get placement statistics
    const selectedApplications = await ctx.db
      .query("applications")
      .withIndex("by_status", (q) => q.eq("status", "selected"))
      .collect();

    // Calculate average package
    const packagesPromises = selectedApplications.map(async (app) => {
      const job = await ctx.db.get(app.jobId);
      return job?.package || 0;
    });
    const packages = await Promise.all(packagesPromises);
    const averagePackage = packages.length > 0 
      ? packages.reduce((sum, pkg) => sum + pkg, 0) / packages.length 
      : 0;

    // Branch-wise placement stats
    const branchStats: Record<string, number> = {};
    for (const app of selectedApplications) {
      const studentProfile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", app.studentId))
        .unique();
      
      if (studentProfile?.branch) {
        branchStats[studentProfile.branch] = (branchStats[studentProfile.branch] || 0) + 1;
      }
    }

    return {
      totalStudents: totalStudents.length,
      totalCompanies: totalCompanies.filter(c => c.isApproved).length,
      pendingCompanies: totalCompanies.filter(c => !c.isApproved).length,
      totalJobs: totalJobs.length,
      totalApplications: totalApplications.length,
      totalPlacements: selectedApplications.length,
      averagePackage,
      branchStats,
      placementRate: totalStudents.length > 0 
        ? (selectedApplications.length / totalStudents.length) * 100 
        : 0,
    };
  },
});

export const getAllStudents = query({
  args: {},
  handler: async (ctx) => {
    await verifyAdminAccess(ctx);

    const studentProfiles = await ctx.db
      .query("profiles")
      .withIndex("by_role", (q) => q.eq("role", "student"))
      .collect();

    const studentsWithDetails = await Promise.all(
      studentProfiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        const applications = await ctx.db
          .query("applications")
          .withIndex("by_student", (q) => q.eq("studentId", profile.userId))
          .collect();

        const selectedApplications = applications.filter(app => app.status === "selected");

        return {
          ...profile,
          user,
          totalApplications: applications.length,
          isPlaced: selectedApplications.length > 0,
        };
      })
    );

    return studentsWithDetails;
  },
});
