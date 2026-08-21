import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import heroVideo from '@client/src/assets/hero-sunrise-timelapse.mp4';
import heroPoster from '@client/src/assets/hero-poster.jpg';

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: EASE_OUT_EXPO },
  },
};

const titleVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const lineReveal: Variants = {
  hidden: { y: '108%' },
  visible: {
    y: 0,
    transition: { duration: 1.05, ease: EASE_OUT_EXPO },
  },
};

const LINE_MASK_CLASS = 'block overflow-hidden pb-[0.12em] -mb-[0.12em]';

const HeroSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) video.pause();
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) video.pause();
      else void video.play();
    };
    motionQuery.addEventListener('change', handleChange);
    return () => motionQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <section className="relative h-[56vw] min-h-0 md:h-[85vh] md:min-h-[520px] overflow-hidden md:-mt-20">
      {/* 日照金山延时视频铺底 + 单层暗色遮罩（向左渐隐） */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          src={heroVideo}
          poster={heroPoster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="雪山日出延时摄影"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/35 to-transparent hidden md:block" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent md:hidden" />
      </div>

      {/* 左对齐编辑式内容 */}
      <motion.div
        className="absolute inset-x-0 bottom-0 px-4 pb-4 md:relative md:max-w-7xl md:mx-auto md:px-6 lg:px-8 md:h-full md:flex md:items-center md:pt-20 md:pb-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-2xl">
          {/* 大标题 */}
          <motion.h1
            variants={titleVariants}
            initial="hidden"
            animate="visible"
            className="font-display text-2xl md:text-7xl font-bold text-paper leading-[1.05] tracking-tight mb-3 md:mb-7"
          >
            <span className={LINE_MASK_CLASS}>
              <motion.span variants={lineReveal} className="block">
                探索
              </motion.span>
            </span>
            <span className={LINE_MASK_CLASS}>
              <motion.span variants={lineReveal} className="block">
                <span className="italic font-display-thin">中国</span> 最美的
              </motion.span>
            </span>
            <span className={LINE_MASK_CLASS}>
              <motion.span variants={lineReveal} className="block text-ember-400">
                山川湖海
              </motion.span>
            </span>
          </motion.h1>

          {/* 副文案 */}
          <motion.p
            variants={itemVariants}
            className="hidden md:block max-w-lg text-paper/75 text-lg leading-relaxed mb-10"
          >
            与数万名徒步爱好者一起，发现被遗忘的足迹，记录每一段行走的故事。从入门路线到极限挑战，总有一条路等你出发。
          </motion.p>

          {/* CTA */}
          <motion.div variants={itemVariants} className="flex flex-wrap gap-3 md:gap-4">
            <Link
              to="/routes"
              className="group relative inline-flex items-center gap-2 px-3 py-1.5 text-xs md:px-8 md:py-4 md:text-base bg-paper text-ink font-semibold rounded-lg shadow-lg shadow-ink/25 hover:bg-pine-100 transition-colors ease-out-expo after:absolute after:inset-x-4 after:bottom-1.5 md:after:inset-x-8 md:after:bottom-2.5 after:h-px after:origin-left after:scale-x-0 after:bg-ink/40 after:transition-transform after:duration-500 hover:after:scale-x-100"
            >
              探索路线
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform ease-out-expo"
              />
            </Link>
            <Link
              to="/forum"
              className="inline-flex items-center px-3 py-1.5 text-xs md:px-8 md:py-4 md:text-base border border-paper/35 text-paper font-medium rounded-lg hover:bg-paper/10 transition-colors"
            >
              进入论坛
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
