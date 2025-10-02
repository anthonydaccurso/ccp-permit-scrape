// netlify/functions/gh-dispatch.ts
import type { Handler } from "@netlify/functions"

const WORKFLOWS = ["seed-sources.yml", "seed-areas.yml", "crawl.yml"]

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return resp(405, { error: "method_not_allowed", allow: "POST" })
    }

    // ✅ safely ignore empty body
    let body: any = {}
    if (event.body && event.body.trim() !== "") {
      try {
        body = JSON.parse(event.body)
      } catch {
        return resp(400, { error: "invalid_json" })
      }
    }

    const token = event.headers["x-admin-token"]
    if (!token || token.trim() !== (process.env.ADMIN_TOKEN_NEW || "")) {
      return resp(401, { error: "unauthorized" })
    }

    const owner = process.env.GH_OWNER
    const repo = process.env.GH_REPO
    const ghToken = process.env.GH_TOKEN
    const ref = process.env.GH_REF || "main"

    if (!owner || !repo || !ghToken) {
      return resp(500, { error: "missing_env" })
    }

    const results: any[] = []
    for (const wf of WORKFLOWS) {
      const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(wf)}/dispatches`

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ghToken}`,
          "Accept": "application/vnd.github+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ref }) // always send JSON
      })

      if (!res.ok) {
        const text = await res.text()
        results.push({ workflow: wf, status: res.status, ok: false, detail: text })
        break // stop chain on first failure
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