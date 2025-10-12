import { YMApi } from "../src";

async function main() {
  const access_token = process.env.YM_ACCESS_TOKEN as string;
  const uid = Number(process.env.YM_UID);

  if (!access_token || !uid) {
    throw new Error("YM_ACCESS_TOKEN and YM_UID must be set in environment");
  }

  const api = new YMApi();
  await api.init({ access_token, uid });

  // Получаем первую партию треков
  const tracks = await api.getStationTracks(`track:29168781`);
  const firstTrack = tracks.sequence?.[0]?.track;
  if (!firstTrack) throw new Error("No tracks returned from station");
  console.log(firstTrack.title);

  // Получаем следующую партию треков
  const nextBatch = await api.getStationTracks(`track:${firstTrack.id}`);
  const nextTrack = nextBatch.sequence?.[0]?.track;
  if (!nextTrack) throw new Error("No tracks returned in next batch");
  console.log("Next batch:", nextTrack.title);
}

main().catch((e: any) => {
  console.error(e?.response?.data || e?.message || e);
  process.exit(1);
});
