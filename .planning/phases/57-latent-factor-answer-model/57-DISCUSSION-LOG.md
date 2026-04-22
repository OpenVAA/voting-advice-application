# Phase 57: Latent-Factor Answer Model - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 57-latent-factor-answer-model
**Areas discussed:** Latent-space geometry, Loadings & answer mapping, Sub-step hook architecture, Clustering verification

---

## Latent-space geometry

### Q1: Default latent dimension count when template supplies none?
| Option | Description | Selected |
|--------|-------------|----------|
| 2 (political compass) | Classic 2D economic/social axes; smallest, visually interpretable | ✓ |
| 4 (richer but compact) | Captures more nuance (econ/social/EU/env); loading matrix Q×4 | |
| Configurable, default 3 | Middle ground; three uncorrelated axes for non-trivial loadings | |

**User's choice:** 2 (political compass)

### Q2: Should default latent space carry per-dimension variance weights (eigenvalues)?
| Option | Description | Selected |
|--------|-------------|----------|
| No — uniform variance | Each dimension equal; `eigenvalues` optional override | |
| Yes — decaying defaults | Default eigenvalues [1.0, 0.7, 0.5, …] PCA-like | |

**User's choice:** Other — "2 with big decay like 1, 0.333, 0.1111"
**Interpretation:** Geometric decay with ratio 1/3 per step → `[1, 0.333]` for 2D, generalizes to `[1, 1/3, 1/9, …]` for any dim count.

### Q3: Default per-party centroid sampling strategy?
| Option | Description | Selected |
|--------|-------------|----------|
| Farthest-point sampling | Seed one random, iteratively pick next maximizing min-dist | ✓ |
| Latin hypercube | Stratified sampling across each dimension | |
| Max-min optimization | Iterative maximization via gradient/swap steps | |

**User's choice:** Farthest-point sampling

### Q4: Per-party spread parameter semantics when set in template?
| Option | Description | Selected |
|--------|-------------|----------|
| Std-dev of isotropic Gaussian | N(centroid, spread²·I); default 0.15 relative | ✓ |
| Uniform radius | Ball of radius=spread around centroid | |
| Std-dev per dimension (vector) | Anisotropic; scalar broadcasts, vector per-dim | |

**User's choice:** Std-dev of isotropic Gaussian

---

## Loadings & answer mapping

### Q1: Default question→dimension loading matrix (Q×D)?
| Option | Description | Selected |
|--------|-------------|----------|
| Dense Gaussian N(0,1) | Every Q loads on every dim with random weight | ✓ |
| Sparse (1-2 dims per Q) | Each Q randomly assigned 1-2 dominant dims | |
| Uniform [-1, 1] dense | Bounded, predictable magnitudes | |

**User's choice:** Dense Gaussian N(0,1)

### Q2: Per-question override shape when template sets custom loadings?
| Option | Description | Selected |
|--------|-------------|----------|
| Array of numbers length=D | `questions.fixed[].loadings: number[]` matches matrix row | ✓ |
| Named dimensions object | `loadings: { econ: 0.8, social: -0.3 }` | |
| Primary dim + magnitude | `loadings: { dim: 0, weight: 0.9 }` | |

**User's choice:** Array of numbers length=D

### Q3: How does latent projection map to a Likert-ordinal answer value?
| Option | Description | Selected |
|--------|-------------|----------|
| Linear bucket to choice ids | Compute z, map via logistic/tanh, bucket by choices | ✓ |
| Argmax over choice loadings | Each choice has own latent position; pick argmin dist | |
| Gaussian-cdf quantile buckets | Equal probability mass per bucket | |

**User's choice:** Linear bucket (option 1)
**User note:** "leverage the data package's ordinal question code if possible or the matching package to ensure compliance"

### Q4: How does projection map to categorical/multi-choice question answers?
| Option | Description | Selected |
|--------|-------------|----------|
| Per-choice loadings, argmax/threshold | Each choice gets loading vector; argmax (single) or dot>0 (multi) | ✓ |
| Fallback to defaultRandomValidEmit | D-21 fallback; no categorical clustering | |
| First-choice-wins thresholding | Project onto 1st dim; bucket into choice order | |

**User's choice:** Per-choice loadings, argmax (single) / threshold (multi)

---

## Sub-step hook architecture

### Q1: How does a consumer override a single sub-step?
| Option | Description | Selected |
|--------|-------------|----------|
| ctx.latent = { dims, centroids, … } | Single nested object on ctx; each field optional fn | ✓ |
| Flat ctx fields | `ctx.latentDimensions`, etc. — 6 ctx fields | |
| LatentPipeline interface with methods | `ctx.latent = new LatentPipeline(…)` | |

**User's choice:** ctx.latent = { dimensions, centroids, spread, positions, loadings, project }

### Q2: How does the Phase 57 latent emitter compose the 6 sub-steps internally?
| Option | Description | Selected |
|--------|-------------|----------|
| Flat top-down function | One function calling each sub-step in order | ✓ |
| Memoized space + per-candidate closure | Space cached on ctx; per-candidate pure | |
| Pipeline object with run() method | LatentPipeline instance holding state | |

**User's choice:** Flat top-down function

### Q3: Override precedence — sub-step hook vs template field?
| Option | Description | Selected |
|--------|-------------|----------|
| Template data wins over hook | Explicit data overrides function | |
| Hook wins over template | Function is the programmatic override | ✓ |
| Template-only override | Remove ctx.latent hook entirely | |

**User's choice:** Hook wins over template

### Q4: How do unit tests for each sub-step get at default implementations?
| Option | Description | Selected |
|--------|-------------|----------|
| Export each default as a named function | `export function defaultCentroidSampler(...)` | ✓ |
| Single export of a defaults bundle | `export const defaultLatent = { ... }` | |
| Internal helpers only + test via emitter output | Don't export sub-steps | |

**User's choice:** Export each default as a named function

---

## Clustering verification

### Q1: Which distance metric drives Success Criterion 5?
| Option | Description | Selected |
|--------|-------------|----------|
| Manhattan (default in @openvaa/matching) | Same metric as UI | ✓ |
| Latent-space Euclidean | Pure latent distance before projection | |
| Both — assert on each | Tighter safety net | |

**User's choice:** Manhattan

### Q2: 'Measurable margin' threshold?
| Option | Description | Selected |
|--------|-------------|----------|
| mean_intra / mean_inter < 0.5 | Intra avg < half inter avg | ✓ |
| mean_intra / mean_inter < 0.75 | Looser; survives higher noise | |
| max_intra < min_inter (strict separation) | Every intra < every inter | |

**User's choice:** mean_intra / mean_inter < 0.5

### Q3: Shape of the Success Criterion 5 integration test?
| Option | Description | Selected |
|--------|-------------|----------|
| Unit-style: pipeline + in-memory matching | Fixed seed, no DB | ✓ |
| DB integration: bulk_import + round-trip | Live Supabase; slower | |
| Both — unit for clustering, integration for round-trip | Separated concerns | |

**User's choice:** Unit-style

### Q4: How do `candidates.fixed[]` rows interact with the latent pipeline?
| Option | Description | Selected |
|--------|-------------|----------|
| Fixed rows skip latent; synthetic go through | Fixed uses verbatim answers or defaultRandomValidEmit | ✓ |
| Fixed rows with explicit party ref get latent answers too | Richer but unpredictable | |
| Fixed rows always skip latent; no fallback | Empty answers; breaks TMPL-03 | |

**User's choice:** Fixed rows skip latent entirely; synthetic rows go through pipeline

---

## Claude's Discretion

- Exact file layout under `src/emitters/latent/` (single file vs grouped by theme)
- Space-bundle cache location (closure vs `ctx.latent._cache`)
- Box-Muller vs other Gaussian-from-uniform transform
- Multi-choice threshold exact value (`> 0` vs small positive bias)
- Emitter naming (`latentAnswerEmitter` vs `emitLatentAnswers` vs `latentFactorEmitter`)
- Whether `spread` hook runs once (scalar/array return) or per-candidate

## Deferred Ideas

- Anisotropic spread per dimension (eigenvalues already anisotropize)
- Latin hypercube / max-min-optimization centroid strategies
- Gaussian-CDF quantile Likert bucketing
- DB round-trip integration test (Phase 58 DX-03 covers this)
- Fixed rows running through latent when they have `organization` ref
- Sparse loading defaults
- Named-dimension override shape
