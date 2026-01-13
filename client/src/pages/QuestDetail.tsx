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
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";
import { 
  ArrowLeft,
  Swords, 
  Plus, 
  Play, 
  Pause, 
  CheckCircle2,
  Circle,
  Bot,
  Zap,
  Wand2,
  MessageSquare
} from "lucide-react";

export default function QuestDetail() {
  const params = useParams<{ id: string }>();
  const questId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const [decomposeGoal, setDecomposeGoal] = useState("");
  const [isDecomposeOpen, setIsDecomposeOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: quest, isLoading } = trpc.quest.get.useQuery({ id: questId });
  const { data: agents } = trpc.agent.list.useQuery();
  const { data: messages } = trpc.quest.getMessages.useQuery({ id: questId, limit: 50 });

  const decompose = trpc.quest.decompose.useMutation({
    onSuccess: () => {
      utils.quest.get.invalidate({ id: questId });
      setIsDecomposeOpen(false);
      setDecomposeGoal("");
      toast.success("Quest decomposed into tasks!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateTask = trpc.task.update.useMutation({
    onSuccess: () => {
      utils.quest.get.invalidate({ id: questId });
      toast.success("Task updated");
    },
  });

  const assignTask = trpc.task.assign.useMutation({
    onSuccess: () => {
      utils.quest.get.invalidate({ id: questId });
      toast.success("Task assigned to agent");
    },
  });

  const executeTask = trpc.task.execute.useMutation({
    onSuccess: (result) => {
      utils.quest.get.invalidate({ id: questId });
      toast.success("Task executed successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/quests")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/quests")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Quest Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/quests")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{quest.title}</h1>
            <p className="text-muted-foreground">{quest.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">{quest.difficulty}</Badge>
          <Badge variant="outline" className="capitalize">{quest.priority}</Badge>
          <Badge variant={quest.status === 'completed' ? 'default' : 'secondary'} className="capitalize">
            {quest.status}
          </Badge>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Quest Progress</CardTitle>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-chart-5" />
              <span className="font-medium">{quest.xpReward} XP</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {quest.completedTasks} of {quest.totalTasks} tasks completed
              </span>
              <span className="font-medium">{quest.progress}%</span>
            </div>
            <Progress value={quest.progress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tasks List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Tasks</h2>
            <Dialog open={isDecomposeOpen} onOpenChange={setIsDecomposeOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Wand2 className="mr-2 h-4 w-4" />
                  AI Decompose
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Decompose Goal with AI</DialogTitle>
                  <DialogDescription>
                    Enter a goal and AI will break it down into specific, actionable tasks.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Goal to Decompose</Label>
                    <Textarea
                      placeholder="e.g., Create a comprehensive marketing strategy for a new product launch..."
                      value={decomposeGoal}
                      onChange={(e) => setDecomposeGoal(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDecomposeOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => decompose.mutate({ id: questId, goal: decomposeGoal })}
                    disabled={decompose.isPending || !decomposeGoal.trim()}
                  >
                    {decompose.isPending ? "Decomposing..." : "Decompose"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {quest.tasks && quest.tasks.length > 0 ? (
            <div className="space-y-3">
              {quest.tasks.map((task) => (
                <Card key={task.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <button
                        className="mt-1 shrink-0"
                        onClick={() => {
                          const newStatus = task.status === 'completed' ? 'pending' : 'completed';
                          updateTask.mutate({ id: task.id, status: newStatus });
                        }}
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </p>
                          <Badge variant="outline" className="shrink-0 capitalize">
                            {task.status}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3">
                          {/* Agent Assignment */}
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-muted-foreground" />
                            <Select
                              value={task.assignedAgentId?.toString() || ""}
                              onValueChange={(value) => {
                                if (value) {
                                  assignTask.mutate({ taskId: task.id, agentId: parseInt(value) });
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 w-40">
                                <SelectValue placeholder="Assign agent" />
                              </SelectTrigger>
                              <SelectContent>
                                {agents?.map((agent) => (
                                  <SelectItem key={agent.id} value={agent.id.toString()}>
                                    {agent.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Execute Button */}
                          {task.assignedAgentId && task.status !== 'completed' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => executeTask.mutate({ id: task.id })}
                              disabled={executeTask.isPending}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              {executeTask.isPending ? "Executing..." : "Execute"}
                            </Button>
                          )}
                          
                          <div className="flex items-center gap-1 text-sm text-muted-foreground ml-auto">
                            <Zap className="h-3 w-3" />
                            {task.xpReward} XP
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Wand2 className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-center mb-4">
                  No tasks yet. Use AI to decompose your goal into tasks.
                </p>
                <Button variant="outline" onClick={() => setIsDecomposeOpen(true)}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  AI Decompose Goal
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Agent Communication */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Agent Messages
          </h2>
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {messages && messages.length > 0 ? (
                  <div className="p-4 space-y-3">
                    {messages.map((msg) => (
                      <div key={msg.id} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Bot className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">
                            Agent #{msg.fromAgentId || msg.toAgentId}
                          </span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {msg.messageType.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      No agent messages yet. Messages will appear here as agents work on tasks.
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
