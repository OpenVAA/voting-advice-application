## Core Logic: The Condenser
The Condenser is the core engine that transforms VAA comments into structured arguments.
It processes comments through a configurable pipeline of operations to extract and coalesce
the key arguments present in VAA open answers. 

## Key Concepts

1. OPERATIONS: Different types of processing steps (MAP, REDUCE, REFINE, GROUND)
MAP: Extract arguments from comment batches in parallel
ITERATE_MAP: Make sure MAP didn't miss anything. Expand MAP output arguments using the same comment batch
REDUCE: Consolidate multiple argument lists into fewer, merged lists
REFINE: Sequential processing with argument accumulation across batches
GROUND: Connect arguments back to original comments for evidence

2. DATA FLOW: Comments → Extract Arguments → Improve & Coalesce Arguments -> Output Arguments
Input: Array of VAAComment objects (raw string inputs with optional metadata)
Processing: Through multiple operation steps that can be configured
Output: Array of Argument objects

3. OPERATION TREE: Visual representation of the processing pipeline
Tracks input/output at each step for debugging and visualization
Maintains parent-child relationships between operations
Provides execution metadata (timing, success/failure, tokens used)
Doesn't include the raw prompts. For prompt templates see core/condensation/prompts 

4. PARALLEL PROCESSING: Most operations (MAP, REDUCE and GROUND) run batches in parallel
Improves performance by utilizing LLM provider's parallel capabilities
Includes robust retry mechanisms for failed batches
Falls back gracefully when individual batches fail

TYPICAL USAGE PIPELINE:
1. MAP: Extract initial arguments from comment batches (parallel)
2. ITERATE_MAP: Refine arguments using feedback loop (parallel)
3. REDUCE: Consolidate multiple argument lists into fewer lists (parallel)

## Refine: Sequential Argument Accumulation

REFINE OPERATION:

Processes comments in batches sequentially, building up arguments iteratively.
Unlike MAP, each batch builds upon the arguments from previous batches.

PROCESS:
1.  Split comments into batches of specified size
2.  Process first batch to extract initial arguments
3.  For subsequent batches: pass existing arguments + new comments to LLM
4.  LLM refines/extends the argument list based on new evidence
5.  Continue until all batches are processed

USE CASE: When you want arguments to evolve and build upon each other
as more evidence is processed, rather than extracting independently.

## MAP: Parallel Argument Extraction with Iteration

The most complex operation processes comment batches in parallel to extract arguments,
then runs an iteration step to refine those arguments using the original comments.

TWO-PHASE PROCESS:

PHASE 1 INITIAL MAPPING:
1.  Split comments into batches
2.  Process all batches in parallel to extract initial arguments
3.  Each batch produces its own set of arguments independently

PHASE 2 ITERATIVE REFINEMENT:
1.  Take the arguments from Phase 1 + original comments for each batch
2.  Ask LLM to refine/improve the arguments based on the original evidence
3.  This allows the LLM to reconsider and improve its initial extraction

## REDUCE: Parallel Argument List Consolidation

Takes multiple argument lists and consolidates them into fewer, merged lists.
This is typically used after MAP operations to reduce the number of separate
argument lists down to a manageable number.

PROCESS:
1.  Group argument lists into a single LLM call based on denominator (e.g., 3 lists → 1 list)
2.  Merge the arguments lists
3.  LLM identifies overlaps, removes duplicates, and returns fewer, consolidated arguments

EXAMPLE:
Input: [[args1], [args2], [args3], [args4], [args5], [args6]]
With denominator=3: [[args1,args2,args3], [args4,args5,args6]]
Output: [[merged_args1], [merged_args2]] 

## GROUND: Connect Arguments to Source Info

Takes final arguments and connects them back to specific comments that support them.
This provides evidence and traceability for the generated arguments.

PROCESS:
1.  For each argument list, pair it with a batch of original comments (it doesn't really matter which ones)
2.  Ask LLM to identify which comments support which arguments
3.  May modify arguments to better reflect the supporting evidence and tone of the comments

COMMENT ALLOCATION:
If we have fewer comment batches than argument lists, we replicate comments
This ensures every argument list gets grounded against actual evidence

USE CASE: Final step to add credibility and traceability to arguments
