import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getParticipantVotes = query({
  args: {
    participantId: v.id("participants"),
    retrospectiveId: v.id("retrospectives"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("votes")
      .withIndex("by_participant", (q) => q.eq("participantId", args.participantId))
      .filter((q) => q.eq(q.field("retrospectiveId"), args.retrospectiveId))
      .collect();
  },
});

export const toggle = mutation({
  args: {
    cardId: v.id("cards"),
    participantId: v.id("participants"),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (!card) {
      throw new Error("Card not found");
    }

    const participant = await ctx.db.get(args.participantId);
    if (!participant || participant.retrospectiveId !== card.retrospectiveId) {
      throw new Error("Invalid participant");
    }

    const retrospective = await ctx.db.get(card.retrospectiveId);
    if (!retrospective) {
      throw new Error("Retrospective not found");
    }

    // Check if vote already exists
    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
      .filter((q) => q.eq(q.field("participantId"), args.participantId))
      .unique();

    if (existingVote) {
      // Remove vote
      await ctx.db.delete(existingVote._id);
      await ctx.db.patch(args.cardId, {
        voteCount: card.voteCount - 1,
      });
      return { action: "removed" };
    } else {
      // Check if participant has reached vote limit
      const participantVotes = await ctx.db
        .query("votes")
        .withIndex("by_participant", (q) => q.eq("participantId", args.participantId))
        .filter((q) => q.eq(q.field("retrospectiveId"), card.retrospectiveId))
        .collect();

      if (participantVotes.length >= retrospective.votesPerParticipant) {
        throw new Error("Vote limit reached");
      }

      // Add vote
      await ctx.db.insert("votes", {
        cardId: args.cardId,
        participantId: args.participantId,
        retrospectiveId: card.retrospectiveId,
      });

      await ctx.db.patch(args.cardId, {
        voteCount: card.voteCount + 1,
      });
      return { action: "added" };
    }
  },
});
