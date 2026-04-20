'use strict';
/* formats/docx.js — .docx імпорт/експорт */

const ArtDocx = (() => {
  function importDocx(file) {
    if (typeof mammoth === 'undefined') return Promise.reject(new Error('Бібліотека mammoth.js не завантажена'));
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = async () => {
        try {
          const result = await mammoth.convertToHtml({ arrayBuffer: fr.result }, {
            styleMap: [
              "p[style-name='Heading 1'] => h1:fresh",
              "p[style-name='Heading 2'] => h2:fresh",
              "p[style-name='Heading 3'] => h3:fresh",
              "p[style-name='Заголовок 1'] => h1:fresh",
              "p[style-name='Заголовок 2'] => h2:fresh",
              "p[style-name='Заголовок 3'] => h3:fresh"
            ]
          });
          resolve({ html: ArtSanitize.clean(result.value), meta: { format: 'docx', fileName: file.name, warnings: result.messages || [] } });
        } catch (e) {
          reject(new Error('Не вдалося прочитати .docx: ' + (e.message || e)));
        }
      };
      fr.onerror = () => reject(new Error('Не вдалося прочитати файл'));
      fr.readAsArrayBuffer(file);
    });
  }

  async function exportDocx(html, meta = {}) {
    if (typeof docx === 'undefined') throw new Error('Бібліотека docx.js не завантажена');
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, UnderlineType, PageOrientation, Table, TableRow, TableCell, WidthType } = docx;
    const div = document.createElement('div');
    div.innerHTML = html;
    const children = [];

    function css(node, prop) {
      return (node.style && node.style[prop]) || '';
    }

    function collectRuns(node, fmt = {}) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        return text ? [new TextRun({
          text,
          bold: fmt.bold,
          italics: fmt.italics,
          underline: fmt.underline ? { type: UnderlineType.SINGLE } : undefined,
          strike: fmt.strike,
          font: fmt.font,
          size: fmt.size,
          color: fmt.color,
          highlight: fmt.highlight
        })] : [];
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return [];
      const tag = node.tagName.toLowerCase();
      const next = {
        bold: fmt.bold || ['b','strong'].includes(tag),
        italics: fmt.italics || ['i','em'].includes(tag),
        underline: fmt.underline || tag === 'u',
        strike: fmt.strike || ['s','strike'].includes(tag),
        font: node.style.fontFamily || fmt.font,
        size: _ptToHalfPt(node.style.fontSize) || fmt.size,
        color: _cssColorToHex(node.style.color) || fmt.color,
        highlight: node.style.backgroundColor ? 'yellow' : fmt.highlight
      };
      return [...node.childNodes].flatMap(ch => collectRuns(ch, next));
    }

    function para(node, opts = {}) {
      return new Paragraph({
        children: collectRuns(node).length ? collectRuns(node) : [new TextRun('')],
        heading: opts.heading,
        alignment: _alignment(node.style.textAlign),
        indent: node.style.marginLeft ? { left: Math.round(parseInt(node.style.marginLeft, 10) * 15) } : undefined
      });
    }

    function tableFromNode(tableNode) {
      const rows = [...tableNode.querySelectorAll(':scope > tbody > tr, :scope > tr')].map(tr =>
        new TableRow({ children: [...tr.children].map(cell => new TableCell({
          width: { size: 100 / Math.max(1, tr.children.length), type: WidthType.PERCENTAGE },
          children: [para(cell)]
        })) })
      );
      return new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } });
    }

    [...div.childNodes].forEach(node => {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        if ((node.textContent || '').trim()) children.push(new Paragraph({ children: collectRuns(node) }));
        return;
      }
      const tag = node.tagName.toLowerCase();
      if (['p','div','blockquote'].includes(tag)) children.push(para(node));
      else if (['h1','h2','h3','h4'].includes(tag)) children.push(para(node, { heading: HeadingLevel[`HEADING_${tag.slice(1)}`] }));
      else if (tag === 'ul' || tag === 'ol') {
        [...node.children].forEach((li, idx) => children.push(new Paragraph({
          children: collectRuns(li).length ? collectRuns(li) : [new TextRun('')],
          bullet: tag === 'ul' ? { level: 0 } : undefined,
          numbering: tag === 'ol' ? { reference: 'numbered-list', level: 0 } : undefined
        })));
      } else if (tag === 'table') children.push(tableFromNode(node));
      else if (tag === 'hr') children.push(new Paragraph({ children: [new TextRun('────────────────────────')] }));
    });

    if (!children.length) children.push(new Paragraph({ children: [new TextRun('')] }));
    const isLandscape = meta.orientation === 'landscape';
    const doc = new Document({
      numbering: {
        config: [{ reference: 'numbered-list', levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START }] }]
      },
      sections: [{
        properties: { page: { size: isLandscape ? { orientation: PageOrientation.LANDSCAPE, width: 16838, height: 11906 } : { width: 11906, height: 16838 } } },
        children
      }]
    });
    return Packer.toBlob(doc);
  }

  function _ptToHalfPt(pt) { const m = /([\d.]+)pt/.exec(pt || ''); return m ? Math.round(parseFloat(m[1]) * 2) : undefined; }
  function _alignment(value) { return ({ center: docx.AlignmentType.CENTER, right: docx.AlignmentType.RIGHT, justify: docx.AlignmentType.JUSTIFIED }[value] || docx.AlignmentType.LEFT); }
  function _cssColorToHex(color) {
    if (!color) return undefined;
    if (/^#([0-9a-f]{6})$/i.test(color)) return color.slice(1);
    return undefined;
  }

  return { importDocx, exportDocx };
})();
