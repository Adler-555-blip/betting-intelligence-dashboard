export async function pandascoreProvider() {
  if (!process.env.PANDASCORE_API_KEY) {
    return { enabled: false, reason: "PANDASCORE_API_KEY is not configured." };
  }
  return { enabled: true, reason: "Placeholder: implement PandaScore API client here." };
}
