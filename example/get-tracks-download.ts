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

    const downloadInfo = await api.getTrackDownloadInfo(
      trackId,
      Types.DownloadTrackQuality.Lossless
    );

    if (!downloadInfo?.length) {
      console.error("❌ No download info available");
      process.exitCode = 1;
      return;
    }

    console.log(
      `✔ Track URL(s) fetched successfully: ${downloadInfo.length} variant(s)`
    );

    downloadInfo.forEach((info, idx) => {
      console.log(`\nVariant #${idx + 1}:`);
      console.log(`Codec: ${info.codec}`);
      console.log(`Bitrate: ${info.bitrateInKbps} kbps`);
      console.log(`Gain applied: ${info.gain}`);
      console.log(`Preview: ${info.preview}`);
      console.log(`Direct link: ${info.direct}`);
      console.log(`Download URL: ${info.downloadInfoUrl}`);
    });

    process.exitCode = 0;
  } catch (err: any) {
    console.error("❌ API error:", err?.message ?? err);
    process.exitCode = 1;
  }
})();
