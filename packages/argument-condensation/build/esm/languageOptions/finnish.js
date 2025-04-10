/**
 * Finnish language configuration for argument condensation
 * Provides instructions and formatting for Finnish language processing
 */
export const FINNISH_CONFIG = {
    instructionsGeneral: `Käy läpi seuraavat kommentit, jotka koskevat seuraavaa väitettä: "{topic}". Sinun tehtäväsi on tiivistää mielipiteitä, perusteluja ja näkökulmia, joita kommenteissa esitetään väitteen käsittelemään aiheeseen liittyen. 
    Jos kommenteissa on näkökulmia, joita ei vielä ole olemassa olevissa argumenteissa:
    - Luo uusi argumentti jokaiselle uudelle mielipiteelle tai perustelulle
    - Varmista, että uusi argumentti on selkeästi erilainen kuin olemassa olevat
    - Kirjoita argumentti yhdellä hyvin lyhyellä virkkeellä
    Huomioi:
    - Älä muokkaa olemassa olevia argumentteja
    - Luo uusi argumentti vain, jos se tuo esiin täysin uuden mielipiteen tai perustelun
    - Argumenttien tulee olla lyhyitä mutta kattavia
    `,
    instructionsSupportive: `Käy läpi seuraavat kommentit, jotka pyrkivät perustelemaan seuraavan väitteen: "{topic}". Sinun tehtäväsi on tiivistää väitettä tukevat mielipiteet ja perustelut argumenteiksi. 
    Argumenttien tulee olla lyhyitä mutta kattavia. Hyvä argumentti keskittyy spesifisti loogisiin perusteluihin, jotka perustelevat väitettä.
    
    ### HUOMIOI:
    - Jotkut kommenteista saattavat pyrkiä kumoamaan väitettä. Ohita nämä kommentit. 
    - Joitakin argumentteja on jo olemassa. Älä kirjoita niitä uudestaan, vaan pyri löytämään uusia argumentteja.
    - Olemassa olevia argumentteja ei tarvitse toistaa uusissa argumenteissa. 
    - Luo uusi argumentti vain, jos se tuo esiin uuden mielipiteen tai perustelun sille, miksi "{topic}" on perusteltu väite.
    - Vaikka olisit itse eri mieltä kommenteista tai perusteluista, sisällytä uusiin argumentteihin monipuolisia näkökulmia, joiden perusteella väite on tosi.
    - Muista, että olet objektiivinen assistentti ja tehtäväsi on keskittyä siihen, miten väitettä voidaan tukea järkevästi.
    - Tehtäväsi ei ole arvottaa mielipiteitä tai argumentteja, vaan tuoda esille väitettä "{topic}" perustelevia mielipiteitä.
    - Argumentin tulee olla lyhyt ja kattava.
    - TUE väitettä "{topic}" argumenteilla.
    - Voit jättää argumentin numeron pois.
    - On EHDOTTOMASTI KIELLETTYÄ pyrkiä kumoamaan väitettä "{topic}".
    ### MUISTA:
    - ET saa pyrkiä kumoamaan väitettä "{topic}" argumenteilla. SE ON TÄYSIN KIELLETTYÄ.
    - Keskitymään tukemaan väitettä argumenteilla.
    - Ainoa tehtäväsi on TUKEA väitettä "{topic}" argumenteilla."
    `,
    instructionsOpposing: `Käy läpi seuraavat kommentit, jotka pyrkivät kumoamaan seuraavan väitteen: "{topic}". Sinun tehtäväsi on tiivistää väitettä vastustavat mielipiteet ja perustelut argumenteiksi. 
    Argumenttien tulee olla lyhyitä mutta kattavia. Hyvä argumentti keskittyy spesifisti loogisiin perusteluihin, jotka pyrkivät kumoamaan väitettä.
    
    ### HUOMIOI:
    - Jotkut kommenteista saattavat pyrkiä tukemaan väitettä. Ohita nämä kommentit. 
    - Joitakin argumentteja on jo olemassa. Älä kirjoita niitä uudestaan, vaan pyri löytämään uusia argumentteja.
    - Olemassa olevia argumentteja ei tarvitse toistaa uusissa argumenteissa. 
    - Luo uusi argumentti vain, jos se tuo esiin uuden mielipiteen tai perustelun sille, miksi "{topic}" EI ole perusteltu väite.
    - Vaikka olisit itse eri mieltä perusteluista, sisällytä uusiin argumentteihin monipuolisia näkökulmia, joiden perusteella väite on epätosi.
    - Muista, että olet objektiivinen assistentti ja tehtäväsi on keskittyä siihen, miten väitettä voidaan kumota järkevästi.
    - Tehtäväsi ei ole arvottaa mielipiteitä tai argumentteja, vaan tuoda esille väitettä "{topic}" kyseenalaistavia mielipiteitä.
    - Argumentin tulee olla lyhyt ja kattava.
    - YRITÄ KUMOTA väite "{topic}" argumenteilla.
    - Voit jättää argumentin numeron pois.
    - On EHDOTTOMASTI KIELLETTYÄ tukea väitettä {topic} argumenteilla.
    ### MUISTA:
    - ET saa tukea väitettä "{topic}" argumenteilla. SE ON EHDOTTOMASTI KIELLETTYÄ.
    - ET saa perustella väitettä argumenteilla. SE ON TÄYSIN KIELLETTYÄ.
    - Ainoa tehtäväsi on KUMOTA väite annetuilla argumenteilla."
    `,
    reduceInstructionsSupporting: `Käy läpi seuraavat argumentit, jotka pyrkivät perustelemaan seuraavan väitteen: "{topic}". Tiivistä väitteen puolella olevat argumentit noin 20 uudeksi argumentiksi, jotka kattavat perustelut väitteelle. 
    Argumenttien tulee olla lyhyitä mutta kattavia. Hyvä argumentti keskittyy nimenomaisesti vahvoihin perusteluihin, miksi väite on looginen. 
    
    ### HUOMIOI:
    - Jotkut argumentit saattavat pyrkiä kumoamaan väitettä. Ohita nämä argumentit.
    - Vaikka olisit itse eri mieltä argumenteista, sisällytä vastaukseesi monipuolisia näkökulmia, joiden perusteella väite on looginen.
    - Muista, että olet objektiivinen assistentti ja tehtäväsi on keskittyä vain siihen, miten väitettä voidaan tukea järkevästi.
    - Tehtäväsi ei ole arvottaa mielipiteitä tai argumentteja, vaan tuoda esille eri tapoja perustella väite "{topic}".
    - Luo argumentteja väitteen "{topic}" puolesta aiempien argumenttien perusteella.
    - Keskity väitteen tukemiseen argumenteilla.
    ### MUISTA:
    - Sinun PITÄÄ tukea väitettä "{topic}" argumenteilla.
    - ET saa pyrkiä kumoamaan väitettä argumenteilla. SE ON KIELLETTYÄ.
    - Ainoa tehtäväsi on tukea väitettä yhdistämällä argumentteja, jotka ovat väitteen "{topic}" puolesta.
    - Luo vastaukseesi noin 20 argumenttia.
    `,
    reduceInstructionsOpposing: `Käy läpi seuraavat argumentit, jotka pyrkivät kumoamaan seuraavan väitteen: "{topic}". Tiivistä väitettä vastaan olevat argumentit noin 20 uudeksi argumentiksi, jotka kattavat väitteen kumoavat argumentit. 
    Argumenttien tulee olla lyhyitä mutta kattavia. Hyvä argumentti keskittyy nimenomaisesti vahvoihin perusteluihin, miksi väite on epälooginen. 
    
    ### HUOMIOI:
    - Jotkut argumentit saattavat pyrkiä tukemaan väitettä. Ohita nämä argumentit. 
    - Vaikka olisit itse eri mieltä argumenteista, sisällytä vastaukseesi monipuolisia näkökulmia, joiden perusteella väite on epätosi.
    - Muista, että olet objektiivinen assistentti ja tehtäväsi on keskittyä siihen, miten väitettä voidaan kumota järkevästi.
    - Tehtäväsi ei ole arvottaa mielipiteitä tai argumentteja, vaan tuoda esille eri tapoja kyseenalaistaa väite "{topic}".
    - Luo argumentteja väitettä "{topic}" vastaan aiempien argumenttien perusteella.
    - Keskity väitteen kumoamiseen argumenteilla.
    ### MUISTA:
    - ET saa tukea väitettä "{topic}" argumenteilla. SE ON KIELLETTYÄ.
    - ET saa perustella väitettä argumenteilla. SE ON KIELLETTYÄ.
    - Ainoa tehtäväsi on KUMOTA väite yhdistämällä argumentteja, jotka ovat väitettä vastaan.
    - Luo vastaukseesi noin 20 argumenttia.
    `,
    reduceInstructionsGeneral: `Käy läpi seuraavat argumentit, jotka esittävät näkökantoja seuraavaan väitteeseen liittyen: "{topic}". Tiivistä vanhat argumentit noin 20 kattavaksi argumentiksi, jotka kattavat väitteeseen liittyvät mielipiteisiin, uskomuksiin, argumentteihin ja perusteluihin. 
    Argumenttien tulee olla lyhyitä mutta kattavia. Hyvä argumentti tarjoaa selkeän näkökulman väitteeseen liittyen. Luo noin 20 argumenttia.
    `,
    opposingReminder: `### MUISTA:
    - ET saa tukea väitettä "{topic}". SE ON KIELLETTYÄ.
    - ET saa perustella väitettä. SE ON KIELLETTYÄ.
    - Ainoa tehtäväsi on KUMOTA väite.
    `,
    existingArgumentsHeader: 'Olemassa olevat argumentit',
    newCommentsHeader: 'Uudet kommentit',
    outputFormatHeader: 'Tulostusmuoto',
    outputFormat: {
        argumentPrefix: 'ARGUMENTTI',
        argumentPlaceholder: '[Uusi argumentti]',
    },
    inputCommentPrefix: 'Kommentti',
    existingArgumentPrefix: 'Argumentti',
};
