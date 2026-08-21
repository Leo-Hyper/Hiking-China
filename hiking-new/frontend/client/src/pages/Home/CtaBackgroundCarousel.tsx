import { useEffect, useState } from 'react';
import { Image } from '@client/src/components/ui/image';
import { withBasePath } from '@client/src/utils/base-path';

const CTA_CAROUSEL_INTERVAL = 6000;

const CTA_CAROUSEL_IMAGES: { src: string; alt: string }[] = [
  { src: withBasePath('/img/张家界.png'), alt: '张家界石英砂岩峰林与蓝天白云' },
  { src: withBasePath('/img/贡嘎转山.png'), alt: '贡嘎雪山日照金山与湖面倒影' },
  { src: withBasePath('/img/云蒙山.jpg'), alt: '云蒙山云海缭绕的山脊与亭阁' },
  { src: withBasePath('/img/喀纳斯.jpg'), alt: '喀纳斯金秋白桦林与远山' },
];

const CtaBackgroundCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex(
        (prev: number) => (prev + 1) % CTA_CAROUSEL_IMAGES.length
      );
    }, CTA_CAROUSEL_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0">
      {CTA_CAROUSEL_IMAGES.map((image, index) => (
        <Image
          key={image.src}
          src={image.src}
          alt={image.alt}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1600ms] ease-out ${
            index === activeIndex ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/40 to-ink/15" />
      <div className="absolute bottom-5 right-6 flex items-center gap-2">
        {CTA_CAROUSEL_IMAGES.map((image, index) => (
          <button
            key={image.src}
            type="button"
            aria-label={`查看第 ${index + 1} 张背景图`}
            onClick={() => setActiveIndex(index)}
            className={`h-1 rounded-full transition-all duration-500 ${
              index === activeIndex
                ? 'w-6 bg-ember-400'
                : 'w-2 bg-paper/40 hover:bg-paper/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default CtaBackgroundCarousel;
