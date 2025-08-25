import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateAnonymousName(): string {
  const adjectives = ["Creative", "Thoughtful", "Insightful", "Brilliant", "Clever", "Wise", "Bold", "Curious"];
  const animals = ["Owl", "Fox", "Eagle", "Dolphin", "Lion", "Tiger", "Bear", "Wolf"];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adjective} ${animal}`;
}

export const create = mutation({
  args: {
    name: v.string(),
    votesPerParticipant: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create retrospective");
    }

    const inviteCode = generateInviteCode();
    const retrospectiveId = await ctx.db.insert("retrospectives", {
      name: args.name,
      moderatorId: userId,
      votesPerParticipant: args.votesPerParticipant,
      isActive: true,
      inviteCode,
    });

    // Create moderator participant
    const anonymousName = generateAnonymousName();
    await ctx.db.insert("participants", {
      retrospectiveId,
      anonymousName,
      sessionId: `moderator-${userId}`,
      isModerator: true,
      userId,
    });

    return { retrospectiveId, inviteCode };
  },
});

export const getByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const retrospective = await ctx.db
      .query("retrospectives")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .unique();
    
    if (!retrospective || !retrospective.isActive) {
      return null;
    }

    return retrospective;
  },
});

export const getById = query({
  args: { id: v.id("retrospectives") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getMyRetrospectives = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("retrospectives")
      .filter((q) => q.eq(q.field("moderatorId"), userId))
      .order("desc")
      .collect();
  },
});

export const joinAsParticipant = mutation({
  args: {
    inviteCode: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const retrospective = await ctx.db
      .query("retrospectives")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .unique();

    if (!retrospective || !retrospective.isActive) {
      throw new Error("Retrospective not found or inactive");
    }

    // Check if participant already exists
    const existingParticipant = await ctx.db
      .query("participants")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("retrospectiveId"), retrospective._id))
      .unique();

    if (existingParticipant) {
      return existingParticipant._id;
    }

    // Create new participant
    const anonymousName = generateAnonymousName();
    const participantId = await ctx.db.insert("participants", {
      retrospectiveId: retrospective._id,
      anonymousName,
      sessionId: args.sessionId,
      isModerator: false,
    });

    return participantId;
  },
});

export const getParticipants = query({
  args: { retrospectiveId: v.id("retrospectives") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("participants")
      .withIndex("by_retrospective", (q) => q.eq("retrospectiveId", args.retrospectiveId))
      .collect();
  },
});

export const updateSettings = mutation({
  args: {
    retrospectiveId: v.id("retrospectives"),
    votesPerParticipant: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const retrospective = await ctx.db.get(args.retrospectiveId);
    if (!retrospective || retrospective.moderatorId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.retrospectiveId, {
      votesPerParticipant: args.votesPerParticipant,
    });
  },
});

export const endRetrospective = mutation({
  args: { retrospectiveId: v.id("retrospectives") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const retrospective = await ctx.db.get(args.retrospectiveId);
    if (!retrospective || retrospective.moderatorId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.retrospectiveId, {
      isActive: false,
    });
  },
});
