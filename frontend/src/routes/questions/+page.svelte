<script>
    import { _ } from 'svelte-i18n'
    import { goto } from '$app/navigation';
    import {currentQuestion, answeredQuestions} from "../../utils/stores";
    import {getQuestion, getNumberOfQuestions} from "../../api/getQuestion";
    import {calculateCandidateCompatibilities} from "../../candidateRanking/calculateCompatibility";
	export let data;

    let currentQuestionNumber = 1;
    let currentQuestionText = getQuestion(currentQuestionNumber);

    // Null values
    currentQuestion.update(n => 1);
    answeredQuestions.update(n => []);

    currentQuestion.subscribe((value) => {
        currentQuestionNumber = value;
    })

    // Get next question from backend
    function nextQuestion(){
        if(currentQuestionNumber < getNumberOfQuestions()){
            currentQuestion.update(n => n + 1);
            currentQuestionText = getQuestion(currentQuestionNumber);
        }
        else{
            calculateCandidateCompatibilities().then(() => {
                goto("/results");
            });
        }
    }

    // Store question number and answer value in a store
    function answerQuestion(answer){
        answeredQuestions.update(questions => [...questions, {question: currentQuestionNumber, answer: answer}])
        nextQuestion(); // TODO: Placeholder for testing, remove when we have radio buttons
    }
</script>

<p>{currentQuestionNumber}/{getNumberOfQuestions()}</p>
<h2>{currentQuestionText}</h2>
<br />

<!-- TODO: Don't hardcode number of answer options in the future -->

<button on:click={() => answerQuestion(0)} aria-label={$_("questions.scale.stronglyDisagree")}>{$_("questions.scale.stronglyDisagree")}</button> -
<button on:click={() => answerQuestion(1)} aria-label={$_("questions.scale.disagree")}>{$_("questions.scale.disagree")}</button> -
<button on:click={() => answerQuestion(2)} aria-label={$_("questions.scale.agree")}>{$_("questions.scale.agree")}</button> -
<button on:click={() => answerQuestion(3)} aria-label={$_("questions.scale.stronglyAgree")}>{$_("questions.scale.stronglyAgree")}</button>

<hr />
<br />
<button on:click={() => nextQuestion()} aria-label={$_("questions.nextQuestion")}>{$_("questions.nextQuestion")}</button>
<br />
<a href="/results">{$_("questions.goToResults")}</a>
