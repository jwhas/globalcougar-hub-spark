import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/integrations/supabase/types'

const progressSchema = z.object({
  task_key: z.string().regex(/^(core-(0[1-9]|1[0-4])|life-0[1-7])$/),
  status: z.enum(['not_started', 'in_progress', 'completed', 'not_applicable']),
  checklist: z.array(z.number().int().min(0).max(19)).max(20),
  completed_at: z.string().datetime().nullable(),
})
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v))).nullable()
const settingsSchema = z.object({
  semester: z.enum(['Fall 2026', 'Winter 2027', 'Spring 2027', 'Summer 2027']),
  account_start: date, arrival: date, program_start: date,
})
function client() {
  const url = process.env['SUPABASE_URL'], key = process.env['SUPABASE_PUBLISHABLE_KEY']
  if (!url || !key) throw new Error('Shared saving is unavailable.')
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers)
      if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization')
      headers.set('apikey', key)
      return fetch(input, { ...init, headers })
    } },
  })
}
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
export const Route = createFileRoute('/api/public/journey')({
  server: { handlers: {
    GET: async () => {
      try {
        const db = client()
        const [progress, settings] = await Promise.all([
          db.from('journey_progress').select('task_key,status,checklist,completed_at'),
          db.from('journey_settings').select('semester,account_start,arrival,program_start').eq('id', 1).maybeSingle(),
        ])
        if (progress.error || settings.error) throw new Error('Could not load journey.')
        return json({ ok: true, progress: progress.data, settings: settings.data })
      } catch { return json({ ok: false, error: 'Shared saving is unavailable.' }, 503) }
    },
    POST: async ({ request }) => {
      // Deliberately public, non-sensitive class-demo state, not user identity.
      // Require an explicit same-origin browser caller; never accept missing origins.
      const origin = request.headers.get('origin')
      if (!origin || origin !== new URL(request.url).origin) return json({ ok: false }, 403)
      if (Number(request.headers.get('content-length') || 0) > 6000) return json({ ok: false }, 413)
      try {
        const raw = await request.text()
        if (raw.length > 6000) return json({ ok: false }, 413)
        const payload = z.object({ progress: progressSchema.optional(), settings: settingsSchema.optional() }).refine(v => Boolean(v.progress || v.settings)).parse(JSON.parse(raw))
        if (payload.progress?.status === 'not_applicable' && !['core-02','core-03','core-07','core-10','core-13'].includes(payload.progress.task_key)) return json({ ok: false }, 400)
        const db = client()
        if (payload.progress) {
          const { error } = await db.from('journey_progress').upsert({ ...payload.progress, updated_at: new Date().toISOString() })
          if (error) throw error
        }
        if (payload.settings) {
          const { error } = await db.from('journey_settings').upsert({ id: 1, ...payload.settings, updated_at: new Date().toISOString() })
          if (error) throw error
        }
        return json({ ok: true })
      } catch (error) { return json({ ok: false }, error instanceof z.ZodError || error instanceof SyntaxError ? 400 : 503) }
    },
  } },
})