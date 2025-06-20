
/**
 * CLI arguments for setting prompts to use for next evaluation run.
 * 
 * Also used to show available prompts.
 */
export interface CliArgs {
  initial?: string;
  main?: string;
  improve?: string;
  help?: boolean;
  showAvailable?: boolean;
  showInitial?: boolean;
  showMain?: boolean;
  showImprove?: boolean;
}