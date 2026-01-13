import { eq, desc, and, sql, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  agents, InsertAgent, Agent,
  quests, InsertQuest, Quest,
  tasks, InsertTask, Task,
  agentMessages, InsertAgentMessage,
  agentMemories, InsertAgentMemory,
  achievements, InsertAchievement,
  userAchievements, InsertUserAchievement,
  agentMetrics, InsertAgentMetric,
  sandboxEnvironments, InsertSandboxEnvironment,
  humanInterventions, InsertHumanIntervention,
  notifications, InsertNotification
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================
// USER QUERIES
// ============================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserXP(userId: number, xpToAdd: number) {
  const db = await getDb();
  if (!db) return;
  
  const user = await getUserById(userId);
  if (!user) return;
  
  const newXP = user.xp + xpToAdd;
  const newLevel = Math.floor(newXP / 1000) + 1;
  
  await db.update(users)
    .set({ xp: newXP, level: newLevel })
    .where(eq(users.id, userId));
  
  return { xp: newXP, level: newLevel };
}

// ============================================
// AGENT QUERIES
// ============================================

export async function createAgent(agent: InsertAgent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(agents).values(agent);
  return result[0].insertId;
}

export async function getAgentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agents).where(eq(agents.userId, userId)).orderBy(desc(agents.createdAt));
}

export async function getAgentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateAgentStatus(id: number, status: Agent["status"]) {
  const db = await getDb();
  if (!db) return;
  await db.update(agents).set({ status }).where(eq(agents.id, id));
}

export async function updateAgent(id: number, data: Partial<InsertAgent>) {
  const db = await getDb();
  if (!db) return;
  await db.update(agents).set(data).where(eq(agents.id, id));
}

export async function deleteAgent(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(agents).where(eq(agents.id, id));
}

export async function incrementAgentXP(agentId: number, xpToAdd: number) {
  const db = await getDb();
  if (!db) return;
  
  const agent = await getAgentById(agentId);
  if (!agent) return;
  
  const newXP = agent.xp + xpToAdd;
  const newLevel = Math.floor(newXP / 500) + 1;
  
  await db.update(agents)
    .set({ xp: newXP, level: newLevel, tasksCompleted: agent.tasksCompleted + 1 })
    .where(eq(agents.id, agentId));
}

// ============================================
// QUEST QUERIES
// ============================================

export async function createQuest(quest: InsertQuest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(quests).values(quest);
  return result[0].insertId;
}

export async function getQuestsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quests).where(eq(quests.userId, userId)).orderBy(desc(quests.createdAt));
}

export async function getQuestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(quests).where(eq(quests.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateQuest(id: number, data: Partial<InsertQuest>) {
  const db = await getDb();
  if (!db) return;
  await db.update(quests).set(data).where(eq(quests.id, id));
}

export async function deleteQuest(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(quests).where(eq(quests.id, id));
}

// ============================================
// TASK QUERIES
// ============================================

export async function createTask(task: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tasks).values(task);
  return result[0].insertId;
}

export async function getTasksByQuestId(questId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.questId, questId)).orderBy(tasks.priority);
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateTask(id: number, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) return;
  await db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function getTasksByAgentId(agentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.assignedAgentId, agentId));
}

// ============================================
// AGENT MESSAGES QUERIES
// ============================================

export async function createAgentMessage(message: InsertAgentMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(agentMessages).values(message);
  return result[0].insertId;
}

export async function getMessagesByQuestId(questId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentMessages)
    .where(eq(agentMessages.questId, questId))
    .orderBy(desc(agentMessages.createdAt))
    .limit(limit);
}

export async function getRecentMessages(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  // Get messages for user's agents
  const userAgents = await getAgentsByUserId(userId);
  const agentIds = userAgents.map(a => a.id);
  
  if (agentIds.length === 0) return [];
  
  return db.select().from(agentMessages)
    .orderBy(desc(agentMessages.createdAt))
    .limit(limit);
}

// ============================================
// AGENT MEMORIES QUERIES
// ============================================

export async function createAgentMemory(memory: InsertAgentMemory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(agentMemories).values(memory);
  return result[0].insertId;
}

export async function getAgentMemories(agentId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentMemories)
    .where(eq(agentMemories.agentId, agentId))
    .orderBy(desc(agentMemories.importance))
    .limit(limit);
}

// ============================================
// ACHIEVEMENTS QUERIES
// ============================================

export async function createAchievement(data: Omit<InsertAchievement, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(achievements).values(data);
  return Number(result[0].insertId);
}

export async function getAllAchievements() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(achievements);
}

export async function getUserAchievements(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    achievement: achievements,
    unlockedAt: userAchievements.unlockedAt
  })
    .from(userAchievements)
    .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
    .where(eq(userAchievements.userId, userId));
}

export async function unlockAchievement(userId: number, achievementId: number) {
  const db = await getDb();
  if (!db) return;
  
  // Check if already unlocked
  const existing = await db.select().from(userAchievements)
    .where(and(
      eq(userAchievements.userId, userId),
      eq(userAchievements.achievementId, achievementId)
    )).limit(1);
  
  if (existing.length > 0) return false;
  
  await db.insert(userAchievements).values({ userId, achievementId });
  return true;
}

// ============================================
// AGENT METRICS QUERIES
// ============================================

export async function recordAgentMetric(metric: InsertAgentMetric) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(agentMetrics).values(metric);
}

export async function getAgentMetrics(agentId: number, days = 7) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return db.select().from(agentMetrics)
    .where(and(
      eq(agentMetrics.agentId, agentId),
      gte(agentMetrics.recordedAt, startDate)
    ))
    .orderBy(desc(agentMetrics.recordedAt));
}

// ============================================
// SANDBOX ENVIRONMENT QUERIES
// ============================================

export async function createSandboxEnvironment(env: InsertSandboxEnvironment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sandboxEnvironments).values(env);
  return result[0].insertId;
}

export async function getSandboxEnvironmentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sandboxEnvironments)
    .where(eq(sandboxEnvironments.userId, userId))
    .orderBy(desc(sandboxEnvironments.createdAt));
}

export async function updateSandboxEnvironment(id: number, data: Partial<InsertSandboxEnvironment>) {
  const db = await getDb();
  if (!db) return;
  await db.update(sandboxEnvironments).set(data).where(eq(sandboxEnvironments.id, id));
}

// ============================================
// HUMAN INTERVENTION QUERIES
// ============================================

export async function createHumanIntervention(intervention: InsertHumanIntervention) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(humanInterventions).values(intervention);
  return result[0].insertId;
}

export async function getInterventionsByUserId(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(humanInterventions)
    .where(eq(humanInterventions.userId, userId))
    .orderBy(desc(humanInterventions.createdAt))
    .limit(limit);
}

// ============================================
// NOTIFICATION QUERIES
// ============================================

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(notification);
  return result[0].insertId;
}

export async function getUserNotifications(userId: number, unreadOnly = false) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) {
    conditions.push(eq(notifications.read, false));
  }
  
  return db.select().from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
}

// ============================================
// DASHBOARD STATS
// ============================================

export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const userAgents = await getAgentsByUserId(userId);
  const userQuests = await getQuestsByUserId(userId);
  
  const activeAgents = userAgents.filter(a => a.status === 'running').length;
  const activeQuests = userQuests.filter(q => q.status === 'active').length;
  const completedQuests = userQuests.filter(q => q.status === 'completed').length;
  const totalXP = userAgents.reduce((sum, a) => sum + a.xp, 0);
  
  return {
    totalAgents: userAgents.length,
    activeAgents,
    totalQuests: userQuests.length,
    activeQuests,
    completedQuests,
    totalXP,
    agents: userAgents,
    quests: userQuests.slice(0, 5)
  };
}
