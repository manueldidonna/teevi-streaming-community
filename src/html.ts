import { load } from "cheerio"

// Generic HTML fetcher using Cheerio
export async function fetchHTML(input: RequestInfo | URL) {
  const response = await fetch(input.toString(), {
    method: "GET",
  })
  const body = await response.text()
  return load(body)
}
