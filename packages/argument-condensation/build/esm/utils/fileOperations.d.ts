import { Argument } from '../core/types/argument';
/**
 * Exports condensed Arguments to multiple file formats
 * @param condensedArguments - Array of condensed Arguments to export
 * @param formats - Array of output formats ('txt', 'json', 'csv')
 */
export declare function exportResults(condensedArguments: Argument[], formats?: string[]): Promise<Record<string, string>>;
//# sourceMappingURL=fileOperations.d.ts.map