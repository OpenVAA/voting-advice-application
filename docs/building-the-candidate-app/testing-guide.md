# OpenVAA Candidate App Testing Guide

## Candidate App

This app is an open-source framework for voting advice applications. Team #9 is impelementing the candidate side of the applicatoin where candidates of an election can sign up, enter their personal info and answer questions.

## Your role

In this test you are a candidate of an election. Your goal is to sign up, enter information about yourself and then answer questions of the voting advice application. In addition to selecting an option on the disagree-agree scale, candidates can also provide open answer clarifications to their opinions.

## Before starting

To complete this test, you need to have two tabs open

1. The candidate app itself, [localhost:5137/candidate](http://localhost:5173/candidate)
2. Email, [localhost:1080](http://localhost:1080/)

## Arc of drama

1. Registration

   1. Open email window and click the registration link from the email you have received
   2. You are taken to [localhost:5137/candidate/register](http://localhost:5173/candidate/register) with the registration code as an url parameter
   3. You can also navigate to the registration page manually and enter the code from the email
   4. You are now shown the registration page where you can set your password according to the displayed requirements
   5. After setting the password, you are redirected to the front page [localhost:5137/candidate](http://localhost:5173/candidate)

2. Log in

   1. Log in using the provided email and the password you just set
   2. On successful login, you are shown the candidate app front page that greets you

3. Basic info

   1. Click `Continue` and you are now taken to the basic info page [localhost:5173/candidate/profile](http://localhost:5173/candidate/profile)
   2. You can also navigate to the page from the navigation menu in the top left corner
   3. Here set your birthday, gender and your election manifesto
   4. Optionally, you can also set a portrait and edit your languages
   5. Click `Done` to save your answers and you are then redicrected to questions

4. Kysymyksiin vastaminen

5. katsele kaikkia kysymyksiä

6. Mene settings ja vaihda salasana, kirjaudu ulos ja takaisin sisään uudella salasanalla

7. kirjaudu ulls

8. Unohda salana ja resettaa se, ja kirjaudu tänään
