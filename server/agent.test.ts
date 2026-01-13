import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  getAgentsByUserId: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      name: "Test Agent",
      role: "executor",
      llmProvider: "gpt4",
      status: "idle",
      level: 1,
      xp: 0,
      tasksCompleted: 0,
      description: "A test agent",
      systemPrompt: null,
      capabilities: null,
      config: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getAgentById: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    name: "Test Agent",
    role: "executor",
    llmProvider: "gpt4",
    status: "idle",
    level: 1,
    xp: 0,
    tasksCompleted: 0,
    description: "A test agent",
    systemPrompt: null,
    capabilities: null,
    config: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  createAgent: vi.fn().mockResolvedValue(1),
  updateAgent: vi.fn().mockResolvedValue(undefined),
  deleteAgent: vi.fn().mockResolvedValue(undefined),
  updateAgentStatus: vi.fn().mockResolvedValue(undefined),
  createNotification: vi.fn().mockResolvedValue(undefined),
  createHumanIntervention: vi.fn().mockResolvedValue(1),
}));

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      level: 1,
      xp: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("agent router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists agents for the authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const agents = await caller.agent.list();

    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe("Test Agent");
    expect(agents[0].role).toBe("executor");
  });

  it("creates a new agent", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.agent.create({
      name: "New Agent",
      role: "planner",
      llmProvider: "claude",
      description: "A planning agent",
    });

    expect(result).toHaveProperty("id");
    expect(result.id).toBe(1);
  });

  it("gets an agent by id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const agent = await caller.agent.get({ id: 1 });

    expect(agent).toBeDefined();
    expect(agent?.name).toBe("Test Agent");
  });

  it("updates agent status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.agent.updateStatus({
      id: 1,
      status: "running",
    });

    expect(result).toEqual({ success: true });
  });

  it("deletes an agent", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.agent.delete({ id: 1 });

    expect(result).toEqual({ success: true });
  });
});

describe("quest router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication for quest operations", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.quest.list()).rejects.toThrow();
  });
});
