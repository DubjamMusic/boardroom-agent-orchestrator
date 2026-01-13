import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, float } from "drizzle-orm/mysql-core";

// ============================================
// USER & AUTH
// ============================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  xp: int("xp").default(0).notNull(),
  level: int("level").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================
// AGENTS
// ============================================

export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["planner", "executor", "monitor", "data_agent"]).notNull(),
  llmProvider: mysqlEnum("llmProvider", ["gpt4", "claude", "gemini"]).default("gpt4").notNull(),
  status: mysqlEnum("status", ["idle", "running", "paused", "error", "completed"]).default("idle").notNull(),
  description: text("description"),
  systemPrompt: text("systemPrompt"),
  capabilities: json("capabilities").$type<string[]>(),
  config: json("config").$type<Record<string, unknown>>(),
  xp: int("xp").default(0).notNull(),
  level: int("level").default(1).notNull(),
  successRate: float("successRate").default(0),
  tasksCompleted: int("tasksCompleted").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

// ============================================
// QUESTS (High-level goals)
// ============================================

export const quests = mysqlTable("quests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "active", "completed", "failed", "paused"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  xpReward: int("xpReward").default(100).notNull(),
  difficulty: mysqlEnum("difficulty", ["novice", "apprentice", "journeyman", "expert", "master"]).default("apprentice").notNull(),
  progress: int("progress").default(0).notNull(),
  totalTasks: int("totalTasks").default(0).notNull(),
  completedTasks: int("completedTasks").default(0).notNull(),
  narrativeTheme: varchar("narrativeTheme", { length: 100 }),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quest = typeof quests.$inferSelect;
export type InsertQuest = typeof quests.$inferInsert;

// ============================================
// TASKS (Sub-tasks within quests)
// ============================================

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  questId: int("questId").notNull(),
  assignedAgentId: int("assignedAgentId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "assigned", "running", "completed", "failed", "paused"]).default("pending").notNull(),
  priority: int("priority").default(0).notNull(),
  xpReward: int("xpReward").default(25).notNull(),
  input: json("input").$type<Record<string, unknown>>(),
  output: json("output").$type<Record<string, unknown>>(),
  errorMessage: text("errorMessage"),
  retryCount: int("retryCount").default(0).notNull(),
  maxRetries: int("maxRetries").default(3).notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ============================================
// AGENT MESSAGES (Communication bus)
// ============================================

export const agentMessages = mysqlTable("agent_messages", {
  id: int("id").autoincrement().primaryKey(),
  fromAgentId: int("fromAgentId"),
  toAgentId: int("toAgentId"),
  questId: int("questId"),
  taskId: int("taskId"),
  messageType: mysqlEnum("messageType", ["task_assignment", "status_update", "data_request", "data_response", "coordination", "error", "human_feedback"]).notNull(),
  content: text("content").notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentMessage = typeof agentMessages.$inferSelect;
export type InsertAgentMessage = typeof agentMessages.$inferInsert;

// ============================================
// AGENT MEMORIES (Vector storage for context)
// ============================================

export const agentMemories = mysqlTable("agent_memories", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  memoryType: mysqlEnum("memoryType", ["task_result", "learned_strategy", "knowledge", "context", "feedback"]).notNull(),
  content: text("content").notNull(),
  embedding: json("embedding").$type<number[]>(),
  importance: float("importance").default(0.5),
  accessCount: int("accessCount").default(0).notNull(),
  lastAccessedAt: timestamp("lastAccessedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentMemory = typeof agentMemories.$inferSelect;
export type InsertAgentMemory = typeof agentMemories.$inferInsert;

// ============================================
// ACHIEVEMENTS (Gamification)
// ============================================

export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  category: mysqlEnum("category", ["quest", "agent", "milestone", "special"]).default("quest").notNull(),
  xpReward: int("xpReward").default(50).notNull(),
  requirement: json("requirement").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

export const userAchievements = mysqlTable("user_achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementId: int("achievementId").notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

// ============================================
// AGENT PERFORMANCE METRICS
// ============================================

export const agentMetrics = mysqlTable("agent_metrics", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  metricType: mysqlEnum("metricType", ["task_completion", "response_time", "error_rate", "token_usage", "success_rate"]).notNull(),
  value: float("value").notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type AgentMetric = typeof agentMetrics.$inferSelect;
export type InsertAgentMetric = typeof agentMetrics.$inferInsert;

// ============================================
// SANDBOX ENVIRONMENTS
// ============================================

export const sandboxEnvironments = mysqlTable("sandbox_environments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["provisioning", "running", "paused", "terminated", "error"]).default("provisioning").notNull(),
  resourceType: mysqlEnum("resourceType", ["compute", "storage", "network"]).default("compute").notNull(),
  config: json("config").$type<Record<string, unknown>>(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  port: int("port"),
  cpuUsage: float("cpuUsage").default(0),
  memoryUsage: float("memoryUsage").default(0),
  lastHealthCheck: timestamp("lastHealthCheck"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SandboxEnvironment = typeof sandboxEnvironments.$inferSelect;
export type InsertSandboxEnvironment = typeof sandboxEnvironments.$inferInsert;

// ============================================
// HUMAN INTERVENTIONS
// ============================================

export const humanInterventions = mysqlTable("human_interventions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentId: int("agentId"),
  questId: int("questId"),
  taskId: int("taskId"),
  interventionType: mysqlEnum("interventionType", ["pause", "resume", "override", "feedback", "abort", "approve"]).notNull(),
  reason: text("reason"),
  previousState: json("previousState").$type<Record<string, unknown>>(),
  newState: json("newState").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HumanIntervention = typeof humanInterventions.$inferSelect;
export type InsertHumanIntervention = typeof humanInterventions.$inferInsert;

// ============================================
// NOTIFICATIONS
// ============================================

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["info", "warning", "error", "success", "milestone", "intervention_required"]).default("info").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  read: boolean("read").default(false).notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
