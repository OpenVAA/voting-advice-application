export class OutputParser {
  parseArguments(text: string): string[] {
    const parsedArgs: string[] = [];
    const lines = text.split('\n');
    let currentArg: string[] = [];
    let inArguments = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.includes('<ARGUMENTS>')) {
        inArguments = true;
        continue;
      } else if (trimmedLine.includes('</ARGUMENTS>')) {
        break;
      } else if (inArguments && trimmedLine.startsWith('ARGUMENTTI')) {
        if (currentArg.length) {
          parsedArgs.push(currentArg.join(' '));
          currentArg = [];
        }
        currentArg = [trimmedLine.split(':', 2)[1].trim()];
      } else if (inArguments && !trimmedLine.startsWith('Lähteet:') && trimmedLine) {
        currentArg.push(trimmedLine);
      }
    }

    if (currentArg.length) {
      parsedArgs.push(currentArg.join(' '));
    }

    return parsedArgs;
  }

  parseSourceIndices(text: string): number[][] {
    const sourceIndicesPerArg: number[][] = [];
    const lines = text.split('\n');
    let inArguments = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.includes('<ARGUMENTS>')) {
        inArguments = true;
        continue;
      } else if (trimmedLine.includes('</ARGUMENTS>')) {
        break;
      } else if (inArguments && trimmedLine.startsWith('Lähteet:')) {
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
            .filter((num): num is number => num !== null);
          sourceIndicesPerArg.push(numbers);
        } else {
          sourceIndicesPerArg.push([]);
        }
      }
    }

    return sourceIndicesPerArg;
  }
}
