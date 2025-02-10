import { LLMProvider, Message, Role } from '@openvaa/llm';
import { Argument } from './types/Argument';
import { OutputParser } from './utils/OutputParser';

export class Condenser {
  private llmProvider: LLMProvider;
  private parser: OutputParser;
  private allArguments: Argument[] = [];

  private readonly PROMPT_TEMPLATE = `
    ### Ohjeet:
    1. Käy läpi seuraavat kommentit aiheesta: "{topic}"
    2. Jos kommenteissa on näkökulmia, joita ei vielä ole olemassa olevissa argumenteissa:
       - Luo uusi argumentti jokaiselle uudelle näkökulmalle
       - Varmista, että uusi argumentti on selkeästi erilainen kuin olemassa olevat
       - Kirjoita argumentti yhdellä virkkeellä
    3. Huomioi:
       - Älä muokkaa olemassa olevia argumentteja
       - Luo uusi argumentti vain, jos se tuo esiin täysin uuden näkökulman
       - Merkitse selkeästi, mitkä kommentit (numerot) liittyvät kuhunkin uuteen argumenttiin
       - Käytä kahta parhaiten sopivaa kommenttia uuden argumentin lähteenä

    ### Olemassa olevat argumentit:
    {existingArguments}

    ### Uudet kommentit:
    {comments}

    ### Tulostusmuoto:
    <ARGUMENTS>
    ARGUMENTTI 1: [Uusi argumentti, jos löytyy uusi näkökulma]
    Lähteet: [Kommenttien numerot]
    </ARGUMENTS>
  `;

  constructor(llmProvider: LLMProvider) {
    this.llmProvider = llmProvider;
    this.parser = new OutputParser();
  }

  async processComments(
    comments: string[],
    topic: string,
    nComments: number,
    batchSize: number = 10
  ): Promise<Argument[]> {
    const nIterations = Math.floor(nComments / batchSize);

    for (let i = 0; i < nIterations; i++) {
      console.log(`Processing batch ${i + 1} of ${nIterations}...`);
      const batch = comments.slice(i * batchSize, (i + 1) * batchSize);
      const newArgs = await this._processBatch(batch, this.allArguments, topic, i);
      this.allArguments.push(...newArgs);
    }

    return this.allArguments;
  }

  private async _processBatch(
    batch: string[],
    existingArgs: Argument[],
    topic: string,
    startIdx: number
  ): Promise<Argument[]> {
    const commentsText = batch.map((comment, i) => `Kommentti ${i + 1}: ${comment}`).join('\n');

    const existingArgsText = existingArgs.map((arg, i) => `Argumentti ${i + 1}: ${arg.mainArgument}`).join('\n');

    const prompt = this.PROMPT_TEMPLATE.replace('{topic}', topic)
      .replace('{existingArguments}', existingArgs.length ? existingArgsText : 'Ei olemassa olevia argumentteja.')
      .replace('{comments}', commentsText);

    const response = await this.llmProvider.generate(
      [new Message(Role.USER, prompt)],
      1 // Use the supported temperature value
    );

    const newArgTexts = this.parser.parseArguments(response.content);
    const sourceIndicesPerArg = this.parser.parseSourceIndices(response.content);

    return newArgTexts.map((argText, i) => {
      const localIndices = sourceIndicesPerArg[i] || [];
      const globalIndices = localIndices.map((idx) => startIdx * batch.length + (idx - 1));
      const sources = localIndices.map((idx) => batch[idx - 1]).filter((_, idx) => idx >= 0 && idx < batch.length);

      return {
        mainArgument: argText,
        sources,
        sourceIndices: globalIndices,
        topic
      };
    });
  }
}
