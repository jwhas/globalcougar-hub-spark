import { XMLParser, XMLValidator } from "fast-xml-parser";
import type { TablesInsert } from "@/integrations/supabase/types";

export const BYU_NEWS_RSS_URL = "https://news.byu.edu/index.rss";
export const BYU_NEWS_SOURCE = "byu_news_rss";
const NEWS_EXPIRATION_DAYS = 90;

const parser = new XMLParser({
  ignoreAttributes: true,
  processEntities: true,
  trimValues: true,
});

type XmlRecord = Record<string, unknown>;

function isRecord(value: unknown): value is XmlRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function text(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (!isRecord(value)) return "";
  return text(value["#text"] ?? value["__cdata"] ?? "");
}

function cleanSummary(value: unknown): string {
  return text(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}

function officialNewsUrl(value: unknown): string | null {
  const raw = text(value);
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.hostname !== "news.byu.edu") return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function classification(sourceCategories: string[], sourceUrl: string) {
  const hints = [...sourceCategories, new URL(sourceUrl).pathname].join(" ").toLowerCase();
  const categories = new Set<string>();
  const interestKeys = new Set<string>();
  const add = (category: string | null, interest: string) => {
    if (category) categories.add(category);
    interestKeys.add(interest);
  };

  if (/\b(visa|immigration)\b/.test(hints)) add("Legal / Visa", "Immigration & Visa");
  if (/\b(academic calendar|academic deadline|deadlines)\b/.test(hints))
    add("Deadlines", "Academics & Deadlines");
  if (/\b(careers?|internships?|employment)\b/.test(hints)) add(null, "Career & Internships");
  if (/\b(scholarships?|financial aid)\b/.test(hints))
    add("Scholarships", "Scholarships & Financial Aid");
  if (/\b(campus life|campus events?|student life)\b/.test(hints))
    add("Campus Life", "Campus Life & Events");
  if (/\bhousing\b/.test(hints)) add("Housing", "Housing & Life in Provo");
  if (/\b(health|wellness)\b/.test(hints)) add("Health & Wellness", "Health & Wellness");
  if (/\b(travel|arrival)\b/.test(hints)) add("Travel & Arrival", "Travel & Arrival");
  if (/\b(community|student groups?|organizations?)\b/.test(hints))
    add("Community", "Community & Student Groups");

  return { categories: [...categories], interest_keys: [...interestKeys] };
}

export function parseByuNewsRss(xml: string, now = new Date()): TablesInsert<"announcements">[] {
  if (xml.length > 2_000_000) throw new Error("The BYU News feed exceeded the size limit.");
  if (/<!DOCTYPE|<!ENTITY/i.test(xml))
    throw new Error("The BYU News feed contains unsupported XML declarations.");
  if (XMLValidator.validate(xml) !== true) throw new Error("The BYU News feed is not valid XML.");

  const document: unknown = parser.parse(xml);
  const root = isRecord(document) && isRecord(document["rss"]) ? document["rss"] : null;
  const channel = root && isRecord(root["channel"]) ? root["channel"] : null;
  if (!channel) throw new Error("The BYU News RSS channel was not found.");

  const nowIso = now.toISOString();
  const items = asArray(channel["item"]);
  const announcements = new Map<string, TablesInsert<"announcements">>();

  for (const rawItem of items.slice(0, 100)) {
    if (!isRecord(rawItem)) continue;
    const sourceUrl = officialNewsUrl(rawItem["link"]);
    const title = text(rawItem["title"]).slice(0, 300);
    const sourceItemId = text(rawItem["guid"]) || sourceUrl || "";
    if (!sourceUrl || !title || !sourceItemId) continue;

    const sourceCategories = asArray(rawItem["category"]).map(text).filter(Boolean).slice(0, 20);
    const published = Date.parse(text(rawItem["pubDate"]));
    const publishedAt = Number.isFinite(published) ? new Date(published).toISOString() : null;
    const expiresAt = publishedAt
      ? new Date(Date.parse(publishedAt) + NEWS_EXPIRATION_DAYS * 24 * 60 * 60 * 1000).toISOString()
      : null;
    const mapped = classification(sourceCategories, sourceUrl);
    const row: TablesInsert<"announcements"> = {
      source: BYU_NEWS_SOURCE,
      source_item_id: sourceItemId.slice(0, 500),
      source_url: sourceUrl,
      title,
      summary: cleanSummary(rawItem["description"]),
      source_categories: sourceCategories,
      categories: mapped.categories,
      interest_keys: mapped.interest_keys,
      published_at: publishedAt,
      expires_at: expiresAt,
      is_published: true,
      last_seen_at: nowIso,
      updated_at: nowIso,
    };
    if (!announcements.has(row.source_item_id)) announcements.set(row.source_item_id, row);
  }

  if (announcements.size === 0) throw new Error("The BYU News feed contained no usable entries.");
  return [...announcements.values()];
}
