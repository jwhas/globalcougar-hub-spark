import { createFileRoute } from '@tanstack/react-router';

// Public, read-only proxy for BYU's official news RSS (news.byu.edu). Returns only public headlines.
const FEED = 'https://news.byu.edu/xml/rss/rssfeed.rss';

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim();

function categorize(text: string) {
  const t = text.toLowerCase();
  if (/(visa|immigra|international student|i-20|f-1|sevis|isss|passport)/.test(t)) return 'Legal / Visa';
  if (/(deadline|registration|register|due |apply by|last day|tuition)/.test(t)) return 'Deadlines';
  return 'Campus Life';
}

export const Route = createFileRoute('/api/public/byu-news')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const res = await fetch(FEED, { headers: { 'User-Agent': 'Mozilla/5.0 GlobalCougar' } });
          if (!res.ok) throw new Error(`BYU feed ${res.status}`);
          const xml = await res.text();
          const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 12).map((m) => {
            const body = m[1] ?? '';
            const get = (tag: string) => decode(body.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1] ?? '');
            const title = get('title');
            const description = get('description');
            return {
              title,
              description,
              link: get('link'),
              pubDate: get('pubDate'),
              category: categorize(`${title} ${description}`),
            };
          });
          return Response.json(
            { source: 'news.byu.edu', items },
            { headers: { 'Cache-Control': 'public, max-age=900' } },
          );
        } catch (e) {
          return Response.json({ error: (e as Error).message, items: [] });
        }
      },
    },
  },
});
