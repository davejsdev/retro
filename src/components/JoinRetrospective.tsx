import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface JoinRetrospectiveProps {
  onJoin: (retrospectiveId: string, participantId: string) => void;
}

export function JoinRetrospective({ onJoin }: JoinRetrospectiveProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Get invite code from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("invite");
    if (code) {
      setInviteCode(code);
    }
  }, []);

  const retrospective = useQuery(
    api.retrospectives.getByInviteCode,
    inviteCode ? { inviteCode } : "skip"
  );

  const joinRetrospective = useMutation(api.retrospectives.joinAsParticipant);

  const handleJoin = async () => {
    if (!retrospective) return;

    setIsJoining(true);
    try {
      // Generate a session ID for this browser session
      let sessionId = localStorage.getItem("retrospective-session-id");
      if (!sessionId) {
        sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2)}`;
        localStorage.setItem("retrospective-session-id", sessionId);
      }

      const participantId = await joinRetrospective({
        inviteCode,
        sessionId,
      });

      toast.success("Joined retrospective successfully!");
      onJoin(retrospective._id, participantId);
    } catch (error) {
      toast.error("Failed to join retrospective");
      console.error(error);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Join Retrospective
        </h1>

        <div className="space-y-4">
          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
              Invite Code
            </label>
            <input
              type="text"
              id="inviteCode"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter invite code"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-center text-lg font-mono"
              maxLength={6}
            />
          </div>

          {retrospective === undefined && inviteCode && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}

          {retrospective === null && inviteCode && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm text-center">
                Invalid or expired invite code
              </p>
            </div>
          )}

          {retrospective && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-900">{retrospective.name}</h3>
              <p className="text-sm text-green-700 mt-1">
                {retrospective.votesPerParticipant} votes per participant
              </p>
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={!retrospective || isJoining}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isJoining ? "Joining..." : "Join Retrospective"}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            You'll be assigned a random anonymous name when you join
          </p>
        </div>
      </div>
    </div>
  );
}
