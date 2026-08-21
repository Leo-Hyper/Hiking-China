import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const containerRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
  const quillRef: React.MutableRefObject<Quill | null> = useRef<Quill | null>(null);
  const onChangeRef: React.MutableRefObject<(html: string) => void> = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;
    const quill: Quill = new Quill(containerRef.current, {
      theme: 'snow',
      placeholder: placeholder || '开始撰写...',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'code-block'],
          ['link', 'image'],
          ['clean'],
        ],
      },
    });
    quillRef.current = quill;

    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value);
    }

    quill.on('text-change', () => {
      const html: string = quill.root.innerHTML;
      // Only emit if content actually changed (avoid empty <p><br></p> noise)
      const cleaned: string = html === '<p><br></p>' ? '' : html;
      onChangeRef.current(cleaned);
    });

    return () => {
      quillRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const quill: Quill | null = quillRef.current;
    if (!quill) return;
    const current: string = quill.root.innerHTML;
    const normalizedCurrent: string = current === '<p><br></p>' ? '' : current;
    if (value !== normalizedCurrent && value !== current) {
      quill.clipboard.dangerouslyPasteHTML(value || '');
    }
  }, [value]);

  return (
    <div className="rich-editor-wrapper overflow-hidden rounded-lg border border-border bg-card">
      <div ref={containerRef} className="quill-container" />
      <style>{`
        .quill-container { min-height: 300px; }
        .quill-container .ql-editor { min-height: 300px; font-size: 15px; line-height: 1.8; }
        .quill-container .ql-toolbar { border: none; border-bottom: 1px solid var(--border); background: color-mix(in oklab, var(--muted) 50%, transparent); }
        .quill-container .ql-container { border: none; font-family: inherit; color: var(--ink); background: var(--card); }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
