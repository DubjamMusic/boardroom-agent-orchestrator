import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Hand, 
  Pause, 
  Play, 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquare,
  Bot,
  Clock,
  XCircle,
  ThumbsUp
} from "lucide-react";

const interventionTypeIcons = {
  pause: Pause,
  resume: Play,
  override: AlertTriangle,
  feedback: MessageSquare,
  abort: XCircle,
  approve: ThumbsUp,
};

const interventionTypeColors = {
  pause: "bg-accent/20 text-accent",
  resume: "bg-primary/20 text-primary",
  override: "bg-chart-5/20 text-chart-5",
  feedback: "bg-chart-2/20 text-chart-2",
  abort: "bg-destructive/20 text-destructive",
  approve: "bg-chart-1/20 text-chart-1",
};

export default function Intervention() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newIntervention, setNewIntervention] = useState({
    agentId: "",
    interventionType: "pause" as "pause" | "resume" | "override" | "feedback" | "abort" | "approve",
    reason: "",
  });

  const utils = trpc.useUtils();
  const { data: interventions, isLoading } = trpc.intervention.list.useQuery({ limit: 100 });
  const { data: agents } = trpc.agent.list.useQuery();

  const createIntervention = trpc.intervention.create.useMutation({
    onSuccess: () => {
      utils.intervention.list.invalidate();
      utils.agent.list.invalidate();
      setIsCreateOpen(false);
      setNewIntervention({
        agentId: "",
        interventionType: "pause",
        reason: "",
      });
      toast.success("Intervention recorded successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreate = () => {
    if (!newIntervention.agentId) {
      toast.error("Please select an agent");
      return;
    }
    createIntervention.mutate({
      agentId: parseInt(newIntervention.agentId),
      interventionType: newIntervention.interventionType,
      reason: newIntervention.reason || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Human-in-the-Loop</h1>
          <p className="text-muted-foreground">Loading interventions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-chart-3 to-accent bg-clip-text text-transparent">
            Human-in-the-Loop
          </h1>
          <p className="text-muted-foreground">
            Intervene, provide feedback, and override agent decisions
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Hand className="mr-2 h-4 w-4" />
              New Intervention
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Intervention</DialogTitle>
              <DialogDescription>
                Take control of an agent's execution or provide feedback.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Select Agent</Label>
                <Select
                  value={newIntervention.agentId}
                  onValueChange={(value) => setNewIntervention({ ...newIntervention, agentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents?.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id.toString()}>
                        {agent.name} ({agent.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Intervention Type</Label>
                <Select
                  value={newIntervention.interventionType}
                  onValueChange={(value) => setNewIntervention({ ...newIntervention, interventionType: value as typeof newIntervention.interventionType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pause">Pause Agent</SelectItem>
                    <SelectItem value="resume">Resume Agent</SelectItem>
                    <SelectItem value="abort">Abort Task</SelectItem>
                    <SelectItem value="approve">Approve Action</SelectItem>
                    <SelectItem value="override">Override Decision</SelectItem>
                    <SelectItem value="feedback">Provide Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Reason / Feedback</Label>
                <Textarea
                  placeholder="Explain your intervention or provide feedback..."
                  value={newIntervention.reason}
                  onChange={(e) => setNewIntervention({ ...newIntervention, reason: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createIntervention.isPending}>
                {createIntervention.isPending ? "Creating..." : "Create Intervention"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common intervention actions for active agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {agents?.filter(a => a.status === 'running').slice(0, 6).map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <span className="font-medium">{agent.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-7 text-accent hover:text-accent"
                    onClick={() => {
                      createIntervention.mutate({
                        agentId: agent.id,
                        interventionType: 'pause',
                        reason: 'Quick pause from intervention panel'
                      });
                    }}
                  >
                    <Pause className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-7 text-destructive hover:text-destructive"
                    onClick={() => {
                      createIntervention.mutate({
                        agentId: agent.id,
                        interventionType: 'abort',
                        reason: 'Quick abort from intervention panel'
                      });
                    }}
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            {(!agents || agents.filter(a => a.status === 'running').length === 0) && (
              <div className="col-span-3 text-center py-4 text-muted-foreground">
                No running agents to intervene
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Intervention History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Intervention History
          </CardTitle>
          <CardDescription>Log of all human interventions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {interventions && interventions.length > 0 ? (
              <div className="p-4 space-y-3">
                {interventions.map((intervention) => {
                  const IconComponent = interventionTypeIcons[intervention.interventionType as keyof typeof interventionTypeIcons] || Hand;
                  const colorClass = interventionTypeColors[intervention.interventionType as keyof typeof interventionTypeColors] || "bg-muted text-muted-foreground";

                  return (
                    <div key={intervention.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border border-border/50">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold capitalize">
                            {intervention.interventionType.replace('_', ' ')}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {new Date(intervention.createdAt).toLocaleString()}
                          </Badge>
                        </div>
                        {intervention.reason && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {intervention.reason}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {intervention.agentId && (
                            <span className="flex items-center gap-1">
                              <Bot className="h-3 w-3" />
                              Agent #{intervention.agentId}
                            </span>
                          )}
                          {intervention.questId && (
                            <span>Quest #{intervention.questId}</span>
                          )}
                          {intervention.taskId && (
                            <span>Task #{intervention.taskId}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <Hand className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-center">
                  No interventions recorded yet. Interventions will appear here as you take control of agent actions.
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
