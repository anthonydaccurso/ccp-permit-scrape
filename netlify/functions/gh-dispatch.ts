// netlify/functions/gh-dispatch-all.ts
// POST /api/gh-dispatch-all
// Runs "seed-sources.yml" -> "seed-areas.yml" -> "crawl.yml" in order
// Protected with x-admin-token

import type { Handler } from "@netlify/functions"

const WORKFLOWS = ["seed-sources.yml", "seed-areas.yml", "crawl.yml"]

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return resp(405, { error: "method_not_allowed", allow: "POST" })
    }

    const token = event.headers["x-admin-token"]
    if (!token || token.trim() !== (process.env.ADMIN_TOKEN || "")) {
      return resp(401, { error: "unauthorized" })
    }

    const owner = process.env.GH_OWNER
    const repo = process.env.GH_REPO
    const ghToken = process.env.GH_TOKEN
    const ref = process.env.GH_REF || "main"

    if (!owner || !repo || !ghToken) {
      return resp(500, {
        error: "missing_env",
        hint: "Set GH_OWNER, GH_REPO, GH_TOKEN, GH_REF in Netlify envs"
      })
    }

    const results: any[] = []

    for (const wf of WORKFLOWS) {
      const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(wf)}/dispatches`

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ghToken}`,
          "Accept": "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28"
        },
        body: JSON.stringify({ ref })
      })

      const text = await res.text()

      if (!res.ok) {
        results.push({
          workflow: wf,
          status: res.status,
          ok: false,
          detail: safeParse(text) ?? text
        })
        // stop the chain on first failure
        break
      } else {
        results.push({ workflow: wf, status: res.status, ok: true })
      }
    }

    return resp(200, { ok: true, results })

  } catch (e: any) {
    return resp(500, { error: "server_error", detail: e?.message })
  }
}

function resp(status: number, body: any) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }
}

function safeParse(s: string) {
  try { return JSON.parse(s) } catch { return null }
}