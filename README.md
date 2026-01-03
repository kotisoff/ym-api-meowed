# Yandex.Music API (Unofficial) for Node

This is a Node.js wrapper for the [Yandex.Music](http://music.yandex.ru/) API that is used in mobile apps (iOS/Android).

> Note:
> I think I will no longer maintain this repo. Check this one: https://github.com/Dirold2/ym-api-meowed-d2

## Installation

```sh
npm install ym-api-meowed
```

## Usage

```js
import { YMApi } from "ym-api-meowed";
const api = new YMApi();

(async () => {
  try {
    await api.init({ access_token: "EXAMPLE_TOKEN", uid: 0 });
    const result = await api.searchArtists("gorillaz");
    console.log({ result });
  } catch (e) {
    console.log(`api error ${e.message}`);
  }
})();
```

Get token from [here](https://oauth.yandex.ru/authorize?response_type=token&client_id=23cabbbdc6cd418abb4b39c32c41195d) and uid from [here](https://mail.yandex.ru/).

## Available methods

This library provides following methods:

### Plain API

#### Users

- getAccountStatus
- getFeed

#### Music

- getChart
- getNewReleases
- getPodcasts
- getGenres
- search
- searchArtists
- searchTracks
- searchAlbums
- searchAll

#### Playlist

- getNewPlaylists
- getPlaylist
- getPlaylists
- getUserPlaylists
- createPlaylist
- removePlaylist
- renamePlaylist
- addTracksToPlaylist
- removeTracksFromPlaylist

#### Tracks

- getTrack
- getArtistTracks
- getSingleTrack
- getTrackSupplement
- getTrackDownloadInfo
- getTrackDirectLink
- getTrackShareLink
- getSimilarTracks
- getDislikedTracks
- getLikedTracks

#### Album

- getAlbums
- getAlbum
- getAlbumWithTracks

#### Artist

- getArtist
- getArtists

#### Station

- getAllStationsList
- getRecomendedStationsList
- getStationTracks
- getStationInfo

### Wrapped API

Almost all methods of the wrapped api can be called with a entity id or url

#### Tracks

- getConcreteDownloadInfo
- getMp3DownloadInfo
- getMp3DownloadUrl

#### Playlist

- getPlaylist

#### Album

- getAlbum
- getAlbumWithTracks

#### Artist

- getArtist

#### Etc

- getShortenedLink

## Acknowledgements

- [itsmepetrov/yandex-music-api](https://github.com/itsmepetrov/yandex-music-api)
- [MarshalX/yandex-music-api](https://github.com/MarshalX/yandex-music-api)
- [kontsevoye/ym-api](https://github.com/kontsevoye/ym-api)
