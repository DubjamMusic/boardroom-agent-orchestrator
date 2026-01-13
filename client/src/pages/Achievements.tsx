import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Star, 
  Zap,
  Target,
  Flame,
  Crown,
  Shield,
  Rocket,
  Medal,
  Award
} from "lucide-react";

const achievementIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  star: Star,
  zap: Zap,
  target: Target,
  flame: Flame,
  crown: Crown,
  shield: Shield,
  rocket: Rocket,
  medal: Medal,
  award: Award,
};

const rarityColors = {
  common: "bg-muted text-muted-foreground border-muted",
  uncommon: "bg-chart-1/20 text-chart-1 border-chart-1/30",
  rare: "bg-chart-4/20 text-chart-4 border-chart-4/30",
  epic: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  legendary: "bg-chart-5/20 text-chart-5 border-chart-5/30 glow-accent",
};

export default function Achievements() {
  const { data: allAchievements, isLoading: achievementsLoading } = trpc.achievement.list.useQuery();
  const { data: userAchievements, isLoading: userLoading } = trpc.achievement.userAchievements.useQuery();
  const { data: stats } = trpc.dashboard.stats.useQuery();

  const isLoading = achievementsLoading || userLoading;

  // Create a set of unlocked achievement IDs
  const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement.id) || []);

  // Calculate stats
  const totalAchievements = allAchievements?.length || 0;
  const unlockedCount = userAchievements?.length || 0;
  const completionPercent = totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
          <p className="text-muted-foreground">Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-chart-5 to-accent bg-clip-text text-transparent">
          Achievements
        </h1>
        <p className="text-muted-foreground">
          Track your progress and unlock rewards
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-chart-5/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-chart-5" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unlockedCount}/{totalAchievements}</div>
            <Progress value={completionPercent} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Total XP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.totalXP || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-chart-1/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-chart-1" />
              Quests Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">{stats?.completedQuests || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-chart-3/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-chart-3" />
              Agents Deployed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">{stats?.totalAgents || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recently Unlocked */}
      {userAchievements && userAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-chart-5" />
              Recently Unlocked
            </CardTitle>
            <CardDescription>Your latest achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {userAchievements.slice(0, 5).map((ua) => {
                const achievement = ua.achievement;
                if (!achievement) return null;
                const IconComponent = achievementIcons[achievement.icon || 'trophy'] || Trophy;
                const rarityColor = rarityColors[achievement.category as keyof typeof rarityColors] || rarityColors.common;

                return (
                  <div 
                    key={achievement.id} 
                    className={`flex items-center gap-3 p-3 rounded-lg border ${rarityColor}`}
                  >
                    <div className="p-2 rounded-lg bg-background/50">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium">{achievement.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ua.unlockedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Achievements */}
      <div>
        <h2 className="text-xl font-semibold mb-4">All Achievements</h2>
        {allAchievements && allAchievements.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allAchievements.map((achievement) => {
              const isUnlocked = unlockedIds.has(achievement.id);
              const IconComponent = achievementIcons[achievement.icon || 'trophy'] || Trophy;
              const rarityColor = rarityColors[achievement.category as keyof typeof rarityColors] || rarityColors.common;

              return (
                <Card 
                  key={achievement.id} 
                  className={`transition-all ${isUnlocked ? rarityColor : 'opacity-50 grayscale'}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${isUnlocked ? 'bg-background/50' : 'bg-muted'}`}>
                        <IconComponent className={`h-8 w-8 ${isUnlocked ? '' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold">{achievement.name}</p>
                          <Badge variant="outline" className="capitalize shrink-0">
                            {achievement.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {achievement.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Zap className="h-4 w-4 text-chart-5" />
                          <span className="text-sm font-medium">{achievement.xpReward} XP</span>
                          {isUnlocked && (
                            <Badge variant="default" className="ml-auto">
                              Unlocked
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Achievements Yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Complete quests and deploy agents to unlock achievements and earn XP rewards.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
