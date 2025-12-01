# Redis Refactoring Plan - Conversation State Management

## Summary

This plan outlines adding server-side conversation state persistence using Redis to the OpenVAA chatbot. The implementation follows a **phased, incremental approach** that prioritizes architectural soundness over feature completeness.

**Key Architectural Principles:**
- **Separation of Concerns:** Redis infrastructure lives in `frontend/src/lib/server/`, NOT in `packages/`
- **Dependency Injection:** Packages define storage interfaces, frontend provides Redis implementations

**Scope:** Phase 1 focuses ONLY on conversation state persistence. Rate limiting, session locks, and LLM request logging are future considerations, not part of this initial implementation.

**Status:** Planning phase - questions below must be answered before implementation begins.

---

## Questions to Answer Before Implementation

### Critical Architecture Decisions

**Q1: Do we actually need Redis-backed state persistence?**
- Yes.

**Q2: What storage pattern should we use?**
- Chatbot package defines `ConversationStateStore` interface, frontend implements with Redis

**Q3: Should conversation state be stored server-side at all?**
- No.

### Functionality & Privacy

**Q4: What should the conversation state TTL be?**
- 24 hours.

**Q5: Should conversation data be encrypted in Redis?**
- Yes. Use Encryption at rest. Use TLS supported by Redis. 

**Q6: What should happen if Redis is unavailable?**
- Fail hard - return error to user

### Existing Code Understanding

**Q7: What is the conversation logger?**
- Location: `packages/chatbot/src/utils/conversationLogger.ts`
- This is a removable part of the system. It was an experimental feature, which is now queued for removal. 

**Q8: How is state currently managed?**
- Location: `frontend/src/routes/[[lang=locale]]/api/chat/+server.ts` (line 21-35)
- Current: State is rebuilt from client messages on each request
- This is wasteful. This is why we are moving to a Redis-based approach. 

**Q9: Who creates sessionId - client or server?**
- Current: Client sends sessionId, server uses it or generates UUID
- Security concern: Client could manipulate sessionId to access other sessions
- **Action Required:** Have server implement UUID generation. 

### Technical Configuration

**Q10: What Redis configuration do we need?**
- Singleton pattern. Single connection. 
- Memory limits: 100mb with allkeys-lru eviction
- Persistence: appendonly yes (because we are getting ready for implementing rate limiting)

**Q11: Should TTL be configurable via environment variable?**
- No. Hardcoded.

**Q12: Key naming convention?**
- Simple: `conversation:state:{sessionId}`

---

## Implementation Steps

### Phase 2: Add Redis Implementation

#### Step 2.1: Install Redis Client

```bash
cd frontend
npm install ioredis
npm install -D @types/ioredis
```

**Decision Point:**
- Use `ioredis` (better TypeScript support, more features)
- Or `node-redis` (official client, simpler)
- **Recommendation:** ioredis

---

#### Step 2.2: Create Redis Client Singleton

**File:** `frontend/src/lib/server/redis/client.ts`

```typescript
import Redis from 'ioredis';
import { constants } from '../constants';

let redisClient: Redis | null = null;

/**
 * Get Redis client singleton.
 * Connects lazily on first access.
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = constants.REDIS_URL ?? 'redis://localhost:6379';
    
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });
    
    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err);
    });
    
    redisClient.on('connect', () => {
      console.info('[Redis] Connected to', redisUrl);
    });
    
    redisClient.on('ready', () => {
      console.info('[Redis] Ready to accept commands');
    });
    
    redisClient.on('close', () => {
      console.warn('[Redis] Connection closed');
    });
  }
  
  return redisClient;
}

/**
 * Close Redis connection (call on server shutdown)
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.info('[Redis] Connection closed gracefully');
  }
}
```

**Open Questions:**
- Should we call `closeRedisClient()` in SvelteKit hooks on shutdown?
- Connection retry strategy - current settings optimal?
- Should we fail hard if Redis is unavailable on startup, or allow lazy connection?

---

#### Step 2.3: Create Redis ConversationStateStore Implementation

**File:** `frontend/src/lib/server/redis/conversationStore.ts`

```typescript
import type { ConversationStateStore, ConversationState } from '@openvaa/chatbot/server';
import type Redis from 'ioredis';

/**
 * Redis-backed conversation state store.
 * States automatically expire after TTL.
 */
export class RedisConversationStore implements ConversationStateStore {
  private readonly TTL = 24 * 60 * 60; // 24 hours in seconds
  private readonly keyPrefix = 'conversation:state:';
  
  constructor(private redis: Redis) {}
  
  private getKey(sessionId: string): string {
    return `${this.keyPrefix}${sessionId}`;
  }
  
  async get(sessionId: string): Promise<ConversationState | null> {
    try {
      const data = await this.redis.get(this.getKey(sessionId));
      if (!data) return null;
      
      return JSON.parse(data) as ConversationState;
    } catch (error) {
      console.error('[RedisConversationStore] Error getting state:', error);
      throw error; // Let caller handle errors
    }
  }
  
  async set(sessionId: string, state: ConversationState): Promise<void> {
    try {
      const key = this.getKey(sessionId);
      const serialized = JSON.stringify(state);
      
      // Use SETEX for atomic set + expiration
      await this.redis.setex(key, this.TTL, serialized);
    } catch (error) {
      console.error('[RedisConversationStore] Error setting state:', error);
      throw error;
    }
  }
  
  async delete(sessionId: string): Promise<void> {
    try {
      await this.redis.del(this.getKey(sessionId));
    } catch (error) {
      console.error('[RedisConversationStore] Error deleting state:', error);
      throw error;
    }
  }
  
  /**
   * Update TTL without changing data (sliding window)
   */
  async touch(sessionId: string): Promise<boolean> {
    try {
      const result = await this.redis.expire(this.getKey(sessionId), this.TTL);
      return result === 1;
    } catch (error) {
      console.error('[RedisConversationStore] Error touching state:', error);
      return false;
    }
  }
}
```

**Open Questions:**
- Should TTL be configurable via env var or constructor parameter?
- Should we use sliding window TTL (update on each access via `touch()`)?
- Key naming convention - include environment or app version?
- JSON serialization - any issues with `Date` objects in state?
- Should we validate state structure on `get()` (schema validation)?

---

#### Step 2.4: Add Feature Flag and Environment Variables

**File:** `frontend/src/lib/server/constants.ts`

```typescript
export const constants = {
  // ... existing constants
  
  REDIS_URL: process.env.REDIS_URL,
  REDIS_ENABLED: process.env.REDIS_ENABLED !== 'false', // Default enabled
} as const;
```

**File:** `.env.example` (add these lines)

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=true
```

---

#### Step 2.5: Update Chat API to Use Redis Store

**File:** `frontend/src/routes/[[lang=locale]]/api/chat/+server.ts`

```typescript
import { RedisConversationStore } from '$lib/server/redis/conversationStore';
import { InMemoryConversationStore } from '$lib/server/storage/inMemoryConversationStore';
import { getRedisClient } from '$lib/server/redis/client';
import { constants } from '$lib/server/constants';

// Initialize store based on configuration
let conversationStore: ConversationStateStore;

try {
  if (constants.REDIS_ENABLED && constants.REDIS_URL) {
    conversationStore = new RedisConversationStore(getRedisClient());
    console.info('[Chat API] Using Redis conversation store');
  } else {
    conversationStore = new InMemoryConversationStore();
    console.info('[Chat API] Using in-memory conversation store');
  }
} catch (error) {
  console.error('[Chat API] Failed to initialize Redis, falling back to in-memory:', error);
  conversationStore = new InMemoryConversationStore();
}

// ... rest of the file remains the same
```

**Open Questions:**
- Should Redis failure fallback to in-memory automatically (as shown)?
- Or should we fail hard and return 500 to client?
- Log warning if `REDIS_ENABLED=true` but Redis unavailable?

---

### Phase 3: Conversation Logger Migration (Optional)

#### Step 3.1: Review Existing Conversation Logger

**Action Required:** Examine `packages/chatbot/src/utils/conversationLogger.ts`

**Questions to Answer:**
- What is it used for? Debugging, analytics, admin panel?
- Does it need to be queryable (e.g., admin can see all conversations)?
- Can it stay in-memory, or must it survive restarts?
- Is it separate from state, or should they be unified?

---

#### Step 3.2: Decide on Migration Strategy

**Option A:** Keep conversation logger separate from state
- Two Redis keys: `conversation:state:{sessionId}` and `conversation:log:{sessionId}`
- State: for business logic, expires after TTL
- Log: for analytics/debugging, longer TTL or permanent

**Option B:** Merge logger into state store
- Single source of truth
- Simpler architecture
- But mixing concerns (state vs logging)

**Option C:** Keep logger in-memory
- If only used for debugging/development
- Simplest approach

**Decision Required:** Depends on answer to Step 3.1 questions

---

### Phase 4: Testing & Validation

#### Step 4.1: Local Development Testing

**Start Redis:**
```bash
docker-compose -f docker-compose.dev.yml up redis
```

**Test Conversation Persistence:**
1. Send first message, note `sessionId` from response
2. Send second message with same `sessionId`
3. Verify context is maintained (chatbot remembers conversation)
4. Restart SvelteKit server (`Ctrl+C` and restart)
5. Send third message with same `sessionId`
6. Verify conversation context survived restart

**Test Fallback:**
1. Set `REDIS_ENABLED=false`
2. Restart server
3. Verify in-memory store is used
4. Conversation works but doesn't survive restart

---

#### Step 4.2: Redis Inspection

**Connect to Redis CLI:**
```bash
docker exec -it openvaa-redis-1 redis-cli
```

**Useful Commands:**
```redis
# Check memory usage
INFO memory

# View all conversation keys
KEYS conversation:*

# Get specific state
GET conversation:state:<session-id>

# Check TTL
TTL conversation:state:<session-id>

# Count total keys
DBSIZE

# Monitor commands in real-time
MONITOR
```

---

#### Step 4.3: Performance & Memory Monitoring

**Estimate Memory Usage:**
- Average conversation: ~10 message exchanges
- Average message: ~200 chars = ~200 bytes
- State overhead: workingMemory, metadata = ~2KB
- **Per session: ~2-5KB**
- **1000 concurrent sessions: ~2-5MB**
- Current Redis limit: 100MB = ~20,000-50,000 sessions

**Questions:**
- Is 100MB sufficient for expected scale?
- Should we increase `maxmemory` in production?
- Is `allkeys-lru` the right eviction policy?

---

## Future Considerations (Not Part of Phase 1)

### Rate Limiting
- Location: `frontend/src/lib/server/redis/rateLimiter.ts`
- Applied as middleware in API route before chatbot logic
- Separate concern from conversation state
- Consider: Per IP? Per session? Per user account?

### Session Locks
- Prevent concurrent requests for same sessionId
- Use Redis SETNX for distributed locks
- Question: Does chatbot handle concurrent requests poorly?
- Consider: Is this actually a problem, or premature optimization?

### LLM Request Logging
- Add `LLMRequestLogger` interface to `llm-refactor` package
- Implement in `frontend/src/lib/server/redis/llmLogger.ts`
- Inject into `LLMProvider` instances
- Use case: Track usage, costs, debugging

### Conversation Analytics
- Store aggregated metrics (messages per day, avg conversation length)
- Separate from state storage
- Use Redis streams or separate time-series DB

---

## Key Differences from Original Plan

| Original Plan | Revised Plan | Rationale |
|--------------|--------------|-----------|
| Redis code in `packages/chatbot/` | Redis in `frontend/src/lib/server/redis/` | Separation: infrastructure vs business logic |
| Everything at once | Incremental phases | Reduce complexity, easier testing |
| No fallback | In-memory fallback | Development ease, graceful degradation |
| Redis always required | Feature flag + optional | Flexibility, testing without Docker |
| Conversation logger must migrate | Evaluate first, then decide | Avoid unnecessary work |
| Rate limiting + locks + storage | State persistence only | Focus on one problem at a time |
| 24hr TTL hardcoded | Question to answer | Avoid premature decisions |

---

## Success Criteria

### Phase 1 Complete When:
- [ ] `ConversationStateStore` interface defined and exported
- [ ] `InMemoryConversationStore` implemented and working
- [ ] Chat API uses in-memory store successfully
- [ ] Conversation context maintained across requests (in same session)
- [ ] Code compiles and linter passes

### Phase 2 Complete When:
- [ ] Redis client connection established
- [ ] `RedisConversationStore` implemented
- [ ] Feature flag allows switching between Redis and in-memory
- [ ] Conversation state persists across server restarts
- [ ] Redis keys have correct TTL
- [ ] Error handling for Redis failures works

### Phase 3 Complete When:
- [ ] Conversation logger reviewed and decision made
- [ ] If migrating: Logger uses Redis or unified with state
- [ ] If not migrating: Documentation updated explaining why

### Phase 4 Complete When:
- [ ] Manual testing scenarios pass
- [ ] Redis memory usage is acceptable
- [ ] Documentation updated
- [ ] No regressions in chatbot functionality

---

## Rollout Strategy

### Development
1. Implement Phase 1 (in-memory only)
2. Test thoroughly
3. Implement Phase 2 (add Redis)
4. Test with `REDIS_ENABLED=true` and `false`
5. Keep in-memory as fallback

### Staging/Production
1. Deploy with `REDIS_ENABLED=false` first
2. Monitor for issues
3. Enable Redis: `REDIS_ENABLED=true`
4. Monitor Redis memory, connection stability
5. If issues: disable Redis (`REDIS_ENABLED=false`)

---

## Open Questions Summary

Collect all answers here before starting implementation:

1. **Do we actually need Redis state persistence?** _______________
2. **Storage pattern decision:** ☐ Option A (interfaces) ☐ Option B (frontend only)
3. **Should state be stored server-side?** ☐ Yes ☐ No ☐ Needs more analysis
4. **TTL duration:** _______ hours
5. **Encrypt conversations in Redis?** ☐ Yes ☐ No
6. **Redis unavailable strategy:** ☐ Fail hard ☐ Fallback ☐ Retry
7. **Conversation logger purpose:** _______________________
8. **Does logger need Redis?** ☐ Yes ☐ No ☐ Unsure
9. **SessionId creation:** ☐ Client ☐ Server ☐ Either (current)
10. **TTL configurable via env?** ☐ Yes (more flexible) ☐ No (simpler)
11. **Key naming convention:** `_________________________`
12. **Connection pooling config:** ☐ Use defaults ☐ Custom (specify: _____)

---

## Next Steps

1. ☐ Review this document
2. ☐ Answer all questions in "Open Questions Summary"
3. ☐ Validate that Redis state persistence is actually needed
4. ☐ Review existing conversation logger code
5. ☐ Decide on Phase 1 scope (proceed or simplify further)
6. ☐ Begin implementation at Phase 1, Step 1.1

---

*Last Updated: 2024-12-01*
*Status: Planning - Awaiting Question Answers*

