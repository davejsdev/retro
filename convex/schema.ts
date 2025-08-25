import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  retrospectives: defineTable({
    name: v.string(),
    moderatorId: v.id("users"),
    votesPerParticipant: v.number(),
    isActive: v.boolean(),
    inviteCode: v.string(),
  }).index("by_invite_code", ["inviteCode"]),

  participants: defineTable({
    retrospectiveId: v.id("retrospectives"),
    anonymousName: v.string(),
    sessionId: v.string(),
    isModerator: v.boolean(),
    userId: v.optional(v.id("users")),
  }).index("by_retrospective", ["retrospectiveId"])
    .index("by_session", ["sessionId"]),

  cards: defineTable({
    retrospectiveId: v.id("retrospectives"),
    participantId: v.id("participants"),
    category: v.union(v.literal("went-well"), v.literal("went-poorly"), v.literal("ideas")),
    content: v.string(),
    voteCount: v.number(),
  }).index("by_retrospective", ["retrospectiveId"])
    .index("by_retrospective_and_category", ["retrospectiveId", "category"]),

  votes: defineTable({
    cardId: v.id("cards"),
    participantId: v.id("participants"),
    retrospectiveId: v.id("retrospectives"),
  }).index("by_card", ["cardId"])
    .index("by_participant", ["participantId"])
    .index("by_retrospective", ["retrospectiveId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
