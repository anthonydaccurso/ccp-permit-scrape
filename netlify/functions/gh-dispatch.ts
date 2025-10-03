import type { Handler } from "@netlify/functions"

const WORKFLOWS = ["seed-sources.yml", "seed-areas.yml", "crawl.yml"]

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return resp(204, "", cors())
    if (event.httpMethod !== "POST")   return resp(405, { error: "method_not_allowed", allow: "POST" }, cors())

    const admin = event.headers["x-admin-token-new"]
    if (!admin || admin.trim() !== (process.env.ADMIN_TOKEN_NEW || "")) {
      return resp(401, { error: "unauthorized" }, cors())
    }

    const owner = (process.env.GH_OWNER || "").trim()
    const repo  = (process.env.GH_REPO  || "").trim()
    const token = (process.env.GH_TOKEN || "").trim()
    const ref   = (process.env.GH_REF   || "main").trim()

    if (!owner || !repo || !token) {
      return resp(200, {
        ok: false,
        error: "missing_env",
        missing: { GH_OWNER: !!owner, GH_REPO: !!repo, GH_TOKEN: !!token, GH_REF: !!ref }
      }, cors())
    }

    const results: any[] = []

    for (const wf of WORKFLOWS) {
      const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/workflows/${encodeURIComponent(wf)}/dispatches`
      let ghRes: Response
      let text = ""
      try {
        ghRes = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28"
          },
          body: JSON.stringify({ ref })
        })
        text = await ghRes.text()
      } catch (e: any) {
        return resp(200, { ok: false, step: wf, error: "dispatch_request_failed", detail: e?.message }, cors())
      }

      if (!ghRes.ok) {
        return resp(200, {
          ok: false,
          step: wf,
          status: ghRes.status,
          error: "github_dispatch_failed",
          hint: "Check branch (GH_REF), workflow filename, GH_OWNER/GH_REPO, PAT scopes (Actions+Workflows RW).",
          detail: tryJson(text) ?? text
        }, cors())
      }

      results.push({ workflow: wf, status: ghRes.status, ok: true })
    }

    return resp(200, { ok: true, results }, cors())
  } catch (e: any) {
    return resp(200, { ok: false, error: "server_error", detail: e?.message ?? String(e) }, cors())
  }
}

function resp(status: number, body: any, headers?: Record<string,string>) {
  return { statusCode: status, headers: { "Content-Type": "application/json", ...(headers||{}) }, body: JSON.stringify(body) }
}
function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-token"
  }
}
function tryJson(s: string) { try { return JSON.parse(s) } catch { return null } }