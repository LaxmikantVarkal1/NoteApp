"use dom";
import bgPatterns from '@/constants/bg';
import React, { useCallback, useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type BlockType =
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

export interface fontConfig {
  url: string;
  name: string;
}



export interface RichTextEditorProps {
  initialContent: string;
  onChange: (html: string) => void;
  textColor?: string;
  backgroundColor?: string;
  backgroundPattern?: string;
  sizes?: {
    width?: number;
    height?: number;
  };
  formatCommand?: string;
  onActiveFormatsChange?: (formats: { bold: boolean; italic: boolean; underline: boolean; strikethrough: boolean }) => void;
  onBlockTypeChange?: (type: string) => void;
  configs: {
    font: fontConfig;
  };
  readOnly?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function findMarkdownMatches(text: string) {
  // 1. Inline code: `code`
  const codeIndex = text.indexOf('`');
  if (codeIndex !== -1) {
    const nextCodeIndex = text.indexOf('`', codeIndex + 1);
    if (nextCodeIndex !== -1 && nextCodeIndex > codeIndex + 1) {
      return {
        type: 'code',
        start: codeIndex,
        end: nextCodeIndex + 1,
        content: text.substring(codeIndex + 1, nextCodeIndex)
      };
    }
  }

  // 2. Bold: **bold**
  const boldIndex = text.indexOf('**');
  if (boldIndex !== -1) {
    const nextBoldIndex = text.indexOf('**', boldIndex + 2);
    if (nextBoldIndex !== -1 && nextBoldIndex > boldIndex + 2) {
      return {
        type: 'bold',
        start: boldIndex,
        end: nextBoldIndex + 2,
        content: text.substring(boldIndex + 2, nextBoldIndex)
      };
    }
  }

  // 3. Italic: *italic*
  let italicIndex = text.indexOf('*');
  while (italicIndex !== -1) {
    // Ensure boundary is not adjacent to another asterisk
    if (text[italicIndex + 1] === '*' || (italicIndex > 0 && text[italicIndex - 1] === '*')) {
      italicIndex = text.indexOf('*', italicIndex + 1);
      continue;
    }

    let nextItalicIndex = text.indexOf('*', italicIndex + 1);
    while (nextItalicIndex !== -1) {
      if (text[nextItalicIndex + 1] === '*' || text[nextItalicIndex - 1] === '*') {
        nextItalicIndex = text.indexOf('*', nextItalicIndex + 1);
        continue;
      }
      return {
        type: 'italic',
        start: italicIndex,
        end: nextItalicIndex + 1,
        content: text.substring(italicIndex + 1, nextItalicIndex)
      };
    }
    italicIndex = text.indexOf('*', italicIndex + 1);
  }

  return null;
}

function convertBlockToChecklist(blockNode: HTMLElement) {
  if (blockNode.classList.contains('checklist-item')) return;

  const checklistItem = document.createElement('div');
  checklistItem.className = 'checklist-item';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.setAttribute('contenteditable', 'false');
  checklistItem.appendChild(checkbox);

  const textSpan = document.createElement('span');
  textSpan.className = 'checklist-text';

  while (blockNode.firstChild) {
    textSpan.appendChild(blockNode.firstChild);
  }
  checklistItem.appendChild(textSpan);

  blockNode.parentNode!.replaceChild(checklistItem, blockNode);

  const selection = window.getSelection();
  if (selection) {
    const range = document.createRange();
    range.selectNodeContents(textSpan);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

function convertChecklistToParagraph(checklistNode: HTMLElement) {
  const p = document.createElement('p');
  const textSpan = checklistNode.querySelector('.checklist-text');
  if (textSpan) {
    while (textSpan.firstChild) {
      p.appendChild(textSpan.firstChild);
    }
  } else {
    while (checklistNode.firstChild) {
      if (checklistNode.firstChild.nodeName !== 'INPUT') {
        p.appendChild(checklistNode.firstChild);
      } else {
        checklistNode.removeChild(checklistNode.firstChild);
      }
    }
  }
  checklistNode.parentNode!.replaceChild(p, checklistNode);

  const selection = window.getSelection();
  if (selection) {
    const range = document.createRange();
    range.selectNodeContents(p);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

function getCleanHTML(editorEl: HTMLElement | null): string {
  if (!editorEl) return '';
  const clone = editorEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.checklist-delete-btn').forEach((btn) => btn.remove());
  clone.querySelectorAll('.checklist-add-row').forEach((row) => row.remove());
  return clone.innerHTML;
}

function insertAddRowAfter(targetItem: HTMLElement) {
  const addRow = document.createElement('div');
  addRow.className = 'checklist-add-row';
  addRow.setAttribute('contenteditable', 'false');

  addRow.innerHTML = `
    <span class="plus-icon">+</span>
    <span class="placeholder-text">List item</span>
  `;
  targetItem.parentNode!.insertBefore(addRow, targetItem.nextSibling);
}

function enhanceChecklists(editorEl: HTMLElement, backgroundColor: any) {
  // 1. Ensure all checklist items have a delete button
  const items = editorEl.querySelectorAll('.checklist-item');
  items.forEach((item) => {
    if (!item.querySelector('.checklist-delete-btn')) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'checklist-delete-btn';
      deleteBtn.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg"
     width="16"
     height="16"
     viewBox="0 0 24 24"
     fill="none"
     stroke="#3a3a3af0"
     stroke-width="2"
     stroke-linecap="round"
     stroke-linejoin="round">
  <path d="M18 6 6 18"/>
  <path d="m6 6 12 12"/>
</svg>
`;
      deleteBtn.setAttribute('contenteditable', 'false');
      item.appendChild(deleteBtn);
    }
  });

  // 2. Remove all existing add-item rows first to recalculate groups cleanly
  editorEl.querySelectorAll('.checklist-add-row').forEach((row) => row.remove());

  // 3. Find groups of adjacent checklist items and insert a checklist-add-row after each group
  let currentGroup: HTMLElement[] = [];
  const children = Array.from(editorEl.children) as HTMLElement[];

  children.forEach((child) => {
    if (child.classList.contains('checklist-item')) {
      currentGroup.push(child);
    } else {
      if (currentGroup.length > 0) {
        insertAddRowAfter(currentGroup[currentGroup.length - 1]);
        currentGroup = [];
      }
    }
  });

  if (currentGroup.length > 0) {
    insertAddRowAfter(currentGroup[currentGroup.length - 1]);
  }
}

function getCurrentBlockType(editorEl: HTMLElement): BlockType {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 'paragraph';

  let node = selection.getRangeAt(0).startContainer;
  let blockNode: Node | null = node;

  while (blockNode && blockNode !== editorEl) {
    if (blockNode.nodeType === Node.ELEMENT_NODE) {
      const el = blockNode as HTMLElement;
      if (el.classList.contains('checklist-item')) {
        return 'checklist';
      }
      const tagName = el.tagName;
      if (tagName === 'H1') return 'heading1';
      if (tagName === 'H2') return 'heading2';
      if (tagName === 'H3') return 'heading3';
      if (tagName === 'BLOCKQUOTE') return 'blockquote';
      if (tagName === 'PRE') return 'code';
      if (tagName === 'LI') {
        const parentTag = el.parentElement?.tagName;
        if (parentTag === 'OL') return 'numberedList';
        return 'bulletList';
      }
    }
    blockNode = blockNode.parentNode;
  }
  return 'paragraph';
}

function handleInlineMarkdown(node: Text, selection: Selection) {
  const text = node.nodeValue || '';
  const match = findMarkdownMatches(text);
  if (!match) return;

  const parent = node.parentNode;
  if (!parent) return;

  const beforeText = text.substring(0, match.start);
  const afterText = text.substring(match.end);

  let newElement: HTMLElement;
  if (match.type === 'bold') {
    newElement = document.createElement('strong');
    newElement.textContent = match.content;
  } else if (match.type === 'italic') {
    newElement = document.createElement('em');
    newElement.textContent = match.content;
  } else {
    newElement = document.createElement('code');
    newElement.textContent = match.content;
  }

  const nextSibling = node.nextSibling;
  parent.removeChild(node);

  if (beforeText) {
    const beforeNode = document.createTextNode(beforeText);
    parent.insertBefore(beforeNode, nextSibling);
  }

  parent.insertBefore(newElement, nextSibling);

  const afterNode = document.createTextNode(afterText || ' ');
  parent.insertBefore(afterNode, nextSibling);

  const range = document.createRange();
  range.setStart(afterNode, afterText ? 0 : 1);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function handleBlockMarkdown(blockNode: HTMLElement, selection: Selection) {
  if (selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  if (!range.collapsed) return;

  const cursorNode = range.startContainer;
  if (cursorNode.nodeType !== Node.TEXT_NODE) return;

  const textNode = cursorNode as Text;
  const textValue = textNode.nodeValue || '';
  const caretOffset = range.startOffset;

  if (blockNode.firstChild !== textNode && !blockNode.contains(textNode)) return;

  const textBeforeCursor = textValue.substring(0, caretOffset);

  // 1. Heading 1: starts with "# " or "#\u00A0"
  if (/^#[\s\u00A0]$/.test(textBeforeCursor)) {
    textNode.nodeValue = textValue.substring(caretOffset);
    document.execCommand('formatBlock', false, 'H1');
    return;
  }

  // 2. Heading 2: starts with "## " or "##\u00A0"
  if (/^##[\s\u00A0]$/.test(textBeforeCursor)) {
    textNode.nodeValue = textValue.substring(caretOffset);
    document.execCommand('formatBlock', false, 'H2');
    return;
  }

  // 3. Heading 3: starts with "### " or "###\u00A0"
  if (/^###[\s\u00A0]$/.test(textBeforeCursor)) {
    textNode.nodeValue = textValue.substring(caretOffset);
    document.execCommand('formatBlock', false, 'H3');
    return;
  }

  // 4. Quote: starts with "> " or ">\u00A0"
  if (/^>[\s\u00A0]$/.test(textBeforeCursor)) {
    textNode.nodeValue = textValue.substring(caretOffset);
    document.execCommand('formatBlock', false, 'blockquote');
    return;
  }

  // 5. Bullet list: starts with "- " or "* " or their non-breaking space variants
  if (/^[-*][\s\u00A0]$/.test(textBeforeCursor)) {
    textNode.nodeValue = textValue.substring(caretOffset);
    document.execCommand('insertUnorderedList');
    return;
  }

  // 6. Numbered list: starts with "1. " or "1.\u00A0"
  if (/^1\.[\s\u00A0]$/.test(textBeforeCursor)) {
    textNode.nodeValue = textValue.substring(caretOffset);
    document.execCommand('insertOrderedList');
    return;
  }

  // 7. Divider: starts with "---"
  if (/^---$/.test(textBeforeCursor)) {
    textNode.nodeValue = textValue.substring(caretOffset);
    const hr = document.createElement('hr');
    hr.setAttribute('contenteditable', 'false');
    const p = document.createElement('p');
    p.innerHTML = '<br>';

    const parent = blockNode.parentNode!;
    parent.replaceChild(hr, blockNode);
    parent.insertBefore(p, hr.nextSibling);

    const newRange = document.createRange();
    newRange.selectNodeContents(p);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    return;
  }

  // 8. Code block: starts with "```"
  if (/^```[\s\u00A0]?$/.test(textBeforeCursor)) {
    textNode.nodeValue = textValue.substring(caretOffset);
    document.execCommand('formatBlock', false, 'pre');
    return;
  }

  // 9. Checklist: starts with "[] ", "[ ] ", "- [] ", "- [ ] "
  if (/^(?:-\s*)?\[\s*\][\s\u00A0]$|^(?:-\s*)?\[\][\s\u00A0]$/.test(textBeforeCursor)) {
    textNode.nodeValue = textValue.substring(caretOffset);
    convertBlockToChecklist(blockNode);
    return;
  }
}

function svgToBackgroundImage(svg?: string) {
  if (!svg) return 'none';
  if (svg.startsWith('url(')) return svg;
  if (svg.startsWith('data:')) return `url("${svg}")`;

  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RichTextEditor({
  initialContent,
  onChange,
  textColor = '#1a1a2e',
  backgroundColor = '#ffffff',
  backgroundPattern = '',
  sizes,
  formatCommand,
  onActiveFormatsChange,
  onBlockTypeChange,
  configs,
  readOnly = false
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const isInitialized = useRef(false);
  const savedRangeRef = useRef<Range | null>(null);
  const [loading, setLoading] = useState(true);

  const getSafeRange = useCallback(() => {
    const sel = window.getSelection();
    return sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
  }, []);

  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      enhanceChecklists(editorRef.current, backgroundColor);
      onChange(getCleanHTML(editorRef.current));
    }
  }, [onChange]);

  const isDark = backgroundColor === '#000' || backgroundColor === '#1a1a2e' || backgroundColor === '#111' || backgroundColor === '#222';
  const tc = textColor;
  let bg = backgroundColor;
  // const patternBg = svgToBackgroundImage(backgroundPattern);
  const isLight = !isDark;
  const borderColor = isLight ? '#0000002e' : '#fffdfd1d';
  const accentColor = '#edecf31e';

  // ─── Initialize Editor Content ─────────────────────────────────────────────
  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      editorRef.current.innerHTML = initialContent || '<p><br></p>';
      enhanceChecklists(editorRef.current, backgroundColor);
      isInitialized.current = true;
      setLoading(false);
    }
  }, [initialContent]);

  // ─── Format State Sync ─────────────────────────────────────────────────────
  const updateFormats = useCallback(() => {
    const formats = {
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikeThrough'),
    };
    onActiveFormatsChange?.(formats);

    if (editorRef.current) {
      const blockType = getCurrentBlockType(editorRef.current);
      onBlockTypeChange?.(blockType);
    }
  }, [onActiveFormatsChange, onBlockTypeChange]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const range = getSafeRange();
      if (range && editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range;
      }
      updateFormats();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [getSafeRange, updateFormats]);

  // ─── Format Command Listener ───────────────────────────────────────────────
  useEffect(() => {
    if (!formatCommand) return;
    const parts = formatCommand.split(':');
    const cmd = parts[0];
    if (!cmd) return;

    if (cmd === 'blockType') {
      const newType = parts[1] as BlockType | undefined;
      if (!newType) return;

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const node = selection.getRangeAt(0).startContainer;
        let blockNode: Node | null = node;
        const editorEl = editorRef.current;

        if (editorEl) {
          while (blockNode && blockNode !== editorEl) {
            if (blockNode.nodeType === Node.ELEMENT_NODE) {
              const tagName = (blockNode as HTMLElement).tagName;
              if (['P', 'H1', 'H2', 'H3', 'LI', 'BLOCKQUOTE', 'PRE', 'DIV'].includes(tagName)) {
                break;
              }
            }
            blockNode = blockNode.parentNode;
          }

          if (blockNode && blockNode !== editorEl) {
            const el = blockNode as HTMLElement;
            if (newType === 'heading1') {
              if (el.classList.contains('checklist-item')) convertChecklistToParagraph(el);
              document.execCommand('formatBlock', false, 'H1');
            } else if (newType === 'heading2') {
              if (el.classList.contains('checklist-item')) convertChecklistToParagraph(el);
              document.execCommand('formatBlock', false, 'H2');
            } else if (newType === 'heading3') {
              if (el.classList.contains('checklist-item')) convertChecklistToParagraph(el);
              document.execCommand('formatBlock', false, 'H3');
            } else if (newType === 'paragraph') {
              if (el.classList.contains('checklist-item')) {
                convertChecklistToParagraph(el);
              } else {
                document.execCommand('formatBlock', false, 'P');
              }
            } else if (newType === 'bulletList') {
              if (el.classList.contains('checklist-item')) convertChecklistToParagraph(el);
              document.execCommand('insertUnorderedList');
            } else if (newType === 'numberedList') {
              if (el.classList.contains('checklist-item')) convertChecklistToParagraph(el);
              document.execCommand('insertOrderedList');
            } else if (newType === 'blockquote') {
              if (el.classList.contains('checklist-item')) convertChecklistToParagraph(el);
              document.execCommand('formatBlock', false, 'blockquote');
            } else if (newType === 'code') {
              if (el.classList.contains('checklist-item')) convertChecklistToParagraph(el);
              document.execCommand('formatBlock', false, 'pre');
            } else if (newType === 'checklist') {
              if (el.classList.contains('checklist-item')) {
                convertChecklistToParagraph(el);
              } else {
                convertBlockToChecklist(el);
              }
            }
          }
        }
      }

      handleContentChange();
      return;
    }

    if (editorRef.current) {
      if (cmd === 'bg') {
        const color = parts[1];
        editorRef.current.style.backgroundColor = color
      }

      if (cmd === 'pattern') {
        const activeBackgroundPattern = bgPatterns.find((pattern) => pattern.id === parts[1])?.svg || '';
        editorRef.current.style.backgroundImage = svgToBackgroundImage(activeBackgroundPattern);
      }

      editorRef.current.focus();
    }
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRangeRef.current);
    }
    try {
      document.execCommand(cmd, false, undefined);
    } catch (_) { }

    updateFormats();

    handleContentChange();
  }, [formatCommand, handleContentChange, updateFormats]);

  const scrollCursorIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !editorRef.current) return;

      const range = sel.getRangeAt(0);
      if (!range.collapsed) return;

      const tempSpan = document.createElement("span");
      tempSpan.textContent = "\u200b";
      range.insertNode(tempSpan);

      const spanRect = tempSpan.getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();

      const currentScroll = editorRef.current.scrollTop;

      if (spanRect.bottom > editorRect.bottom - 30) {
        editorRef.current.scrollTo({
          top: currentScroll + (spanRect.bottom - editorRect.bottom + 30),
          behavior: "smooth",
        });
      } else if (spanRect.top < editorRect.top + 10) {
        editorRef.current.scrollTo({
          top: currentScroll - (editorRect.top - spanRect.top + 30),
          behavior: "smooth",
        });
      }

      tempSpan.remove();
      editorRef.current.normalize();
    });
  }, []);

  // Listen for viewport resize (keyboard open/close triggers this in WebView)
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        scrollCursorIntoView();
      }, 10);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [scrollCursorIntoView]);

  // ─── Input handler (Markdown Shortcuts) ───────────────────────────────────
  const handleEditorInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const el = e.currentTarget;

    // Safety fallback: if editor content is completely deleted, maintain paragraph structure
    if (!el.innerHTML || el.innerHTML === '<br>' || el.innerHTML === '<div><br></div>') {
      el.innerHTML = '<p><br></p>';
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(el.firstChild!);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const node = range.startContainer;

      // 1. Handle Inline Markdown Shortcuts
      if (node.nodeType === Node.TEXT_NODE) {
        handleInlineMarkdown(node as Text, selection);
      }

      // 2. Handle Block-level Markdown Shortcuts
      let blockNode: Node | null = node;
      while (blockNode && blockNode !== el) {
        if (blockNode.nodeType === Node.ELEMENT_NODE) {
          const tagName = (blockNode as HTMLElement).tagName;
          if (['P', 'H1', 'H2', 'H3', 'LI', 'BLOCKQUOTE', 'PRE', 'DIV'].includes(tagName)) {
            break;
          }
        }
        blockNode = blockNode.parentNode;
      }

      if (blockNode && blockNode !== el) {
        handleBlockMarkdown(blockNode as HTMLElement, selection);
      }
    }

    handleContentChange();
    scrollCursorIntoView();
  }, [handleContentChange, scrollCursorIntoView]);

  // ─── KeyDown events ────────────────────────────────────────────────────────
  const handleEditorKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);

    // ── Handle Enter Key ──
    if (e.key === 'Enter') {
      const node = range.startContainer;
      const checklistItem =
        node.nodeType === Node.ELEMENT_NODE
          ? (node as HTMLElement).closest('.checklist-item')
          : node.parentElement?.closest('.checklist-item');

      if (checklistItem) {
        e.preventDefault();

        const p = document.createElement('p');
        p.innerHTML = '<br>';

        checklistItem.parentNode?.insertBefore(p, checklistItem.nextSibling);

        // Move cursor into the new paragraph
        const newRange = document.createRange();
        newRange.selectNodeContents(p);
        newRange.collapse(true);

        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(newRange);

        handleContentChange();
        scrollCursorIntoView();
        return;
      }
    }

    // ── Handle Backspace Key ──
    if (e.key === 'Backspace' && range.collapsed && range.startOffset === 0) {
      const node = range.startContainer;
      let isAtStartOfBlock = false;
      let blockNode: Node | null = node;
      const editorEl = editorRef.current;

      if (editorEl) {
        while (blockNode && blockNode !== editorEl) {
          if (blockNode.nodeType === Node.ELEMENT_NODE) {
            const el = blockNode as HTMLElement;
            if (['P', 'H1', 'H2', 'H3', 'LI', 'BLOCKQUOTE', 'PRE', 'DIV'].includes(el.tagName) || el.classList.contains('checklist-item')) {
              break;
            }
          }
          blockNode = blockNode.parentNode;
        }

        if (blockNode && blockNode !== editorEl) {
          const checkRange = document.createRange();
          checkRange.setStartBefore(blockNode.firstChild || blockNode);
          checkRange.setEnd(range.startContainer, range.startOffset);
          if (checkRange.toString().trim() === '') {
            isAtStartOfBlock = true;
          }
        }
      }

      if (isAtStartOfBlock && blockNode) {
        const el = blockNode as HTMLElement;
        if (el.classList.contains('checklist-item')) {
          e.preventDefault();
          convertChecklistToParagraph(el);
          handleContentChange();
          return;
        }

        const tagName = el.tagName;
        if (['H1', 'H2', 'H3', 'BLOCKQUOTE', 'PRE'].includes(tagName)) {
          e.preventDefault();
          document.execCommand('formatBlock', false, 'P');
          handleContentChange();
          return;
        }
      }
    }

    // Scroll cursor into view after any key that might move it
    scrollCursorIntoView();
  }, [handleContentChange, scrollCursorIntoView]);

  // ─── Click handler (Checkbox Toggles, Delete, Add Row) ─────────────────────
  const handleEditorClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // 1. Checkbox toggle
    if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
      const checkbox = target as HTMLInputElement;
      const checklistItem = checkbox.closest('.checklist-item');
      if (checklistItem) {
        if (checkbox.checked) {
          checkbox.setAttribute('checked', 'true');
          checklistItem.classList.add('checked');
        } else {
          checkbox.removeAttribute('checked');
          checklistItem.classList.remove('checked');
        }
        handleContentChange();
      }
      return;
    }

    // 2. Delete button click
    if (target.classList.contains('checklist-delete-btn') || target.closest('.checklist-delete-btn')) {
      const btn = target.classList.contains('checklist-delete-btn') ? target : target.closest('.checklist-delete-btn')!;
      const checklistItem = btn.closest('.checklist-item');
      if (checklistItem) {
        checklistItem.remove();
        handleContentChange();
      }
      return;
    }

    // 3. "+ List item" add-row click
    if (target.classList.contains('checklist-add-row') || target.closest('.checklist-add-row')) {
      const addRow = target.classList.contains('checklist-add-row') ? target : target.closest('.checklist-add-row')!;
      const editorEl = editorRef.current;
      if (!editorEl) return;

      // Create a new checklist item
      const newItem = document.createElement('div');
      newItem.className = 'checklist-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.setAttribute('contenteditable', 'false');
      newItem.appendChild(checkbox);

      const textSpan = document.createElement('span');
      textSpan.className = 'checklist-text';
      textSpan.innerHTML = '<br>';
      newItem.appendChild(textSpan);

      // Insert before the add-row
      addRow.parentNode!.insertBefore(newItem, addRow);

      // Focus the new item
      const sel = window.getSelection();
      if (sel) {
        const range = document.createRange();
        range.selectNodeContents(textSpan);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }

      handleContentChange();
      return;
    }
  }, [handleContentChange]);

  // ─── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div
      className="editor-root"
      style={{
        //backgroundColor: bg,
        //backgroundImage: patternBg,
        backgroundRepeat: 'repeat',
        color: tc,
      }}
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet" />

      {loading && (
        <div className="loader-bar">
          <div className="loader-bar-value" />
        </div>
      )}

      <style>{`
        @import url(${configs?.font?.url});

        .loader-bar {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background-color: transparent;
          overflow: hidden;
          z-index: 10000;
        }

        .loader-bar-value {
          width: 100%;
          height: 100%;
          background-color: ${accentColor};
          animation: loader-indeterminate 1.5s infinite linear;
          transform-origin: 0% 50%;
        }

        @keyframes loader-indeterminate {
          0% { transform: translateX(-100%) scaleX(1); }
          50% { transform: translateX(-30%) scaleX(0.4); }
          100% { transform: translateX(100%) scaleX(1); }
        }

        *, *::before, *::after { 
          font-family: "${configs?.font?.name}", sans-serif;
          box-sizing: border-box; 
          margin: 0; 
          padding: 0; 
        }

        .editor-root {
          display: flex;
          flex-direction: column;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          font-size: 16px;
          position: relative;
          width: ${sizes?.width ? sizes.width + "px" : "100%"};
          height: ${sizes?.height ? sizes.height + "px" : "100%"};
        }

        /* scroll bar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: ${borderColor};
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${accentColor}88;
        }

        .editor-content {
          flex: 1;
          padding: 10px 16px 24px;
          min-height: 300px;
          outline: none;
          word-break: break-word;
          caret-color: ${accentColor};
          overflow-y: auto;
          line-height: 1.6;
        }

        .editor-content p {
          position: relative;
          margin: 0;
          padding: 0;
          min-height: 1.6em;
        }
        .editor-content p:first-child:empty::before,
        .editor-content p:first-child:has(br:only-child)::before {
          content: "...";
          color: ${tc}55;
          pointer-events: none;
          font-style: italic;
          position: absolute;
          left: 0;
          top: 0;
        }

        .editor-content h1 { font-size: 1.95em; font-weight: 800; letter-spacing: -0.03em; line-height: 1.2; margin-top: 16px; margin-bottom: 8px; }
        .editor-content h2 { font-size: 1.45em; font-weight: 700; letter-spacing: -0.02em; line-height: 1.3; margin-top: 14px; margin-bottom: 6px; }
        .editor-content h3 { font-size: 1.15em; font-weight: 600; letter-spacing: -0.01em; line-height: 1.4; margin-top: 12px; margin-bottom: 4px; }

        .editor-content blockquote {
          border-left: 3px solid ${accentColor};
          padding-left: 12px;
          font-style: italic;
          color: ${tc}cc;
          margin-bottom: 8px;
        }

        .editor-content pre {
          background: ${isLight ? '#f4f4f9' : '#1e1e2e'};
          border: 1px solid ${borderColor};
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 8px;
          overflow-x: auto;
        }
        .editor-content code {
          font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
          font-size: 13px;
          color: ${isLight ? '#3d3d6b' : '#cdd6f4'};
        }
        .editor-content p code {
          background: ${isLight ? '#f4f4f9' : '#1e1e2e'};
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.9em;
          color: ${isLight ? '#353535ff' : '#222222ff'};
        }

        .editor-content ul, .editor-content ol {
          margin-left: 24px;
          margin-bottom: 8px;
        }
        .editor-content li {
          margin-bottom: 4px;
        }

        .editor-content hr {
          border: none;
          border-top: 2px solid ${borderColor};
          margin: 16px 0;
        }

        .checklist-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          width: 100%;
          min-height: 32px;
          position: relative;
          padding-left: 24px;
          padding-right: 28px;
        }
        /* Drag handle dots – visible on hover */

       .checklist-item input[type="checkbox"] {
  appearance: none;
  width: 18px;
  height: 18px;
  margin-top: 3px;
  border: 2px solid ${accentColor};
  border-radius: 5px;
  cursor: pointer;

  position: relative;
}

.checklist-item input[type="checkbox"]:checked {
  background: ${accentColor};
}

.checklist-item input[type="checkbox"]:checked::before {
  content: "✔";
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 10px;
  font-weight: bold;
}
        .checklist-text {
          flex: 1;
          outline: none;
          min-height: 1.4em;
        }
        .checklist-item.checked .checklist-text {
          text-decoration: line-through;
          opacity: 0.48;
        }

        /* Delete button (×) */
        .checklist-delete-btn {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 20px;
          line-height: 1;
          color: ${tc}40;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.15s ease, color 0.15s ease;
          padding: 2px 4px;
          user-select: none;
        }
        .checklist-item:hover .checklist-delete-btn {
          opacity: 1;
        }

        /* "+ List item" add row */
        .checklist-add-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
          padding-left: 24px;
          cursor: pointer;
          user-select: none;
          margin-left: 26px;
        }
        .checklist-add-row .plus-icon {
          font-size: 18px;
          color: ${tc}40;
          transition: color 0.15s ease;
          width: 18px;
          text-align: center;
        }
        .checklist-add-row .placeholder-text {
          font-size: 15px;
          color: ${tc}40;
          transition: color 0.15s ease;
        }
        .checklist-add-row:hover .plus-icon,
        .checklist-add-row:hover .placeholder-text {
          color: ${tc}80;
        }

        ::selection { background: ${accentColor}40; }
      `}</style>

      <div
        ref={editorRef}
        className="editor-content"
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={handleEditorInput}
        onKeyDown={handleEditorKeyDown}
        onClick={handleEditorClick}
        onFocus={() => setTimeout(scrollCursorIntoView, 200)}
      />
    </div>
  );
}
