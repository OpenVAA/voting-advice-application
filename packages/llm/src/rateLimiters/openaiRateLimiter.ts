/**
 * Rate limiter for OpenAI API calls. Stateful for one OpenAI model. 
 * Tracks tokens per minute (TPM) and requests per minute (RPM) to stay within limits.
 * Does NOT account for tokens or requests per day (TPD, RPD). 
 */
export class OpenAIRateLimiter {
  private tokenUsage: Array<{ timestamp: number; tokens: number }> = [];
  private requestUsage: Array<{ timestamp: number }> = [];
  public readonly tpmLimit: number;
  public readonly rpmLimit: number;
  public model: string;
  private readonly safetyMargin: number = 0.95; // Use 95% of capacity
  

  constructor(model: string) {
    this.model = model;
    // Set limits based on model - these are typical OpenAI limits
    const limits = this.getModelTPMLimits(model);
    this.tpmLimit = Math.floor(limits.tpm * this.safetyMargin);
    this.rpmLimit = Math.floor(limits.rpm * this.safetyMargin); 
  }

  private getModelTPMLimits(model: string): { tpm: number; rpm: number } {
    const modelLimits: Record<string, { tpm: number; rpm: number }> = {
      'gpt-4o': { tpm: 30000, rpm: 500 },
      'gpt-4o-mini': { tpm: 200000, rpm: 500 },
      'o1-mini': { tpm: 200000, rpm: 500 },
      'o3-mini': { tpm: 200000, rpm: 500 },
      'o1': { tpm: 30000, rpm: 500 },
      'gpt-4.1': { tpm: 30000, rpm: 500 },
      'gpt-4.1-mini': { tpm: 200000, rpm: 500 },
      'gpt-4': { tpm: 10000, rpm: 500 },
      'gpt-3.5-turbo': { tpm: 200000, rpm: 500 },

    };

    return modelLimits[model] || { tpm: 10000, rpm: 100 }; // Conservative defaults
  }

  /**
   * Clean up old usage records (older than 1 minute)
   */
  private cleanupOldTPMRecords(): void {
    const oneMinuteAgo = Date.now() - 60000;
    this.tokenUsage = this.tokenUsage.filter(record => record.timestamp > oneMinuteAgo);
    this.requestUsage = this.requestUsage.filter(record => record.timestamp > oneMinuteAgo);
  }

  /**
   * Get current usage within the last minute
   */
  private getCurrentTPMUsage(): { tokens: number; requests: number } {
    this.cleanupOldTPMRecords();    
    const tokens = this.tokenUsage.reduce((sum, record) => sum + record.tokens, 0);
    const requests = this.requestUsage.length;
    return { tokens, requests };
  }

  /**
   * Check if we can make a request with the given estimated tokens given the current usage
   */
  hasEnoughTPM({ estimatedTokens }: { estimatedTokens: number }): boolean {
    // Clean up old records first (older than 1 minute)
    this.cleanupOldTPMRecords();
    
    const currentTPMUsage = this.tokenUsage.reduce((sum, record) => sum + record.tokens, 0);
    return (currentTPMUsage + estimatedTokens) <= this.tpmLimit;
  }

  /**
   * Calculate how long to wait before making a request
   */
  getWaitTimeTPM({ estimatedTokens }: { estimatedTokens: number }): number {
    const current = this.getCurrentTPMUsage();
    
    // If we're within limits, no wait needed
    if (this.hasEnoughTPM({ estimatedTokens })) {
      return 0;
    }

    // Calculate wait time based on when oldest records will expire
    const oldestTokenRecord = this.tokenUsage[0];
    const oldestRequestRecord = this.requestUsage[0];
    
    let waitTime = 0;
    
    // Check token limit
    if ((current.tokens + estimatedTokens) > this.tpmLimit && oldestTokenRecord) {
      const tokenWaitTime = (oldestTokenRecord.timestamp + 60000) - Date.now();
      waitTime = Math.max(waitTime, tokenWaitTime);
    }
    
    // Check request limit
    if ((current.requests + 1) > this.rpmLimit && oldestRequestRecord) {
      const requestWaitTime = (oldestRequestRecord.timestamp + 60000) - Date.now();
      waitTime = Math.max(waitTime, requestWaitTime);
    }
    
    return Math.max(0, waitTime);
  }

  /**
   * Calculate how long to wait before making a request
   */
  getWaitTime({ estimatedTokens }: { estimatedTokens: number }): number {
    return this.getWaitTimeTPM({ estimatedTokens });
  }

  /**
   * Record a completed request
   */
  recordRequest(tokensUsed: number): void {
    const now = Date.now();
    this.tokenUsage.push({ timestamp: now, tokens: tokensUsed });
    this.requestUsage.push({ timestamp: now });
  }

  /**
   * Record a completed request
   */
  recordUsage({ tokensUsed }: { tokensUsed: number }): void {
    this.recordRequest(tokensUsed);
  }

  /**
   * Get current rate limit status
   */
  getStatus(): { tpm: { used: number; limit: number; percentage: number }, rpm: { used: number; limit: number; percentage: number } } {
    const current = this.getCurrentTPMUsage();
    
    return {
      tpm: {
        used: current.tokens,
        limit: this.tpmLimit,
        percentage: (current.tokens / this.tpmLimit) * 100
      },
      rpm: {
        used: current.requests,
        limit: this.rpmLimit,
        percentage: (current.requests / this.rpmLimit) * 100
      }
    };
  }
}