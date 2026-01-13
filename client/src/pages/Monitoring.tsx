import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  Bot, 
  MessageSquare, 
  Zap,
  ArrowRight,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Pause,
  Hand
} from "lucide-react";
import { toast } from "sonner";

export default function Monitoring() {
  const utils = trpc.useUtils();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: messages, isLoading: messagesLoading } = trpc.dashboard.recentMessages.useQuery({ limit: 50 });
  const { data: interventions } = trpc.intervention.list.useQuery({ limit: 20 });

  const createIntervention = trpc.intervention.create.useMutation({
    onSuccess: () => {
      utils.intervention.list.invalidate();
      utils.agent.list.invalidate();
      toast.success("Intervention recorded");
    },
  });

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitoring</h1>
          <p className="text-muted-foreground">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-chart-4 to-primary bg-clip-text text-transparent">
          Real-Time Monitoring
        </h1>
        <p className="text-muted-foreground">
          Monitor agent activity, communication flows, and system health
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              Active Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.activeAgents || 0}</div>
            <p className="text-xs text-muted-foreground">of {stats?.totalAgents || 0} total</p>
          </CardContent>
        </Card>

        <Card className="border-chart-1/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-chart-1" />
              Tasks Running
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">{stats?.activeQuests || 0}</div>
            <p className="text-xs text-muted-foreground">in progress</p>
          </CardContent>
        </Card>

        <Card className="border-chart-2/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-chart-2" />
              Messages Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{messages?.length || 0}</div>
            <p className="text-xs text-muted-foreground">agent communications</p>
          </CardContent>
        </Card>

        <Card className="border-chart-3/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Hand className="h-4 w-4 text-chart-3" />
              Interventions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">{interventions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">human overrides</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Agent Status Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Agent Status
            </CardTitle>
            <CardDescription>Real-time agent states and activities</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.agents && stats.agents.length > 0 ? (
              <div className="space-y-3">
                {stats.agents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        agent.status === 'running' ? 'bg-primary animate-pulse' :
                        agent.status === 'idle' ? 'bg-muted-foreground' :
                        agent.status === 'paused' ? 'bg-accent' :
                        agent.status === 'error' ? 'bg-destructive' :
                        'bg-chart-1'
                      }`} />
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {agent.role.replace('_', ' ')} • {agent.llmProvider}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {agent.status}
                      </Badge>
                      {agent.status === 'running' && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-7 text-accent hover:text-accent"
                          onClick={() => createIntervention.mutate({
                            agentId: agent.id,
                            interventionType: 'pause',
                            reason: 'Manual pause from monitoring'
                          })}
                        >
                          <Pause className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No agents deployed yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Communication Bus */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-chart-2" />
              Communication Bus
            </CardTitle>
            <CardDescription>Agent message flows and coordination</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[350px]">
              {messages && messages.length > 0 ? (
                <div className="p-4 space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className="p-3 rounded-lg bg-muted/50 border-l-2 border-primary/50">
                      <div className="flex items-center gap-2 mb-1">
                        {msg.fromAgentId && (
                          <>
                            <Badge variant="outline" className="text-xs">
                              Agent #{msg.fromAgentId}
                            </Badge>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          </>
                        )}
                        {msg.toAgentId && (
                          <Badge variant="outline" className="text-xs">
                            Agent #{msg.toAgentId}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs capitalize ml-auto">
                          {msg.messageType.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{msg.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    No messages yet. Agent communications will appear here.
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Human Interventions Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hand className="h-5 w-5 text-chart-3" />
            Human-in-the-Loop Interventions
          </CardTitle>
          <CardDescription>History of human oversight actions</CardDescription>
        </CardHeader>
        <CardContent>
          {interventions && interventions.length > 0 ? (
            <div className="space-y-3">
              {interventions.map((intervention) => (
                <div key={intervention.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      intervention.interventionType === 'pause' ? 'bg-accent/20 text-accent' :
                      intervention.interventionType === 'abort' ? 'bg-destructive/20 text-destructive' :
                      intervention.interventionType === 'approve' ? 'bg-primary/20 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {intervention.interventionType === 'pause' ? <Pause className="h-4 w-4" /> :
                       intervention.interventionType === 'abort' ? <AlertTriangle className="h-4 w-4" /> :
                       intervention.interventionType === 'approve' ? <CheckCircle2 className="h-4 w-4" /> :
                       <Hand className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{intervention.interventionType}</p>
                      <p className="text-sm text-muted-foreground">
                        {intervention.reason || 'No reason provided'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(intervention.createdAt).toLocaleString()}
                    </p>
                    {intervention.agentId && (
                      <Badge variant="outline" className="text-xs mt-1">
                        Agent #{intervention.agentId}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No interventions recorded yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
