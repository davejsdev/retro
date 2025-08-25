import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface ParticipantViewProps {
  retrospectiveId: string;
  participantId: string | null;
}

type Category = "went-well" | "went-poorly" | "ideas";

const categoryConfig = {
  "went-well": {
    title: "Went Well",
    color: "bg-green-50 border-green-200",
    headerColor: "bg-green-100 text-green-800",
    buttonColor: "bg-green-600 hover:bg-green-700",
  },
  "went-poorly": {
    title: "Went Poorly",
    color: "bg-red-50 border-red-200",
    headerColor: "bg-red-100 text-red-800",
    buttonColor: "bg-red-600 hover:bg-red-700",
  },
  "ideas": {
    title: "Ideas",
    color: "bg-blue-50 border-blue-200",
    headerColor: "bg-blue-100 text-blue-800",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
  },
};

export function ParticipantView({ retrospectiveId, participantId }: ParticipantViewProps) {
  const [newCardContent, setNewCardContent] = useState<Record<Category, string>>({
    "went-well": "",
    "went-poorly": "",
    "ideas": "",
  });
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const retrospective = useQuery(api.retrospectives.getById, { id: retrospectiveId as Id<"retrospectives"> });
  const cards = useQuery(api.cards.getByRetrospective, { retrospectiveId: retrospectiveId as Id<"retrospectives"> });
  const participants = useQuery(api.retrospectives.getParticipants, { retrospectiveId: retrospectiveId as Id<"retrospectives"> });
  const participantVotes = useQuery(
    api.votes.getParticipantVotes,
    participantId ? {
      participantId: participantId as Id<"participants">,
      retrospectiveId: retrospectiveId as Id<"retrospectives">,
    } : "skip"
  );

  const createCard = useMutation(api.cards.create);
  const updateCard = useMutation(api.cards.update);
  const deleteCard = useMutation(api.cards.remove);
  const toggleVote = useMutation(api.votes.toggle);

  // Get current participant info
  const currentParticipant = participants?.find(p => p._id === participantId);

  // Get session ID and join if needed
  useEffect(() => {
    if (!participantId && retrospective) {
      // Auto-join logic would go here if needed
    }
  }, [participantId, retrospective]);

  const handleCreateCard = async (category: Category) => {
    if (!participantId || !newCardContent[category].trim()) return;

    try {
      await createCard({
        retrospectiveId: retrospectiveId as Id<"retrospectives">,
        participantId: participantId as Id<"participants">,
        category,
        content: newCardContent[category].trim(),
      });

      setNewCardContent(prev => ({ ...prev, [category]: "" }));
      toast.success("Card added!");
    } catch (error) {
      toast.error("Failed to add card");
      console.error(error);
    }
  };

  const handleUpdateCard = async (cardId: string) => {
    if (!participantId || !editContent.trim()) return;

    try {
      await updateCard({
        cardId: cardId as Id<"cards">,
        participantId: participantId as Id<"participants">,
        content: editContent.trim(),
      });

      setEditingCard(null);
      setEditContent("");
      toast.success("Card updated!");
    } catch (error) {
      toast.error("Failed to update card");
      console.error(error);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!participantId) return;

    try {
      await deleteCard({
        cardId: cardId as Id<"cards">,
        participantId: participantId as Id<"participants">,
      });

      toast.success("Card deleted!");
    } catch (error) {
      toast.error("Failed to delete card");
      console.error(error);
    }
  };

  const handleToggleVote = async (cardId: string) => {
    if (!participantId) return;

    try {
      const result = await toggleVote({
        cardId: cardId as Id<"cards">,
        participantId: participantId as Id<"participants">,
      });

      toast.success(result.action === "added" ? "Vote added!" : "Vote removed!");
    } catch (error: any) {
      if (error.message === "Vote limit reached") {
        toast.error(`You've reached your vote limit of ${retrospective?.votesPerParticipant} votes`);
      } else {
        toast.error("Failed to vote");
      }
      console.error(error);
    }
  };

  const startEditing = (cardId: string, content: string) => {
    setEditingCard(cardId);
    setEditContent(content);
  };

  const cancelEditing = () => {
    setEditingCard(null);
    setEditContent("");
  };

  const isCardVotedByUser = (cardId: string) => {
    return participantVotes?.some(vote => vote.cardId === cardId) || false;
  };

  const remainingVotes = retrospective && participantVotes 
    ? retrospective.votesPerParticipant - participantVotes.length 
    : 0;

  if (!retrospective || !cards || !participants) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!retrospective.isActive) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Retrospective Ended</h1>
        <p className="text-gray-600">This retrospective has been ended by the moderator.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{retrospective.name}</h1>
            {currentParticipant && (
              <p className="text-lg text-gray-600 mt-2">
                Welcome, <span className="font-medium text-blue-600">{currentParticipant.anonymousName}</span>
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-gray-600">
              {remainingVotes} vote{remainingVotes !== 1 ? 's' : ''} remaining
            </p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(Object.keys(categoryConfig) as Category[]).map((category) => {
          const config = categoryConfig[category];
          const categoryCards = cards.filter(card => card.category === category);

          return (
            <div key={category} className={`${config.color} rounded-xl border p-6`}>
              <div className={`${config.headerColor} rounded-lg px-4 py-3 mb-6`}>
                <h2 className="text-xl font-semibold text-center">{config.title}</h2>
              </div>

              {/* Add new card */}
              {participantId && (
                <div className="mb-6">
                  <textarea
                    value={newCardContent[category]}
                    onChange={(e) => setNewCardContent(prev => ({ ...prev, [category]: e.target.value }))}
                    placeholder={`Add a ${config.title.toLowerCase()} card...`}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    rows={3}
                  />
                  <button
                    onClick={() => handleCreateCard(category)}
                    disabled={!newCardContent[category].trim()}
                    className={`mt-2 w-full px-4 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${config.buttonColor}`}
                  >
                    Add Card
                  </button>
                </div>
              )}

              {/* Cards */}
              <div className="space-y-3">
                {categoryCards.map((card) => (
                  <div key={card._id} className="bg-white rounded-lg p-4 shadow-sm border">
                    {editingCard === card._id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateCard(card._id)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-800 mb-3">{card.content}</p>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">
                              by {card.participantName}
                            </span>
                            {participantId && card.participantId === participantId && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => startEditing(card._id, card.content)}
                                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteCard(card._id)}
                                  className="text-xs text-red-600 hover:text-red-800 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                          {participantId && (
                            <button
                              onClick={() => handleToggleVote(card._id)}
                              disabled={!isCardVotedByUser(card._id) && remainingVotes === 0}
                              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                isCardVotedByUser(card._id)
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                              }`}
                            >
                              <span>👍</span>
                              <span>{card.voteCount}</span>
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {categoryCards.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No cards yet</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
