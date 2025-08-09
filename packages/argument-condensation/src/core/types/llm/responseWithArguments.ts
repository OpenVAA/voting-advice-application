import type { Argument } from '../condensation/argument';

/**
 * Expected structure for LLM response containing arguments and reasoning
 *
 * @example
 * const response: ResponseWithArguments = {
 *   arguments: [{ id: '123', text: 'This is an argument' }],
 *   reasoning: 'Reasoning for why the arguments are valid'
 * };
 *
 *
 */
export interface ResponseWithArguments {
  arguments: Array<Argument>;
  reasoning: string;
}
