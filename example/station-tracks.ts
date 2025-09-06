import { YMApi } from "../src";

async function main() {
  const access_token = process.env.YM_ACCESS_TOKEN as string;
  const uid = Number(process.env.YM_UID);

  if (!access_token || !uid) {
    throw new Error("YM_ACCESS_TOKEN and YM_UID must be set in environment");
  }

  const api = new YMApi();
  await api.init({ access_token, uid });

  const tracks = await api.getStationTracks(`track:29168781`);
  console.log(tracks.sequence[0].track.title);

  const nextNext = await api.getStationTracks(
    `track:${tracks.sequence[0].track.id}`
  );
  console.log("Next batch:", nextNext.sequence[0].track.title);
}

main().catch((e) => {
  console.error(e?.response?.data || e);
  process.exit(1);
});
