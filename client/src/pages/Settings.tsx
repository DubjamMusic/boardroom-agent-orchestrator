import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Palette,
  Zap,
  Bot,
  Trash2,
  CheckCircle2
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: notifications } = trpc.notification.list.useQuery({ unreadOnly: false });

  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      toast.success("All notifications marked as read");
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {user?.name?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-semibold">{user?.name || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email || "No email"}</p>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {user?.role || "user"}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Level</Label>
                  <p className="font-medium">{user?.level || 1}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total XP</Label>
                  <p className="font-medium">{user?.xp || 0}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Login Method</Label>
                  <p className="font-medium capitalize">{user?.loginMethod || "manus"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Member Since</Label>
                  <p className="font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Preferences
              </CardTitle>
              <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use dark theme for the interface
                  </p>
                </div>
                <Switch defaultChecked disabled />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sounds for notifications and achievements
                  </p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use a more condensed layout
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Agent Defaults */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Agent Defaults
              </CardTitle>
              <CardDescription>Default settings for new agents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-start Agents</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically start agents when created
                  </p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Verbose Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable detailed logging for agent activities
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Human Approval Required</Label>
                  <p className="text-sm text-muted-foreground">
                    Require approval before executing critical tasks
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {notifications && notifications.length > 0 ? (
                  <div className="p-4 space-y-3">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-3 rounded-lg border ${notification.read ? 'bg-muted/30' : 'bg-muted/50 border-primary/30'}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 ${
                            notification.type === 'success' ? 'text-primary' :
                            notification.type === 'error' ? 'text-destructive' :
                            notification.type === 'milestone' ? 'text-chart-5' :
                            'text-muted-foreground'
                          }`}>
                            {notification.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> :
                             notification.type === 'milestone' ? <Zap className="h-4 w-4" /> :
                             <Bell className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4">
                    <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      No notifications yet
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Shield className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All Agents
              </Button>
              <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Reset All Progress
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
