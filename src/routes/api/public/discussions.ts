import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

// Public board for the prototype: no sign-in exists yet, so the anonymous
// role reads and writes it. Every caller is still checked here: same-origin
// only, and every field validated and length-capped before it reaches SQL.
const DEMO_STUDENT = 'James A.'
const TOPICS = ['Careers', 'Work', 'Scholarships', 'Money & Aid', 'Campus Life']

type Reply = { id: number; author: string; body: string; at: number }
type Thread = Reply extends never ? never : {
  id: number
  title: string
  body: string
  topic: string
  author: string
  at: number
  replies: Reply[]
}

type RawThread = {
  id: number
  title: string
  body: string
  topic: string
  created_at: string
  student: { name: string } | null
  forum_reply: Array<{
    id: number
    body: string
    created_at: string
    student: { name: string } | null
  }> | null
}

function sameOrigin(request: Request): boolean {
  const host = new URL(request.url).host
  const source = request.headers.get('origin') ?? request.headers.get('referer')
  if (!source) return true
  try {
    return new URL(source).host === host
  } catch {
    return false
  }
}

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function fail(error: string, status: number) {
  return Response.json({ ok: false, error }, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export const Route = createFileRoute('/api/public/discussions')({
  server: {
    handlers: {
      GET: async () => {
        const url = process.env['SUPABASE_URL']
        const key = process.env['SUPABASE_PUBLISHABLE_KEY']
        if (!url || !key) return fail('The database is not configured yet.', 503)

        // Opaque sb_ keys are not JWTs, so send apikey only and never persist a session.
        const supabase = createClient<Database>(url, key, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) => {
              const headers = new Headers(
                typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
              )
              if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v))
              if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) {
                headers.delete('Authorization')
              }
              headers.set('apikey', key)
              return fetch(input, { ...init, headers })
            },
          },
        })

        const { data, error } = await supabase
          .from('forum_thread')
          .select('id, title, body, topic, created_at, student(name), forum_reply(id, body, created_at, student(name))')
          .order('created_at', { ascending: false })
          .limit(60)

        if (error) return fail('The board could not be loaded.', 502)

        const threads: Thread[] = ((data ?? []) as unknown as RawThread[]).map((row) => ({
          id: row.id,
          title: row.title,
          body: row.body,
          topic: row.topic,
          author: row.student?.name ?? 'Student',
          at: Date.parse(row.created_at),
          replies: (row.forum_reply ?? [])
            .map((r) => ({
              id: r.id,
              author: r.student?.name ?? 'Student',
              body: r.body,
              at: Date.parse(r.created_at),
            }))
            .sort((a, b) => a.at - b.at),
        }))

        return Response.json({ ok: true, threads }, {
          headers: { 'Cache-Control': 'no-store' },
        })
      },

      POST: async ({ request }) => {
        if (!sameOrigin(request)) return fail('Only this site can post to the board.', 403)

        let payload: unknown
        try {
          payload = await request.json()
        } catch {
          return fail('Send a JSON body.', 400)
        }
        const input = (payload ?? {}) as Record<string, unknown>
        const action = clean(input.action, 10)

        const url = process.env['SUPABASE_URL']
        const key = process.env['SUPABASE_PUBLISHABLE_KEY']
        if (!url || !key) return fail('The database is not configured yet.', 503)

        const supabase = createClient<Database>(url, key, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input2, init) => {
              const headers = new Headers(
                typeof Request !== 'undefined' && input2 instanceof Request ? input2.headers : undefined,
              )
              if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v))
              if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) {
                headers.delete('Authorization')
              }
              headers.set('apikey', key)
              return fetch(input2, { ...init, headers })
            },
          },
        })

        // Posts belong to the demo student until real accounts exist.
        const { data: student, error: studentError } = await supabase
          .from('student')
          .select('id')
          .eq('name', DEMO_STUDENT)
          .maybeSingle()
        if (studentError || !student) return fail('The board is not ready yet.', 503)

        if (action === 'thread') {
          const title = clean(input.title, 140)
          const body = clean(input.body, 2000)
          const topicRaw = clean(input.topic, 40)
          const topic = TOPICS.includes(topicRaw) ? topicRaw : 'Campus Life'
          if (title.length < 3) return fail('A title needs at least 3 characters.', 400)
          if (body.length < 1) return fail('Add some details to your post.', 400)

          const { data: thread, error } = await supabase
            .from('forum_thread')
            .insert({ student_id: student.id, title, body, topic })
            .select('id, title, body, topic, created_at, student(name)')
            .single()
          if (error || !thread) return fail('Your post could not be saved.', 502)

          const row = thread as unknown as RawThread
          return Response.json({
            ok: true,
            thread: {
              id: row.id,
              title: row.title,
              body: row.body,
              topic: row.topic,
              author: row.student?.name ?? DEMO_STUDENT,
              at: Date.parse(row.created_at),
              replies: [],
            },
          }, { headers: { 'Cache-Control': 'no-store' } })
        }

        if (action === 'reply') {
          const body = clean(input.body, 1000)
          const threadId = Number(input.thread_id)
          if (body.length < 1) return fail('Write a reply first.', 400)
          if (!Number.isInteger(threadId) || threadId < 1) return fail('That discussion no longer exists.', 400)

          const { data: existing } = await supabase
            .from('forum_thread')
            .select('id')
            .eq('id', threadId)
            .maybeSingle()
          if (!existing) return fail('That discussion no longer exists.', 404)

          const { data: reply, error } = await supabase
            .from('forum_reply')
            .insert({ thread_id: threadId, student_id: student.id, body })
            .select('id, body, created_at, student(name)')
            .single()
          if (error || !reply) return fail('Your reply could not be saved.', 502)

          const row = reply as unknown as {
            id: number
            body: string
            created_at: string
            student: { name: string } | null
          }
          return Response.json({
            ok: true,
            reply: {
              id: row.id,
              author: row.student?.name ?? DEMO_STUDENT,
              body: row.body,
              at: Date.parse(row.created_at),
            },
          }, { headers: { 'Cache-Control': 'no-store' } })
        }

        return fail('Unknown action.', 400)
      },
    },
  },
})
