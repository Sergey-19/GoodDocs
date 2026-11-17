(() => {
  'use strict';
  const KEY = 'dark-notes-v1';
  const $ = id => document.getElementById(id);
  const elements = {
    list: $('noteList'), count: $('noteCount'), title: $('noteTitle'), editor: $('editor'),
    crumb: $('currentCrumb'), edited: $('lastEdited'), words: $('wordCount'),
    font: $('fontSizeDisplay'), status: $('saveStatus'), toast: $('toast'),
    sidebar: $('sidebar'), overlay: $('overlay'), bold: $('boldBtn')
  };
  const uid = () => (globalThis.crypto?.randomUUID?.() ?? `n${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const starter = () => ({
    id: uid(), title: 'Chào mừng đến Dark Notes', fontSize: 16,
    html: '<p>Đây là không gian ghi chú riêng của bạn. ✨</p><p><strong>Bắt đầu nhanh:</strong></p><p>• Bấm <strong>＋ Tạo tab mới</strong> để thêm ghi chú.<br>• Chọn văn bản và bấm <strong>B</strong> để in đậm.<br>• Bấm <strong>A− / A+</strong> để đổi cỡ chữ của tab hiện tại.<br>• Mọi nội dung được lưu tự động trong trình duyệt này.</p><p><strong>Lưu ý:</strong> Dữ liệu không tự đồng bộ giữa điện thoại và máy tính. Hãy thường xuyên dùng “Xuất dữ liệu” để sao lưu.</p>',
    updatedAt: Date.now()
  });
  const cleanHTML = html => {
    // Allow only safe text, line breaks, paragraphs and bold, never attributes/scripts.
    const doc = new DOMParser().parseFromString(String(html), 'text/html');
    const allowedBlock = new Set(['P', 'DIV']);
    const allowedBold = new Set(['B', 'STRONG']);
    const blocked = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'SVG', 'MATH', 'FORM', 'META', 'LINK']);
    const output = document.createElement('div');
    function appendSafe(node, dest) {
      if (node.nodeType === Node.TEXT_NODE) { dest.appendChild(document.createTextNode(node.textContent)); return; }
      if (node.nodeType !== Node.ELEMENT_NODE || blocked.has(node.nodeName)) return;
      const tag = node.nodeName;
      if (tag === 'BR') { dest.appendChild(document.createElement('br')); return; }
      const wrapper = allowedBold.has(tag) ? document.createElement('strong') : allowedBlock.has(tag) ? document.createElement('p') : null;
      const target = wrapper ?? dest;
      for (const child of node.childNodes) appendSafe(child, target);
      if (wrapper) dest.appendChild(wrapper);
    }
    for (const child of doc.body.childNodes) appendSafe(child, output);
    return output.innerHTML;
  };
  function normalize(data) {
    if (!data || !Array.isArray(data.notes)) throw new Error('Không đúng định dạng sao lưu.');
    if (data.notes.length > 500) throw new Error('Tệp vượt giới hạn 500 tab.');
    const seen = new Set();
    const notes = data.notes.map(n => {
      if (!n || typeof n !== 'object') throw new Error('Dữ liệu ghi chú không hợp lệ.');
      const id = typeof n.id === 'string' && n.id.length < 150 && !seen.has(n.id) ? n.id : uid();
      seen.add(id);
      return {
        id, title: String(n.title ?? 'Không có tiêu đề').slice(0, 100),
        html: cleanHTML(String(n.html ?? '').slice(0, 2_000_000)),
        fontSize: Math.max(12, Math.min(32, Number(n.fontSize) || 16)),
        updatedAt: Number.isFinite(n.updatedAt) ? n.updatedAt : Date.now()
      };
    });
    if (!notes.length) notes.push(starter());
    return { notes, activeId: notes.some(n => n.id === data.activeId) ? data.activeId : notes[0].id };
  }
  let state;
  try {
    const saved = localStorage.getItem(KEY);
    state = saved ? normalize(JSON.parse(saved)) : {notes: [starter()], activeId: null};
  } catch (e) {
    state = {notes: [starter()], activeId: null};
    console.warn('Không thể đọc dữ liệu đã lưu:', e);
  }
  if (!state.activeId) state.activeId = state.notes[0].id;
  let saveTimer;
  let toastTimer;
  let storageFailed = false;
  const current = () => state.notes.find(n => n.id === state.activeId);
  const save = () => {
    clearTimeout(saveTimer);
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      storageFailed = false;
      elements.status.textContent = 'Đã lưu';
    } catch (e) {
      storageFailed = true;
      elements.status.textContent = 'Chưa lưu được';
      showToast('Không thể lưu: bộ nhớ trình duyệt có thể đã đầy. Hãy xuất bản sao lưu.');
      console.error(e);
    }
  };
  const scheduleSave = () => {
    elements.status.textContent = 'Đang lưu…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 350);
  };
  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => elements.toast.classList.remove('show'), 3700);
  }
  function formattedDate(ts) {
    const date = new Date(ts);
    if (new Date().toDateString() === date.toDateString()) return 'Hôm nay';
    return date.toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric'});
  }
  function updateWords() {
    const content = elements.editor.innerText.trim();
    const count = content ? content.split(/\s+/u).length : 0;
    elements.words.textContent = `${count} từ`;
  }
  function renderList() {
    elements.list.replaceChildren();
    elements.count.textContent = `${state.notes.length} ghi chú`;
    for (const note of state.notes) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'note-item' + (note.id === state.activeId ? ' active' : '');
      item.setAttribute('role', 'listitem');
      item.setAttribute('aria-current', note.id === state.activeId ? 'page' : 'false');
      const icon = document.createElement('span'); icon.className = 'note-symbol'; icon.textContent = '▤';
      const text = document.createElement('span'); text.className = 'note-text';
      const name = document.createElement('span'); name.className = 'note-name'; name.textContent = note.title || 'Không có tiêu đề';
      const date = document.createElement('span'); date.className = 'note-date'; date.textContent = formattedDate(note.updatedAt);
      text.append(name, date); item.append(icon, text);
      item.addEventListener('click', () => selectNote(note.id));
      elements.list.appendChild(item);
    }
  }
  function renderEditor() {
    const note = current();
    if (!note) return;
    elements.title.value = note.title;
    elements.editor.innerHTML = cleanHTML(note.html);
    elements.editor.style.fontSize = `${note.fontSize}px`;
    elements.font.textContent = String(note.fontSize);
    elements.crumb.textContent = note.title || 'Không có tiêu đề';
    elements.edited.textContent = `Cập nhật: ${formattedDate(note.updatedAt)}`;
    updateWords();
    renderList();
  }
  function touchNote() {
    const note = current();
    if (!note) return;
    note.updatedAt = Date.now();
    elements.edited.textContent = 'Cập nhật: Hôm nay';
    scheduleSave();
  }
  function setSidebar(open) {
    elements.sidebar.classList.toggle('open', open);
    elements.overlay.classList.toggle('visible', open);
  }
  function selectNote(id) {
    if (!state.notes.some(n => n.id === id)) return;
    state.activeId = id;
    renderEditor(); save(); setSidebar(false);
  }
  function addNote() {
    if (state.notes.length >= 500) return showToast('Đã đạt giới hạn 500 tab.');
    const note = {id: uid(), title: 'Ghi chú mới', html: '', fontSize: 16, updatedAt: Date.now()};
    state.notes.unshift(note);
    state.activeId = note.id;
    renderEditor(); save(); setSidebar(false);
    elements.title.focus(); elements.title.select();
    showToast('Đã tạo tab mới');
  }
  $('addNote').addEventListener('click', addNote);
  $('openSidebar').addEventListener('click', () => setSidebar(true));
  $('closeSidebar').addEventListener('click', () => setSidebar(false));
  elements.overlay.addEventListener('click', () => setSidebar(false));
  elements.title.addEventListener('input', () => {
    current().title = elements.title.value;
    elements.crumb.textContent = elements.title.value || 'Không có tiêu đề';
    renderList(); touchNote();
  });
  elements.editor.addEventListener('input', () => {
    current().html = cleanHTML(elements.editor.innerHTML);
    updateWords(); touchNote();
  });
  elements.editor.addEventListener('paste', event => {
    // Paste as plain text to avoid importing arbitrary HTML and styles.
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    if (document.queryCommandSupported?.('insertText')) {
      document.execCommand('insertText', false, text);
    } else {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(text);
      range.insertNode(node);
      range.setStartAfter(node); range.collapse(true);
      selection.removeAllRanges(); selection.addRange(range);
      elements.editor.dispatchEvent(new Event('input', {bubbles: true}));
    }
  });
  function changeFont(delta) {
    const note = current();
    note.fontSize = Math.max(12, Math.min(32, note.fontSize + delta));
    elements.editor.style.fontSize = `${note.fontSize}px`;
    elements.font.textContent = String(note.fontSize);
    touchNote();
  }
  $('decreaseFont').addEventListener('click', () => changeFont(-2));
  $('increaseFont').addEventListener('click', () => changeFont(2));
  // Prevent toolbar mouse-down from losing the user's text selection.
  elements.bold.addEventListener('mousedown', e => e.preventDefault());
  elements.bold.addEventListener('click', () => {
    elements.editor.focus();
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed || !elements.editor.contains(selection.anchorNode)) {
      showToast('Hãy bôi đen đoạn văn bản cần in đậm trước.');
      return;
    }
    document.execCommand('bold', false, null);
    current().html = cleanHTML(elements.editor.innerHTML);
    touchNote();
  });
  $('deleteNote').addEventListener('click', () => {
    const note = current();
    if (!window.confirm(`Xóa tab “${note.title || 'Không có tiêu đề'}”? Thao tác này không thể hoàn tác.`)) return;
    state.notes = state.notes.filter(n => n.id !== note.id);
    if (!state.notes.length) state.notes.push(starter());
    state.activeId = state.notes[0].id;
    renderEditor(); save(); showToast('Đã xóa tab');
  });
  $('exportBtn').addEventListener('click', () => {
    if (saveTimer) save();
    const blob = new Blob([JSON.stringify({format: 'dark-notes', version: 1, exportedAt: new Date().toISOString(), ...state}, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dark-notes-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Đã tải bản sao lưu .json');
  });
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', async event => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return showToast('Tệp quá lớn (tối đa 8 MB).');
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed.format !== 'dark-notes') throw new Error('Tệp không phải bản sao lưu Dark Notes.');
      const incoming = normalize(parsed);
      if (!window.confirm(`Nhập ${incoming.notes.length} tab? Dữ liệu hiện có trên thiết bị này sẽ bị thay thế. Hãy xuất bản sao lưu trước nếu cần.`)) return;
      state = incoming;
      renderEditor(); save(); setSidebar(false);
      showToast(`Đã nhập ${incoming.notes.length} tab thành công`);
    } catch (err) { showToast(`Lỗi nhập dữ liệu: ${err.message}`); }
  });
  document.addEventListener('keydown', e => {
    if (e.altKey && e.key.toLowerCase() === 'n') { e.preventDefault(); addNote(); }
    if (e.key === 'Escape') setSidebar(false);
  });
  window.addEventListener('pagehide', () => { if (saveTimer) save(); });
  window.addEventListener('storage', event => {
    if (event.key === KEY) showToast('Dữ liệu đã thay đổi ở tab trình duyệt khác. Hãy tải lại trang để cập nhật.');
  });
  renderEditor();
  if (!localStorage.getItem(KEY)) save();
  if (storageFailed) elements.status.textContent = 'Chưa lưu được';
})();
