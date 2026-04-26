import { useState, useEffect, useRef } from "react";

const TARGET_RATIO = 2 / 3; // width / height
export const COVER_RATIO_TOLERANCE = 0.25; // within 15% → object-cover, otherwise blur + contain

type CoverMode = "loading" | "cover" | "contain";

interface Props {
  src: string;
  alt?: string;
  /** When true, always zoom/fill regardless of aspect ratio. */
  forceFill?: boolean;
}

/**
 * Renders a game cover image inside the parent's container.
 * The parent must be `relative overflow-hidden` and sized appropriately.
 * Images within 15% of the 2:3 aspect ratio use object-cover; others get
 * a blurred background fill with the image contained.
 * Set forceFill to always use object-cover regardless of ratio.
 */
export default function GameCoverImage({ src, alt = "", forceFill = false }: Props) {
  const [mode, setMode] = useState<CoverMode>(forceFill ? "cover" : "loading");
  const imgRef = useRef<HTMLImageElement>(null);

  function checkRatio(img: HTMLImageElement) {
    if (forceFill) return;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      const ratio = img.naturalWidth / img.naturalHeight;
      const diff = Math.abs(ratio - TARGET_RATIO) / TARGET_RATIO;
      setMode(diff <= COVER_RATIO_TOLERANCE ? "cover" : "contain");
    }
  }

  // Handle already-cached images where onLoad may not fire
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) checkRatio(img);
  }, [src]);

  return (
    <>
      {mode === "contain" && (
        <div
          className="absolute inset-0 scale-110"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(18px)",
            opacity: 0.6,
          }}
        />
      )}
      {/* Starts invisible; fades in once we know the correct display mode */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={(e) => checkRatio(e.currentTarget)}
        className={`relative z-10 h-full w-full transition-opacity duration-200 ${
          mode === "loading" ? "opacity-0" : "opacity-100"
        } ${mode === "cover" ? "object-cover" : "object-contain"}`}
      />
    </>
  );
}
