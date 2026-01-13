import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Server, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Cpu,
  HardDrive,
  Network,
  Activity,
  RefreshCw
} from "lucide-react";

const resourceIcons = {
  compute: Cpu,
  storage: HardDrive,
  network: Network,
};

const statusColors = {
  provisioning: "bg-chart-5/20 text-chart-5",
  running: "bg-primary/20 text-primary",
  paused: "bg-accent/20 text-accent",
  terminated: "bg-muted text-muted-foreground",
  error: "bg-destructive/20 text-destructive",
};

export default function Sandbox() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEnv, setNewEnv] = useState({
    name: "",
    resourceType: "compute" as "compute" | "storage" | "network",
  });

  const utils = trpc.useUtils();
  const { data: environments, isLoading } = trpc.sandbox.list.useQuery();
  
  const createEnv = trpc.sandbox.create.useMutation({
    onSuccess: () => {
      utils.sandbox.list.invalidate();
      setIsCreateOpen(false);
      setNewEnv({ name: "", resourceType: "compute" });
      toast.success("Sandbox environment created!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateEnv = trpc.sandbox.update.useMutation({
    onSuccess: () => {
      utils.sandbox.list.invalidate();
      toast.success("Environment updated");
    },
  });

  const handleCreate = () => {
    if (!newEnv.name.trim()) {
      toast.error("Environment name is required");
      return;
    }
    createEnv.mutate(newEnv);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sandbox Environments</h1>
          <p className="text-muted-foreground">Loading environments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-chart-4 to-chart-3 bg-clip-text text-transparent">
            Sandbox Environments
          </h1>
          <p className="text-muted-foreground">
            Manage isolated execution environments for your agents
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Environment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Sandbox Environment</DialogTitle>
              <DialogDescription>
                Provision a new isolated environment for agent execution.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Environment Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Production Sandbox"
                  value={newEnv.name}
                  onChange={(e) => setNewEnv({ ...newEnv, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Resource Type</Label>
                <Select
                  value={newEnv.resourceType}
                  onValueChange={(value) => setNewEnv({ ...newEnv, resourceType: value as typeof newEnv.resourceType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compute">Compute</SelectItem>
                    <SelectItem value="storage">Storage</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createEnv.isPending}>
                {createEnv.isPending ? "Creating..." : "Create Environment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resource Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              Compute Instances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {environments?.filter(e => e.resourceType === 'compute').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-chart-2/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-chart-2" />
              Storage Volumes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {environments?.filter(e => e.resourceType === 'storage').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-chart-3/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Network className="h-4 w-4 text-chart-3" />
              Network Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {environments?.filter(e => e.resourceType === 'network').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Environments Grid */}
      {environments && environments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {environments.map((env) => {
            const ResourceIcon = resourceIcons[env.resourceType as keyof typeof resourceIcons] || Server;
            const statusColor = statusColors[env.status as keyof typeof statusColors] || statusColors.terminated;

            return (
              <Card key={env.id} className="hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <ResourceIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{env.name}</CardTitle>
                        <CardDescription className="capitalize">
                          {env.resourceType}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={statusColor}>
                      {env.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Resource Usage */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">CPU Usage</span>
                        <span>{Math.round(env.cpuUsage || 0)}%</span>
                      </div>
                      <Progress value={env.cpuUsage || 0} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Memory Usage</span>
                        <span>{Math.round(env.memoryUsage || 0)}%</span>
                      </div>
                      <Progress value={env.memoryUsage || 0} className="h-1.5" />
                    </div>
                  </div>

                  {/* Network Info */}
                  {env.ipAddress && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">IP: </span>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {env.ipAddress}:{env.port}
                      </code>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {env.status === 'running' ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => updateEnv.mutate({ id: env.id, status: 'paused' })}
                      >
                        <Pause className="mr-1 h-3 w-3" />
                        Pause
                      </Button>
                    ) : env.status === 'paused' ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => updateEnv.mutate({ id: env.id, status: 'running' })}
                      >
                        <Play className="mr-1 h-3 w-3" />
                        Resume
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => updateEnv.mutate({ id: env.id, status: 'running' })}
                      >
                        <Play className="mr-1 h-3 w-3" />
                        Start
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => updateEnv.mutate({ id: env.id, status: 'terminated' })}
                    >
                      <RefreshCw className="h-3 w-3" />
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
            <Server className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Environments</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Create sandbox environments to provide isolated execution contexts for your agents.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Environment
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
