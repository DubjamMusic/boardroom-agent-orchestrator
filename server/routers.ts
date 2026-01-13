import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import * as db from "./db";

// ============================================
// AGENT ROUTER
// ============================================

const agentRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getAgentsByUserId(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getAgentById(input.id);
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      role: z.enum(["planner", "executor", "monitor", "data_agent"]),
      llmProvider: z.enum(["gpt4", "claude", "gemini"]).default("gpt4"),
      description: z.string().optional(),
      systemPrompt: z.string().optional(),
      capabilities: z.array(z.string()).optional(),
      config: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { config, capabilities, ...rest } = input;
      const agentId = await db.createAgent({
        userId: ctx.user.id,
        ...rest,
        config: config as Record<string, unknown> | undefined,
        capabilities: capabilities || undefined,
      });
      
      // Create notification
      await db.createNotification({
        userId: ctx.user.id,
        type: "success",
        title: "Agent Created",
        message: `Agent "${input.name}" has been created successfully.`,
      });
      
      return { id: agentId };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      role: z.enum(["planner", "executor", "monitor", "data_agent"]).optional(),
      llmProvider: z.enum(["gpt4", "claude", "gemini"]).optional(),
      description: z.string().optional(),
      systemPrompt: z.string().optional(),
      capabilities: z.array(z.string()).optional(),
      config: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, config, capabilities, ...rest } = input;
      await db.updateAgent(id, {
        ...rest,
        config: config as Record<string, unknown> | undefined,
        capabilities: capabilities || undefined,
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteAgent(input.id);
      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["idle", "running", "paused", "error", "completed"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.updateAgentStatus(input.id, input.status);
      
      // Log intervention if pausing
      if (input.status === "paused") {
        await db.createHumanIntervention({
          userId: ctx.user.id,
          agentId: input.id,
          interventionType: "pause",
          reason: "User paused agent",
        });
      }
      
      return { success: true };
    }),

  invoke: protectedProcedure
    .input(z.object({
      id: z.number(),
      prompt: z.string(),
      context: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const agent = await db.getAgentById(input.id);
      if (!agent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      }

      // Update agent status to running
      await db.updateAgentStatus(input.id, "running");

      try {
        // Build messages for LLM
        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
        
        if (agent.systemPrompt) {
          messages.push({ role: "system", content: agent.systemPrompt });
        } else {
          messages.push({
            role: "system",
            content: `You are an AI agent named "${agent.name}" with the role of "${agent.role}". 
            ${agent.description || ""}
            Respond helpfully and accurately to complete the assigned task.`,
          });
        }

        // Get agent memories for context
        const memories = await db.getAgentMemories(input.id, 5);
        if (memories.length > 0) {
          const memoryContext = memories.map(m => m.content).join("\n");
          messages.push({
            role: "system",
            content: `Previous context and learnings:\n${memoryContext}`,
          });
        }

        messages.push({ role: "user", content: input.prompt });

        // Invoke LLM
        const response = await invokeLLM({ messages });
        const rawContent = response.choices[0]?.message?.content;
        const responseContent = typeof rawContent === 'string' ? rawContent : '';

        // Store memory
        await db.createAgentMemory({
          agentId: input.id,
          memoryType: "task_result",
          content: `Task: ${input.prompt}\nResult: ${responseContent.substring(0, 500)}`,
          importance: 0.7,
        });

        // Record metric
        await db.recordAgentMetric({
          agentId: input.id,
          metricType: "task_completion",
          value: 1,
          metadata: { prompt: input.prompt.substring(0, 100) },
          recordedAt: new Date(),
        });

        // Increment XP
        await db.incrementAgentXP(input.id, 25);

        // Update status back to idle
        await db.updateAgentStatus(input.id, "idle");

        return { response: responseContent };
      } catch (error) {
        await db.updateAgentStatus(input.id, "error");
        
        // Notify owner of error
        await notifyOwner({
          title: "Agent Error",
          content: `Agent "${agent.name}" encountered an error: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Agent invocation failed",
        });
      }
    }),

  getMetrics: protectedProcedure
    .input(z.object({ id: z.number(), days: z.number().default(7) }))
    .query(async ({ input }) => {
      return db.getAgentMetrics(input.id, input.days);
    }),

  getMemories: protectedProcedure
    .input(z.object({ id: z.number(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      return db.getAgentMemories(input.id, input.limit);
    }),
});

// ============================================
// QUEST ROUTER
// ============================================

const questRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getQuestsByUserId(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const quest = await db.getQuestById(input.id);
      if (!quest) return null;
      
      const tasks = await db.getTasksByQuestId(input.id);
      return { ...quest, tasks };
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      difficulty: z.enum(["novice", "apprentice", "journeyman", "expert", "master"]).default("apprentice"),
      xpReward: z.number().default(100),
      narrativeTheme: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const questId = await db.createQuest({
        userId: ctx.user.id,
        ...input,
      });
      
      await db.createNotification({
        userId: ctx.user.id,
        type: "info",
        title: "New Quest Created",
        message: `Quest "${input.title}" is ready to begin!`,
      });
      
      return { id: questId };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      status: z.enum(["pending", "active", "completed", "failed", "paused"]).optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const quest = await db.getQuestById(id);
      
      await db.updateQuest(id, data);
      
      // Award XP on completion
      if (data.status === "completed" && quest) {
        await db.updateUserXP(ctx.user.id, quest.xpReward);
        
        await db.createNotification({
          userId: ctx.user.id,
          type: "milestone",
          title: "Quest Completed!",
          message: `You earned ${quest.xpReward} XP for completing "${quest.title}"!`,
        });
        
        // Notify owner of milestone
        await notifyOwner({
          title: "Quest Milestone",
          content: `User completed quest: "${quest.title}"`,
        });
      }
      
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteQuest(input.id);
      return { success: true };
    }),

  decompose: protectedProcedure
    .input(z.object({
      id: z.number(),
      goal: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const quest = await db.getQuestById(input.id);
      if (!quest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Quest not found" });
      }

      // Use LLM to decompose the goal into tasks
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a task decomposition expert. Break down complex goals into smaller, actionable tasks.
            Return a JSON array of tasks with the following structure:
            [{ "title": "Task title", "description": "Task description", "priority": 1-5 }]
            Keep tasks specific, measurable, and achievable.`,
          },
          {
            role: "user",
            content: `Decompose this goal into 3-7 specific tasks: "${input.goal}"`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "task_list",
            strict: true,
            schema: {
              type: "object",
              properties: {
                tasks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      priority: { type: "integer" },
                    },
                    required: ["title", "description", "priority"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["tasks"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices[0]?.message?.content;
      if (!rawContent || typeof rawContent !== 'string') {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to decompose goal" });
      }

      const { tasks: decomposedTasks } = JSON.parse(rawContent) as { tasks: Array<{ title: string; description: string; priority: number }> };

      // Create tasks in database
      const taskIds: number[] = [];
      for (const task of decomposedTasks) {
        const taskId = await db.createTask({
          questId: input.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          xpReward: Math.floor(quest.xpReward / decomposedTasks.length),
        });
        taskIds.push(taskId);
      }

      // Update quest with task count
      await db.updateQuest(input.id, {
        totalTasks: decomposedTasks.length,
        status: "active",
        startedAt: new Date(),
      });

      return { taskIds, tasks: decomposedTasks };
    }),

  getMessages: protectedProcedure
    .input(z.object({ id: z.number(), limit: z.number().default(100) }))
    .query(async ({ input }) => {
      return db.getMessagesByQuestId(input.id, input.limit);
    }),
});

// ============================================
// TASK ROUTER
// ============================================

const taskRouter = router({
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getTaskById(input.id);
    }),

  listByQuest: protectedProcedure
    .input(z.object({ questId: z.number() }))
    .query(async ({ input }) => {
      return db.getTasksByQuestId(input.questId);
    }),

  create: protectedProcedure
    .input(z.object({
      questId: z.number(),
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      priority: z.number().default(0),
      xpReward: z.number().default(25),
    }))
    .mutation(async ({ input }) => {
      const taskId = await db.createTask(input);
      return { id: taskId };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["pending", "assigned", "running", "completed", "failed", "paused"]).optional(),
      assignedAgentId: z.number().nullable().optional(),
      output: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, output, ...rest } = input;
      const task = await db.getTaskById(id);
      
      await db.updateTask(id, {
        ...rest,
        output: output as Record<string, unknown> | undefined,
      });
      
      // If task completed, update quest progress and award XP
      if (rest.status === "completed" && task) {
        const quest = await db.getQuestById(task.questId);
        if (quest) {
          const newCompleted = quest.completedTasks + 1;
          const progress = Math.floor((newCompleted / quest.totalTasks) * 100);
          
          await db.updateQuest(task.questId, {
            completedTasks: newCompleted,
            progress,
            ...(newCompleted >= quest.totalTasks ? { status: "completed", completedAt: new Date() } : {}),
          });
          
          // Award task XP to user
          await db.updateUserXP(ctx.user.id, task.xpReward);
        }
        
        // Award XP to assigned agent
        if (task.assignedAgentId) {
          await db.incrementAgentXP(task.assignedAgentId, task.xpReward);
        }
      }
      
      return { success: true };
    }),

  assign: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      agentId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await db.updateTask(input.taskId, {
        assignedAgentId: input.agentId,
        status: "assigned",
      });
      
      // Create message for agent assignment
      await db.createAgentMessage({
        toAgentId: input.agentId,
        taskId: input.taskId,
        messageType: "task_assignment",
        content: `Task ${input.taskId} has been assigned to you.`,
      });
      
      return { success: true };
    }),

  execute: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const task = await db.getTaskById(input.id);
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      if (!task.assignedAgentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Task has no assigned agent" });
      }

      const agent = await db.getAgentById(task.assignedAgentId);
      if (!agent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Assigned agent not found" });
      }

      // Update task and agent status
      await db.updateTask(input.id, { status: "running", startedAt: new Date() });
      await db.updateAgentStatus(agent.id, "running");

      try {
        // Execute task using agent's LLM
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: agent.systemPrompt || `You are an AI agent named "${agent.name}" with the role of "${agent.role}". Complete the assigned task efficiently and accurately.`,
            },
            {
              role: "user",
              content: `Complete this task:\nTitle: ${task.title}\nDescription: ${task.description || "No additional description"}\n\nProvide a detailed response completing this task.`,
            },
          ],
        });

        const resultContent = response.choices[0]?.message?.content;
        const result = typeof resultContent === 'string' ? resultContent : '';

        // Update task with result
        await db.updateTask(input.id, {
          status: "completed",
          output: { result },
          completedAt: new Date(),
        });

        // Create completion message
        await db.createAgentMessage({
          fromAgentId: agent.id,
          taskId: input.id,
          messageType: "status_update",
          content: `Task completed: ${task.title}`,
          metadata: { result: result.substring(0, 200) },
        });

        // Update agent status
        await db.updateAgentStatus(agent.id, "idle");

        // Record metrics
        await db.recordAgentMetric({
          agentId: agent.id,
          metricType: "task_completion",
          value: 1,
          recordedAt: new Date(),
        });

        return { success: true, result };
      } catch (error) {
        await db.updateTask(input.id, {
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        });
        await db.updateAgentStatus(agent.id, "error");

        // Notify owner
        await notifyOwner({
          title: "Task Execution Failed",
          content: `Task "${task.title}" failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Task execution failed",
        });
      }
    }),
});

// ============================================
// DASHBOARD ROUTER
// ============================================

const dashboardRouter = router({
  stats: protectedProcedure.query(async ({ ctx }) => {
    return db.getDashboardStats(ctx.user.id);
  }),

  recentMessages: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      return db.getRecentMessages(ctx.user.id, input.limit);
    }),
});

// ============================================
// NOTIFICATION ROUTER
// ============================================

const notificationRouter = router({
  list: protectedProcedure
    .input(z.object({ unreadOnly: z.boolean().default(false) }))
    .query(async ({ ctx, input }) => {
      return db.getUserNotifications(ctx.user.id, input.unreadOnly);
    }),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.markNotificationRead(input.id);
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db.markAllNotificationsRead(ctx.user.id);
    return { success: true };
  }),
});

// ============================================
// INTERVENTION ROUTER
// ============================================

const interventionRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      return db.getInterventionsByUserId(ctx.user.id, input.limit);
    }),

  create: protectedProcedure
    .input(z.object({
      agentId: z.number().optional(),
      questId: z.number().optional(),
      taskId: z.number().optional(),
      interventionType: z.enum(["pause", "resume", "override", "feedback", "abort", "approve"]),
      reason: z.string().optional(),
      newState: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get current state before intervention
      let previousState: Record<string, unknown> = {};
      
      if (input.agentId) {
        const agent = await db.getAgentById(input.agentId);
        if (agent) {
          previousState = { agentStatus: agent.status };
          
          // Apply intervention
          if (input.interventionType === "pause") {
            await db.updateAgentStatus(input.agentId, "paused");
          } else if (input.interventionType === "resume") {
            await db.updateAgentStatus(input.agentId, "running");
          } else if (input.interventionType === "abort") {
            await db.updateAgentStatus(input.agentId, "idle");
          }
        }
      }

      if (input.questId) {
        const quest = await db.getQuestById(input.questId);
        if (quest) {
          previousState = { ...previousState, questStatus: quest.status };
          
          if (input.interventionType === "pause") {
            await db.updateQuest(input.questId, { status: "paused" });
          } else if (input.interventionType === "resume") {
            await db.updateQuest(input.questId, { status: "active" });
          }
        }
      }

      const interventionId = await db.createHumanIntervention({
        userId: ctx.user.id,
        agentId: input.agentId,
        questId: input.questId,
        taskId: input.taskId,
        interventionType: input.interventionType,
        reason: input.reason,
        previousState,
        newState: input.newState,
      });

      // Notify owner of intervention
      await notifyOwner({
        title: "Human Intervention",
        content: `User performed ${input.interventionType} intervention${input.reason ? `: ${input.reason}` : ""}`,
      });

      return { id: interventionId };
    }),
});

// ============================================
// SANDBOX ROUTER
// ============================================

const sandboxRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getSandboxEnvironmentsByUserId(ctx.user.id);
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      resourceType: z.enum(["compute", "storage", "network"]).default("compute"),
      config: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { config, ...rest } = input;
      const envId = await db.createSandboxEnvironment({
        userId: ctx.user.id,
        ...rest,
        config: config as Record<string, unknown> | undefined,
      });
      return { id: envId };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["provisioning", "running", "paused", "terminated", "error"]).optional(),
      cpuUsage: z.number().optional(),
      memoryUsage: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateSandboxEnvironment(id, { ...data, lastHealthCheck: new Date() });
      return { success: true };
    }),
});

// ============================================
// ACHIEVEMENT ROUTER
// ============================================

const achievementRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getAllAchievements();
  }),

  userAchievements: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserAchievements(ctx.user.id);
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      icon: z.string().optional(),
      category: z.enum(["quest", "agent", "milestone", "special"]).default("milestone"),
      xpReward: z.number().default(100),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admins can create achievements
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can create achievements" });
      }
      const achievementId = await db.createAchievement(input);
      return { id: achievementId };
    }),

  unlock: protectedProcedure
    .input(z.object({ achievementId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const unlocked = await db.unlockAchievement(ctx.user.id, input.achievementId);
      
      if (unlocked) {
        await db.createNotification({
          userId: ctx.user.id,
          type: "milestone",
          title: "Achievement Unlocked!",
          message: "You've earned a new achievement!",
        });
      }
      
      return { success: unlocked };
    }),
});

// ============================================
// MAIN ROUTER
// ============================================

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  agent: agentRouter,
  quest: questRouter,
  task: taskRouter,
  dashboard: dashboardRouter,
  notification: notificationRouter,
  intervention: interventionRouter,
  sandbox: sandboxRouter,
  achievement: achievementRouter,
});

export type AppRouter = typeof appRouter;
