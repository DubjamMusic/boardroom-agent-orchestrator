CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(100),
	`category` enum('quest','agent','milestone','special') NOT NULL DEFAULT 'quest',
	`xpReward` int NOT NULL DEFAULT 50,
	`requirement` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_memories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`memoryType` enum('task_result','learned_strategy','knowledge','context','feedback') NOT NULL,
	`content` text NOT NULL,
	`embedding` json,
	`importance` float DEFAULT 0.5,
	`accessCount` int NOT NULL DEFAULT 0,
	`lastAccessedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_memories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromAgentId` int,
	`toAgentId` int,
	`questId` int,
	`taskId` int,
	`messageType` enum('task_assignment','status_update','data_request','data_response','coordination','error','human_feedback') NOT NULL,
	`content` text NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`metricType` enum('task_completion','response_time','error_rate','token_usage','success_rate') NOT NULL,
	`value` float NOT NULL,
	`metadata` json,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` enum('planner','executor','monitor','data_agent') NOT NULL,
	`llmProvider` enum('gpt4','claude','gemini') NOT NULL DEFAULT 'gpt4',
	`status` enum('idle','running','paused','error','completed') NOT NULL DEFAULT 'idle',
	`description` text,
	`systemPrompt` text,
	`capabilities` json,
	`config` json,
	`xp` int NOT NULL DEFAULT 0,
	`level` int NOT NULL DEFAULT 1,
	`successRate` float DEFAULT 0,
	`tasksCompleted` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `human_interventions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentId` int,
	`questId` int,
	`taskId` int,
	`interventionType` enum('pause','resume','override','feedback','abort','approve') NOT NULL,
	`reason` text,
	`previousState` json,
	`newState` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `human_interventions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('info','warning','error','success','milestone','intervention_required') NOT NULL DEFAULT 'info',
	`title` varchar(255) NOT NULL,
	`message` text,
	`read` boolean NOT NULL DEFAULT false,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('pending','active','completed','failed','paused') NOT NULL DEFAULT 'pending',
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`xpReward` int NOT NULL DEFAULT 100,
	`difficulty` enum('novice','apprentice','journeyman','expert','master') NOT NULL DEFAULT 'apprentice',
	`progress` int NOT NULL DEFAULT 0,
	`totalTasks` int NOT NULL DEFAULT 0,
	`completedTasks` int NOT NULL DEFAULT 0,
	`narrativeTheme` varchar(100),
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sandbox_environments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`status` enum('provisioning','running','paused','terminated','error') NOT NULL DEFAULT 'provisioning',
	`resourceType` enum('compute','storage','network') NOT NULL DEFAULT 'compute',
	`config` json,
	`ipAddress` varchar(45),
	`port` int,
	`cpuUsage` float DEFAULT 0,
	`memoryUsage` float DEFAULT 0,
	`lastHealthCheck` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sandbox_environments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`questId` int NOT NULL,
	`assignedAgentId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('pending','assigned','running','completed','failed','paused') NOT NULL DEFAULT 'pending',
	`priority` int NOT NULL DEFAULT 0,
	`xpReward` int NOT NULL DEFAULT 25,
	`input` json,
	`output` json,
	`errorMessage` text,
	`retryCount` int NOT NULL DEFAULT 0,
	`maxRetries` int NOT NULL DEFAULT 3,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementId` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `xp` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `level` int DEFAULT 1 NOT NULL;