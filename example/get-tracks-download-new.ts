import { Types, WrappedYMApi, YMApi } from "../src";

const WrappedApi = new WrappedYMApi();
const api = new YMApi();

const access_token = process.env.YM_ACCESS_TOKEN as string;
const uid = Number(process.env.YM_UID);

(async () => {
  try {
    if (!access_token || !uid)
      throw new Error("YM_ACCESS_TOKEN and YM_UID must be set");

    await WrappedApi.init({ access_token, uid });
    await api.init({ access_token, uid });

    const trackId = 14329703;

    const track = await api.getTrackDownloadInfoNew(
      trackId,
      Types.DownloadTrackQuality.Lossless
    );

    const info = track.downloadInfo;

    if (!info || !info.url) {
      console.error("❌ Track URL not found");
      process.exitCode = 1;
      return;
    }

    console.log("✔ Track URL fetched successfully");
    console.log(`Track ID: ${info.trackId}`);
    console.log(`Codec: ${info.codec}`);
    console.log(`Quality: ${info.quality}`);
    console.log(`Bitrate: ${info.bitrate} kbps`);
    console.log(`Gain applied: ${info.gain}`);
    console.log(`Transport: ${info.transport}`);
    console.log(`Size: ${info.size} bytes`);
    console.log(`Main URL: ${info.url}`);

    if (info.urls?.length) {
      console.log("\nAlternative URLs:");
      info.urls.forEach((alt, idx) => console.log(`  [${idx + 1}] ${alt}`));
    }

    process.exitCode = 0;
  } catch (err: any) {
    console.error("❌ API error:", err?.message ?? err);
    process.exitCode = 1;
  }
})();
