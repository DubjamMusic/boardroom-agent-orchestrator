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
import { useLocation } from "wouter";
import { 
  Swords, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight
} from "lucide-react";

const difficultyColors = {
  novice: "bg-chart-4/20 text-chart-4",
  apprentice: "bg-chart-1/20 text-chart-1",
  journeyman: "bg-chart-2/20 text-chart-2",
  expert: "bg-chart-3/20 text-chart-3",
  master: "bg-chart-5/20 text-chart-5",
};

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/20 text-primary",
  high: "bg-accent/20 text-accent",
  critical: "bg-destructive/20 text-destructive",
};

export default function Quests() {
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newQuest, setNewQuest] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    difficulty: "apprentice" as "novice" | "apprentice" | "journeyman" | "expert" | "master",
    xpReward: 100,
    narrativeTheme: "",
  });

  const utils = trpc.useUtils();
  const { data: quests, isLoading } = trpc.quest.list.useQuery();
  
  const createQuest = trpc.quest.create.useMutation({
    onSuccess: () => {
      utils.quest.list.invalidate();
      setIsCreateOpen(false);
      setNewQuest({
        title: "",
        description: "",
        priority: "medium",
        difficulty: "apprentice",
        xpReward: 100,
        narrativeTheme: "",
      });
      toast.success("Quest created successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateQuest = trpc.quest.update.useMutation({
    onSuccess: () => {
      utils.quest.list.invalidate();
      toast.success("Quest updated");
    },
  });

  const deleteQuest = trpc.quest.delete.useMutation({
    onSuccess: () => {
      utils.quest.list.invalidate();
      toast.success("Quest deleted");
    },
  });

  const handleCreate = () => {
    if (!newQuest.title.trim()) {
      toast.error("Quest title is required");
      return;
    }
    createQuest.mutate(newQuest);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quest Board</h1>
            <p className="text-muted-foreground">Loading quests...</p>
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
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-accent to-chart-3 bg-clip-text text-transparent">
            Quest Board
          </h1>
          <p className="text-muted-foreground">
            Create and manage AI-powered missions
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="glow-accent bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              New Quest
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Quest</DialogTitle>
              <DialogDescription>
                Define a complex goal that will be decomposed into tasks for your agents.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Quest Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Build a Marketing Campaign"
                  value={newQuest.title}
                  onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the overall goal and expected outcomes..."
                  value={newQuest.description}
                  onChange={(e) => setNewQuest({ ...newQuest, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Select
                    value={newQuest.priority}
                    onValueChange={(value) => setNewQuest({ ...newQuest, priority: value as typeof newQuest.priority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Difficulty</Label>
                  <Select
                    value={newQuest.difficulty}
                    onValueChange={(value) => setNewQuest({ ...newQuest, difficulty: value as typeof newQuest.difficulty })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novice">Novice</SelectItem>
                      <SelectItem value="apprentice">Apprentice</SelectItem>
                      <SelectItem value="journeyman">Journeyman</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                      <SelectItem value="master">Master</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="xpReward">XP Reward</Label>
                <Input
                  id="xpReward"
                  type="number"
                  value={newQuest.xpReward}
                  onChange={(e) => setNewQuest({ ...newQuest, xpReward: parseInt(e.target.value) || 100 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="narrativeTheme">Narrative Theme (Optional)</Label>
                <Input
                  id="narrativeTheme"
                  placeholder="e.g., Cyberpunk heist, Space exploration..."
                  value={newQuest.narrativeTheme}
                  onChange={(e) => setNewQuest({ ...newQuest, narrativeTheme: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createQuest.isPending}>
                {createQuest.isPending ? "Creating..." : "Create Quest"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quests Grid */}
      {quests && quests.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quests.map((quest) => (
            <Card 
              key={quest.id} 
              className="group hover:border-accent/40 transition-all cursor-pointer"
              onClick={() => setLocation(`/quests/${quest.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{quest.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={difficultyColors[quest.difficulty as keyof typeof difficultyColors]}>
                        {quest.difficulty}
                      </Badge>
                      <Badge className={priorityColors[quest.priority as keyof typeof priorityColors]}>
                        {quest.priority}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {quest.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {quest.description}
                  </p>
                )}

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-primary">{quest.progress}%</span>
                  </div>
                  <Progress value={quest.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {quest.completedTasks}/{quest.totalTasks} tasks completed
                  </p>
                </div>

                {/* Status & Reward */}
                <div className="flex items-center justify-between pt-2">
                  <Badge 
                    variant={quest.status === 'completed' ? 'default' : quest.status === 'active' ? 'secondary' : 'outline'}
                    className="capitalize"
                  >
                    {quest.status === 'completed' ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : quest.status === 'active' ? (
                      <Play className="h-3 w-3 mr-1" />
                    ) : quest.status === 'failed' ? (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <Clock className="h-3 w-3 mr-1" />
                    )}
                    {quest.status}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm">
                    <Zap className="h-4 w-4 text-chart-5" />
                    <span className="font-medium">{quest.xpReward} XP</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                  {quest.status === 'pending' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => updateQuest.mutate({ id: quest.id, status: 'active' })}
                    >
                      <Play className="mr-1 h-3 w-3" />
                      Start
                    </Button>
                  )}
                  {quest.status === 'active' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => updateQuest.mutate({ id: quest.id, status: 'paused' })}
                    >
                      <Pause className="mr-1 h-3 w-3" />
                      Pause
                    </Button>
                  )}
                  {quest.status === 'paused' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => updateQuest.mutate({ id: quest.id, status: 'active' })}
                    >
                      <Play className="mr-1 h-3 w-3" />
                      Resume
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this quest?')) {
                        deleteQuest.mutate({ id: quest.id });
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Swords className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Quests Yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Create your first quest to start breaking down complex goals into AI-powered tasks.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="glow-accent bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Quest
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
