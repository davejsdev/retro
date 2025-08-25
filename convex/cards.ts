import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getByRetrospective = query({
  args: { retrospectiveId: v.id("retrospectives") },
  handler: async (ctx, args) => {
    const cards = await ctx.db
      .query("cards")
      .withIndex("by_retrospective", (q) => q.eq("retrospectiveId", args.retrospectiveId))
      .collect();

    // Get participant info for each card
    const cardsWithParticipants = await Promise.all(
      cards.map(async (card) => {
        const participant = await ctx.db.get(card.participantId);
        return {
          ...card,
          participantName: participant?.anonymousName || "Unknown",
        };
      })
    );

    return cardsWithParticipants;
  },
});

export const create = mutation({
  args: {
    retrospectiveId: v.id("retrospectives"),
    participantId: v.id("participants"),
    category: v.union(v.literal("went-well"), v.literal("went-poorly"), v.literal("ideas")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify participant belongs to retrospective
    const participant = await ctx.db.get(args.participantId);
    if (!participant || participant.retrospectiveId !== args.retrospectiveId) {
      throw new Error("Invalid participant");
    }

    return await ctx.db.insert("cards", {
      retrospectiveId: args.retrospectiveId,
      participantId: args.participantId,
      category: args.category,
      content: args.content,
      voteCount: 0,
    });
  },
});

export const update = mutation({
  args: {
    cardId: v.id("cards"),
    participantId: v.id("participants"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (!card || card.participantId !== args.participantId) {
      throw new Error("Not authorized to edit this card");
    }

    await ctx.db.patch(args.cardId, {
      content: args.content,
    });
  },
});

export const remove = mutation({
  args: {
    cardId: v.id("cards"),
    participantId: v.id("participants"),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (!card || card.participantId !== args.participantId) {
      throw new Error("Not authorized to delete this card");
    }

    // Delete all votes for this card
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
      .collect();

    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    await ctx.db.delete(args.cardId);
  },
});
