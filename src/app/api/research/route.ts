import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { keywords } = await req.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: "키워드를 1개 이상 입력해 주세요." }, { status: 400 });
    }

    const tavilyApiKey = process.env.TAVILY_API_KEY;
    if (!tavilyApiKey) {
      return NextResponse.json({ error: "TAVILY_API_KEY가 설정되지 않았습니다." }, { status: 500 });
    }

    const results = await Promise.all(
      keywords.slice(0, 3).map(async (keyword: string) => {
        // 1) Tavily Search로 최신 정보 수집
        const searchRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tavilyApiKey}`,
          },
          body: JSON.stringify({
            query: `${keyword} latest trends 2025 2026`,
            maxResults: 10,
            includeAnswer: false,
            includeRawContent: false,
            includeDomains: false,
            topic: "general",
          }),
        });

        if (!searchRes.ok) {
          const errBody = await searchRes.text();
          console.error(`Tavily search error for "${keyword}":`, errBody);
          throw new Error(`검색 API 오류 (키워드: ${keyword})`);
        }

        const searchData = await searchRes.json();

        // 2) 수집된 결과를 기반으로 인사이트 구성
        const trends = extractTrends(keyword, searchData.results || []);

        return { keyword, trends };
      })
    );

    return NextResponse.json({ keywords: results });
  } catch (err) {
    console.error("Research API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "리서치 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

type TavilyResult = {
  title: string;
  url: string;
  content: string;
  publishedDate?: string;
};

function extractTrends(keyword: string, results: TavilyResult[]): Array<{
  name: string;
  core: string;
  insight: string;
  source: string;
}> {
  // 수집된 결과에서 핵심 트렌드 3~4건 추출
  const trends: Array<{ name: string; core: string; insight: string; source: string }> = [];

  const topResults = results.slice(0, 4);

  for (const item of topResults) {
    // 제목에서 키워드 추출
    const titleWords = item.title.replace(/[-(,)]$/g, "").split(/[-\s,(]+/).filter(Boolean);

    // 트렌드 이름이 너무 길면 줄인다
    const name = item.title.length > 40 ? item.title.slice(0, 40) + "…" : item.title;

    // 콘텐츠에서 핵심 문장 추출 (첫 문장)
    const firstSentence = item.content
      .replace(/\n+/g, " ")
      .split(/(?<=[.!?])\s+/)[0] ?? item.content.slice(0, 60);

    // 시사점 추론
    const insight = item.content
      .replace(/\n+/g, " ")
      .split(/(?<=[.!?])\s+/)[1]
      ?.slice(0, 60) ?? "트렌드 변화에 주목";

    trends.push({
      name,
      core: firstSentence.length > 80 ? firstSentence.slice(0, 80) + "…" : firstSentence,
      insight,
      source: item.url,
    });
  }

  return trends;
}
