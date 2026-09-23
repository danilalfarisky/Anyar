import { motion } from "motion/react";
import { Heart } from "lucide-react";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1731566971965-acfb1151fc34?crop=entropy&cs=srgb&fm=jpg&q=85";

export default function HeroWeddingBanner() {
  return (
    <section className="relative flex min-h-[58vh] items-center justify-center overflow-hidden">
      <img
        src={HERO_IMAGE}
        alt="Pasangan pengantin di bawah cahaya romantis"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(28,25,23,0.75) 0%, rgba(28,25,23,0.45) 60%, rgba(28,25,23,0.85) 100%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 mx-auto max-w-3xl px-6 py-20 text-center text-white"
      >
        <p className="text-xs font-medium uppercase" style={{ letterSpacing: "0.25em" }}>
          Galeri Foto Pernikahan
        </p>
        <h1 className="mt-6 font-heading text-4xl leading-tight sm:text-5xl lg:text-[56px]">
          Abadikan Setiap Detik <span className="gold-shimmer-text italic">Keindahan</span> &amp; Janji Suci
        </h1>
        <div className="mx-auto mt-7 flex items-center justify-center gap-3 text-[#DFB76C]">
          <span className="h-px w-12 bg-[#DFB76C]/60" />
          <Heart className="h-4 w-4" fill="currentColor" strokeWidth={1} />
          <span className="h-px w-12 bg-[#DFB76C]/60" />
        </div>
        <p className="mt-6 text-[#E7E5E4]">
          Pilih nama klien di bawah untuk menjelajahi momen bahagia hari besar mereka.
        </p>
      </motion.div>
    </section>
  );
}
