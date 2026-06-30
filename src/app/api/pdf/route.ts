import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { ResearchResult } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { results } = await req.json();
    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: "결과 데이터가 필요합니다." }, { status: 400 });
    }

    const pdfDoc = await PDFDocument.create();
    const A4: [number, number] = [595.28, 841.89];
    const [bold, regular] = await Promise.all([
      pdfDoc.embedFont(StandardFonts.HelveticaBold),
      pdfDoc.embedFont(StandardFonts.Helvetica),
    ]);

    let page: any = pdfDoc.addPage(A4);
    let y = A4[1] - 60;

    // === 표지 ===
    y = A4[1] - 70;
    page.drawText("테크 트렌드 리서치 리포트", {
      font: bold, size: 24, color: rgb(0.1, 0.1, 0.1), x: 50, y,
    });
    y -= 20;
    page.drawText("키워드 기반 기술 트렌드 분석", {
      font: regular, size: 14, color: rgb(0.43, 0.43, 0.45), x: 50, y,
    });
    y -= 30;
    page.drawText(`생성일: ${new Date().toLocaleDateString("ko-KR")}`, {
      font: regular, size: 11, color: rgb(0.64, 0.65, 0.67), x: 50, y,
    });
    y -= 20;

    for (const result of results) {
      // 페이지 나누기
      if (y < 120) { page = pdfDoc.addPage(A4); y = A4[1] - 60; }

      // 키워드 헤더
      page.drawText(`🔍 키워드: ${result.keyword}`, {
        font: bold, size: 16, color: rgb(0.1, 0.1, 0.1), x: 50, y,
      });
      y -= 25;

      for (const trend of result.trends) {
        // 페이지 나누기
        if (y < 100) { page = pdfDoc.addPage(A4); y = A4[1] - 60; }

        page.drawText(trend.name, { font: bold, size: 12, color: rgb(0.1, 0.1, 0.1), x: 50, y });
        y -= 16;
        page.drawText(`핵심: ${truncate(trend.core, 60)}`, { font: regular, size: 10, color: rgb(0.33, 0.33, 0.34), x: 55, y });
        y -= 14;
        page.drawText(`시사점: ${truncate(trend.insight, 60)}`, { font: regular, size: 10, color: rgb(0.33, 0.33, 0.34), x: 55, y });
        y -= 14;
        if (trend.source) {
          try {
            page.drawText(`출처: ${new URL(trend.source).hostname}`, { font: regular, size: 9, color: rgb(0.06, 0.42, 0.82), x: 55, y });
          } catch {}
        }
        y -= 24;
      }

      y -= 10;
      if (y < 160) { page = pdfDoc.addPage(A4); y = A4[1] - 60; }

      // 표
      const colWidths = [130, 220, 140, 80];
      const rowH = 20;
      const startX = 45;

      // 표 헤더
      let hx = startX;
      const headers = ["트렌드명", "핵심 요약", "시사점", "출처"];
      for (let i = 0; i < headers.length; i++) {
        page.drawRectangle({
          x: hx, y: y - rowH, width: colWidths[i], height: rowH,
          color: rgb(0.93, 0.93, 0.94),
        });
        page.drawText(headers[i], {
          font: bold, size: 9, color: rgb(0.44, 0.45, 0.47),
          x: hx + 6, y: y - rowH + 6,
        });
        hx += colWidths[i];
      }

      // 표 행
      for (const trend of result.trends) {
        y -= rowH;
        let cx = startX;
        const hostname = trend.source ? (() => { try { return new URL(trend.source).hostname; } catch { return "–"; } })() : "–";
        const row = [
          truncate(trend.name, 28),
          truncate(trend.core, 45),
          truncate(trend.insight, 28),
          hostname,
        ];
        for (let i = 0; i < row.length; i++) {
          page.drawRectangle({
            x: cx, y, width: colWidths[i], height: rowH,
            color: rgb(0.97, 0.97, 0.98),
          });
          page.drawText(row[i], {
            font: regular, size: 8, color: rgb(0.33, 0.33, 0.34),
            x: cx + 5, y: y + 5,
          });
          cx += colWidths[i];
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="tech-trend-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}
