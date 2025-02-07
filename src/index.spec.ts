import { describe, it, expect, test } from "vitest"
import extension from "../src/index"

test("fetchShowsByQuery", async () => {
  const shows = await extension.fetchShowsByQuery("rick and morty")
  expect(shows.length).toBeGreaterThan(0)
  expect(shows.find((show) => show.id === "115-rick-and-morty")).toBeTruthy()
})

describe("fetchShow", () => {
  it("should return a movie", async () => {
    const show = await extension.fetchShow("835-jurassic-park")
    expect(show).toHaveProperty("id", "835-jurassic-park")
    expect(show).toHaveProperty("title", "Jurassic Park")
    expect(show).toHaveProperty("kind", "movie")
    expect(show.seasonNumbers).toBeFalsy()
  })
})

describe("fetchMediaItems", () => {
  it("should return a single movie item", async () => {
    const mediaItems = await extension.fetchMediaItems("835-jurassic-park")
    expect(mediaItems).toHaveLength(1)
    expect(mediaItems[0]).toHaveProperty("type", "movie")
  })
})

test("fetchVideoAssets", async () => {
  const videoAssets = await extension.fetchVideoAssets("835")
  expect(videoAssets).toHaveLength(1)
  expect(videoAssets[0].url).toContain("vixcloud.co")
})
