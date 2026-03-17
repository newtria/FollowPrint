"use client";

import { useCallback, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import type { CharacterResult } from "@/lib/character";

interface Props {
  result: CharacterResult;
  followerCount: number;
  followingCount: number;
  mutualRate: number;
}

export default function StoryCard({
  result,
  followerCount,
  followingCount,
  mutualRate,
}: Props) {
  const { t, lang } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generating, setGenerating] = useState(false);

  const formatHour = (h: number) => {
    if (lang === "ko") {
      return h < 12 ? `오전 ${h || 12}시` : `오후 ${h === 12 ? 12 : h - 12}시`;
    }
    return h < 12 ? `${h || 12} AM` : `${h === 12 ? 12 : h - 12} PM`;
  };

  const generateStory = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setGenerating(true);

    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#1e1033");
    bg.addColorStop(0.5, "#2d1b4e");
    bg.addColorStop(1, "#1a0e2e");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Decorative circles
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#a78bfa";
    ctx.beginPath();
    ctx.arc(850, 300, 400, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ec4899";
    ctx.beginPath();
    ctx.arc(200, 1500, 350, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Logo
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 42px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Followprint", W / 2, 120);

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "24px system-ui, -apple-system, sans-serif";
    ctx.fillText(
      lang === "ko" ? "나의 인스타 캐릭터" : "My Instagram Character",
      W / 2,
      170
    );

    // Character type badge
    const typeName = t(`character.types.${result.typeKey}.name`);
    const typeDesc = t(`character.types.${result.typeKey}.desc`);

    // Gradient card background
    const cardY = 240;
    const cardH = 320;
    const cardGrad = ctx.createLinearGradient(80, cardY, W - 80, cardY + cardH);
    cardGrad.addColorStop(0, "#7c3aed");
    cardGrad.addColorStop(1, "#ec4899");
    roundRect(ctx, 80, cardY, W - 160, cardH, 32);
    ctx.fillStyle = cardGrad;
    ctx.fill();

    // Rank letter
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = "bold 160px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(result.emoji, W / 2, cardY + 170);

    // Type name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 56px system-ui, -apple-system, sans-serif";
    ctx.fillText(typeName, W / 2, cardY + 240);

    // Type desc
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "26px system-ui, -apple-system, sans-serif";
    wrapText(ctx, typeDesc, W / 2, cardY + 290, W - 200, 34);

    // Score bars
    const scores = [
      { label: t("character.scores.social"), value: result.stats.socialScore, color: "#8b5cf6" },
      { label: t("character.scores.loyalty"), value: result.stats.loyaltyScore, color: "#22c55e" },
      { label: t("character.scores.curiosity"), value: result.stats.curiosityScore, color: "#f97316" },
      { label: t("character.scores.selectivity"), value: result.stats.selectivityScore, color: "#3b82f6" },
    ];

    let scoreY = 640;
    ctx.textAlign = "left";

    for (const score of scores) {
      // Label
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "26px system-ui, -apple-system, sans-serif";
      ctx.fillText(score.label, 100, scoreY);

      // Value
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
      ctx.fillText(String(score.value), W - 100, scoreY);
      ctx.textAlign = "left";

      // Bar background
      const barY = scoreY + 12;
      roundRect(ctx, 100, barY, W - 200, 16, 8);
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fill();

      // Bar fill
      const barWidth = ((W - 200) * score.value) / 100;
      if (barWidth > 0) {
        roundRect(ctx, 100, barY, barWidth, 16, 8);
        ctx.fillStyle = score.color;
        ctx.fill();
      }

      scoreY += 80;
    }

    // Stats boxes
    const boxY = 980;
    const boxW = (W - 240) / 2;

    // Box 1: Active hour
    roundRect(ctx, 100, boxY, boxW, 140, 20);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(formatHour(result.stats.activeHour), 100 + boxW / 2, boxY + 70);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "22px system-ui, -apple-system, sans-serif";
    ctx.fillText(t("character.activeTime"), 100 + boxW / 2, boxY + 110);

    // Box 2: Follows per month
    roundRect(ctx, 140 + boxW, boxY, boxW, 140, 20);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px system-ui, -apple-system, sans-serif";
    ctx.fillText(
      `${result.stats.followsPerMonth}/${lang === "ko" ? "월" : "mo"}`,
      140 + boxW + boxW / 2,
      boxY + 70
    );
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "22px system-ui, -apple-system, sans-serif";
    ctx.fillText(t("character.newFollows"), 140 + boxW + boxW / 2, boxY + 110);

    // Summary stats
    const summaryY = 1200;
    roundRect(ctx, 100, summaryY, W - 200, 100, 20);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();

    const statLabels = [
      { label: lang === "ko" ? "팔로워" : "Followers", value: String(followerCount) },
      { label: lang === "ko" ? "팔로잉" : "Following", value: String(followingCount) },
      { label: lang === "ko" ? "맞팔률" : "Mutuality", value: `${mutualRate}%` },
    ];

    const statW = (W - 200) / 3;
    statLabels.forEach((stat, i) => {
      const cx = 100 + statW * i + statW / 2;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(stat.value, cx, summaryY + 50);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "20px system-ui, -apple-system, sans-serif";
      ctx.fillText(stat.label, cx, summaryY + 80);
    });

    // Highlights
    if (result.highlights.length > 0) {
      const hlY = 1380;
      let hlX = W / 2;
      ctx.textAlign = "center";
      const tags = result.highlights.slice(0, 4).map((k) => t(k));
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "22px system-ui, -apple-system, sans-serif";
      ctx.fillText(tags.join("  ·  "), hlX, hlY);
    }

    // Bottom watermark
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "28px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("followprint.com", W / 2, H - 100);
    ctx.font = "20px system-ui, -apple-system, sans-serif";
    ctx.fillText(
      lang === "ko"
        ? "나도 분석해보기"
        : "Try yours too",
      W / 2,
      H - 60
    );

    // Download or share
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "followprint-story.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            text: lang === "ko"
              ? "나의 인스타 캐릭터 분석 결과! followprint.com"
              : "My Instagram character analysis! followprint.com",
          });
          setGenerating(false);
          return;
        } catch {
          // fallback to download
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "followprint-story.png";
      a.click();
      URL.revokeObjectURL(url);
      setGenerating(false);
    }, "image/png");
  }, [result, t, lang, followerCount, followingCount, mutualRate, formatHour]);

  return (
    <>
      <button
        onClick={generateStory}
        disabled={generating}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {generating
          ? lang === "ko" ? "생성 중..." : "Generating..."
          : lang === "ko" ? "스토리 카드 저장" : "Save Story Card"}
      </button>
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
}

// ── Canvas helpers ──

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split("");
  let line = "";
  let curY = y;

  for (const char of words) {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = char;
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, curY);
}
