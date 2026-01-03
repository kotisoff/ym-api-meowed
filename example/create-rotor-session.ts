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

  // Проверяем реальные поля
  if (
    !sess ||
    !sess.radioSessionId ||
    !Array.isArray(sess.sequence) ||
    sess.sequence.length === 0
  ) {
    console.error("❌ Rotor session creation failed or empty sequence");
    process.exitCode = 1;
  } else {
    console.log(`✔ Rotor session created: ${sess.radioSessionId}`);
    console.log(`Tracks returned: ${sess.sequence.length}`);
    process.exitCode = 0;
  }
}

main().catch((e) => {
  console.error("❌ api error:", e?.response?.data || e?.message || e);
  process.exitCode = 1;
});
