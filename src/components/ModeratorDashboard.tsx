import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface ModeratorDashboardProps {
  onCreateRetrospective: (retrospectiveId: string) => void;
}

export function ModeratorDashboard({ onCreateRetrospective }: ModeratorDashboardProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [votesPerParticipant, setVotesPerParticipant] = useState(3);
  const [isCreating, setIsCreating] = useState(false);

  const myRetrospectives = useQuery(api.retrospectives.getMyRetrospectives);
  const createRetrospective = useMutation(api.retrospectives.create);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      const result = await createRetrospective({
        name: name.trim(),
        votesPerParticipant,
      });
      
      toast.success("Retrospective created successfully!");
      setName("");
      setVotesPerParticipant(3);
      setShowCreateForm(false);
      onCreateRetrospective(result.retrospectiveId);
    } catch (error) {
      toast.error("Failed to create retrospective");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const copyInviteLink = (inviteCode: string) => {
    const url = `${window.location.origin}?invite=${inviteCode}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied to clipboard!");
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Moderator Dashboard</h1>
        <p className="text-xl text-gray-600">Create and manage team retrospectives</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Your Retrospectives</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create New Retrospective
          </button>
        </div>

        {showCreateForm && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Retrospective</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Retrospective Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Sprint 23 Retrospective"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label htmlFor="votes" className="block text-sm font-medium text-gray-700 mb-2">
                  Votes per Participant
                </label>
                <select
                  id="votes"
                  value={votesPerParticipant}
                  onChange={(e) => setVotesPerParticipant(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                >
                  <option value={1}>1 vote</option>
                  <option value={2}>2 votes</option>
                  <option value={3}>3 votes</option>
                  <option value={5}>5 votes</option>
                  <option value={10}>10 votes</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isCreating || !name.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isCreating ? "Creating..." : "Create Retrospective"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {myRetrospectives === undefined ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : myRetrospectives.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No retrospectives yet</p>
              <p className="text-sm">Create your first retrospective to get started</p>
            </div>
          ) : (
            myRetrospectives.map((retro) => (
              <div key={retro._id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{retro.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {retro.votesPerParticipant} votes per participant • 
                      <span className={`ml-1 ${retro.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {retro.isActive ? 'Active' : 'Ended'}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created {new Date(retro._creationTime).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {retro.isActive && (
                      <>
                        <button
                          onClick={() => copyInviteLink(retro.inviteCode)}
                          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          Copy Invite Link
                        </button>
                        <button
                          onClick={() => onCreateRetrospective(retro._id)}
                          className="px-3 py-2 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
                        >
                          Open
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
