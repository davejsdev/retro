import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { ModeratorDashboard } from "./components/ModeratorDashboard";
import { ParticipantView } from "./components/ParticipantView";
import { JoinRetrospective } from "./components/JoinRetrospective";
import { useState, useEffect } from "react";

export default function App() {
  const [currentView, setCurrentView] = useState<"dashboard" | "join" | "retrospective">("dashboard");
  const [retrospectiveId, setRetrospectiveId] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);

  // Check URL for invite code
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get("invite");
    if (inviteCode) {
      setCurrentView("join");
    }
  }, []);

  const handleJoinRetrospective = (retId: string, partId: string) => {
    setRetrospectiveId(retId);
    setParticipantId(partId);
    setCurrentView("retrospective");
  };

  const handleCreateRetrospective = (retId: string) => {
    setRetrospectiveId(retId);
    setCurrentView("retrospective");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <div className="flex items-center gap-4">
          <h2 
            className="text-xl font-semibold text-blue-600 cursor-pointer hover:text-blue-700 transition-colors"
            onClick={() => setCurrentView("dashboard")}
          >
            Team Retrospective
          </h2>
          {currentView !== "dashboard" && (
            <button
              onClick={() => setCurrentView("dashboard")}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Dashboard
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          {currentView === "dashboard" && (
            <button
              onClick={() => setCurrentView("join")}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Join Retrospective
            </button>
          )}
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 p-4">
        <Content 
          currentView={currentView}
          retrospectiveId={retrospectiveId}
          participantId={participantId}
          onJoinRetrospective={handleJoinRetrospective}
          onCreateRetrospective={handleCreateRetrospective}
        />
      </main>
      <Toaster />
    </div>
  );
}

function Content({ 
  currentView, 
  retrospectiveId, 
  participantId,
  onJoinRetrospective,
  onCreateRetrospective 
}: {
  currentView: "dashboard" | "join" | "retrospective";
  retrospectiveId: string | null;
  participantId: string | null;
  onJoinRetrospective: (retId: string, partId: string) => void;
  onCreateRetrospective: (retId: string) => void;
}) {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (currentView === "join") {
    return <JoinRetrospective onJoin={onJoinRetrospective} />;
  }

  if (currentView === "retrospective" && retrospectiveId) {
    return (
      <ParticipantView 
        retrospectiveId={retrospectiveId} 
        participantId={participantId}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Authenticated>
        <ModeratorDashboard onCreateRetrospective={onCreateRetrospective} />
      </Authenticated>
      <Unauthenticated>
        <div className="max-w-md mx-auto mt-20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Team Retrospective</h1>
            <p className="text-gray-600">Sign in to create and moderate retrospectives</p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}
