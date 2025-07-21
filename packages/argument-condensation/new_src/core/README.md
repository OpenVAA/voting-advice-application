- ARGUMENT CONDENSATION ENGINE
-
- The Condenser is the core engine that transforms raw VAA comments into structured arguments.
- It processes comments through a configurable pipeline of operations to extract, refine, and
- consolidate the key arguments present in user feedback.
-
- KEY CONCEPTS:
-
- 1.  OPERATIONS: Different types of processing steps (MAP, REDUCE, REFINE, GROUND)
- - MAP: Extract arguments from comment batches in parallel
- - REDUCE: Consolidate multiple argument lists into fewer, merged lists
- - REFINE: Sequential processing with argument accumulation across batches
- - GROUND: Connect arguments back to original comments for evidence
-
- 2.  DATA FLOW: Comments → Arguments → Refined Arguments → Final Output
- - Input: Array of VAAComment objects (raw user feedback)
- - Processing: Through multiple operation steps as defined in the plan
- - Output: Array of Argument objects (structured, consolidated arguments)
-
- 3.  OPERATION TREE: Visual representation of the processing pipeline
- - Tracks input/output at each step for debugging and visualization
- - Maintains parent-child relationships between operations
- - Provides execution metadata (timing, success/failure, tokens used)
-
- 4.  PARALLEL PROCESSING: Most operations (MAP, REDUCE, GROUND) run batches in parallel
- - Improves performance by utilizing LLM provider's parallel capabilities
- - Includes robust retry mechanisms for failed batches
- - Falls back gracefully when individual batches fail
-
- TYPICAL USAGE PIPELINE:
- 1.  MAP: Extract initial arguments from comment batches (parallel)
- 2.  MAP_ITERATE: Refine arguments using feedback loop (parallel)
- 3.  REDUCE: Consolidate multiple argument lists into fewer lists (parallel)

## Refine: Sequential Argument Accumulation

- REFINE OPERATION:
-
- Processes comments in batches sequentially, building up arguments iteratively.
- Unlike MAP, each batch builds upon the arguments from previous batches.
-
- PROCESS:
- 1.  Split comments into batches of specified size
- 2.  Process first batch to extract initial arguments
- 3.  For subsequent batches: pass existing arguments + new comments to LLM
- 4.  LLM refines/extends the argument list based on new evidence
- 5.  Continue until all batches are processed
-
- USE CASE: When you want arguments to evolve and build upon each other
- as more evidence is processed, rather than extracting independently.

## MAP: Parallel Argument Extraction with Iteration

-
- The most complex operation - processes comment batches in parallel to extract arguments,
- then runs an iteration step to refine those arguments using the original comments.
-
- TWO-PHASE PROCESS:
-
- PHASE 1 - INITIAL MAPPING:
- 1.  Split comments into batches
- 2.  Process all batches in parallel to extract initial arguments
- 3.  Each batch produces its own set of arguments independently
-
- PHASE 2 - ITERATIVE REFINEMENT:
- 1.  Take the arguments from Phase 1 + original comments for each batch
- 2.  Ask LLM to refine/improve the arguments based on the original evidence
- 3.  This allows the LLM to reconsider and improve its initial extraction
-
- ADVANTAGES:
- - Fast parallel processing for initial extraction
- - Iterative refinement improves argument quality
- - Robust error handling with graceful fallbacks
-
- TOKEN VALIDATION:
- - Includes pre-processing token estimation to prevent API errors
- - Fails fast if batches would exceed LLM context limits

## REDUCE: Parallel Argument List Consolidation

-
- Takes multiple argument lists and consolidates them into fewer, merged lists.
- This is typically used after MAP operations to reduce the number of separate
- argument lists down to a manageable number.
-
- PROCESS:
- 1.  Group argument lists into chunks based on denominator (e.g., 3 lists → 1 list)
- 2.  Process each chunk in parallel to merge the arguments
- 3.  LLM identifies overlaps, removes duplicates, and creates consolidated arguments
- 4.  Return fewer, higher-quality argument lists
-
- EXAMPLE:
- Input: [[args1], [args2], [args3], [args4], [args5], [args6]]
- With denominator=3: [[args1,args2,args3], [args4,args5,args6]]
- Output: [[merged_args1], [merged_args2]]

## GROUND: Connect Arguments to Source Evidence

-
- Takes final arguments and connects them back to specific comments that support them.
- This provides evidence and traceability for the generated arguments.
-
- PROCESS:
- 1.  For each argument list, pair it with a batch of original comments
- 2.  Ask LLM to identify which comments support which arguments
- 3.  May modify arguments to better reflect the supporting evidence
- 4.  Provides citation/grounding for transparency
-
- COMMENT ALLOCATION:
- - If we have fewer comment batches than argument lists, we replicate comments
- - This ensures every argument list gets grounded against actual evidence
-
- USE CASE: Final step to add credibility and traceability to arguments
