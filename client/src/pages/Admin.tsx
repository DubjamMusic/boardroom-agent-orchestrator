import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Shield, 
  Users, 
  Bot, 
  Activity,
  Settings,
  Plus,
  Trash2,
  RefreshCw,
  BarChart3,
  Beaker,
  Brain
} from "lucide-react";

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreateAchievementOpen, setIsCreateAchievementOpen] = useState(false);
  const [newAchievement, setNewAchievement] = useState({
    name: "",
    description: "",
    icon: "trophy",
    category: "milestone" as "quest" | "agent" | "milestone" | "special",
    xpReward: 100,
  });

  const utils = trpc.useUtils();
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: agents } = trpc.agent.list.useQuery();
  const { data: achievements } = trpc.achievement.list.useQuery();

  const createAchievement = trpc.achievement.create.useMutation({
    onSuccess: () => {
      utils.achievement.list.invalidate();
      setIsCreateAchievementOpen(false);
      setNewAchievement({
        name: "",
        description: "",
        icon: "trophy",
        category: "milestone",
        xpReward: 100,
      });
      toast.success("Achievement created!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Shield className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-4">
          You need administrator privileges to access this page.
        </p>
        <Button onClick={() => setLocation("/")}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-destructive to-chart-3 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            System administration and configuration
          </p>
        </div>
        <Badge variant="destructive" className="text-sm">
          <Shield className="h-3 w-3 mr-1" />
          Admin Access
        </Badge>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
          </CardContent>
        </Card>

        <Card className="border-chart-1/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bot className="h-4 w-4 text-chart-1" />
              Total Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAgents || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-chart-2/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-chart-2" />
              Active Quests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeQuests || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-chart-3/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-chart-3" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{achievements?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Agent Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Agent Management
            </CardTitle>
            <CardDescription>Manage all deployed agents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {agents && agents.length > 0 ? (
              <div className="space-y-2">
                {agents.slice(0, 5).map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {agent.role} • {agent.llmProvider}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {agent.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No agents deployed</p>
            )}
            <Button variant="outline" className="w-full" onClick={() => setLocation("/agents")}>
              View All Agents
            </Button>
          </CardContent>
        </Card>

        {/* Achievement Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-chart-5" />
                  Achievement Management
                </CardTitle>
                <CardDescription>Create and manage achievements</CardDescription>
              </div>
              <Dialog open={isCreateAchievementOpen} onOpenChange={setIsCreateAchievementOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Achievement</DialogTitle>
                    <DialogDescription>
                      Add a new achievement for users to unlock.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Name</Label>
                      <Input
                        placeholder="e.g., First Quest Complete"
                        value={newAchievement.name}
                        onChange={(e) => setNewAchievement({ ...newAchievement, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Describe how to unlock this achievement..."
                        value={newAchievement.description}
                        onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Category</Label>
                        <Select
                          value={newAchievement.category}
                          onValueChange={(value) => setNewAchievement({ ...newAchievement, category: value as typeof newAchievement.category })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="quest">Quest</SelectItem>
                            <SelectItem value="agent">Agent</SelectItem>
                            <SelectItem value="milestone">Milestone</SelectItem>
                            <SelectItem value="special">Special</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>XP Reward</Label>
                        <Input
                          type="number"
                          value={newAchievement.xpReward}
                          onChange={(e) => setNewAchievement({ ...newAchievement, xpReward: parseInt(e.target.value) || 100 })}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Icon</Label>
                      <Select
                        value={newAchievement.icon}
                        onValueChange={(value) => setNewAchievement({ ...newAchievement, icon: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trophy">Trophy</SelectItem>
                          <SelectItem value="star">Star</SelectItem>
                          <SelectItem value="zap">Zap</SelectItem>
                          <SelectItem value="target">Target</SelectItem>
                          <SelectItem value="flame">Flame</SelectItem>
                          <SelectItem value="crown">Crown</SelectItem>
                          <SelectItem value="shield">Shield</SelectItem>
                          <SelectItem value="rocket">Rocket</SelectItem>
                          <SelectItem value="medal">Medal</SelectItem>
                          <SelectItem value="award">Award</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateAchievementOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => createAchievement.mutate(newAchievement)}
                      disabled={createAchievement.isPending || !newAchievement.name}
                    >
                      {createAchievement.isPending ? "Creating..." : "Create"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {achievements && achievements.length > 0 ? (
              <div className="space-y-2">
                {achievements.slice(0, 5).map((achievement) => (
                  <div key={achievement.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{achievement.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {achievement.category} • {achievement.xpReward} XP
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No achievements created</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Configuration
          </CardTitle>
          <CardDescription>Global system settings and A/B testing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* LLM Configuration */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4" />
                LLM Configuration
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>GPT-4 Enabled</Label>
                    <p className="text-xs text-muted-foreground">Allow agents to use GPT-4</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Claude Enabled</Label>
                    <p className="text-xs text-muted-foreground">Allow agents to use Claude</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Gemini Enabled</Label>
                    <p className="text-xs text-muted-foreground">Allow agents to use Gemini</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            {/* A/B Testing */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Beaker className="h-4 w-4" />
                A/B Testing
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable A/B Testing</Label>
                    <p className="text-xs text-muted-foreground">Split traffic between agent strategies</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Reinforcement Learning</Label>
                    <p className="text-xs text-muted-foreground">Enable agent learning from feedback</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-optimization</Label>
                    <p className="text-xs text-muted-foreground">Automatically optimize agent parameters</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button onClick={() => toast.success("Settings saved!")}>
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
