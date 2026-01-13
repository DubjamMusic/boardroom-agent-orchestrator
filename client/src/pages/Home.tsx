import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, 
  Swords, 
  Activity, 
  Zap, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Play
} from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
            <p className="text-muted-foreground">Loading your orchestration dashboard...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16"></div>
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
            Command Center
          </h1>
          <p className="text-muted-foreground">
            Orchestrate your AI agents and manage quests
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setLocation("/agents")} variant="outline">
            <Bot className="mr-2 h-4 w-4" />
            New Agent
          </Button>
          <Button onClick={() => setLocation("/quests")} className="glow-primary">
            <Swords className="mr-2 h-4 w-4" />
            New Quest
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Bot className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAgents || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">{stats?.activeAgents || 0}</span> currently active
            </p>
          </CardContent>
        </Card>

        <Card className="border-accent/20 hover:border-accent/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Quests</CardTitle>
            <Swords className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeQuests || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-chart-1">{stats?.completedQuests || 0}</span> completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-chart-3/20 hover:border-chart-3/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP Earned</CardTitle>
            <Zap className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalXP || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all agents
            </p>
          </CardContent>
        </Card>

        <Card className="border-chart-4/20 hover:border-chart-4/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Online</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Agents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Agent Fleet
            </CardTitle>
            <CardDescription>Your deployed AI agents</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.agents && stats.agents.length > 0 ? (
              <div className="space-y-4">
                {stats.agents.slice(0, 5).map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        agent.status === 'running' ? 'bg-primary animate-pulse' :
                        agent.status === 'idle' ? 'bg-muted-foreground' :
                        agent.status === 'error' ? 'bg-destructive' :
                        'bg-accent'
                      }`} />
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{agent.role.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Lv.{agent.level}
                      </Badge>
                      <Badge 
                        variant={agent.status === 'running' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {agent.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">No agents deployed yet</p>
                <Button onClick={() => setLocation("/agents")} variant="outline">
                  Deploy Your First Agent
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Quests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-accent" />
              Active Quests
            </CardTitle>
            <CardDescription>Current missions in progress</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.quests && stats.quests.length > 0 ? (
              <div className="space-y-4">
                {stats.quests.map((quest) => (
                  <div key={quest.id} className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer" onClick={() => setLocation(`/quests/${quest.id}`)}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{quest.title}</p>
                      <Badge 
                        variant={quest.status === 'completed' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {quest.status === 'completed' ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : quest.status === 'active' ? (
                          <Play className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {quest.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span className="capitalize">{quest.difficulty}</span>
                      <span>•</span>
                      <span>{quest.xpReward} XP</span>
                    </div>
                    <Progress value={quest.progress} className="h-1.5" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {quest.completedTasks}/{quest.totalTasks} tasks completed
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Swords className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">No quests created yet</p>
                <Button onClick={() => setLocation("/quests")} variant="outline">
                  Start Your First Quest
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common orchestration tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setLocation("/agents")}>
              <Bot className="h-6 w-6 text-primary" />
              <span>Create Agent</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setLocation("/quests")}>
              <Swords className="h-6 w-6 text-accent" />
              <span>New Quest</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setLocation("/monitoring")}>
              <Activity className="h-6 w-6 text-chart-4" />
              <span>View Metrics</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setLocation("/sandbox")}>
              <TrendingUp className="h-6 w-6 text-chart-3" />
              <span>Sandbox Status</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
