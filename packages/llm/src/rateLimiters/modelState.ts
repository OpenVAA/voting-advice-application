
/**
 * Manages models that are available for use. This is used to handle daily limits and fallback. 
 * Uses a queue: we have multiple fallback models that we can rotate through.
 */
export class ModelState {
  private dailyLimitReached = new Set<string>();
  private allModels: string[];
  private currentMainModel: string;
  private currentFallbackModel: string | null;
  
  constructor(primaryModel: string, fallbackModel?: string) {
    // Build the full model list: primary, fallback (if given), then const defaults
    this.allModels = [primaryModel];
    if (fallbackModel) {
      this.allModels.push(fallbackModel);
    }
    this.allModels.push('gpt-4o-mini', 'gpt-4.1-mini', 'gpt-3.5-turbo'); // Add defaults. TODO: Configure. 
    
    // Remove duplicates while preserving order
    this.allModels = this.allModels.filter((m, i, arr) => arr.indexOf(m) === i);
    
    this.currentMainModel = primaryModel;
    
    if (fallbackModel) {
      this.currentFallbackModel = fallbackModel;
    } else {
      this.currentFallbackModel = null; // No fallback until daily limit hit
    }
    console.info(`🔄 INITIALIZATION: Model rotation: Main=${this.currentMainModel}, Fallback=${this.currentFallbackModel || 'none'}`);
  }
  
  isDailyLimited(model: string): boolean {
    return this.dailyLimitReached.has(model);
  }
  
  markDailyLimitReached(model: string): void {
    this.dailyLimitReached.add(model);
    this.rotateModels();
  }

  /**
   * If a model has reached its daily limit, rotate to the next available model.
   */
  public rotateModels(): void {
    const availableModels = this.allModels.filter(m => !this.dailyLimitReached.has(m));
    
    if (availableModels.length === 0) {
      throw new Error('All models have reached daily limits');
    }
    
    this.currentMainModel = availableModels[0];
    this.currentFallbackModel = availableModels[1] || null;
    
    console.info(`🔄 Model rotation: Main=${this.currentMainModel}, Fallback=${this.currentFallbackModel || 'none'}`);
  }
  
  get mainModel(): string {
    return this.currentMainModel;
  }
  
  get fallbackModel(): string | null {
    return this.currentFallbackModel;
  }
  
  get hasFallback(): boolean {
    return this.currentFallbackModel !== null;
  }
  
  availableModelsCount(): number {
    return this.allModels.filter(m => !this.dailyLimitReached.has(m)).length;
  }
  
  get allAvailableModels(): string[] {
    return this.allModels.filter(m => !this.dailyLimitReached.has(m));
  }
}