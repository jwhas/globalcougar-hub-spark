import test from "node:test";
import assert from "node:assert/strict";
import {
  clearRetrievalCacheForTests,
  extractReadableText,
  fetchTrustedDocument,
  formatOfficialContext,
  isTrustedUrl,
  retrieveOfficialSources,
  selectTrustedSources,
} from "./retrieval.ts";
import { openRouterErrorMessage, requestOpenRouter } from "./openrouter.ts";
import { TRUSTED_SOURCES } from "./trusted-sources.ts";
import { readFileSync } from "node:fs";

const html = (body: string) => new Response(`<!doctype html><html><body><header>Site menu that should be removed</header><main><h1>Official guidance</h1>${body}</main><footer>Footer links that should be removed</footer></body></html>`, {
  status: 200,
  headers: { "content-type": "text/html; charset=utf-8" },
});

test("selects relevant sources deterministically without a model call", () => {
  assert.equal(selectTrustedSources("How do I apply for CPT at BYU?")[0]?.source.id, "byu-isss-cpt-application");
  assert.ok(selectTrustedSources("BYU에서 커피를 마셔도 되나요?").some(({ source }) => source.id === "byu-policy-honor-code"));
  assert.ok(selectTrustedSources("¿Qué es el Honor Code de BYU?").some(({ source }) => source.id === "byu-policy-honor-code"));
  assert.deepEqual(selectTrustedSources("How is BYU?"), []);
  assert.deepEqual(selectTrustedSources("How can I make tomato soup?"), []);
});

test("prioritizes CPT-specific and federal sources over on-campus employment", () => {
  const selected = selectTrustedSources("Can an F-1 transfer student work off campus using CPT before completing one academic year?", 5);
  const ids = selected.map(({ source }) => source.id);
  assert.equal(ids[0], "byu-isss-cpt-application");
  assert.ok(ids.includes("ecfr-f1-practical-training"));
  assert.ok(ids.includes("dhs-training-opportunities"));
  assert.ok(!ids.includes("byu-isss-on-campus-employment"));
});

test("includes transfer and program exceptions in the retrieved CPT evidence", async () => {
  const result = await retrieveOfficialSources("Can a transfer student use CPT immediately at BYU?", {
    fetcher: async () => { throw new Error("No network expected for indexed CPT guidance"); },
  });
  const evidence = result.excerpts.map(({ text }) => text).join(" ");
  assert.match(evidence, /transferred to BYU/i);
  assert.match(evidence, /new graduate student/i);
});

test("covers the requested retrieval scenarios", () => {
  const cases: Array<[string, string | null]> = [
    ["Do BYU students have to follow the Word of Wisdom?", "byu-policy-honor-code"],
    ["How do I apply for CPT at BYU?", "byu-isss-cpt-application"],
    ["What is the difference between CPT and OPT?", "dhs-training-opportunities"],
    ["BYU에서 커피를 마셔도 되나요?", "byu-policy-honor-code"],
    ["BYU의 기술 인프라는 다른 미국 대학보다 뒤처지나요?", null],
    ["What is the official name of the Church affiliated with BYU?", "church-style-guide"],
    ["¿Qué es el Honor Code de BYU?", "byu-policy-honor-code"],
  ];
  for (const [question, expectedId] of cases) {
    const ids = selectTrustedSources(question).map(({ source }) => source.id);
    if (expectedId) assert.ok(ids.includes(expectedId), `${question} should select ${expectedId}`);
    else assert.deepEqual(ids, [], `${question} should not claim a verified source`);
  }
});

test("validates only explicit trusted HTTPS hosts", () => {
  assert.equal(isTrustedUrl("https://iss.byu.edu/employment"), true);
  assert.equal(isTrustedUrl("http://iss.byu.edu/employment"), false);
  assert.equal(isTrustedUrl("https://iss.byu.edu.evil.example/employment"), false);
  assert.equal(isTrustedUrl("https://user@iss.byu.edu/employment"), false);
  assert.equal(isTrustedUrl("https://127.0.0.1/"), false);
});

test("removes navigation, scripts, and footer text from HTML", () => {
  const text = extractReadableText("<nav>Navigation content should disappear</nav><article><h1>CPT Guidance</h1><p>Curricular practical training must relate to the curriculum.</p></article><script>ignore me</script><footer>Footer content should disappear</footer>");
  assert.match(text, /Curricular practical training/);
  assert.doesNotMatch(text, /Navigation content|ignore me|Footer content/);
});

test("preserves short advisor names, emails, and assignment ranges", () => {
  const text = extractReadableText(`<main><h3>Sam Brown</h3><div>sam_brown@byu.edu<br>Advises Students with Last Names <strong>V-Z</strong></div></main>`);
  assert.match(text, /Sam Brown/);
  assert.match(text, /sam_brown@byu\.edu/);
  assert.match(text, /V-Z/);
});

test("selects the ISSS advisor directory for multilingual advisor questions", () => {
  for (const question of ["My last name is Young. Who is my ISSS advisor?", "제 성은 김인데 ISSS 담당자가 누구예요?", "¿Quién es mi asesor de ISSS si mi apellido es Díaz?"]) {
    assert.equal(selectTrustedSources(question)[0]?.source.id, "byu-isss-advisor-assignments");
  }
});

test("the assistant explains advisor assignment using the family name initial", () => {
  const handler = readFileSync(new URL("./index.ts", import.meta.url), "utf8");
  assert.match(handler, /Briefly state which family\/last name you understood/);
  assert.match(handler, /first letter Y places you in the V-Z range/);
});

test("retrieves, ranks, cites, and caches official excerpts", async () => {
  clearRetrievalCacheForTests();
  let requests = 0;
  const fetcher: typeof fetch = async () => {
    requests += 1;
    return html("<p>Curricular Practical Training (CPT) is employment connected to a student's curriculum.</p><p>Students should review authorization requirements before beginning employment.</p>");
  };
  const first = await retrieveOfficialSources("How do I apply for CPT at BYU?", { fetcher, now: 1_000 });
  assert.ok(first.excerpts.length > 0);
  assert.ok(first.sources.every((source) => source.url.startsWith("https://")));
  assert.match(formatOfficialContext(first), /OFFICIAL SOURCE EXCERPTS/);
  const firstRequestCount = requests;
  await retrieveOfficialSources("How do I apply for CPT at BYU?", { fetcher, now: 2_000 });
  assert.equal(requests, firstRequestCount);
});

test("reports retrieval failures without fabricating a source", async () => {
  clearRetrievalCacheForTests();
  const fetcher: typeof fetch = async () => new Response("unavailable", { status: 503, headers: { "content-type": "text/plain" } });
  const result = await retrieveOfficialSources("What is OPT?", { fetcher });
  assert.equal(result.sources.length, 0);
  assert.ok(result.failures.length > 0);
  assert.match(formatOfficialContext(result), /Relevant official sources were identified, but their content could not be retrieved/);
});

test("does not add an official-source disclaimer to unrelated general questions", async () => {
  const result = await retrieveOfficialSources("토마토 수프를 어떻게 만들어?");
  assert.deepEqual(result.attempted, []);
  assert.match(formatOfficialContext(result), /Answer it normally/);
  assert.match(formatOfficialContext(result), /Do not mention retrieval/);
});

test("blocks redirects to an untrusted host", async () => {
  const source = TRUSTED_SOURCES.find(({ id }) => id === "byu-isss-employment");
  assert.ok(source);
  const fetcher: typeof fetch = async () => new Response(null, { status: 302, headers: { location: "https://evil.example/steal" } });
  await assert.rejects(() => fetchTrustedDocument(source, fetcher), /untrusted_redirect/);
});

test("maps OpenRouter rate limits to a friendly non-retry message", () => {
  assert.match(openRouterErrorMessage(429) ?? "", /request limit/);
  assert.match(openRouterErrorMessage(429) ?? "", /conversation is still here/);
  assert.equal(openRouterErrorMessage(200), null);
});

test("makes one model request and parses a mocked answer", async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => {
    calls += 1;
    return Response.json({ choices: [{ message: { content: "Grounded answer [S1]" } }] });
  };
  const result = await requestOpenRouter({ apiKey: "test", model: "test-model", messages: [{ role: "user", content: "Question" }] }, fetcher);
  assert.equal(calls, 1);
  assert.deepEqual(result, { ok: true, status: 200, reply: "Grounded answer [S1]" });
});

test("does not retry a mocked 429 response", async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => {
    calls += 1;
    return new Response("rate limited", { status: 429 });
  };
  const result = await requestOpenRouter({ apiKey: "test", model: "test-model", messages: [{ role: "user", content: "Question" }] }, fetcher);
  assert.equal(calls, 1);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /request limit/);
});

