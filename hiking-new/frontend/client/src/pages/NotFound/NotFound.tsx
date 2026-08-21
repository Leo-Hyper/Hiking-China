import { Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import TopoBackground from '@client/src/components/visual/TopoBackground';

const NotFound = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-paper px-6">
      <TopoBackground className="text-pine-200/70" />
      <div className="relative max-w-lg text-center">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card shadow-sm">
          <span className="font-data text-xl tracking-widest text-pine-700">404</span>
        </div>
        <p className="text-kicker uppercase text-ember-600">Off the map</p>
        <h1 className="mt-4 font-display text-xl md:text-h1 text-ink">此路不通</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          你走到了地图之外的地方。沿原路折返，从起点重新选择方向，
          或者去论坛看看其他人走过的路。
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-pine-700 px-4 py-2 md:px-5 md:py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-pine-800"
          >
            <ArrowLeft size={15} strokeWidth={2.25} />
            返回起点
          </Link>
          <Link
            to="/forum"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 md:px-5 md:py-2.5 text-sm font-medium text-ink transition-colors hover:border-pine-300 hover:bg-pine-50/50"
          >
            <MessageSquare size={15} strokeWidth={2} />
            去论坛看看
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
