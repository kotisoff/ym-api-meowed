import { UrlExtractorInterface } from "../Types";

export default class UrlExtractor implements UrlExtractorInterface {
  private extractGroups<T extends string>(
    url: string,
    regex: RegExp,
    entityName: string,
    groupNames: T[]
  ): Record<T, string> {
    const match = url.match(regex)?.groups;
    if (!match) {
      throw new Error(`Invalid ${entityName} URL: ${url}`);
    }

    return groupNames.reduce(
      (acc, name) => {
        const value = match[name];
        if (!value) {
          throw new Error(`Missing ${name} in ${entityName} URL: ${url}`);
        }
        acc[name] = value;
        return acc;
      },
      {} as Record<T, string>
    );
  }

  extractTrackId(url: string): number {
    // Direct short track URL: /track/<id>
    const direct = url.match(
      /(?:https?:\/\/)?music\.yandex\.ru\/track\/(?<id>\d+)/
    );
    if (direct?.groups?.id) return Number(direct.groups.id);

    // Album track URL: /album/<albumId>/track/<id>
    const extracted = this.extractGroups(
      url,
      /(?:https?:\/\/)?music\.yandex\.ru\/album\/\d+\/track\/(?<id>\d+)/,
      "track",
      ["id"]
    );
    return Number(extracted.id);
  }

  extractAlbumId(url: string): number {
    const extracted = this.extractGroups(
      url,
      /(?:https?:\/\/)?music\.yandex\.ru\/album\/(?<id>\d+)/,
      "album",
      ["id"]
    );
    return Number(extracted.id);
  }

  extractArtistId(url: string): number {
    const extracted = this.extractGroups(
      url,
      /(?:https?:\/\/)?music\.yandex\.ru\/artist\/(?<id>\d+)/,
      "artist",
      ["id"]
    );
    return Number(extracted.id);
  }

  extractPlaylistId(url: string): { id: number | string; user: string | null } {
    // User-based playlist URL: /users/<user>/playlists/<id>
    if (url.includes("/users/") && url.includes("/playlists/")) {
      const extracted = this.extractGroups(
        url,
        /(?:https?:\/\/)?music\.yandex\.ru\/users\/(?<user>[\w\d\-_\.]+)\/playlists\/(?<id>\d+)/,
        "playlist",
        ["id", "user"]
      );
      return { id: Number(extracted.id), user: extracted.user };
    }

    // Public/UUID-style playlist URL: /playlists/<uid> or /playlist/<uid>
    if (url.includes("/playlists/") || url.includes("/playlist/")) {
      const extracted = this.extractGroups(
        url,
        /(?:https?:\/\/)?music\.yandex\.ru\/playlists?\/(?<uid>(?:ar\.)?[A-Za-z0-9\-]+)/,
        "playlist",
        ["uid"]
      );
      return { id: extracted.uid, user: null };
    }

    throw new Error(`Invalid playlist URL: ${url}`);
  }
}
