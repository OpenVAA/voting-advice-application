import { LanguageConfig } from '../types/LanguageConfig';

/**
 * Finnish language configuration for argument condensation
 * Provides instructions and formatting for Finnish language processing
 */
export const finnishConfig: LanguageConfig = {
    instructions: `Käy läpi seuraavat kommentit, jotka pyrkivät perustelemaan tai kumoamaan tietyn väitteen: "{topic}". Sinun tehtäväsi on tiivistää perusteluja ja näkökulmia, joita kommenteissa esitetään väitteen tukemiseksi tai sen kumoamiseksi.
Jos kommenteissa on näkökulmia, joita ei vielä ole olemassa olevissa argumenteissa:
- Luo uusi argumentti jokaiselle uudelle mielipiteelle tai perustelulle
- Varmista, että uusi argumentti on selkeästi erilainen kuin olemassa olevat
- Kirjoita argumentti yhdellä hyvin lyhyellä virkkeellä
- Käytä kahta parhaiten sopivaa kommenttia uuden argumentin lähteenä
Huomioi:
- Älä muokkaa olemassa olevia argumentteja
- Luo uusi argumentti vain, jos se tuo esiin täysin uuden mielipiteen tai perustelun
- Merkitse selkeästi, mitkä kommentit (numerot) liittyvät kuhunkin uuteen argumenttiin
- Argumenttien tulee olla lyhyitä mutta kattavia

Hyvä uusi argumentti:
- "Kouluruokailussa tulisi käyttää paikallisia raaka-aineita" on hyvä argumentti, koska on lyhyt ja kattava. Se selittää laajan näkökulman tiiviisti.

Kuinka luoda uusi argumentti:
- "Kasvisruoan tarjoaminen kouluissa voi edistää oppilaiden tietoisuutta erilaisista ruokavalinnoista ja niiden vaikutuksista omaan terveyteen ja ympäristöön." ei ole hyvä argumentti, koska se on liian pitkä ja seuraa liian läheisesti kommentin sisältöä
- Parempi vaihtoehto olisi luoda kaksi erillistä argumenttia: "Kasvisruoan tarjoaminen kouluissa voi parantaa oppilaiden tietoisuutta ruokavalintojensa terveysvaikutuksista" ja "Kasvisruoan tarjoaminen kouluissa voi edistää oppilaiden tietoisuutta ruokavalintojen vaikutuksesta ympäristöön"
- "Kouluruokailussa tulisi korostaa kasvisruoan tarjoamisen tehoja, kuten ravinteiden saantia ja ympäristöhyötyjä" ei ole hyvä argumentti, koska se ei liity suoraan aiheeseen kasvisruokailujen lisäämisestä tai vähentämisestä kouluruokailussa

Esimerkki:
- "Pelkästään turvapaikanhakijoiden puolesta tarvitaan selkeä erottelu työperäisiin maahanmuuttajiin, joiden rooli on kriittinen." ei ole hyvä argumentti, koska se ei tuo esiin uutta näkökulmaa ja seuraa liian läheisesti kommentin sisältöä
`,
    recursiveInstructions: 'Käy läpi seuraavat kommentit, jotka pyrkivät perustelemaan tai kumoamaan tietyn väitteen: "{topic}". Käy läpi seuraavat argumentit väitteen puolesta tai vastaan ja tiivistä ne noin 20 kattavaksi argumentiksi, jotka kattavat väitteen puolesta tai vastaan. Argumenttien tulee olla lyhyitä mutta kattavia. Hyvä argumentti keskittyy spesifisiin perusteisiin, miksi väite on tosi tai epätosi.',
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
    outputArgumentPrefix: 'Argumentti',
}; 