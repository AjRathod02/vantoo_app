"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const gallery = images.filter(Boolean);
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    setIndex(0);
  }, [images]);

  if (gallery.length === 0) return null;

  const current = gallery[index] ?? gallery[0]!;

  const prev = () => setIndex((i) => (i - 1 + gallery.length) % gallery.length);
  const next = () => setIndex((i) => (i + 1) % gallery.length);

  return (
    <>
      <div className="space-y-3">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-50">
          <Image
            src={current}
            alt={name}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="absolute bottom-3 right-3 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-ink shadow"
          >
            <span className="inline-flex items-center gap-1">
              <ZoomIn className="h-3.5 w-3.5" /> Preview
            </span>
          </button>
          {gallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow"
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow"
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
        {gallery.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {gallery.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2",
                  i === index ? "border-brand-primary" : "border-transparent"
                )}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4">
          <button
            type="button"
            onClick={() => {
              setFullscreen(false);
              setZoomed(false);
            }}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => setZoomed((z) => !z)} className="relative h-[80vh] w-full max-w-4xl">
            <Image
              src={current}
              alt={name}
              fill
              className={cn(
                "object-contain transition-transform",
                zoomed && "scale-150 cursor-zoom-out"
              )}
              sizes="100vw"
            />
          </button>
          {gallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
