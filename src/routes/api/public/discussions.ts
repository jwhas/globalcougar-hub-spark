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
  student_id: number
  title: string
  body: string
  topic: string
  created_at: string
}

type RawReply = { id: number; thread_id: number; student_id: number; body: string; created_at: string }

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

        const { data: threadRows, error: threadError } = await supabase
          .from('forum_thread')
          .select('id, student_id, title, body, topic, created_at')
          .order('created_at', { ascending: false })
          .limit(60)

        if (threadError) {
          console.error('Discussion threads could not be loaded:', threadError.message)
          return fail('The board could not be loaded.', 502)
        }

        const rawThreads = (threadRows ?? []) as RawThread[]
        const threadIds = rawThreads.map(row => row.id)
        const { data: replyRows, error: replyError } = threadIds.length
          ? await supabase.from('forum_reply').select('id, thread_id, student_id, body, created_at').in('thread_id', threadIds)
          : { data: [], error: null }
        if (replyError) {
          console.error('Discussion replies could not be loaded:', replyError.message)
          return fail('The board replies could not be loaded.', 502)
        }

        const rawReplies = (replyRows ?? []) as RawReply[]
        const studentIds = [...new Set([...rawThreads.map(row => row.student_id), ...rawReplies.map(row => row.student_id)])]
        const { data: studentRows, error: studentsError } = studentIds.length
          ? await supabase.from('student').select('id, name').in('id', studentIds)
          : { data: [], error: null }
        if (studentsError) {
          console.error('Discussion authors could not be loaded:', studentsError.message)
          return fail('The board authors could not be loaded.', 502)
        }
        const authorById = new Map((studentRows ?? []).map(row => [row.id, row.name]))

        const threads: Thread[] = rawThreads.map((row) => ({
          id: row.id,
          title: row.title,
          body: row.body,
          topic: row.topic,
          author: authorById.get(row.student_id) ?? 'Student',
          at: Date.parse(row.created_at),
          replies: rawReplies
            .filter(reply => reply.thread_id === row.id)
            .map((r) => ({
              id: r.id,
              author: authorById.get(r.student_id) ?? 'Student',
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

        const authorization = request.headers.get('authorization')
        if (!authorization?.startsWith('Bearer ')) return fail('Sign in before posting.', 401)
        const accessToken = authorization.slice('Bearer '.length)

        let payload: unknown
        try {
          payload = await request.json()
        } catch {
          return fail('Send a JSON body.', 400)
        }
        const input = (payload ?? {}) as Record<string, unknown>
        const action = clean(input['action'], 10)

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
              headers.set('Authorization', `Bearer ${accessToken}`)
              return fetch(input2, { ...init, headers })
            },
          },
        })

        const { data: authData, error: authError } = await supabase.auth.getUser(accessToken)
        if (authError || !authData.user) return fail('Your session expired. Please sign in again.', 401)

        // Posts belong to the demo student until real accounts exist.
        let { data: student, error: studentError } = await supabase
          .from('student')
          .select('id, name')
          .eq('name', DEMO_STUDENT)
          .maybeSingle()
        if (!student && !studentError) {
          const fallback = await supabase
            .from('student')
            .select('id, name')
            .order('id', { ascending: true })
            .limit(1)
            .maybeSingle()
          student = fallback.data
          studentError = fallback.error
        }
        if (studentError || !student) return fail('The board is not ready yet.', 503)
        const demoAuthor = student.name || DEMO_STUDENT

        if (action === 'thread') {
          const title = clean(input['title'], 140)
          const body = clean(input['body'], 2000)
          const topicRaw = clean(input['topic'], 40)
          const topic = TOPICS.includes(topicRaw) ? topicRaw : 'Campus Life'
          if (title.length < 3) return fail('A title needs at least 3 characters.', 400)
          if (body.length < 1) return fail('Add some details to your post.', 400)

          const { data: thread, error } = await supabase
            .from('forum_thread')
            .insert({ student_id: student.id, title, body, topic })
            .select('id, student_id, title, body, topic, created_at')
            .single()
          if (error || !thread) return fail('Your post could not be saved.', 502)

          const row = thread as RawThread
          return Response.json({
            ok: true,
            thread: {
              id: row.id,
              title: row.title,
              body: row.body,
              topic: row.topic,
              author: demoAuthor,
              at: Date.parse(row.created_at),
              replies: [],
            },
          }, { headers: { 'Cache-Control': 'no-store' } })
        }

        if (action === 'reply') {
          const body = clean(input['body'], 1000)
          const threadId = Number(input['thread_id'])
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
            .select('id, thread_id, student_id, body, created_at')
            .single()
          if (error || !reply) return fail('Your reply could not be saved.', 502)

          const row = reply as RawReply
          return Response.json({
            ok: true,
            reply: {
              id: row.id,
              author: demoAuthor,
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
