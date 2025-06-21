
/**
 * CLI arguments for setting prompts to use for next evaluation run.

 */
export interface CliArgs {
  help?: boolean;
  showAvailable?: boolean;
  showRefine?: boolean;
  showMap?: boolean;
  showReduce?: boolean;
  showGround?: boolean;
  showPros?: boolean;
  showCons?: boolean;
  refine?: string;
  map?: string;
  reduce?: string;
  ground?: string;
  outputType?: 'likertPros' | 'likertCons';
}