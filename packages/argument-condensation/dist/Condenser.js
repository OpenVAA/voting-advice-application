"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Condenser = void 0;
const llm_1 = require("@openvaa/llm");
const OutputParser_1 = require("./utils/OutputParser");
class Condenser {
    constructor(llmProvider) {
        this.allArguments = [];
        this.PROMPT_TEMPLATE = `
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
        this.llmProvider = llmProvider;
        this.parser = new OutputParser_1.OutputParser();
    }
    async processComments(comments, topic, nComments, batchSize = 10) {
        const nIterations = Math.floor(nComments / batchSize);
        for (let i = 0; i < nIterations; i++) {
            console.log(`Processing batch ${i + 1} of ${nIterations}...`);
            const batch = comments.slice(i * batchSize, (i + 1) * batchSize);
            const newArgs = await this._processBatch(batch, this.allArguments, topic, i);
            this.allArguments.push(...newArgs);
        }
        return this.allArguments;
    }
    async _processBatch(batch, existingArgs, topic, startIdx) {
        const commentsText = batch.map((comment, i) => `Kommentti ${i + 1}: ${comment}`).join('\n');
        const existingArgsText = existingArgs.map((arg, i) => `Argumentti ${i + 1}: ${arg.mainArgument}`).join('\n');
        const prompt = this.PROMPT_TEMPLATE.replace('{topic}', topic)
            .replace('{existingArguments}', existingArgs.length ? existingArgsText : 'Ei olemassa olevia argumentteja.')
            .replace('{comments}', commentsText);
        const response = await this.llmProvider.generate([new llm_1.Message(llm_1.Role.USER, prompt)], 1 // Use the supported temperature value
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
exports.Condenser = Condenser;
