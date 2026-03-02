import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const ADMIN_EMAIL = "tushardable04@gmail.com";

export const createProfile = mutation({
  args: {
    role: v.union(v.literal("student"), v.literal("company"), v.literal("admin")),
    // Student fields
    studentId: v.optional(v.string()),
    branch: v.optional(v.string()),
    cgpa: v.optional(v.number()),
    graduationYear: v.optional(v.number()),
    skills: v.optional(v.array(v.string())),
    phone: v.optional(v.string()),
    // Company fields
    companyName: v.optional(v.string()),
    companyDescription: v.optional(v.string()),
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if trying to create admin profile
    if (args.role === "admin") {
      if (user.email !== ADMIN_EMAIL) {
        throw new Error("Admin access is restricted to authorized personnel only");
      }
    }

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) {
      throw new Error("Profile already exists");
    }

    const profileData = {
      userId,
      isApproved: args.role === "company" ? false : true,
      ...args,
    };

    return await ctx.db.insert("profiles", profileData);
  },
});

export const getCurrentUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return { user, profile };
  },
});

export const updateProfile = mutation({
  args: {
    studentId: v.optional(v.string()),
    branch: v.optional(v.string()),
    cgpa: v.optional(v.number()),
    graduationYear: v.optional(v.number()),
    skills: v.optional(v.array(v.string())),
    phone: v.optional(v.string()),
    companyName: v.optional(v.string()),
    companyDescription: v.optional(v.string()),
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
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

    if (!profile) {
      throw new Error("Profile not found");
    }

    return await ctx.db.patch(profile._id, args);
  },
});

export const uploadResume = mutation({
  args: { resumeId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found");
    }

    return await ctx.db.patch(profile._id, { resumeId: args.resumeId });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const checkAdminEligibility = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { isEligible: false, email: null };
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return { isEligible: false, email: null };
    }

    return {
      isEligible: user.email === ADMIN_EMAIL,
      email: user.email,
    };
  },
});
