#!/usr/bin/env bun
/**
 * Redis Conversation Viewer
 *
 * View conversations stored in Redis with filtering options.
 *
 * Usage:
 *   bun run frontend/src/scripts/viewConversations.ts --all
 *   bun run frontend/src/scripts/viewConversations.ts --minutes 30
 *   bun run frontend/src/scripts/viewConversations.ts --sessionId abc-123-xyz
 *   bun run frontend/src/scripts/viewConversations.ts --list
 *   bun run frontend/src/scripts/viewConversations.ts --all --json
 */

import Redis from 'ioredis';
import type { ConversationState } from '@openvaa/chatbot/server';

// Parse command-line arguments
interface Args {
  sessionId?: string;
  minutes?: number;
  all: boolean;
  json: boolean;
  list: boolean;
  help: boolean;
}

function parseArgs(): Args {
  const args: Args = {
    all: false,
    json: false,
    list: false,
    help: false
  };

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    switch (arg) {
      case '--sessionId':
        args.sessionId = process.argv[++i];
        break;
      case '--minutes':
        args.minutes = parseInt(process.argv[++i], 10);
        break;
      case '--all':
        args.all = true;
        break;
      case '--json':
        args.json = true;
        break;
      case '--list':
        args.list = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        console.error(`Unknown argument: ${arg}`);
        process.exit(1);
    }
  }

  return args;
}

function showHelp() {
  console.info(`
Redis Conversation Viewer

Usage:
  bun run frontend/src/scripts/viewConversations.ts [options]

Options:
  --sessionId <id>   View specific conversation by sessionId
  --minutes <n>      Only show conversations from last N minutes (based on TTL)
  --all              Show all conversations (default if no filters specified)
  --list             Just list sessionIds without full content
  --json             Output raw JSON instead of formatted text
  --help, -h         Show this help message

Examples:
  # View all conversations
  bun run frontend/src/scripts/viewConversations.ts --all

  # View conversations from last 30 minutes
  bun run frontend/src/scripts/viewConversations.ts --minutes 30

  # View specific conversation
  bun run frontend/src/scripts/viewConversations.ts --sessionId abc-123-xyz

  # List all sessionIds
  bun run frontend/src/scripts/viewConversations.ts --list
  `);
}

function formatAge(ttlSeconds: number): string {
  const ageSeconds = 24 * 60 * 60 - ttlSeconds; // 24h total - remaining = elapsed
  const minutes = Math.floor(ageSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `~${days}d ${hours % 24}h ago`;
  if (hours > 0) return `~${hours}h ${minutes % 60}m ago`;
  if (minutes > 0) return `~${minutes}m ago`;
  return `~${ageSeconds}s ago`;
}

function formatConversation(sessionId: string, state: ConversationState, ttl: number) {
  console.info('========================================');
  console.info(`Session: ${sessionId}`);
  console.info(`Age: ${formatAge(ttl)} (TTL: ${ttl}s remaining)`);
  console.info(`Locale: ${state.locale}`);
  console.info(`Messages: ${state.messages.length}`);
  console.info(`Working Memory: ${state.workingMemory.length} messages`);
  if (state.forgottenMessages.length > 0) {
    console.info(`Forgotten Messages: ${state.forgottenMessages.length}`);
  }
  if (state.lossyHistorySummary) {
    console.info(`Has Summary: Yes (${state.lossyHistorySummary.length} chars)`);
  }
  console.info('----------------------------------------\n');

  for (const msg of state.messages) {
    const role = msg.role === 'user' ? 'User' : 'Assistant';
    console.info(`[${role}]: ${msg.content}\n`);
  }

  console.info('========================================\n');
}

async function main() {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  // Connect to Redis
  // When running outside Docker, use localhost instead of 'redis' hostname
  const redisUrl = process.env.REDIS_URL_SCRIPT || 'redis://localhost:6379';
  const redis = new Redis(redisUrl, {
    tls: process.env.REDIS_TLS_ENABLED === 'true' ? {} : undefined
  });

  try {
    console.info(`[Redis] Connecting to ${redisUrl}...`);
    await redis.ping();
    console.info('[Redis] Connected!\n');

    let keys: Array<string> = [];

    if (args.sessionId) {
      // Check if specific sessionId exists
      const key = `conversation:state:${args.sessionId}`;
      const exists = await redis.exists(key);
      if (exists) {
        keys = [key];
      } else {
        console.error(`Session ${args.sessionId} not found.`);
        process.exit(1);
      }
    } else {
      // Scan for all conversation keys
      console.info('[Redis] Scanning for conversation keys...');
      keys = await redis.keys('conversation:state:*');
      console.info(`[Redis] Found ${keys.length} conversations\n`);

      if (keys.length === 0) {
        console.info('No conversations found in Redis.');
        process.exit(0);
      }
    }

    // Filter by time if --minutes specified
    if (args.minutes && !args.all) {
      console.info(`[Filter] Showing conversations from last ${args.minutes} minutes\n`);
      const filteredKeys: Array<string> = [];

      for (const key of keys) {
        const ttl = await redis.ttl(key);
        if (ttl > 0) {
          const ageMinutes = Math.floor((24 * 60 * 60 - ttl) / 60);
          if (ageMinutes <= args.minutes) {
            filteredKeys.push(key);
          }
        }
      }

      keys = filteredKeys;
      console.info(`[Filter] ${keys.length} conversations match time filter\n`);
    }

    if (keys.length === 0) {
      console.info('No conversations match the specified filters.');
      process.exit(0);
    }

    // List mode - just show sessionIds
    if (args.list) {
      console.info('Session IDs:');
      for (const key of keys) {
        const sessionId = key.replace('conversation:state:', '');
        const ttl = await redis.ttl(key);
        console.info(`  ${sessionId} (${formatAge(ttl)})`);
      }
      process.exit(0);
    }

    // Load and display conversations
    const conversations: Array<{ sessionId: string; state: ConversationState; ttl: number }> = [];

    for (const key of keys) {
      const data = await redis.get(key);
      const ttl = await redis.ttl(key);

      if (data) {
        const sessionId = key.replace('conversation:state:', '');
        const state = JSON.parse(data) as ConversationState;
        conversations.push({ sessionId, state, ttl });
      }
    }

    // Sort by age (most recent first)
    conversations.sort((a, b) => b.ttl - a.ttl);

    // Output
    if (args.json) {
      console.info(JSON.stringify(conversations, null, 2));
    } else {
      for (const { sessionId, state, ttl } of conversations) {
        formatConversation(sessionId, state, ttl);
      }

      console.info(`\nTotal: ${conversations.length} conversation(s)`);
    }

    await redis.quit();
  } catch (error) {
    console.error('[Error]', error);
    await redis.quit();
    process.exit(1);
  }
}

main();
