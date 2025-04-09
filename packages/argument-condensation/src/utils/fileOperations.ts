import { Argument } from '../core/types/argument';

/**
 * Exports condensed Arguments to multiple file formats
 * @param condensedArguments - Array of condensed Arguments to export
 * @param formats - Array of output formats ('txt', 'json', 'csv')
 */
export async function exportResults(
    condensedArguments: Argument[],
    formats: string[] = ['txt', 'json', 'csv']
  ): Promise<Record<string, string>> {
    const output: Record<string, string> = {};
  
    for (const fmt of formats) {
      if (fmt === 'txt') {
        // Plain text format with simple formatting
        const content = condensedArguments
          .map((arg, i) => `\n                                      *Argument ${i + 1}*\n${arg.argument}\n`)
          .join('\n');
        output[fmt] = content;
      } else if (fmt === 'json') {
        // Structured JSON format with all Argument details
        const jsonData = condensedArguments.map((arg, i) => ({
          argument_id: i + 1,
          topic: arg.topic,
          main_argument: arg.argument
        }));
        output[fmt] = JSON.stringify(jsonData, null, 2);
      } else if (fmt === 'csv') {
        // CSV format for spreadsheet compatibility
        const header = 'argument_id,topic,main_argument\n';
        const rows = condensedArguments.map((arg, i) => [i + 1, arg.topic, arg.argument].join(','));
        output[fmt] = header + rows.join('\n');
      }
    }
  
    return output;
  }
  