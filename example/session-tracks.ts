import { YMApi } from "../src";

async function main() {
  const access_token = process.env.YM_ACCESS_TOKEN as string;
  const uid = Number(process.env.YM_UID);

  if (!access_token || !uid) {
    throw new Error("YM_ACCESS_TOKEN and YM_UID must be set in environment");
  }

  const api = new YMApi();
  await api.init({ access_token, uid });

  // Создаём сессию
  const session = await api.createRotorSession(["user:onyourwave"]);

  if (!session.radioSessionId || !session.batchId) {
    throw new Error("Rotor session response is missing required fields");
  }

  // Получаем треки сессии
  const tracks = await api.postRotorSessionTracks(session.radioSessionId, {
    batchId: session.batchId
  });

  if (!tracks.sequence?.length) {
    throw new Error("No tracks returned from rotor session");
  }

  console.log(tracks.sequence[0].track.title);
}

main().catch((e: any) => {
  console.error(e?.response?.data || e);
  process.exit(1);
});
