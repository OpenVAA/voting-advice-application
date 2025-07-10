import { ModelState } from "../rateLimiters/modelState";
import { OpenAIRateLimiter } from "../rateLimiters/openaiRateLimiter";

/**
 * Get or create rate limiter for a specific model
 */
export function getRateLimiter({
  model,
  rateLimiters
}: {
  model: string;
  rateLimiters: Map<string, OpenAIRateLimiter>;
}): OpenAIRateLimiter {
  if (!rateLimiters.has(model)) {
    rateLimiters.set(model, new OpenAIRateLimiter(model));
  }
  return rateLimiters.get(model)!;
}

/**
 * Select the best available model for generation based on daily limits and rate limits
 */
export async function selectModelForGeneration({
  estimatedTokens,
  modelState,
  rateLimiters
}: {
  estimatedTokens: number;
  modelState: ModelState;
  rateLimiters: Map<string, OpenAIRateLimiter>;
}): Promise<string> {
  // Check if main model is available (not daily limited)
  if (!modelState.isDailyLimited(modelState.mainModel)) {
    const mainRateLimiter = getRateLimiter({ model: modelState.mainModel, rateLimiters });
    const canUseMainModel = mainRateLimiter.hasEnoughTPM({ estimatedTokens });
    
    // If we can use main, do it
    if (canUseMainModel) {
      console.info(`🔄 Using main model ${modelState.mainModel} (has TPM capacity)`);
      return modelState.mainModel;
    }

    // If main model would hit TPM, check if we can use fallback. If not, wait for main model to become available again
    if (modelState.hasFallback && modelState.fallbackModel) {
      if (modelState.isDailyLimited(modelState.fallbackModel)) {
        console.info(`🔄 Fallback model ${modelState.fallbackModel} is daily limited, waiting for main model to become available again`);
        return modelState.mainModel;
      }

      const fallbackRateLimiter = getRateLimiter({ model: modelState.fallbackModel, rateLimiters });
      const canUseFallbackModel = fallbackRateLimiter.hasEnoughTPM({ estimatedTokens });
      console.info(`🔄 Can the fallback model ${modelState.fallbackModel} make a request: ${canUseFallbackModel}`);

      // If we can use fallback, do it
      if (canUseFallbackModel) {
        console.info(`🔄 Using fallback model ${modelState.fallbackModel} (has TPM capacity)`);
        return modelState.fallbackModel;
      }
      else {
        console.info(`🔄 Fallback model ${modelState.fallbackModel} would hit rate limit, comparing wait times`);
        const waitTimeFallback = fallbackRateLimiter.getWaitTimeTPM({ estimatedTokens });
        const waitTimeMain = mainRateLimiter.getWaitTimeTPM({ estimatedTokens });
        console.info(`🔄 Wait times: ${modelState.fallbackModel} ${waitTimeFallback}ms, ${modelState.mainModel} ${waitTimeMain}ms`);
        if (waitTimeFallback <= waitTimeMain) {
          console.info(`🔄 Using fallback model ${modelState.fallbackModel} due to lower wait time`);
          return modelState.fallbackModel;
        }
        else {
          console.info(`🔄 Using main model ${modelState.mainModel} due to lower wait time`);
          return modelState.mainModel;
        }
      }
    }
    else {
      console.info(`No constructor fallback model available. Waiting for main model to become available again. `);
      return modelState.mainModel;
    }
  }
  else {
    console.info(`🔄 Main model ${modelState.mainModel} is daily limited, rotating and trying again`);
    modelState.rotateModels(); // This should usually be called elsewhere but we'll do it here as well to be safe
    return selectModelForGeneration({ estimatedTokens, modelState, rateLimiters });
  }
}