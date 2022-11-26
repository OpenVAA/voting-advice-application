const request = require('supertest');

it("should return something", async () => {
  await request(strapi.server.httpServer)
    .get("/api/election")
    .expect(404) // Expect response http code 404 since the election route is not defined yet
    .then((data) => {
      expect(JSON.parse(data.text).data).toBeNull(); // expect the response text.data to be null
    })
});
