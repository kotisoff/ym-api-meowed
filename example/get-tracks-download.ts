import { Types, WrappedYMApi, YMApi } from "../src";

const WrappedApi = new WrappedYMApi();
const api = new YMApi();

const access_token = process.env.YM_ACCESS_TOKEN as string;
const uid = Number(process.env.YM_UID);

(async () => {
  try {
    await WrappedApi.init({ access_token, uid });
    await api.init({ access_token, uid });
    // https://music.yandex.ru/track/38633712?utm_source=web&utm_medium=copy_link

    const trackId = 117708948;

    WrappedApi.getMp3DownloadUrl(trackId)
      .then((url) => console.log(url))
      .catch((err) => console.error(err));

    // WrappedApi.getAacDownloadUrl(
    //   trackId,
    //   false,
    //   Types.DownloadTrackQuality.Lossless
    // )
    //   .then((url) => console.log(url))
    //   .catch((err) => console.error(err));
  } catch (e: any) {
    console.log(`api error: ${e?.message ?? String(e)}`);
  }
})();
