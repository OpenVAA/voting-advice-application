const exampleQuestions = [
    "Oikeutta poliittisiin lakkoihin pitää rajoittaa.",
    "Toisen asteen koulutuksesta oppimateriaaleineen (lukiot ja ammatillinen koulutus) pitää\n" +
    "tehdä täysin maksutonta.",
    " Pääomatulojen verotusta pitää kiristää."
]

export function getQuestion(number: number): string{
    return exampleQuestions[number - 1];
}

export function getNumberOfQuestions(): number{
    return exampleQuestions.length;
}