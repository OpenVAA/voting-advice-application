import { beforeAll, describe, expect, it } from 'vitest';
import { PromptRegistry } from '../../src/core/condensation/prompts/promptRegistry';
import { SUPPORTED_LANGUAGES } from '../../src/core/types';

describe('PromptRegistry integration with real prompts', () => {
  for (const lang of SUPPORTED_LANGUAGES) {
    describe(`For language: ${lang}`, () => {
      let registry: PromptRegistry;
      let prompts: Array<{ promptId: string; operation: string; outputType: string }>;

      beforeAll(async () => {
        registry = await PromptRegistry.create(lang);
        prompts = registry.listPrompts();
      });

      it('should create a registry and load prompts without errors', () => {
        expect(registry).toBeDefined();
        expect(prompts.length).toBeGreaterThan(0);
      });

      it('should have at least one prompt for MAP operation', () => {
        const mapPrompts = prompts.filter((p) => p.operation === 'MAP');
        expect(mapPrompts.length, `Expected at least one MAP prompt for language '${lang}'`).toBeGreaterThan(0);
      });

      it('should have at least one prompt for ITERATE_MAP operation', () => {
        const iterateMapPrompts = prompts.filter((p) => p.operation === 'ITERATE_MAP');
        expect(iterateMapPrompts.length, `Expected at least one ITERATE_MAP prompt for language '${lang}'`).toBeGreaterThan(0);
      });

      it('should have at least one prompt for REDUCE operation', () => {
        const reducePrompts = prompts.filter((p) => p.operation === 'REDUCE');
        expect(reducePrompts.length, `Expected at least one REDUCE prompt for language '${lang}'`).toBeGreaterThan(0);
      });

      describe('prompt variable validation', () => {
        // We only test for MAP and REDUCE as other operations are optional
        it('should contain correct variables for each prompt', () => {
          const relevantPrompts = prompts.filter((p) => ['MAP', 'REDUCE'].includes(p.operation));

          for (const { promptId } of relevantPrompts) {
            const prompt = registry.getPrompt(promptId);
            expect(prompt, `Prompt ${promptId} should be defined`).toBeDefined();
            if (!prompt) continue;

            if (prompt.operation === 'MAP') {
              expect(
                prompt.promptText,
                `MAP prompt ${promptId} for language '${lang}' should contain {{topic}}`
              ).toContain('{{topic}}');
              expect(
                prompt.promptText,
                `MAP prompt ${promptId} for language '${lang}' should contain {{comments}}`
              ).toContain('{{comments}}');
            } else if (prompt.operation === 'REDUCE') {
              expect(
                prompt.promptText,
                `REDUCE prompt ${promptId} for language '${lang}' should contain {{topic}}`
              ).toContain('{{topic}}');
              expect(
                prompt.promptText,
                `REDUCE prompt ${promptId} for language '${lang}' should contain {{argumentLists}}`
              ).toContain('{{argumentLists}}');
            }
          }
        });
      });
    });
  }
});
