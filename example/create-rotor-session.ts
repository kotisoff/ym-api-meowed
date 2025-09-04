import { YMApi } from "../src";

async function main() {
  const access_token = process.env.YM_ACCESS_TOKEN as string;
  const uid = Number(process.env.YM_UID);

  if (!access_token || !uid) {
    throw new Error("YM_ACCESS_TOKEN and YM_UID must be set in environment");
  }

  const api = new YMApi();
  await api.init({ access_token, uid });

    const trackId = 124413086; // ID трека
    const sess = await api.createRotorSession([`track:${trackId}`], true);

//   const seeds = ["user:onyourwave"];
//   const resp = await api.createRotorSession(seeds, true);
    console.dir(sess, { depth: 2, maxArrayLength: 5, colors: true });
}

main().catch((e) => {
  console.error(e?.response?.data || e);
  process.exit(1);
});