"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputParser = void 0;
class OutputParser {
    parseArguments(text) {
        const parsedArgs = [];
        const lines = text.split('\n');
        let currentArg = [];
        let inArguments = false;
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.includes('<ARGUMENTS>')) {
                inArguments = true;
                continue;
            }
            else if (trimmedLine.includes('</ARGUMENTS>')) {
                break;
            }
            else if (inArguments && trimmedLine.startsWith('ARGUMENTTI')) {
                if (currentArg.length) {
                    parsedArgs.push(currentArg.join(' '));
                    currentArg = [];
                }
                currentArg = [trimmedLine.split(':', 2)[1].trim()];
            }
            else if (inArguments && !trimmedLine.startsWith('Lähteet:') && trimmedLine) {
                currentArg.push(trimmedLine);
            }
        }
        if (currentArg.length) {
            parsedArgs.push(currentArg.join(' '));
        }
        return parsedArgs;
    }
    parseSourceIndices(text) {
        const sourceIndicesPerArg = [];
        const lines = text.split('\n');
        let inArguments = false;
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.includes('<ARGUMENTS>')) {
                inArguments = true;
                continue;
            }
            else if (trimmedLine.includes('</ARGUMENTS>')) {
                break;
            }
            else if (inArguments && trimmedLine.startsWith('Lähteet:')) {
                const numbersStr = trimmedLine
                    .split(':', 2)[1]
                    .trim()
                    .replace(/[\[\]]/g, '');
                if (numbersStr) {
                    const numbers = numbersStr
                        .split(',')
                        .map((numStr) => {
                        const matches = numStr.trim().match(/\d+/);
                        return matches ? parseInt(matches[0]) : null;
                    })
                        .filter((num) => num !== null);
                    sourceIndicesPerArg.push(numbers);
                }
                else {
                    sourceIndicesPerArg.push([]);
                }
            }
        }
        return sourceIndicesPerArg;
    }
}
exports.OutputParser = OutputParser;
