// netlify/functions/gh-dispatch.ts
// POST /api/gh-dispatch
// Body: { workflow: string, ref?: string, inputs?: Record<string, any> }
// Secured via x-admin-token header (must equal ADMIN_TOKEN env)
// Uses GH_OWNER, GH_REPO, GH_TOKEN, optional GH_REF (default branch)

import type { Handler } from "@netlify/functions"

// Allow friendly aliases so the frontend can send short names
const WORKFLOW_ALIASES: Record<string, string> = {
  "seed-sources": "seed-sources.yml",
  "seed-areas": "seed-areas.yml",
  "crawl": "crawl.yml",                 // if you add a crawl workflow
}

function resolveWorkflow(name: string): string {
  // if a direct filename was passed, use it; else map alias → filename
  if (name.endsWith(".yml") || name.endsWith(".yaml")) return name
  return WORKFLOW_ALIASES[name] ?? name
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "method_not_allowed", allow: "POST" })
    }

    // --- Admin auth (protects your GitHub token) ---
    const adminHeader = (event.headers["x-admin-token"] || event.headers["X-Admin-Token"]) as string | undefined
    if (!adminHeader || adminHeader.trim() !== (process.env.ADMIN_TOKEN || "")) {
      return json(401, { error: "unauthorized" })
    }

    // --- Parse + validate body ---
    let body: any = {}
    try {
      body = event.body ? JSON.parse(event.body) : {}
    } catch {
      return json(400, { error: "invalid_json" })
    }

    const rawWorkflow = (body.workflow ?? "").toString().trim()
    if (!rawWorkflow) {
      return json(400, { error: "workflow_required", hint: "Provide { workflow: 'seed-sources.yml' } or an alias like 'seed-sources'." })
    }
    const workflow = resolveWorkflow(rawWorkflow)

    const ref = (body.ref ?? process.env.GH_REF ?? "main").toString().trim()
    const inputs = (body.inputs && typeof body.inputs === "object") ? body.inputs : undefined

    // --- Env sanity checks ---
    const owner = (process.env.GH_OWNER || "").trim()
    const repo  = (process.env.GH_REPO  || "").trim()
    const token = (process.env.GH_TOKEN || "").trim()

    if (!owner || !repo || !token) {
      return json(500, {
        error: "missing_env",
        missing: {
          GH_OWNER: !!owner, GH_REPO: !!repo, GH_TOKEN: !!token
        },
        hint: "Set GH_OWNER, GH_REPO, GH_TOKEN in Netlify env vars."
      })
    }

    // --- Dispatch to GitHub ---
    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/workflows/${encodeURIComponent(workflow)}/dispatches`

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify(inputs ? { ref, inputs } : { ref })
    })

    const text = await res.text()

    if (!res.ok) {
      // Common causes: wrong filename, wrong ref/branch, insufficient token scopes, repo mismatch
      return json(res.status, {
        error: "github_dispatch_failed",
        workflow,
        ref,
        detail: safeParseJson(text) ?? text,
        hint: "Confirm workflow file name on that branch, GH_TOKEN scopes (Actions: Read/Write), repo owner/name, and repo → Settings → Actions → Workflow permissions = Read and write."
      })
    }

    // Success: GitHub returns 204 No Content
    return json(200, { ok: true, workflow, ref })

  } catch (e: any) {
    return json(500, { error: "server_error", detail: e?.message ?? String(e) })
  }
}

// ---------- helpers ----------
function json(status: number, data: unknown) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(data),
  }
}

function safeParseJson(s: string) {
  try { return JSON.parse(s) } catch { return null }
}