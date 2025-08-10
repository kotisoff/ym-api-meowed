import { UrlExtractorInterface } from "../Types";

export default class UrlExtractor implements UrlExtractorInterface {
  private extract<T extends string>(
    url: string,
    regex: RegExp,
    entityName: string,
    groups: T[]
  ): Record<T, string> {
    return groups.reduce((carry: { [key: string]: string }, item: string) => {
      const match = url.match(regex)?.groups?.[item];
      if (!match) {
        throw new Error(`non ${entityName} url received`);
      }
      carry[item] = match;
      return carry;
    }, {}) as Record<T, string>;
  }

  extractTrackId(url: string): number {
    // Support new short track URL: /track/<id>
    const direct = url.match(
      /(https?:\/\/)?music\.yandex\.ru\/track\/(?<id>\d+)/
    );
    if (direct?.groups?.id) return Number(direct.groups.id);
    const extracted = this.extract(
      url,
      /(https?:\/\/)?music\.yandex\.ru\/album\/\d+\/track\/(?<id>\d+)/,
      "track",
      ["id"]
    );
    return Number(extracted.id);
  }

  extractAlbumId(url: string): number {
    const extracted = this.extract(
      url,
      /(https?:\/\/)?music\.yandex\.ru\/album\/(?<id>\d+)/,
      "album",
      ["id"]
    );
    return Number(extracted.id);
  }

  extractArtistId(url: string): number {
    const extracted = this.extract(
      url,
      /(https?:\/\/)?music\.yandex\.ru\/artist\/(?<id>\d+)/,
      "artist",
      ["id"]
    );
    return Number(extracted.id);
  }

  extractPlaylistId(url: string): { id: number | string; user: string | null } {
    // Prefer explicit user-based playlists first to avoid misclassifying
    // URLs like "/users/<user>/playlists/<id>" as UUID-style.
    if (url.includes("/users/") && url.includes("/playlists/")) {
      const extracted = this.extract(
        url,
        /(https?:\/\/)?music\.yandex\.ru\/users\/(?<user>[\w\d\-_\.]+)\/playlists\/(?<id>\d+)/,
        "playlist",
        ["id", "user"]
      );
      return { id: Number(extracted.id), user: extracted.user };
    }

    if (url.includes("/playlists/") || url.includes("/playlist/")) {
      const extracted = this.extract(
        url,
        /(https?:\/\/)?music\.yandex\.ru\/playlists?\/(?<uid>(?:ar\.)?[A-Za-z0-9\-]+)/,
        "playlist",
        ["uid"]
      );
      return { id: extracted.uid, user: null };
    }

    // If neither pattern matches, report a clear error
    throw new Error("non playlist url received");
  }
}
