"use client";

import { useState } from "react";

type ResearchResult = {
  keyword: string;
  trends: {
    name: string;
    core: string;
    insight: string;
    source: string;
  }[];
};

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<ResearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setError("키워드를 입력해 주세요.");
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: keyword.trim().split(",").map((k) => k.trim()).filter(Boolean) }),
      });

      if (!res.ok) throw new Error("리서치 중 오류가 발생했습니다.");

      const data = await res.json();
      const formatted: ResearchResult[] = (data.keywords as any[]).map((kw: any) => ({
        keyword: kw.keyword,
        trends: (kw.trends as any[]).map((t: any) => ({
          name: t.name ?? t.trend,
          core: t.core ?? t.summary,
          insight: t.insight ?? t.implication,
          source: t.source ?? "",
        })),
      }));
      setResults(formatted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!results) return;

    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      });

      if (!res.ok) throw new Error("PDF 생성 중 오류가 발생했습니다.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tech-trend-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "PDF 다운로드에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* 헤더 */}
      <header className="bg-zinc-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold tracking-tight">테크 트렌드 리서치</h1>
          <p className="text-zinc-400 mt-2">
            키워드를 입력하면 최신 기술 트렌드를 리서치하고 PDF 레포트로 다운로드합니다.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* 키워드 입력 */}
        <section className="mb-10">
          <label htmlFor="keyword" className="block text-sm font-medium text-zinc-700 mb-2">
            키워드를 입력하세요 (쉼표로 구분, 최대 3개)
          </label>
          <div className="flex gap-3">
            <input
              id="keyword"
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder='예: "LLM Benchmarks, 생성형 AI, 멀티모달 AI"'
              className="flex-1 px-4 py-3 border border-zinc-300 rounded-lg shadow-sm focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none text-base"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
            >
              {loading ? "리서치 중…" : "리서치 실행"}
            </button>
          </div>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </section>

        {/* 리서치 결과 */}
        {results && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">리서치 결과</h2>
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-white border border-zinc-300 text-zinc-700 font-medium rounded-lg hover:bg-zinc-50 transition-colors text-sm"
              >
                PDF 다운로드
              </button>
            </div>

            <div className="space-y-8">
              {results.map((result, index) => (
                <div key={index} className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-zinc-900">
                      🔍 키워드: <span className="text-zinc-600">{result.keyword}</span>
                    </h3>
                    <span className="text-xs text-zinc-400">{result.trends.length}건</span>
                  </div>

                  <div className="space-y-4">
                    {result.trends.map((trend, i) => (
                      <div key={i} className="border-l-4 border-zinc-900 pl-4 py-1">
                        <h4 className="font-semibold text-zinc-900">{trend.name}</h4>
                        <p className="text-sm text-zinc-600 mt-1">핵심: {trend.core}</p>
                        <p className="text-sm text-zinc-500 italic mt-1">시사점: {trend.insight}</p>
                        {trend.source && (
                          <a href={trend.source} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-zinc-600 underline mt-2 inline-block">
                            출처
                          </a>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 표 */}
                  <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-zinc-600">
                      <thead className="text-xs text-zinc-400 uppercase bg-zinc-50 border-b border-zinc-200">
                        <tr>
                          <th className="px-4 py-2 font-medium">트렌드명</th>
                          <th className="px-4 py-2 font-medium">핵심 요약</th>
                          <th className="px-4 py-2 font-medium">시사점</th>
                          <th className="px-4 py-2 font-medium">출처</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.trends.map((trend, i) => (
                          <tr key={i} className="bg-white border-b border-zinc-100 hover:bg-zinc-50">
                            <td className="px-4 py-2 font-medium text-zinc-900">{trend.name}</td>
                            <td className="px-4 py-2">{trend.core}</td>
                            <td className="px-4 py-2">{trend.insight}</td>
                            <td className="px-4 py-2">
                              {trend.source ? (
                                <a href={trend.source} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-900 underline truncate max-w-[200px]">
                                  출처
                                </a>
                              ) : (
                                <span className="text-zinc-300">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
