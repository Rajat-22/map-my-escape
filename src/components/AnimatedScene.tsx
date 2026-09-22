import Image from "next/image";
import "@/styles/animated-scene.css";

const PHOTO = "/hero-landscape.jpg";

export default function AnimatedScene() {
  return (
    <div className="scene" aria-hidden="true">
      <Image
        className="scene-photo"
        src={PHOTO}
        alt=""
        fill
        priority
        sizes="100vw"
      />

      <div className="scene-vignette" />
    </div>
  );
}
