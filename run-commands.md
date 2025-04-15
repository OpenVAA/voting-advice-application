LIST QUESTIONS:

curl -X POST http://localhost:1337/api/argument-condensation/list-questions | jq

TEST ANSWERS:

curl -X POST http://localhost:1337/api/argument-condensation/test-answers | jq

CONDENSE ARGUMENTS FOR CHOSEN QUESTIONS:
curl -X POST http://localhost:1337/api/argument-condensation/condense -H "Content-Type: application/json" -d '{"questionDocumentIds": ["vdyzxpmc54mj9vibj0w19we3"]}'

CONDENSE ARGUMENTS FOR ALL QUESTIONS:
curl -X POST http://localhost:1337/api/argument-condensation/condense
