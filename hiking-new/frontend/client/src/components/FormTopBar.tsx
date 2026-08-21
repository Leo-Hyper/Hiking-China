import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const FormTopBar = () => {
  const navigate = useNavigate();

  const handleBack = (): void => {
    const state = window.history.state as { idx?: number } | null;
    if (state && typeof state.idx === 'number' && state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-paper">
      <div className="mx-auto flex h-11 max-w-4xl items-center gap-2 px-6 md:h-14 lg:px-8">
        <button
          type="button"
          onClick={handleBack}
          title="返回"
          className="grid min-h-11 min-w-11 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>
        <span className="h-4 w-px bg-border" aria-hidden />
        <Link
          to="/"
          className="font-display text-sm font-bold tracking-tight text-ink transition-colors hover:text-pine-700"
        >
          徒步<span className="text-pine-700">中国</span>
        </Link>
      </div>
    </div>
  );
};

export default FormTopBar;
