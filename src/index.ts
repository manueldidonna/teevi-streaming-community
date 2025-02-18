import type {
  TeeviMediaItem,
  TeeviMetadataExtension,
  TeeviShow,
  TeeviShowEntry,
  TeeviVideoAsset,
  TeeviVideoExtension,
} from "@teeviapp/core"
import { fetchVixcloudPlaylist } from "./vixcloud"
import { fetchHTML } from "./html"

const BASE_URL = new URL(import.meta.env.VITE_API_URL)

type ApiImage = {
  filename: string
  type: "poster" | "cover" | "cover_mobile"
}

// Helper function for extracting image URLs
function findImage(
  collection: ApiImage[],
  type: ApiImage["type"]
): string | undefined {
  const filename = collection.find((img) => img.type === type)?.filename
  if (filename) {
    const cdnURL = new URL(`https://cdn.${BASE_URL.hostname}`)
    const imageURL = new URL(`/images/${filename}`, cdnURL)
    return imageURL.toString()
  }
}

async function fetchShowsByQuery(query: string): Promise<TeeviShowEntry[]> {
  type SearchShowApiModel = {
    name: string
    id: number
    slug: string
    type: string
    images: ApiImage[]
  }

  const endpoint = new URL("/api/search", BASE_URL)
  endpoint.searchParams.append("q", query)

  const response = await fetch(endpoint.toString(), { method: "GET" })
  const json: { data: SearchShowApiModel[] } = await response.json()

  return json.data.map((show) => {
    return {
      kind: show.type == "movie" ? "movie" : "series",
      id: `${show.id}-${show.slug}`,
      title: show.name,
      posterURL: findImage(show.images, "poster"),
    }
  })
}

async function fetchShow(id: string): Promise<TeeviShow> {
  type ShowDetailsApiModel = {
    name: string
    plot: string
    type: string
    release_date: string
    seasons_count: number // Number of seasons, or 0 if the type is 'movie'
    genres: { name: string }[]
    runtime?: number // minutes
    images: ApiImage[]
  }

  const endpoint = new URL(`/titles/${id}`, BASE_URL)
  const html = await fetchHTML(endpoint)

  const json = html("#app").attr("data-page")!
  const data = JSON.parse(json) as { props: { title: ShowDetailsApiModel } }
  const details = data.props.title

  const isSeries = details.type !== "movie"
  const seasons =
    isSeries && details.seasons_count > 0
      ? Array.from({ length: details.seasons_count }, (_, i) => i + 1)
      : undefined

  return {
    id,
    kind: isSeries ? "series" : "movie",
    title: details.name,
    overview: details.plot,
    genres: details.genres.map((g) => g.name),
    duration: (details.runtime || 0) * 60,
    releaseDate: details.release_date,
    seasonNumbers: seasons,
    posterURL: findImage(details.images, "poster"),
    backdropURL:
      findImage(details.images, "cover") ||
      findImage(details.images, "cover_mobile"),
  }
}

async function fetchMediaItems(
  id: string,
  season?: number
): Promise<TeeviMediaItem[]> {
  type SeasonApiModel = {
    props: { loadedSeason: { episodes: EpisodeApiModel[] } }
  }

  type EpisodeApiModel = {
    id: number
    number: number
    name?: string
    plot?: string
    duration?: number
    images: ApiImage[]
  }

  const numericId = id.split("-")[0]

  if (!season) {
    return [{ type: "movie", id: numericId }]
  }

  const endpoint = new URL(`/titles/${id}/stagione-${season}`, BASE_URL)
  const html = await fetchHTML(endpoint)

  const json = html("#app").attr("data-page")!
  const data = JSON.parse(json) as SeasonApiModel

  return data.props.loadedSeason.episodes.map((episode) => {
    return {
      type: "episode",
      id: `${numericId}?episode_id=${episode.id}`,
      number: episode.number,
      overview: episode.plot,
      title: episode.name,
      durationInSeconds: (episode.duration || 0) * 60,
      thumbnailURL: findImage(episode.images, "cover"),
    }
  })
}

async function fetchVideoAssets(id: string): Promise<TeeviVideoAsset[]> {
  const endpoint = new URL(`/iframe/${id}`, BASE_URL)
  const html = await fetchHTML(endpoint)

  const iframeURL = html("iframe").attr("src")!
  const source = await fetchVixcloudPlaylist(new URL(iframeURL))

  return [source]
}

export default {
  fetchShowsByQuery,
  fetchShow,
  fetchMediaItems,
  fetchVideoAssets,
} satisfies TeeviMetadataExtension & TeeviVideoExtension
