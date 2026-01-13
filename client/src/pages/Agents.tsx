import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Bot, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Settings, 
  Zap,
  Brain,
  Target,
  Eye,
  Database
} from "lucide-react";

const roleIcons = {
  planner: Brain,
  executor: Target,
  monitor: Eye,
  data_agent: Database,
};

const roleColors = {
  planner: "text-chart-3",
  executor: "text-primary",
  monitor: "text-chart-4",
  data_agent: "text-accent",
};

export default function Agents() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: "",
    role: "executor" as "planner" | "executor" | "monitor" | "data_agent",
    llmProvider: "gpt4" as "gpt4" | "claude" | "gemini",
    description: "",
    systemPrompt: "",
  });

  const utils = trpc.useUtils();
  const { data: agents, isLoading } = trpc.agent.list.useQuery();
  
  const createAgent = trpc.agent.create.useMutation({
    onSuccess: () => {
      utils.agent.list.invalidate();
      setIsCreateOpen(false);
      setNewAgent({
        name: "",
        role: "executor",
        llmProvider: "gpt4",
        description: "",
        systemPrompt: "",
      });
      toast.success("Agent created successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateStatus = trpc.agent.updateStatus.useMutation({
    onSuccess: () => {
      utils.agent.list.invalidate();
      toast.success("Agent status updated");
    },
  });

  const deleteAgent = trpc.agent.delete.useMutation({
    onSuccess: () => {
      utils.agent.list.invalidate();
      toast.success("Agent deleted");
    },
  });

  const handleCreate = () => {
    if (!newAgent.name.trim()) {
      toast.error("Agent name is required");
      return;
    }
    createAgent.mutate(newAgent);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agent Fleet</h1>
            <p className="text-muted-foreground">Loading agents...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-32"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-chart-3 bg-clip-text text-transparent">
            Agent Fleet
          </h1>
          <p className="text-muted-foreground">
            Deploy and manage your AI agents
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="glow-primary">
              <Plus className="mr-2 h-4 w-4" />
              Deploy Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Deploy New Agent</DialogTitle>
              <DialogDescription>
                Configure and deploy a new AI agent to your fleet.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Strategic Planner Alpha"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <Select
                    value={newAgent.role}
                    onValueChange={(value) => setNewAgent({ ...newAgent, role: value as typeof newAgent.role })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planner">Planner</SelectItem>
                      <SelectItem value="executor">Executor</SelectItem>
                      <SelectItem value="monitor">Monitor</SelectItem>
                      <SelectItem value="data_agent">Data Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>LLM Provider</Label>
                  <Select
                    value={newAgent.llmProvider}
                    onValueChange={(value) => setNewAgent({ ...newAgent, llmProvider: value as typeof newAgent.llmProvider })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt4">GPT-4</SelectItem>
                      <SelectItem value="claude">Claude</SelectItem>
                      <SelectItem value="gemini">Gemini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of the agent's purpose"
                  value={newAgent.description}
                  onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="systemPrompt">System Prompt (Optional)</Label>
                <Textarea
                  id="systemPrompt"
                  placeholder="Custom instructions for the agent..."
                  value={newAgent.systemPrompt}
                  onChange={(e) => setNewAgent({ ...newAgent, systemPrompt: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createAgent.isPending}>
                {createAgent.isPending ? "Deploying..." : "Deploy Agent"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Agents Grid */}
      {agents && agents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const RoleIcon = roleIcons[agent.role as keyof typeof roleIcons] || Bot;
            const roleColor = roleColors[agent.role as keyof typeof roleColors] || "text-primary";
            const xpProgress = (agent.xp % 500) / 5;

            return (
              <Card key={agent.id} className="group hover:border-primary/40 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${roleColor}`}>
                        <RoleIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        <CardDescription className="capitalize">
                          {agent.role.replace('_', ' ')} • {agent.llmProvider.toUpperCase()}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge 
                      variant={agent.status === 'running' ? 'default' : agent.status === 'error' ? 'destructive' : 'secondary'}
                      className="capitalize"
                    >
                      {agent.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {agent.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {agent.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">{agent.level}</p>
                      <p className="text-xs text-muted-foreground">Level</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">{agent.xp}</p>
                      <p className="text-xs text-muted-foreground">XP</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">{agent.tasksCompleted}</p>
                      <p className="text-xs text-muted-foreground">Tasks</p>
                    </div>
                  </div>

                  {/* XP Progress */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Level {agent.level}</span>
                      <span className="text-primary">{agent.xp % 500}/500 XP</span>
                    </div>
                    <Progress value={xpProgress} className="h-1.5" />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {agent.status === 'running' ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => updateStatus.mutate({ id: agent.id, status: 'paused' })}
                      >
                        <Pause className="mr-1 h-3 w-3" />
                        Pause
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => updateStatus.mutate({ id: agent.id, status: 'running' })}
                      >
                        <Play className="mr-1 h-3 w-3" />
                        Start
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Settings className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this agent?')) {
                          deleteAgent.mutate({ id: agent.id });
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Agents Deployed</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Deploy your first AI agent to start orchestrating complex tasks with multi-LLM capabilities.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="glow-primary">
              <Plus className="mr-2 h-4 w-4" />
              Deploy Your First Agent
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
