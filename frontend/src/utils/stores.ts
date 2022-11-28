import { writable } from 'svelte/store';
import { browser } from '$app/environment';

let localCurrentQuestion;
let localAnsweredQuestions;
let localCandidateRankings;

// Store values in local storage to prevent them from disappearing in refresh
if(browser && localStorage){
    let currentQuestionInLocalStorage = localStorage.getItem('currentQuestion');
    let answeredQuestionsInLocalStorage = localStorage.getItem('answeredQuestions');
    let candidateRankingsInLocalStorage = localStorage.getItem('candidateRankings');

    localCurrentQuestion = currentQuestionInLocalStorage ? JSON.parse(currentQuestionInLocalStorage) : "0";
    localAnsweredQuestions = answeredQuestionsInLocalStorage ? JSON.parse(answeredQuestionsInLocalStorage) : [];
    localCandidateRankings = candidateRankingsInLocalStorage ? JSON.parse(candidateRankingsInLocalStorage) : {};
}

// Create the actual Svelte store values
export const currentQuestion = writable( localCurrentQuestion || 1);
export const answeredQuestions = writable(localAnsweredQuestions || []);
export const candidateRankings = writable(localCandidateRankings || {});

// Write to local storage automatically when store values change
if(browser && localStorage){
    currentQuestion.subscribe((value) => localStorage.setItem("currentQuestion", JSON.stringify(value)));
    answeredQuestions.subscribe((value) => localStorage.setItem("answeredQuestions", JSON.stringify(value)));
    candidateRankings.subscribe((value) => localStorage.setItem("candidateRankings", JSON.stringify(value)));
}
