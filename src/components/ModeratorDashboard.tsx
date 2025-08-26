import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

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

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Your Retrospectives</CardTitle>
            <Button onClick={() => setShowCreateForm(true)}>
              Create New Retrospective
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showCreateForm && (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Retrospective</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Retrospective Name</Label>
                  <Input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Sprint 23 Retrospective"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="votes">Votes per Participant</Label>
                  <Select value={votesPerParticipant.toString()} onValueChange={(value) => setVotesPerParticipant(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 vote</SelectItem>
                      <SelectItem value="2">2 votes</SelectItem>
                      <SelectItem value="3">3 votes</SelectItem>
                      <SelectItem value="5">5 votes</SelectItem>
                      <SelectItem value="10">10 votes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isCreating || !name.trim()}
                  >
                    {isCreating ? "Creating..." : "Create Retrospective"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyInviteLink(retro.inviteCode)}
                          >
                            Copy Invite Link
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onCreateRetrospective(retro._id)}
                          >
                            Open
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
