(function (root) {
  'use strict';
  const C = root.AuditCore;
  async function checklist(state) {
    const plan = C.packagePlan(state);
    if (plan.issues.length) throw Error(plan.issues[0]);
    const pdf = await root.PDFLib.PDFDocument.create();
    const font = await pdf.embedFont(root.PDFLib.StandardFonts.Helvetica);
    const glyphs = new Map();
    const pdfText = value => Array.from(String(value), ch => {
      if (!glyphs.has(ch)) {
        let printable = ch;
        try { font.encodeText(ch); }
        catch (_) { printable = '[U+' + ch.codePointAt(0).toString(16).toUpperCase() + ']'; }
        glyphs.set(ch, printable);
      }
      return glyphs.get(ch);
    }).join('');
    const black = root.PDFLib.rgb(0.05, 0.07, 0.1), gray = root.PDFLib.rgb(0.3, 0.34, 0.39), line = root.PDFLib.rgb(0.75, 0.78, 0.82);
    const W = 612, H = 792, margin = 48, width = W - margin * 2;
    let page, y, pageNo = 0;
    const newPage = () => { page = pdf.addPage([W, H]); y = H - 48; pageNo++; page.drawText('Audit Package Index & Completeness Checklist', {x: margin, y, size: 16, font, color: black}); y -= 28; page.drawLine({start: {x: margin, y}, end: {x: W - margin, y}, thickness: 0.7, color: line}); y -= 20; };
    const ensure = height => { if (!page || y - height < 62) newPage(); };
    const lines = (text, size, maxWidth) => {
      const words = pdfText(text).split(/\s+/u), out = []; let current = '';
      for (const word of words) {
        const candidate = current ? current + ' ' + word : word;
        if (font.widthOfTextAtSize(candidate, size) <= maxWidth) { current = candidate; continue; }
        if (current) { out.push(current); current = ''; }
        if (font.widthOfTextAtSize(word, size) <= maxWidth) { current = word; continue; }
        let piece = '';
        for (const ch of word) {
          if (font.widthOfTextAtSize(piece + ch, size) > maxWidth && piece) { out.push(piece); piece = ''; }
          piece += ch;
        }
        current = piece;
      }
      if (current) out.push(current);
      return out.length ? out : [''];
    };
    const write = (text, options = {}) => {
      const size = options.size || 10, indent = options.indent || 0, leading = options.leading || 15;
      for (const lineText of lines(text, size, width - indent)) {
        ensure(leading); page.drawText(lineText, {x: margin + indent, y, size, font, color: options.color || black}); y -= leading;
      }
    };
    newPage();
    write('Template: ' + plan.template.name); write('Package: ' + plan.parent);
    write('Prepared: ' + new Date().toLocaleDateString(), {color: gray});
    y -= 8;
    write('Package summary', {size: 12});
    write('Imported ' + state.files.length + '  |  Assigned ' + plan.assigned.length + '  |  Needs type ' + plan.pending.length + '  |  Unassigned ' + plan.unassigned.length);
    write('Required types included ' + plan.included.filter(x => x.type.required).length + '  |  Missing required ' + plan.missing.length);
    y -= 10;
    for (let fi = 0; fi < plan.template.folders.length; fi++) {
      const folder = plan.template.folders[fi];
      const rowHeight = (value, indent = 10) => lines(value, 10, width - indent).length * 15;
      let folderHeight = 32 + lines(C.pad(fi + 1) + ' - ' + folder.name, 12, width).length * 15;
      for (const type of folder.types) {
        const found = state.files.filter(f => f.folderId === folder.id && f.typeId === type.id);
        const status = found.length ? 'Included' : type.required ? 'Missing' : 'Optional Not Included';
        folderHeight += rowHeight(type.name + ' — ' + (type.required ? 'Required' : 'Optional') + ' — ' + status);
        for (const f of found) folderHeight += rowHeight(plan.names.get(f.id), 24);
      }
      const folderCustom = state.files.filter(f => f.folderId === folder.id && !f.typeId && !C.needsType(f));
      for (const f of folderCustom) folderHeight += rowHeight('Other: ' + (f.customType || 'Other document') + ' — ' + plan.names.get(f.id));
      for (const f of plan.pending.filter(f => f.folderId === folder.id)) folderHeight += rowHeight('Needs document type — ' + plan.names.get(f.id));
      ensure(folderHeight > H - 120 ? 42 : folderHeight);
      write(C.pad(fi + 1) + ' - ' + folder.name, {size: 12});
      page.drawLine({start: {x: margin, y: y + 4}, end: {x: W - margin, y: y + 4}, thickness: 0.5, color: line}); y -= 9;
      for (let ti = 0; ti < folder.types.length; ti++) {
        const type = folder.types[ti], found = state.files.filter(f => f.folderId === folder.id && f.typeId === type.id);
        const status = found.length ? 'Included' : type.required ? 'Missing' : 'Optional Not Included';
        write(C.pad(ti + 1) + ' ' + type.name + ' — ' + (type.required ? 'Required' : 'Optional') + ' — ' + status, {indent: 10});
        for (const f of found) write(plan.names.get(f.id), {indent: 24, color: gray});
      }
      const custom = state.files.filter(f => f.folderId === folder.id && !f.typeId && !C.needsType(f));
      for (const f of custom) write('Other: ' + (f.customType || 'Other document') + ' — ' + plan.names.get(f.id), {indent: 10});
      for (const f of plan.pending.filter(f => f.folderId === folder.id)) write('Needs document type — ' + plan.names.get(f.id), {indent: 10});
      y -= 8;
    }
    ensure(30); write('Items needing attention', {size: 12});
    if (!plan.missing.length && !plan.optional.length && !plan.unassigned.length && !plan.pending.length) write('None.');
    for (const x of plan.missing) write('Missing: ' + x.folder.name + ' / ' + x.type.name, {indent: 10});
    for (const x of plan.optional) write('Optional Not Included: ' + x.folder.name + ' / ' + x.type.name, {indent: 10});
    for (const f of plan.unassigned) write('Unassigned: ' + plan.names.get(f.id), {indent: 10});
    for (const f of plan.pending) write('Needs document type: ' + plan.names.get(f.id), {indent: 10});
    y -= 12; write('This checklist records file organization only. It does not verify document contents or compliance.', {size: 9, color: gray});
    pdf.setTitle('Audit Package Index & Completeness Checklist');
    return pdf.save();
  }
  root.AuditPdf = {checklist};
})(window);
