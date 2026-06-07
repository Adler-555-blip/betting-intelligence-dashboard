import { cached, fetchWithTimeout } from "./cache";

const apiBaseUrl = "https://api.pandascore.co";

export async function pandascoreProvider() {
  if (!process.env.PANDASCORE_API_KEY) {
    return { enabled: false, reason: "PANDASCORE_API_KEY не настроен. Используются демо-данные." };
  }
  return { enabled: true, source: "PandaScore", reason: "PandaScore API key настроен." };
}

export async function fetchPandaScore<T>(path: string): Promise<T | null> {
  const token = process.env.PANDASCORE_API_KEY;
  if (!token) return null;

  try {
    return await cached(`pandascore:${path}`, () =>
      fetchWithTimeout<T>(`${apiBaseUrl}${path}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
    );
  } catch {
    return null;
  }
}
