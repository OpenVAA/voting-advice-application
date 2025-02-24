import { LanguageConfig } from '../types/LanguageConfig';

/**
 * Finnish language configuration for argument condensation
 * Provides instructions and formatting for Finnish language processing
 */
export const finnishConfig: LanguageConfig = {
    instructions: `Käy läpi seuraavat kommentit aiheesta: "{topic}".
Jos kommenteissa on näkökulmia, joita ei vielä ole olemassa olevissa argumenteissa:
- Luo uusi argumentti jokaiselle uudelle näkökulmalle
- Varmista, että uusi argumentti on selkeästi erilainen kuin olemassa olevat
- Kirjoita argumentti yhdellä virkkeellä
- Käytä kahta parhaiten sopivaa kommenttia uuden argumentin lähteenä
Huomioi:
- Älä muokkaa olemassa olevia argumentteja
- Luo uusi argumentti vain, jos se tuo esiin täysin uuden näkökulman
- Merkitse selkeästi, mitkä kommentit (numerot) liittyvät kuhunkin uuteen argumenttiin`,
    existingArgumentsHeader: 'Olemassa olevat argumentit',
    newCommentsHeader: 'Uudet kommentit',
    outputFormatHeader: 'Tulostusmuoto',
    outputFormat: {
      argumentPrefix: 'ARGUMENTTI',
      argumentExplanation: '[Uusi argumentti, jos löytyy uusi näkökulma]',
      sourcesPrefix: 'Lähteet',
      sourcesExplanation: '[Kommenttien numerot]'
    },
    inputCommentPrefix: 'Kommentti',
    outputArgumentPrefix: 'Argumentti'
}; 