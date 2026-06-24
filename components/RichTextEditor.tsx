"use dom";
import React, { useCallback, useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'numberedList'
  | 'checklist'
  | 'blockquote'
  | 'code'
  | 'divider';

interface Block {
  id: string;
  type: BlockType;
  html: string;
  checked?: boolean;
}

interface SlashMenu {
  blockId: string;
  x: number;
  y: number;
  query: string;
}

interface ActiveFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
}

interface InlineToolbarState {
  x: number;
  y: number;
  visible: boolean;
}

interface RichTextEditorProps {
  initialContent: string;
  onChange: (html: string) => void;
  textColor?: string;
  backgroundColor?: string;
  sizes?: {
    width?: number,
    height?: number
  };
  // Pass a new unique string each time to trigger a format command.
  // Inline formats: "bold", "italic", "underline", "strikeThrough", "hiliteColor:#ffe066"
  // Block type:     "blockType:paragraph", "blockType:heading1", "blockType:heading2",
  //                 "blockType:heading3", "blockType:bulletList", "blockType:numberedList",
  //                 "blockType:checklist", "blockType:blockquote", "blockType:code"
  // Append a ":timestamp" suffix to re-trigger the same command: "bold:1719230000"
  formatCommand?: string;
  // Callbacks — DOM pushes state back to RN so the native toolbar stays in sync
  onActiveFormatsChange?: (formats: { bold: boolean; italic: boolean; underline: boolean; strikethrough: boolean }) => void;
  onBlockTypeChange?: (type: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function serializeBlocks(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case 'paragraph': return `<p>${b.html}</p>`;
        case 'heading1': return `<h1>${b.html}</h1>`;
        case 'heading2': return `<h2>${b.html}</h2>`;
        case 'heading3': return `<h3>${b.html}</h3>`;
        case 'bulletList': return `<ul><li>${b.html}</li></ul>`;
        case 'numberedList': return `<ol><li>${b.html}</li></ol>`;
        case 'checklist': return `<div class="checklist-item" data-checked="${b.checked}"><input type="checkbox" ${b.checked ? 'checked' : ''}/><span>${b.html}</span></div>`;
        case 'blockquote': return `<blockquote>${b.html}</blockquote>`;
        case 'code': return `<pre><code>${b.html}</code></pre>`;
        case 'divider': return `<hr/>`;
        default: return `<p>${b.html}</p>`;
      }
    })
    .join('\n');
}

function parseInitialContent(html: string): Block[] {
  if (!html || !html.trim()) {
    return [{ id: uid(), type: 'paragraph', html: '' }];
  }
  return [{ id: uid(), type: 'paragraph', html }];
}

function getPlaceholder(type: BlockType, isFirst: boolean): string {
  switch (type) {
    case 'paragraph': return isFirst ? "Start writing, or type '/' for commands…" : "Type '/' for commands…";
    case 'heading1': return 'Heading 1';
    case 'heading2': return 'Heading 2';
    case 'heading3': return 'Heading 3';
    case 'bulletList': return 'List item';
    case 'numberedList': return 'List item';
    case 'checklist': return 'To-do item';
    case 'blockquote': return 'Quote something…';
    case 'code': return '// Write code here…';
    default: return '';
  }
}

// ─── Slash commands ───────────────────────────────────────────────────────────
const SLASH_COMMANDS = [
  { type: 'paragraph' as BlockType, label: 'Text', icon: '¶', desc: 'Plain paragraph' },
  { type: 'heading1' as BlockType, label: 'Heading 1', icon: 'H1', desc: 'Large section title' },
  { type: 'heading2' as BlockType, label: 'Heading 2', icon: 'H2', desc: 'Medium heading' },
  { type: 'heading3' as BlockType, label: 'Heading 3', icon: 'H3', desc: 'Small heading' },
  { type: 'bulletList' as BlockType, label: 'Bullet List', icon: '•', desc: 'Unordered list' },
  { type: 'numberedList' as BlockType, label: 'Numbered List', icon: '1.', desc: 'Ordered list' },
  { type: 'checklist' as BlockType, label: 'Checklist', icon: '☑', desc: 'To-do list' },
  { type: 'blockquote' as BlockType, label: 'Quote', icon: '"', desc: 'Blockquote' },
  { type: 'code' as BlockType, label: 'Code', icon: '<>', desc: 'Code block' },
  { type: 'divider' as BlockType, label: 'Divider', icon: '—', desc: 'Horizontal rule' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RichTextEditor({
  initialContent,
  onChange,
  textColor = '#1a1a2e',
  backgroundColor = '#ffffff',
  sizes,
  formatCommand,
  onActiveFormatsChange,
  onBlockTypeChange,
}: RichTextEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => parseInitialContent(initialContent));
  const [inlineToolbar, setInlineToolbar] = useState<InlineToolbarState>({ x: 0, y: 0, visible: false });
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>({ bold: false, italic: false, underline: false, strikethrough: false });
  const [slashMenu, setSlashMenu] = useState<SlashMenu | null>(null);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

  // blockRefs stores the live DOM elements; initializedRefs tracks which blocks already had innerHTML set
  const blockRefs = useRef<Record<string, HTMLElement | null>>({});
  const initializedRefs = useRef<Set<string>>(new Set());
  const savedRangeRef = useRef<Range | null>(null);

  const getSafeRange = useCallback(() => {
    const sel = window.getSelection();
    return sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
  }, []);

  const isDark = backgroundColor === '#000' || backgroundColor === '#1a1a2e' || backgroundColor === '#111' || backgroundColor === '#222';
  const tc = textColor;
  const bg = backgroundColor;
  const isLight = !isDark;
  const borderColor = isLight ? `${tc}22` : `${tc}33`;
  const surfaceColor = isLight ? `${tc}06` : `${tc}12`;
  const hoverColor = isLight ? `${tc}10` : `${tc}20`;
  const accentColor = '#6c63ff';

  // ─── Notify parent ─────────────────────────────────────────────────────────
  useEffect(() => {
    onChange(serializeBlocks(blocks));
  }, [blocks]);

  // ─── Report focused block type to RN parent ────────────────────────────────
  useEffect(() => {
    if (!onBlockTypeChange) return;
    if (!focusedBlockId) return;
    const block = blocks.find(b => b.id === focusedBlockId);
    if (block) onBlockTypeChange(block.type);
  }, [focusedBlockId, blocks]);

  // ─── Handle format commands sent from React Native ─────────────────────────
  // formatCommand is a string like "bold", "italic", "bold:1719230000"
  // Block type commands: "blockType:heading1", "blockType:paragraph", etc.
  // The optional trailing ":timestamp" (3rd segment) lets you re-send the same command.
  useEffect(() => {
    if (!formatCommand) return;
    // Parts: [command, arg?, timestamp?]
    const parts = formatCommand.split(':');
    const cmd = parts[0];
    if (!cmd) return;

    // ── Block-type command ──────────────────────────────────────────────────
    if (cmd === 'blockType') {
      const newType = parts[1] as BlockType | undefined;
      if (!newType) return;
      // Use the currently focused block (fallback: last block)
      const targetId = focusedBlockId ?? blocks[blocks.length - 1]?.id;
      if (targetId) {
        requestAnimationFrame(() => changeBlockType(targetId, newType));
      }
      return;
    }

    // ── Inline format command ───────────────────────────────────────────────
    const restoreAndApply = () => {
      if (savedRangeRef.current) {
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(savedRangeRef.current);
      }
      try {
        document.execCommand(cmd, false, undefined);
      } catch (_) { }
      // Refresh active format state after applying
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikethrough: document.queryCommandState('strikeThrough'),
      });
      // Sync block html back to state
      const sel = window.getSelection();
      if (sel?.focusNode) {
        let node: Node | null = sel.focusNode;
        while (node && !(node instanceof HTMLElement && (node as HTMLElement).dataset.blockId)) {
          node = node.parentElement;
        }
        if (node instanceof HTMLElement && node.dataset.blockId) {
          const bid = node.dataset.blockId;
          setBlocks(prev => prev.map(b => b.id === bid ? { ...b, html: (node as HTMLElement).innerHTML } : b));
        }
      }
    };

    // Use rAF to ensure the WebView has had a chance to process
    requestAnimationFrame(restoreAndApply);
  }, [formatCommand]);

  // ─── Focus a block ─────────────────────────────────────────────────────────
  const focusBlock = useCallback((id: string, toEnd = true) => {
    requestAnimationFrame(() => {
      const el = blockRefs.current[id];
      if (!el || el.getAttribute('contenteditable') !== 'true') return;
      el.focus();
      if (toEnd) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    });
  }, []);

  // ─── Sync active format state on every selection change ───────────────────
  const updateFormats = useCallback(() => {
    const formats = {
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikeThrough'),
    };
    setActiveFormats(formats);
    // Notify RN parent so native toolbar buttons reflect the real active state
    onActiveFormatsChange?.(formats);

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !sel.toString().trim()) {
      setInlineToolbar(t => ({ ...t, visible: false }));
      return;
    }
    const range = getSafeRange();
    if (!range) {
      setInlineToolbar(t => ({ ...t, visible: false }));
      return;
    }
    const rect = range.getBoundingClientRect();
    if (rect.width === 0) {
      setInlineToolbar(t => ({ ...t, visible: false }));
      return;
    }
    setInlineToolbar({ x: rect.left + rect.width / 2, y: rect.top + window.scrollY - 8, visible: true });
  }, [getSafeRange]);

  useEffect(() => {
    document.addEventListener('selectionchange', updateFormats);
    return () => document.removeEventListener('selectionchange', updateFormats);
  }, [updateFormats]);

  // ─── Ref callback — sets innerHTML ONLY on first mount (no cursor reset) ──
  const setBlockRef = useCallback((id: string, html: string) => (el: HTMLElement | null) => {
    blockRefs.current[id] = el;
    if (el && !initializedRefs.current.has(id)) {
      el.innerHTML = html;
      initializedRefs.current.add(id);
    }
  }, []);

  // When block TYPE changes we must re-sync the DOM content for that block
  // (the element may re-mount with a different tag)
  const syncBlockContent = useCallback((id: string, html: string) => {
    const el = blockRefs.current[id];
    if (el && el.innerHTML !== html) {
      // Only push if content really differs (e.g. after slash-command type change)
      el.innerHTML = html;
    }
  }, []);

  // ─── Input handler ─────────────────────────────────────────────────────────
  // We read the DOM directly here — never set dangerouslySetInnerHTML
  const handleBlockInput = useCallback((id: string, el: HTMLElement) => {
    const sel = window.getSelection();

    // Slash detection
    if (sel && sel.rangeCount > 0 && sel.focusNode) {
      const textBefore = sel.focusNode.textContent?.slice(0, sel.focusOffset) ?? '';
      const slashIdx = textBefore.lastIndexOf('/');
      if (
        slashIdx !== -1 &&
        (slashIdx === 0 || /\s/.test(textBefore[slashIdx - 1]))
      ) {
        const query = textBefore.slice(slashIdx + 1);
        if (!query.includes(' ') && query.length < 15) {
          const range = getSafeRange();
          if (range) {
            const cloned = range.cloneRange();
            cloned.collapse(true);
            const rect = cloned.getBoundingClientRect();
            setSlashMenu({ blockId: id, x: rect.left, y: rect.bottom + window.scrollY, query });
            // Save html in state for serialisation, but do NOT touch the DOM
            setBlocks(prev => prev.map(b => b.id === id ? { ...b, html: el.innerHTML } : b));
            return;
          }
        }
      }
    }

    setSlashMenu(null);
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, html: el.innerHTML } : b));
  }, [getSafeRange]);

  // ─── Keyboard handler ──────────────────────────────────────────────────────
  const handleBlockKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>, id: string) => {
    const blockIdx = blocks.findIndex(b => b.id === id);
    const block = blocks[blockIdx];
    if (!block) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      if (block.type === 'code') return;
      e.preventDefault();
      const nextType: BlockType =
        block.type === 'heading1' || block.type === 'heading2' || block.type === 'heading3' || block.type === 'divider'
          ? 'paragraph'
          : block.type;
      const nb: Block = { id: uid(), type: nextType, html: '' };
      setBlocks(prev => {
        const next = [...prev];
        next.splice(blockIdx + 1, 0, nb);
        return next;
      });
      setTimeout(() => focusBlock(nb.id, false), 20);
      return;
    }

    if (e.key === 'Backspace') {
      const el = blockRefs.current[id];
      const text = el?.textContent?.trim() ?? '';
      const html = el?.innerHTML?.replace(/<br\s*\/?>/gi, '').trim() ?? '';
      if (!text && !html && blocks.length > 1) {
        e.preventDefault();
        setSlashMenu(null);
        initializedRefs.current.delete(id);
        setBlocks(prev => prev.filter(b => b.id !== id));
        const target = blocks[blockIdx - 1] ?? blocks[blockIdx + 1];
        if (target) setTimeout(() => focusBlock(target.id), 20);
        return;
      }
    }

    if (e.key === 'ArrowUp' && blockIdx > 0) {
      const sel = window.getSelection();
      if (sel && sel.focusOffset === 0) {
        e.preventDefault();
        focusBlock(blocks[blockIdx - 1].id);
      }
    }
    if (e.key === 'ArrowDown' && blockIdx < blocks.length - 1) {
      const el = blockRefs.current[id];
      const textLen = el?.textContent?.length ?? 0;
      const sel = window.getSelection();
      if (sel && sel.focusOffset >= textLen) {
        e.preventDefault();
        focusBlock(blocks[blockIdx + 1].id, false);
      }
    }

    if (e.key === 'Escape') setSlashMenu(null);
  }, [blocks, slashMenu, focusBlock]);

  // ─── Apply inline format ───────────────────────────────────────────────────
  const applyFormat = useCallback((cmd: string, value?: string) => {
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRangeRef.current);
    }
    document.execCommand(cmd, false, value);

    // Sync the affected block's html in state (read from DOM)
    const sel = window.getSelection();
    if (sel?.focusNode) {
      let node: Node | null = sel.focusNode;
      while (node && !(node instanceof HTMLElement && node.dataset.blockId)) {
        node = node.parentElement;
      }
      if (node instanceof HTMLElement && node.dataset.blockId) {
        const bid = node.dataset.blockId;
        setBlocks(prev => prev.map(b => b.id === bid ? { ...b, html: node.innerHTML } : b));
      }
    }
    // Refresh active format indicators
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikeThrough'),
    });
  }, []);

  // ─── Change block type ─────────────────────────────────────────────────────
  const changeBlockType = useCallback((blockId: string, newType: BlockType) => {
    // Strip the slash + query text from the DOM before committing
    const el = blockRefs.current[blockId];
    let cleanHtml = '';
    if (el && slashMenu?.blockId === blockId) {
      const text = el.textContent ?? '';
      const slashPos = text.lastIndexOf('/');
      cleanHtml = slashPos !== -1 ? text.slice(0, slashPos) : text;
    } else if (el) {
      cleanHtml = el.innerHTML;
    }

    // Mark as uninitialized so the ref callback re-syncs innerHTML on re-mount
    initializedRefs.current.delete(blockId);

    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      if (newType === 'divider') return { ...b, type: newType, html: '' };
      return { ...b, type: newType, html: cleanHtml };
    }));
    setSlashMenu(null);
    setTimeout(() => focusBlock(blockId), 40);
  }, [slashMenu, focusBlock]);

  // ─── Toggle checklist ──────────────────────────────────────────────────────
  const toggleChecklist = useCallback((id: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, checked: !b.checked } : b));
  }, []);

  // ─── Add paragraph at end ──────────────────────────────────────────────────
  const addParagraphAtEnd = useCallback(() => {
    const last = blocks[blocks.length - 1];
    if (last?.type === 'paragraph' && !(last.html.trim())) {
      focusBlock(last.id);
      return;
    }
    const nb: Block = { id: uid(), type: 'paragraph', html: '' };
    setBlocks(prev => [...prev, nb]);
    setTimeout(() => focusBlock(nb.id, false), 20);
  }, [blocks, focusBlock]);

  // ─── Filtered slash commands ───────────────────────────────────────────────
  const filteredCmds = slashMenu
    ? SLASH_COMMANDS.filter(c =>
      c.label.toLowerCase().includes(slashMenu.query.toLowerCase()) ||
      c.desc.toLowerCase().includes(slashMenu.query.toLowerCase())
    )
    : SLASH_COMMANDS;

  // ─── Common editable props (no dangerouslySetInnerHTML) ───────────────────
  const editableProps = (block: Block, idx: number) => ({
    contentEditable: true as unknown as boolean,
    suppressContentEditableWarning: true,
    onInput: (e: React.FormEvent<HTMLElement>) => handleBlockInput(block.id, e.currentTarget),
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => handleBlockKeyDown(e, block.id),
    onKeyUp: () => { savedRangeRef.current = getSafeRange(); },
    onMouseUp: () => { savedRangeRef.current = getSafeRange(); },
    onTouchEnd: () => { savedRangeRef.current = getSafeRange(); },
    onFocus: () => {
      setFocusedBlockId(block.id);
      setSlashMenu(null);
    },
    onBlur: () => {
      // Save selection before blur so native buttons can restore it
      savedRangeRef.current = getSafeRange();
      const el = blockRefs.current[block.id];
      if (el) setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, html: el.innerHTML } : b));
    },
    'data-block-id': block.id,
    'data-placeholder': getPlaceholder(block.type, idx === 0),
  });

  // ─── Render a single block ─────────────────────────────────────────────────
  const renderBlock = (block: Block, idx: number) => {
    const ep = editableProps(block, idx);

    if (block.type === 'divider') {
      return (
        <div key={block.id} className="block-wrapper divider-wrapper">
          <hr className="divider-line" />
        </div>
      );
    }

    if (block.type === 'checklist') {
      return (
        <div key={block.id} className="block-wrapper">
          <div className="checklist-row">
            <button
              className={`check-btn ${block.checked ? 'checked' : ''}`}
              onMouseDown={e => { e.preventDefault(); toggleChecklist(block.id); }}
              onTouchStart={e => { e.preventDefault(); toggleChecklist(block.id); }}
              type="button"
            >
              {block.checked && <span>✓</span>}
            </button>
            <div
              ref={setBlockRef(block.id, block.html)}
              className={`block-content checklist-text ${block.checked ? 'checked-text' : ''}`}
              {...ep}
            />
          </div>
        </div>
      );
    }

    if (block.type === 'code') {
      return (
        <div key={block.id} className="block-wrapper code-wrapper">
          <pre className="code-block">
            <div
              ref={setBlockRef(block.id, block.html)}
              className="block-content code-content"
              {...ep}
            />
          </pre>
        </div>
      );
    }

    if (block.type === 'blockquote') {
      return (
        <div key={block.id} className="block-wrapper">
          <div className="quote-wrapper">
            <div className="quote-bar" />
            <div
              ref={setBlockRef(block.id, block.html)}
              className="block-content quote-content"
              {...ep}
            />
          </div>
        </div>
      );
    }

    // Bullet list
    if (block.type === 'bulletList') {
      return (
        <div key={block.id} className="block-wrapper bullet-block">
          <span className="list-bullet">•</span>
          <div
            ref={setBlockRef(block.id, block.html)}
            className="block-content paragraph"
            {...ep}
          />
        </div>
      );
    }

    // Numbered list
    if (block.type === 'numberedList') {
      const numIdx = blocks.filter((b, i) => b.type === 'numberedList' && i <= idx).length;
      return (
        <div key={block.id} className="block-wrapper numbered-block">
          <span className="list-number">{numIdx}.</span>
          <div
            ref={setBlockRef(block.id, block.html)}
            className="block-content paragraph"
            {...ep}
          />
        </div>
      );
    }

    // Headings & paragraph
    const tagMap: Partial<Record<BlockType, string>> = {
      paragraph: 'p',
      heading1: 'h1',
      heading2: 'h2',
      heading3: 'h3',
    };
    const Tag = (tagMap[block.type] ?? 'p') as any;
    return (
      <div key={block.id} className="block-wrapper">
        <Tag
          ref={setBlockRef(block.id, block.html) as any}
          className={`block-content ${block.type}`}
          {...(ep as any)}
        />
      </div>
    );
  };

  // ─── Toolbar button ────────────────────────────────────────────────────────
  const TbBtn = ({
    title, active, onMD, children, style,
  }: {
    title: string; active?: boolean;
    onMD: (e: React.MouseEvent | React.TouchEvent) => void;
    children: React.ReactNode;
    style?: React.CSSProperties;
  }) => (
    <button
      title={title}
      className={`tb-btn ${active ? 'tb-active' : ''}`}
      onMouseDown={e => { e.preventDefault(); onMD(e); }}
      onTouchStart={e => { e.preventDefault(); onMD(e); }}
      style={style}
    >
      {children}
    </button>
  );

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="editor-root"
      style={{ backgroundColor: bg, color: tc }}
      onClick={e => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('editor-root') || target.classList.contains('blocks-container')) {
          addParagraphAtEnd();
        }
      }}
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet" />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .editor-root {
          display: flex;
          flex-direction: column;
          min-height: 100%;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          font-size: 16px;
          line-height: 1.7;
          position: relative;
          width: ${sizes?.width ? sizes.width + "px" : "100%"};
          height: ${sizes?.height ? sizes.height + "px" : "100%"};
        }

        /* ── Toolbar ───────────────────────────────── */
        .toolbar {
          display: flex;
          align-items: center;
          flex-wrap: nowrap;
          gap: 4px;
          padding: 8px 12px;
          border-bottom: 1px solid ${borderColor};
          background: ${bg};
          position: sticky;
          top: 0;
          z-index: 50;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          flex-shrink: 0;
          width: 100%;
        }
        .toolbar::-webkit-scrollbar { display: none; }

        .tb-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 35px;
          height: 35px;
          padding: 0 8px;
          border: none;
          border-radius: 1px;
          background: transparent;
          color: ${tc};
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          transition: background 0.13s, color 0.13s, box-shadow 0.13s;
          white-space: nowrap;
          opacity: 0.65;
          flex-shrink: 0;
        }
        .tb-btn:hover {
          background: ${hoverColor};
          opacity: 1;
        }
        /* Active / toggled state */
        .tb-btn.tb-active {
          background: ${accentColor}22;
          color: ${accentColor};
          opacity: 1;
          box-shadow: inset 0 0 0 1.5px ${accentColor}55;
        }
        .tb-sep {
          width: 1px;
          height: 18px;
          background: ${borderColor};
          margin: 0 5px;
          flex-shrink: 0;
        }

        /* ── Blocks ────────────────────────────────── */
        .blocks-container {
          flex: 1;
          padding: 20px 20px 120px;
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-height: 300px;
        }

        .block-wrapper {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          border-radius: 8px;
          transition: background 0.15s;
        }
        .block-wrapper:hover { background: ${surfaceColor}; }

        /* ── Editable content ──────────────────────── */
        .block-content {
          flex: 1;
          outline: none;
          padding: 3px 6px;
          border-radius: 6px;
          min-height: 26px;
          word-break: break-word;
          caret-color: ${accentColor};
        }
        .block-content:empty::before {
          content: attr(data-placeholder);
          color: ${tc}80;
          pointer-events: none;
          font-style: italic;
        }
        .block-content.paragraph { font-size: 16px; }
        .block-content.heading1  { font-size: 1.95em; font-weight: 800; letter-spacing: -0.03em; line-height: 1.2; padding: 6px 6px 2px; }
        .block-content.heading2  { font-size: 1.45em; font-weight: 700; letter-spacing: -0.02em; line-height: 1.3; padding: 4px 6px 2px; }
        .block-content.heading3  { font-size: 1.15em; font-weight: 600; letter-spacing: -0.01em; line-height: 1.4; padding: 3px 6px 2px; }

        /* ── Lists ─────────────────────────────────── */
        .bullet-block, .numbered-block { padding-left: 6px; }
        .list-bullet, .list-number {
          flex-shrink: 0;
          width: 22px;
          padding-top: 5px;
          font-size: 14px;
          color: ${tc}80;
          font-weight: 600;
          text-align: center;
          user-select: none;
        }

        /* ── Checklist ─────────────────────────────── */
        .checklist-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          width: 100%;
          padding: 2px 6px;
        }
        .check-btn {
          flex-shrink: 0;
          width: 19px;
          height: 19px;
          border-radius: 5px;
          border: 2px solid ${tc}44;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: #fff;
          margin-top: 5px;
          transition: background 0.18s, border-color 0.18s;
          padding: 0;
        }
        .check-btn.checked { background: ${accentColor}; border-color: ${accentColor}; }
        .checklist-text { flex: 1; }
        .checked-text   { text-decoration: line-through; opacity: 0.48; }

        /* ── Blockquote ────────────────────────────── */
        .quote-wrapper { display: flex; gap: 12px; width: 100%; padding: 3px 6px; }
        .quote-bar { width: 3px; border-radius: 3px; background: ${accentColor}; flex-shrink: 0; min-height: 24px; }
        .quote-content { font-style: italic; color: ${tc}cc; }

        /* ── Code ──────────────────────────────────── */
        .code-wrapper { padding: 3px 6px; }
        .code-block {
          background: ${isLight ? '#f4f4f9' : '#1e1e2e'};
          border: 1px solid ${borderColor};
          border-radius: 10px;
          padding: 12px 14px;
          width: 100%;
          overflow-x: auto;
        }
        .code-content {
          font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.6;
          color: ${isLight ? '#3d3d6b' : '#cdd6f4'};
          white-space: pre-wrap;
          padding: 0;
          min-height: 20px;
        }

        /* ── Divider ───────────────────────────────── */
        .divider-wrapper { padding: 6px 0; }
        .divider-line { border: none; border-top: 2px solid ${borderColor}; margin: 0 6px; }

        /* ── Floating inline toolbar ───────────────── */
        .inline-toolbar {
          position: fixed;
          z-index: 200;
          display: flex;
          align-items: center;
          gap: 1px;
          padding: 5px 7px;
          background: ${isLight ? '#16172a' : '#f0f0ff'};
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.28), 0 1px 4px rgba(0,0,0,0.15);
          transform: translateX(-50%) translateY(-100%);
          animation: itPop 0.14s ease;
          pointer-events: all;
        }
        .inline-toolbar::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid ${isLight ? '#16172a' : '#f0f0ff'};
        }
        .it-btn {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 26px;
          border: none; border-radius: 6px;
          background: transparent;
          color: ${isLight ? '#e8e8ff' : '#16172a'};
          cursor: pointer; font-size: 13px; font-weight: 700;
          font-family: 'Inter', sans-serif;
          transition: background 0.12s;
        }
        .it-btn:hover { background: rgba(255,255,255,0.14); }
        .it-btn.it-active {
          background: ${accentColor};
          color: #fff;
        }
        .it-sep { width: 1px; height: 16px; background: rgba(255,255,255,0.18); margin: 0 2px; }

        /* ── Slash menu ────────────────────────────── */
        .slash-menu {
          position: fixed;
          z-index: 300;
          background: ${bg};
          border: 1px solid ${borderColor};
          border-radius: 14px;
          box-shadow: 0 10px 36px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.09);
          padding: 8px;
          min-width: 236px;
          max-height: 320px;
          overflow-y: auto;
          scrollbar-width: none;
          animation: itPop 0.14s ease;
        }
        .slash-menu::-webkit-scrollbar { display: none; }
        .slash-title {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: ${tc}55; padding: 4px 10px 8px;
        }
        .slash-item {
          display: flex; align-items: center; gap: 11px;
          padding: 8px 10px; border-radius: 9px; cursor: pointer;
          border: none; background: transparent; color: ${tc};
          width: 100%; text-align: left; transition: background 0.11s;
        }
        .slash-item:hover { background: ${hoverColor}; }
        .slash-icon {
          width: 30px; height: 30px; border-radius: 8px;
          background: ${accentColor}16; border: 1px solid ${accentColor}30;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: ${accentColor};
          flex-shrink: 0; font-family: 'Inter', sans-serif;
        }
        .slash-item-text { display: flex; flex-direction: column; }
        .slash-label { font-size: 13px; font-weight: 600; }
        .slash-desc  { font-size: 11px; color: ${tc}60; margin-top: 1px; }

        @keyframes itPop {
          from { opacity: 0; transform: translateX(-50%) translateY(calc(-100% - 6px)) scale(0.94); }
          to   { opacity: 1; transform: translateX(-50%) translateY(-100%) scale(1); }
        }

        /* ── Mobile responsiveness adjustments ────── */
        @media (max-width: 600px) {
          .blocks-container {
            padding: 12px 6px 100px;
          }
          .block-content.paragraph {
            font-size: 15px;
          }
          .block-content.heading1 { font-size: 1.6em; }
          .block-content.heading2 { font-size: 1.3em; }
          .block-content.heading3 { font-size: 1.1em; }
          .code-block {
            padding: 8px 10px;
          }
          .quote-wrapper {
            gap: 8px;
          }
          .slash-menu {
            min-width: 200px;
            max-width: calc(100vw - 20px);
          }
        }

        ::selection { background: ${accentColor}40; }
      `}</style>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}


      {/* ── Blocks ──────────────────────────────────────────────────────────── */}
      <div className="blocks-container">
        {blocks.map((block, idx) => renderBlock(block, idx))}
      </div>

      {/* ── Floating inline toolbar ──────────────────────────────────────────── */}
      {inlineToolbar.visible && (
        <div
          className="inline-toolbar"
          style={{ left: inlineToolbar.x, top: inlineToolbar.y }}
          onMouseDown={e => e.preventDefault()}
          onTouchStart={e => e.preventDefault()}
        >
          <button className={`it-btn ${activeFormats.bold ? 'it-active' : ''}`} title="Bold"
            onMouseDown={e => { e.preventDefault(); applyFormat('bold'); }}
            onTouchStart={e => { e.preventDefault(); applyFormat('bold'); }}><b>B</b></button>
          <button className={`it-btn ${activeFormats.italic ? 'it-active' : ''}`} title="Italic"
            onMouseDown={e => { e.preventDefault(); applyFormat('italic'); }}
            onTouchStart={e => { e.preventDefault(); applyFormat('italic'); }}><i>I</i></button>
          <button className={`it-btn ${activeFormats.underline ? 'it-active' : ''}`} title="Underline"
            onMouseDown={e => { e.preventDefault(); applyFormat('underline'); }}
            onTouchStart={e => { e.preventDefault(); applyFormat('underline'); }}><u>U</u></button>
          <button className={`it-btn ${activeFormats.strikethrough ? 'it-active' : ''}`} title="Strike"
            onMouseDown={e => { e.preventDefault(); applyFormat('strikeThrough'); }}
            onTouchStart={e => { e.preventDefault(); applyFormat('strikeThrough'); }}
            style={{ textDecoration: 'line-through', fontSize: 12 }}>S</button>
          <div className="it-sep" />
          <button className="it-btn" title="Highlight"
            onMouseDown={e => { e.preventDefault(); applyFormat('hiliteColor', '#ffe066'); }}
            onTouchStart={e => { e.preventDefault(); applyFormat('hiliteColor', '#ffe066'); }}
            style={{ fontSize: 14 }}>✦</button>
          <button className="it-btn" title="Link"
            onMouseDown={e => {
              e.preventDefault();
              const url = window.prompt('Enter URL:');
              if (url) applyFormat('createLink', url);
            }}
            onTouchStart={e => {
              e.preventDefault();
              const url = window.prompt('Enter URL:');
              if (url) applyFormat('createLink', url);
            }}>🔗</button>
        </div>
      )}

      {/* ── Slash menu ────────────────────────────────────────────────────────── */}
      {slashMenu && filteredCmds.length > 0 && (
        <div
          className="slash-menu"
          style={{
            left: Math.min(slashMenu.x, window.innerWidth - 252),
            top: slashMenu.y + 4,
          }}
          onMouseDown={e => e.preventDefault()}
          onTouchStart={e => e.preventDefault()}
        >
          <div className="slash-title">Block types</div>
          {filteredCmds.map(cmd => (
            <button
              key={cmd.type}
              className="slash-item"
              onMouseDown={e => { e.preventDefault(); changeBlockType(slashMenu.blockId, cmd.type); }}
              onTouchStart={e => { e.preventDefault(); changeBlockType(slashMenu.blockId, cmd.type); }}
            >
              <span className="slash-icon">{cmd.icon}</span>
              <span className="slash-item-text">
                <span className="slash-label">{cmd.label}</span>
                <span className="slash-desc">{cmd.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}



/**
 *  <div className="toolbar">
        <TbBtn title="Bold (⌘B)" active={activeFormats.bold}
          onMD={() => { savedRangeRef.current = getSafeRange(); applyFormat('bold'); }}>
          <b>B</b>
        </TbBtn>
        <TbBtn title="Italic (⌘I)" active={activeFormats.italic}
          onMD={() => { savedRangeRef.current = getSafeRange(); applyFormat('italic'); }}>
          <i>I</i>
        </TbBtn>
        <TbBtn title="Underline (⌘U)" active={activeFormats.underline}
          onMD={() => { savedRangeRef.current = getSafeRange(); applyFormat('underline'); }}>
          <u>U</u>
        </TbBtn>
        <TbBtn title="Strikethrough" active={activeFormats.strikethrough}
          onMD={() => { savedRangeRef.current = getSafeRange(); applyFormat('strikeThrough'); }}
          style={{ textDecoration: 'line-through' }}>
          S
        </TbBtn>
````
        <div className="tb-sep" />

     
        <TbBtn title="Heading 1" active={focusedBlockId !== null && blocks.find(b => b.id === focusedBlockId)?.type === 'heading1'}
          onMD={() => focusedBlockId && changeBlockType(focusedBlockId, 'heading1')}>H1</TbBtn>
        <TbBtn title="Heading 2" active={focusedBlockId !== null && blocks.find(b => b.id === focusedBlockId)?.type === 'heading2'}
          onMD={() => focusedBlockId && changeBlockType(focusedBlockId, 'heading2')}>H2</TbBtn>
        <TbBtn title="Heading 3" active={focusedBlockId !== null && blocks.find(b => b.id === focusedBlockId)?.type === 'heading3'}
          onMD={() => focusedBlockId && changeBlockType(focusedBlockId, 'heading3')}>H3</TbBtn>

        <div className="tb-sep" />

        <TbBtn title="Bullet list" active={focusedBlockId !== null && blocks.find(b => b.id === focusedBlockId)?.type === 'bulletList'}
          onMD={() => focusedBlockId && changeBlockType(focusedBlockId, 'bulletList')}>• List</TbBtn>
        <TbBtn title="Numbered list" active={focusedBlockId !== null && blocks.find(b => b.id === focusedBlockId)?.type === 'numberedList'}
          onMD={() => focusedBlockId && changeBlockType(focusedBlockId, 'numberedList')}>1. List</TbBtn>
        <TbBtn title="Checklist" active={focusedBlockId !== null && blocks.find(b => b.id === focusedBlockId)?.type === 'checklist'}
          onMD={() => focusedBlockId && changeBlockType(focusedBlockId, 'checklist')}>☑</TbBtn>

        <div className="tb-sep" />

        <TbBtn title="Quote" active={focusedBlockId !== null && blocks.find(b => b.id === focusedBlockId)?.type === 'blockquote'}
          onMD={() => focusedBlockId && changeBlockType(focusedBlockId, 'blockquote')}>"</TbBtn>
        <TbBtn title="Code block" active={focusedBlockId !== null && blocks.find(b => b.id === focusedBlockId)?.type === 'code'}
          onMD={() => focusedBlockId && changeBlockType(focusedBlockId, 'code')}>&lt;/&gt;</TbBtn>
        <TbBtn title="Divider"
          onMD={() => {
            if (!focusedBlockId) return;
            const idx = blocks.findIndex(b => b.id === focusedBlockId);
            const nb: Block = { id: uid(), type: 'divider', html: '' };
            setBlocks(prev => { const n = [...prev]; n.splice(idx + 1, 0, nb); return n; });
          }}>—</TbBtn>
      </div>
 * 
 * 
 * 
 */