'use strict';
/* formats/docx.js — .docx імпорт (mammoth) та експорт (docx.js) */

const ArtDocx = (() => {

  // ── IMPORT ──────────────────────────────────
  function importDocx(file) {
    if (typeof mammoth === 'undefined')
      return Promise.reject(new Error('Бібліотека mammoth.js не завантажена'));

    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = async () => {
        try {
          const result = await mammoth.convertToHtml(
            { arrayBuffer: fr.result },
            {
              styleMap: [
                "p[style-name='Heading 1']    => h1:fresh",
                "p[style-name='Heading 2']    => h2:fresh",
                "p[style-name='Heading 3']    => h3:fresh",
                "p[style-name='Заголовок 1']  => h1:fresh",
                "p[style-name='Заголовок 2']  => h2:fresh",
                "p[style-name='Заголовок 3']  => h3:fresh",
              ]
            }
          );
          resolve({
            html: result.value,
            meta: {
              format: 'docx',
              fileName: file.name,
              warnings: result.messages
                .filter(m => m.type === 'warning')
                .map(m => m.message),
            }
          });
        } catch (e) {
          reject(new Error('Не вдалося прочитати .docx: ' + (e.message || e)));
        }
      };
      fr.onerror = () => reject(new Error('Не вдалося прочитати файл'));
      fr.readAsArrayBuffer(file);
    });
  }

  // ── EXPORT ──────────────────────────────────
  async function exportDocx(html, meta = {}) {
    if (typeof docx === 'undefined')
      throw new Error('Бібліотека docx.js не завантажена');

    const {
      Document, Packer, Paragraph, TextRun,
      HeadingLevel, AlignmentType, UnderlineType,
      PageOrientation, PageSize,
    } = docx;

    const isLandscape = meta.orientation === 'landscape';

    const div = document.createElement('div');
    div.innerHTML = html;

    const children = [];

    function collectRuns(node, fmt = {}) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (!text) return [];
        return [new TextRun({
          text,
          bold:      fmt.bold,
          italics:   fmt.italics,
          underline: fmt.underline ? { type: UnderlineType.SINGLE } : undefined,
          strike:    fmt.strike,
          font:      fmt.font,
          size:      fmt.size,      // half-points
          color:     fmt.color,
        })];
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return [];

      const tag = node.tagName.toLowerCase();
      const style = node.getAttribute('style') || '';
      const childFmt = {
        bold:    fmt.bold    || ['b','strong'].includes(tag),
        italics: fmt.italics || ['i','em'].includes(tag),
        underline: fmt.underline || tag === 'u',
        strike:  fmt.strike  || ['s','strike'].includes(tag),
        font:    _extractCss(style, 'font-family') || fmt.font,
        size:    _ptToHalfPt(_extractCss(style, 'font-size')) || fmt.size,
        color:   _extractCss(style, 'color') || fmt.color,
      };
      return Array.from(node.childNodes).flatMap(ch => collectRuns(ch, childFmt));
    }

    const HL = {
      h1: HeadingLevel.HEADING_1,
      h2: HeadingLevel.HEADING_2,
      h3: HeadingLevel.HEADING_3,
      h4: HeadingLevel.HEADING_4,
    };

    function processNode(node) {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const tag = node.tagName.toLowerCase();

      if (['p','div','h1','h2','h3','h4'].includes(tag)) {
        const runs = collectRuns(node);
        children.push(new Paragraph({
          children: runs.length ? runs : [new TextRun('')],
          ...(HL[tag] ? { heading: HL[tag] } : {}),
        }));
      } else if (tag === 'li') {
        const runs = collectRuns(node);
        children.push(new Paragraph({
          children: runs.length ? runs : [new TextRun('')],
          bullet: { level: 0 },
        }));
      } else if (tag === 'br') {
        children.push(new Paragraph({ children: [new TextRun('')] }));
      } else if (['ul','ol','blockquote','table','thead','tbody','tr'].includes(tag)) {
        node.childNodes.forEach(processNode);
      } else if (['td','th'].includes(tag)) {
        const runs = collectRuns(node);
        children.push(new Paragraph({
          children: runs.length ? runs : [new TextRun('')],
        }));
      } else {
        node.childNodes.forEach(processNode);
      }
    }

    div.childNodes.forEach(processNode);
    if (children.length === 0) children.push(new Paragraph({ children: [new TextRun('')] }));

    const document_ = new Document({
      sections: [{
        properties: {
          page: {
            size: isLandscape ? {
              orientation: PageOrientation.LANDSCAPE,
              width:  16838,   // A4 landscape (twips)
              height: 11906,
            } : {
              width:  11906,
              height: 16838,
            },
          },
        },
        children,
      }],
    });

    return Packer.toBlob(document_);
  }

  // ── Утиліти ──────────────────────────────────
  function _extractCss(style, prop) {
    const m = new RegExp(`${prop}\\s*:\\s*([^;]+)`).exec(style);
    return m ? m[1].trim() : null;
  }

  function _ptToHalfPt(ptStr) {
    if (!ptStr) return null;
    const m = /^([\d.]+)pt$/.exec(ptStr);
    return m ? Math.round(parseFloat(m[1]) * 2) : null;
  }

  return { importDocx, exportDocx };
})();
