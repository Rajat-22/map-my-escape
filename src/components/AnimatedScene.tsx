/**
 * AnimatedScene
 *
 * Photographic hero backdrop: a real mountain-and-lake sunrise photograph with
 * animated atmosphere layered over it — drifting fog, a passing cloud shadow, a
 * breathing sun flare and floating mist particles.
 *
 * Why a photograph: vector paths and CSS gradients cannot read as "real".
 * Realism needs actual photographic data; the life then comes from atmosphere
 * and light moving across a still frame, the way a film matte shot works.
 *
 * Layers (back → front)
 *   1. <img>        real photograph, with a very slow Ken Burns drift
 *   2. grade        warm sunrise colour wash tied to the photo
 *   3. fog ×3       parallax fog banks drifting at different speeds
 *   4. cloudshadow  large soft dark blob crossing slowly (clouds overhead)
 *   5. flare        sun bloom that gently breathes
 *   6. mist         fine particles floating upward
 *   7. vignette     readability overlay for the headline
 *
 * Purely decorative: aria-hidden, pointer-events: none, and every animation is
 * disabled under `prefers-reduced-motion` (see globals.css).
 */

import Image from "next/image";
import "@/styles/animated-scene.css";

// Real high-resolution sunrise landscape (mountains, lake, forest, mist),
// served from the Unsplash CDN at an explicit width/quality.
const PHOTO =
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05" +
  "?auto=format&fit=crop&w=2400&q=80";

export default function AnimatedScene() {
  return (
    <div className="scene" aria-hidden="true">
      {/* 1. The real photograph, drifting almost imperceptibly.
             `fill` + `priority` so it is served optimised and starts
             downloading immediately (it is the hero's LCP element). */}
      <Image
        className="scene-photo"
        src={PHOTO}
        alt=""
        fill
        priority
        sizes="100vw"
      />

      {/* 2. Warm sunrise colour grade over the photo */}
      <div className="scene-grade" />

      {/* 3. Parallax fog banks drifting through the valley */}
      <div className="scene-fog scene-fog-1" />
      <div className="scene-fog scene-fog-2" />
      <div className="scene-fog scene-fog-3" />

      {/* 4. Soft cloud shadow sweeping across the land */}
      <div className="scene-cloudshadow" />

      {/* 5. Sun bloom breathing on the horizon */}
      <div className="scene-flare" />

      {/* 6. Fine mist particles rising */}
      <div className="scene-mist">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className={`mist mist-${(i % 7) + 1}`} />
        ))}
      </div>

      {/* 7. Readability overlay so the headline always reads */}
      <div className="scene-vignette" />
    </div>
  );
}
