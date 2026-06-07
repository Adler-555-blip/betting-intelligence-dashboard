export async function mockOddsProvider() {
  return {
    source: "mock",
    bookmakers: ["fonbet", "pari", "betboom", "liga-stavok"],
    description: "Mock odds are generated in the seed script and can be refreshed by jobs later."
  };
}
