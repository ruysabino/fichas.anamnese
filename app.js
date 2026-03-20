/* ==========================================================================
   BELEZA RARA – Fichas de Anamnese
   app.js — navegação, IndexedDB, coleta de dados e impressão
   ========================================================================== */

'use strict';

/* ── Estado global ──────────────────────────────────────────────────────── */
let currentProc  = '';   // 'pestanas' | 'depilacao' | 'laser'
let currentFichaId = null; // ID da ficha aberta (IndexedDB)
let db = null;           // IDBDatabase

/* ══════════════════════════════════════════════════════════════════════════
   INDEXEDDB
   ══════════════════════════════════════════════════════════════════════════ */
const DB_NAME    = 'belezaRaraDB';
const DB_VERSION = 1;
const STORE      = 'fichas';

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) { resolve(db); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains(STORE)) {
        const store = d.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('proc',  'proc',  { unique: false });
        store.createIndex('nome',  'nome',  { unique: false });
        store.createIndex('data',  'dataRegisto', { unique: false });
      }
    };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror   = e => reject(e.target.error);
  });
}

async function dbSave(record) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = d.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req   = record.id ? store.put(record) : store.add(record);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

async function dbGetAll() {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = d.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req   = store.getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

async function dbGet(id) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = d.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req   = store.get(id);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

async function dbDelete(id) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = d.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req   = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = e => reject(e.target.error);
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   NAVEGAÇÃO
   ══════════════════════════════════════════════════════════════════════════ */
function openForm(proc) {
  currentProc    = proc;
  currentFichaId = null;

  document.getElementById('screen-select').classList.remove('active');
  document.getElementById('screen-fichas').style.display = 'none';
  document.getElementById('screen-form').style.display   = 'flex';

  document.querySelectorAll('.form-section').forEach(s => s.style.display = 'none');
  document.getElementById('form-' + proc).style.display = 'block';

  const titles = {
    pestanas:  'Extensão de Pestanas',
    depilacao: 'Depilação',
    laser:     'Depilação Laser de Diodo'
  };
  document.getElementById('form-title-bar').textContent = 'Ficha de Anamnese – ' + titles[proc];
  clearFormFields();
  window.scrollTo(0, 0);
}

function goBack() {
  document.getElementById('screen-form').style.display   = 'none';
  document.getElementById('screen-fichas').style.display = 'none';
  document.getElementById('screen-select').classList.add('active');
}

function showFichas() {
  document.getElementById('screen-select').classList.remove('active');
  document.getElementById('screen-fichas').style.display = 'flex';
  renderFichasList();
}

function backFromFichas() {
  document.getElementById('screen-fichas').style.display = 'none';
  document.getElementById('screen-select').classList.add('active');
}

/* ══════════════════════════════════════════════════════════════════════════
   LISTA DE FICHAS GUARDADAS
   ══════════════════════════════════════════════════════════════════════════ */
const procLabels = {
  pestanas:  '👁️ Extensão de Pestanas',
  depilacao: '✨ Depilação',
  laser:     '⚡ Laser de Diodo'
};

async function renderFichasList() {
  const container = document.getElementById('fichas-list');
  container.innerHTML = '<div class="fichas-loading">A carregar…</div>';

  const all = await dbGetAll();
  if (!all.length) {
    container.innerHTML = '<div class="fichas-empty">Nenhuma ficha guardada ainda.<br>Preencha uma ficha e clique em <strong>Guardar</strong>.</div>';
    return;
  }

  // Sort most recent first
  all.sort((a, b) => (b.dataRegisto || '').localeCompare(a.dataRegisto || ''));

  container.innerHTML = all.map(f => `
    <div class="ficha-card" data-id="${f.id}">
      <div class="ficha-card-left">
        <div class="ficha-card-nome">${f.nome || '(sem nome)'}</div>
        <div class="ficha-card-meta">
          <span class="ficha-badge">${procLabels[f.proc] || f.proc}</span>
          <span class="ficha-date">${formatDate(f.dataRegisto) || ''}</span>
        </div>
      </div>
      <div class="ficha-card-actions">
        <button class="btn-ficha-open"  onclick="openFicha(${f.id})">✏️ Abrir</button>
        <button class="btn-ficha-print" onclick="loadAndPrint(${f.id})">🖨️ Imprimir</button>
        <button class="btn-ficha-del"   onclick="deleteFicha(${f.id})">🗑️</button>
      </div>
    </div>
  `).join('');
}

async function openFicha(id) {
  const ficha = await dbGet(id);
  if (!ficha) return;

  currentFichaId = id;
  currentProc    = ficha.proc;

  document.getElementById('screen-fichas').style.display = 'none';
  document.getElementById('screen-form').style.display   = 'flex';
  document.querySelectorAll('.form-section').forEach(s => s.style.display = 'none');
  document.getElementById('form-' + ficha.proc).style.display = 'block';

  const titles = { pestanas:'Extensão de Pestanas', depilacao:'Depilação', laser:'Depilação Laser de Diodo' };
  document.getElementById('form-title-bar').textContent = 'Ficha de Anamnese – ' + titles[ficha.proc];

  clearFormFields();
  populateForm(ficha);
  window.scrollTo(0, 0);
}

async function deleteFicha(id) {
  if (!confirm('Eliminar esta ficha permanentemente?')) return;
  await dbDelete(id);
  renderFichasList();
}

async function loadAndPrint(id) {
  const ficha = await dbGet(id);
  if (!ficha) return;
  printFromData(ficha.proc, ficha);
}

/* ══════════════════════════════════════════════════════════════════════════
   COLETA DE DADOS DO FORMULÁRIO
   ══════════════════════════════════════════════════════════════════════════ */
function getRadio(name) {
  // query globally so display:none parents don't matter
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : '';
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function collectForm() {
  const now = new Date().toISOString().slice(0, 10);

  if (currentProc === 'pestanas') {
    // collect obs fields from yn rows
    const ynRows = document.querySelectorAll('#form-pestanas .yn-row');
    const ynObs  = {};
    ynRows.forEach((row, i) => {
      const obs = row.querySelector('.yn-obs');
      if (obs) ynObs[i] = obs.value.trim();
    });

    return {
      proc: 'pestanas',
      dataRegisto: now,
      nome:    val('p-nome'),
      nasc:    val('p-nasc'),
      idade:   val('p-idade'),
      sexo:    val('p-sexo'),
      tel:     val('p-tel'),
      morada:  val('p-morada'),
      email:   val('p-email'),
      doc:     val('p-doc'),
      estilo:  val('p-estilo'),
      curv:    val('p-curvatura'),
      esp:     val('p-espessura'),
      modelo:  val('p-modelo'),
      data:    val('p-data'),
      // avaliação
      gest:    getRadio('p-gestante'),
      gestObs: ynObs[0] || '',
      proc_ol: getRadio('p-proced'),
      aler:    getRadio('p-alergia'),
      alerObs: ynObs[2] || '',
      glau:    getRadio('p-glaucoma'),
      onco:    getRadio('p-onco'),
      rimel:   getRadio('p-rimel'),
      // consentimento
      cAler:   getRadio('c-alergia'),
      cOcul:   getRadio('c-ocular'),
      cCiru:   getRadio('c-cirurgia'),
      cLent:   getRadio('c-lentes'),
      cIrri:   getRadio('c-irritacao'),
      // imagem
      imgAuth: getRadio('p-imagem'),
    };
  }

  if (currentProc === 'depilacao') {
    return {
      proc: 'depilacao',
      dataRegisto: now,
      nome:    val('d-nome'),
      nasc:    val('d-nasc'),
      tel:     val('d-tel'),
      morada1: val('d-morada1'),
      morada2: val('d-morada2'),
      nif:     val('d-nif'),
      h1: val('d-h1'), h2: val('d-h2'), h3: val('d-h3'), h4: val('d-h4'),
      h5: val('d-h5'), h6: val('d-h6'), h7: val('d-h7'), h8: val('d-h8'),
      obs: val('d-obs'),
    };
  }

  if (currentProc === 'laser') {
    // sessions
    const sessions = [];
    document.querySelectorAll('#sessions-tbody tr').forEach(tr => {
      const inputs = tr.querySelectorAll('input');
      const row = Array.from(inputs).map(i => i.value.trim());
      if (row.some(v => v)) sessions.push(row);
    });

    return {
      proc: 'laser',
      dataRegisto: now,
      nome:   val('l-nome'),
      nasc:   val('l-nasc'),
      idade:  val('l-idade'),
      sexo:   val('l-sexo'),
      tel:    val('l-tel'),
      morada: val('l-morada'),
      email:  val('l-email'),
      doc:    val('l-doc'),
      // avaliação
      saude:  getRadio('l-saude'), pele:   getRadio('l-pele'),
      grav:   getRadio('l-grav'),  ama:    getRadio('l-ama'),
      prot:   getRadio('l-prot'),  coag:   getRadio('l-coag'),
      neuro:  getRadio('l-neuro'), onco:   getRadio('l-onco'),
      cola:   getRadio('l-cola'),  trat:   getRadio('l-trat'),
      tatu:   getRadio('l-tatu'),  derm:   getRadio('l-derm'),
      aler:   getRadio('l-aler'),  horm:   getRadio('l-horm'),
      meno:   getRadio('l-meno'),  auto:   getRadio('l-auto'),
      vari:   getRadio('l-vari'),  acne:   getRadio('l-acne'),
      cica:   getRadio('l-cica'),  epil:   getRadio('l-epil'),
      diab:   getRadio('l-diab'),  viti:   getRadio('l-viti'),
      // pré-tratamento
      peel:   getRadio('l-peel'),  med:    getRadio('l-med'),
      sol:    getRadio('l-sol'),   crem:   getRadio('l-crem'),
      auto2:  getRadio('l-auto2'), sola:   getRadio('l-sola'),
      prev:   getRadio('l-prev'),
      // extra
      zonasPrev:  val('l-zonas-prev'),
      ultima:     val('l-ultima'),
      foto:       getRadio('l-foto'),
      obs:        val('l-obs'),
      dataInicio: val('l-data-inicio'),
      sessions,
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   POPULAR FORMULÁRIO A PARTIR DOS DADOS
   ══════════════════════════════════════════════════════════════════════════ */
function setRadio(name, value) {
  if (!value) return;
  const el = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (el) el.checked = true;
}

function populateForm(d) {
  if (d.proc === 'pestanas') {
    const set = (id, v) => { const el = document.getElementById(id); if (el && v !== undefined) el.value = v; };
    set('p-nome', d.nome); set('p-nasc', d.nasc); set('p-idade', d.idade);
    set('p-sexo', d.sexo); set('p-tel', d.tel);   set('p-morada', d.morada);
    set('p-email', d.email); set('p-doc', d.doc);
    set('p-estilo', d.estilo); set('p-curvatura', d.curv);
    set('p-espessura', d.esp); set('p-modelo', d.modelo); set('p-data', d.data);

    setRadio('p-gestante', d.gest); setRadio('p-proced', d.proc_ol);
    setRadio('p-alergia',  d.aler); setRadio('p-glaucoma', d.glau);
    setRadio('p-onco', d.onco);     setRadio('p-rimel', d.rimel);
    setRadio('c-alergia', d.cAler); setRadio('c-ocular', d.cOcul);
    setRadio('c-cirurgia', d.cCiru); setRadio('c-lentes', d.cLent);
    setRadio('c-irritacao', d.cIrri);
    setRadio('p-imagem', d.imgAuth);

    // obs fields
    const ynRows = document.querySelectorAll('#form-pestanas .yn-row');
    if (ynRows[0]) { const o = ynRows[0].querySelector('.yn-obs'); if (o) o.value = d.gestObs || ''; }
    if (ynRows[2]) { const o = ynRows[2].querySelector('.yn-obs'); if (o) o.value = d.alerObs || ''; }
  }

  if (d.proc === 'depilacao') {
    const set = (id, v) => { const el = document.getElementById(id); if (el && v !== undefined) el.value = v; };
    set('d-nome', d.nome); set('d-nasc', d.nasc); set('d-tel', d.tel);
    set('d-morada1', d.morada1); set('d-morada2', d.morada2); set('d-nif', d.nif);
    set('d-h1', d.h1); set('d-h2', d.h2); set('d-h3', d.h3); set('d-h4', d.h4);
    set('d-h5', d.h5); set('d-h6', d.h6); set('d-h7', d.h7); set('d-h8', d.h8);
    set('d-obs', d.obs);
  }

  if (d.proc === 'laser') {
    const set = (id, v) => { const el = document.getElementById(id); if (el && v !== undefined) el.value = v; };
    set('l-nome', d.nome); set('l-nasc', d.nasc); set('l-idade', d.idade);
    set('l-sexo', d.sexo); set('l-tel', d.tel);   set('l-morada', d.morada);
    set('l-email', d.email); set('l-doc', d.doc);
    set('l-zonas-prev', d.zonasPrev); set('l-ultima', d.ultima);
    set('l-obs', d.obs); set('l-data-inicio', d.dataInicio);

    const radios = ['saude','pele','grav','ama','prot','coag','neuro','onco','cola',
                    'trat','tatu','derm','aler','horm','meno','auto','vari','acne',
                    'cica','epil','diab','viti','peel','med','sol','crem','auto2','sola','prev'];
    radios.forEach(r => setRadio('l-' + r, d[r]));
    setRadio('l-foto', d.foto);

    // sessions
    const tbody = document.getElementById('sessions-tbody');
    tbody.innerHTML = '';
    (d.sessions || []).forEach((row, i) => {
      addSessionRowWithData(row, i + 1);
    });
    if (!d.sessions || !d.sessions.length) addSessionRow();
  }
}

function clearFormFields() {
  if (!currentProc) return;
  document.getElementById('form-' + currentProc)
    .querySelectorAll('input, select, textarea')
    .forEach(el => {
      if (el.type === 'radio' || el.type === 'checkbox') el.checked = false;
      else el.value = '';
    });
  // reset sessions table
  const tbody = document.getElementById('sessions-tbody');
  if (tbody) {
    tbody.innerHTML = '';
    addSessionRow();
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   GUARDAR FICHA
   ══════════════════════════════════════════════════════════════════════════ */
async function saveFicha() {
  const data = collectForm();
  if (!data) return;
  if (!data.nome) {
    alert('Por favor preencha pelo menos o nome da cliente.');
    return;
  }
  if (currentFichaId) data.id = currentFichaId;
  const savedId = await dbSave(data);
  currentFichaId = data.id || savedId;
  showToast('✅ Ficha guardada com sucesso!');
}

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = 'toast show';
  setTimeout(() => t.className = 'toast', 2800);
}

/* ══════════════════════════════════════════════════════════════════════════
   SESSION TABLE
   ══════════════════════════════════════════════════════════════════════════ */
function sessionRowHTML(num, vals) {
  const v = vals || [];
  const w = ['35px','130px','80px','55px','58px','58px','62px','58px','48px','110px'];
  const ph = [num||'','','Zona','III','ms','Hz','J/cm²','min','nº','Resultado'];
  const cells = w.map((width, i) =>
    `<td><input type="${i===1?'date':'text'}" value="${v[i]||''}" placeholder="${ph[i]}" style="width:${width}"></td>`
  ).join('');
  return `<tr>${cells}<td><button class="btn-rm-row" onclick="removeRow(this)">✕</button></td></tr>`;
}

function addSessionRow() {
  const tbody = document.getElementById('sessions-tbody');
  const num = tbody.rows.length + 1;
  tbody.insertAdjacentHTML('beforeend', sessionRowHTML(num, null));
}

function addSessionRowWithData(vals, num) {
  const tbody = document.getElementById('sessions-tbody');
  tbody.insertAdjacentHTML('beforeend', sessionRowHTML(num, vals));
}

function removeRow(btn) { btn.closest('tr').remove(); }

/* ══════════════════════════════════════════════════════════════════════════
   UTILITÁRIOS DE IMPRESSÃO
   ══════════════════════════════════════════════════════════════════════════ */
function formatDate(d) {
  if (!d) return '';
  const p = d.split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
}

function ynBox(value, target) {
  const checked = value === target;
  return `<span class="print-box${checked ? ' checked' : ''}"></span><span class="print-box-label">${target}</span>`;
}

function fieldLine(label, value, flex) {
  flex = flex || 1;
  return `<div style="display:flex;align-items:baseline;gap:4px;flex:${flex};min-width:0;border-bottom:1px solid #ccc;padding:3px 0 3px;">
    <span class="print-label">${label}&nbsp;</span>
    <span class="print-value">${value || ''}</span>
  </div>`;
}

function logoSVG() {
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:52px;height:52px;flex-shrink:0;">
    <circle cx="100" cy="100" r="100" fill="#e0185e"/>
    <line x1="100" y1="39" x2="100" y2="18" stroke="white" stroke-width="6.5" stroke-linecap="round"/>
    <line x1="100" y1="39" x2="125" y2="21" stroke="white" stroke-width="4.8" stroke-linecap="round"/>
    <line x1="100" y1="39" x2="75"  y2="21" stroke="white" stroke-width="4.8" stroke-linecap="round"/>
    <line x1="100" y1="39" x2="147" y2="29" stroke="white" stroke-width="4.2" stroke-linecap="round"/>
    <line x1="100" y1="39" x2="53"  y2="29" stroke="white" stroke-width="4.2" stroke-linecap="round"/>
    <line x1="100" y1="39" x2="163" y2="45" stroke="white" stroke-width="3.6" stroke-linecap="round"/>
    <line x1="100" y1="39" x2="37"  y2="45" stroke="white" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M38,112 Q100,85 162,112 Q100,139 38,112Z" fill="white"/>
    <circle cx="100" cy="112" r="22" fill="#e0185e"/>
    <circle cx="100" cy="112" r="15.8" fill="none" stroke="white" stroke-width="3.4"/>
    <path d="M100,116.3 C100,116.3 91.4,107.7 91.4,103.2 C91.4,99.5 94.7,98.6 100,103.9 C105.3,98.6 108.6,99.5 108.6,103.2 C108.6,107.7 100,116.3 100,116.3Z" fill="white"/>
  </svg>`;
}

function printHeader(title) {
  return `<div class="pd-header">
    <div class="pd-logo-row">
      ${logoSVG()}
      <div class="pd-brand">
        <div class="pd-brand-name">Beleza Rara</div>
        <div class="pd-brand-sub">Valquiria Almeida</div>
      </div>
    </div>
    <div class="pd-title-bar">${title}</div>
  </div>`;
}

function makeFields(rows) {
  return rows.map(row =>
    `<div style="display:flex;gap:10px;margin-bottom:3px;">${row.map(([l,v,f]) => fieldLine(l,v,f)).join('')}</div>`
  ).join('');
}

function makeYnTable(pairs) {
  return `<table class="pd-yn-table">${
    pairs.map(([label, val]) =>
      `<tr>
        <td class="pd-yn-q">${label}</td>
        <td class="pd-yn-a">${ynBox(val,'SIM')}&nbsp;&nbsp;${ynBox(val,'NÃO')}</td>
      </tr>`
    ).join('')
  }</table>`;
}

function sigRow(blocks) {
  return `<div class="pd-sign-row">${
    blocks.map(([desc, val]) =>
      `<div class="pd-sign-block">
        <div class="pd-sign-line">${val || ''}</div>
        <div class="pd-sign-desc">${desc}</div>
      </div>`
    ).join('')
  }</div>`;
}

/* ══════════════════════════════════════════════════════════════════════════
   GERAÇÃO DE HTML PARA IMPRESSÃO
   ══════════════════════════════════════════════════════════════════════════ */
function buildPestanasHTML(d) {
  const dataFmt = formatDate(d.data);

  /* ── Página 1: Ficha ── */
  const p1 = `<div class="pd-page">
    ${printHeader('FICHA DE ANAMNESE – EXTENSÃO DE PESTANAS')}
    ${makeFields([
      [['Nome:', d.nome, 2], ['Data de Nascimento:', formatDate(d.nasc)]],
      [['Idade:', d.idade], ['Sexo:', d.sexo], ['Telefone:', d.tel]],
      [['Morada:', d.morada, 2], ['E-mail:', d.email, 1.5]],
      [['Documento de Identificação (NIF / BI / Passaporte):', d.doc]],
    ])}
    <div class="pd-section-title">AVALIAÇÃO</div>
    ${makeYnTable([
      ['É gestante ou lactante?' + (d.gestObs ? ' – ' + d.gestObs : ''), d.gest],
      ['Já fez procedimento nos olhos?', d.proc_ol],
      ['Possui alergia a esmalte ou cosméticos?' + (d.alerObs ? ' – ' + d.alerObs : ''), d.aler],
      ['Possui glaucoma ou problema ocular?', d.glau],
      ['Faz tratamento oncológico?', d.onco],
      ['Está de rímel?', d.rimel],
    ])}
    <div class="pd-section-title">PROCEDIMENTO</div>
    ${makeFields([
      [['Estilo:', d.estilo]],
      [['Curvatura:', d.curv], ['Espessura:', d.esp], ['Modelo dos fios:', d.modelo]],
    ])}
    ${sigRow([['Assinatura da Cliente', ''], ['Data do Procedimento', dataFmt]])}
  </div>`;

  /* ── Página 2: Consentimento ── */
  const p2 = `<div class="pd-page">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6mm;">
      ${logoSVG()}
      <div class="pd-title-bar" style="flex:1;margin:0;">TERMO DE CONSENTIMENTO E RESPONSABILIDADE: EXTENSÃO DE PESTANAS</div>
    </div>
    ${fieldLine('Nome:', d.nome)}
    <div style="margin-top:5mm;" class="pd-consent-text">
      <p><b>1. Natureza do Procedimento</b> — Declaro que fui devidamente esclarecida sobre a técnica de extensão de pestanas, que consiste na aplicação de fios sintéticos individuais ou em leque sobre as minhas pestanas naturais, utilizando uma cola (adesivo) específica para uso ocular.</p>
      <p><b>2. Sintomas Adversos e Riscos Possíveis</b> — Embora o procedimento seja estético e não invasivo, podem ocorrer: <b>Irritação Ocular</b> (vermelhidão, lacrimejo ou sensação de corpo estranho nas primeiras 24h); <b>Reações Alérgicas</b> (inchaço das pálpebras, prurido intenso ou dermatite de contacto); <b>Sensibilidade aos Vapores</b> (ardência momentânea durante/após aplicação); <b>Queda Prematura</b> (se não forem cumpridos os cuidados de manutenção).</p>
      <p><b>3. Questionário de Saúde e Segurança</b></p>
    </div>
    ${makeYnTable([
      ['Sofre de alguma alergia conhecida (látex, esmalte, colas)?', d.cAler],
      ['Tem antecedentes de problemas oculares (terçolhos, conjuntivites, blefarite)?', d.cOcul],
      ['Realizou alguma cirurgia ocular nos últimos 6 meses?', d.cCiru],
      ['Utiliza lentes de contacto?', d.cLent],
      ['Está com alguma irritação ou sensibilidade ocular hoje?', d.cIrri],
    ])}
    <div class="pd-consent-text" style="margin-top:4mm;">
      <p><b>4. Dever de Cuidado e Pós-Tratamento</b> — Comprometo-me a: 1) Não molhar as pestanas nas primeiras 24h; 2) Evitar vapores quentes nas primeiras 48h; 3) Não usar produtos oleosos/bifásicos na zona ocular; 4) Higienizar diariamente com lash shampoo; 5) Não puxar nem esfregar as extensões (remoção obrigatória por profissional).</p>
      <p><b>5. Declaração de Consentimento</b> — Autorizo a realização do procedimento de alongamento de pestanas e assumo a responsabilidade pelos cuidados posteriores. Comprometo-me a seguir todas as orientações da profissional e declaro que todas as informações acima são verídicas.</p>
      <p style="font-size:7.5pt;color:#888;margin-top:3mm;"><i>Tratamento de Dados Pessoais (RGPD): Os dados recolhidos destinam-se exclusivamente à gestão da ficha de cliente e segurança do procedimento.</i></p>
    </div>
    ${sigRow([['Assinatura da Cliente',''], ['Assinatura da Técnica',''], ['Data do Procedimento', dataFmt]])}
  </div>`;

  /* ── Página 3: Autorização de Imagem ── */
  const p3 = `<div class="pd-page">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6mm;">
      ${logoSVG()}
      <div class="pd-title-bar" style="flex:1;margin:0;">TERMO DE AUTORIZAÇÃO DE IMAGEM E VÍDEO</div>
    </div>
    ${fieldLine('Nome:', d.nome)}
    <div class="pd-consent-text" style="margin-top:6mm;">
      <p>Pelo presente documento, eu autorizo livremente que a técnica <b>Valquiria Almeida dos Santos</b> proceda à captação de fotografias e/ou vídeos do meu rosto e zona ocular, antes, durante e após o procedimento de extensão de pestanas.</p>
      <p><b>Finalidade:</b> Divulgação em redes sociais (Instagram, Facebook, TikTok), portefólio digital e website oficial.</p>
      <p><b>Gratuidade:</b> Autorização concedida a título gratuito, sem compensação financeira.</p>
      <p><b>Duração:</b> Válida por tempo indeterminado, podendo ser revogada mediante solicitação escrita.</p>
      <p><b>Reserva:</b> A técnica compromete-se a utilizar as imagens de forma ética, respeitando a imagem da cliente.</p>
    </div>
    <div style="margin:8mm 0 4mm;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:10.5pt;">
        <span class="print-box${d.imgAuth === 'Autorizo' ? ' checked' : ''}"></span>
        <span> Autorizo o uso da minha imagem.</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;font-size:10.5pt;">
        <span class="print-box${d.imgAuth === 'Não autorizo' ? ' checked' : ''}"></span>
        <span> Não autorizo o uso da minha imagem.</span>
      </div>
    </div>
    ${sigRow([['Assinatura da Cliente',''], ['Data do Procedimento', dataFmt]])}
  </div>`;

  return p1 + p2 + p3;
}

function buildDepilacaoHTML(d) {
  const questions = [
    ['Já fez depilação antes? Se sim, qual método (cera, lâmina, laser, etc.)?', d.h1],
    ['Tem alguma alergia a produtos de depilação ou sensibilidade na pele?', d.h2],
    ['Qual é a área que deseja depilar hoje?', d.h3],
    ['Está a tomar algum medicamento ou usando produtos tópicos que possam afetar a depilação?', d.h4],
    ['Teve alguma reação adversa à depilação no passado (irritação, pelos encravados, queimaduras)?', d.h5],
    ['Com que frequência faz depilação?', d.h6],
    ['Qual é o seu objetivo com a depilação (remoção temporária, redução permanente)?', d.h7],
    ['Está grávida ou a amamentar?', d.h8],
  ];

  const histRows = questions.map(([q, a]) => `
    <tr>
      <td style="padding:6px 4px;border-bottom:1px solid #eee;vertical-align:top;">
        <div style="display:flex;gap:8px;align-items:flex-start;">
          <span style="color:#e0185e;font-size:16pt;line-height:0.9;flex-shrink:0;">●</span>
          <div style="flex:1;">
            <div style="font-weight:600;font-size:9pt;">${q}</div>
            <div style="border-bottom:1px solid #bbb;min-height:14px;margin-top:3px;font-size:9pt;padding-bottom:2px;">${a || ''}</div>
          </div>
        </div>
      </td>
    </tr>`).join('');

  return `<div class="pd-page">
    ${printHeader('FICHA DE ANAMNESE – DEPILAÇÃO')}
    ${makeFields([
      [['Nome:', d.nome, 2], ['Nasc:', formatDate(d.nasc)]],
      [['Morada:', d.morada1, 2], ['Telefone:', d.tel]],
      [['Morada:', d.morada2, 2], ['NIF:', d.nif]],
    ])}
    <div class="pd-section-title">HISTÓRICO</div>
    <table style="width:100%;border-collapse:collapse;">${histRows}</table>
    <div style="margin-top:5mm;font-size:8pt;font-weight:700;color:#e0185e;text-transform:uppercase;letter-spacing:.06em;">Alguma outra observação relevante:</div>
    <div style="border:1.5px solid #e0185e;border-radius:4px;min-height:22mm;padding:6px 10px;margin-top:3px;font-size:9pt;">${d.obs || ''}</div>
  </div>`;
}

function buildLaserHTML(d) {
  const dataFmt = formatDate(d.dataInicio);

  const ynRows1 = [
    ['Algum problema grave de saúde ou doença?', d.saude],
    ['Sensibilidade da Pele?', d.pele],
    ['Gravidez?', d.grav],
    ['Amamentação?', d.ama],
    ['Tem prótese metálica, bypass, desfibrilhador ou cardioversor?', d.prot],
    ['Alterações de coagulação?', d.coag],
    ['Doenças neuromusculares?', d.neuro],
    ['Antecedentes oncológicos?', d.onco],
    ['Implantes recentes de colagénio na zona a tratar?', d.cola],
    ['Está a fazer tratamento estético na zona a tratar?', d.trat],
    ['Tem tatuagens na zona a tratar?', d.tatu],
    ['Tem dermatites (eczema, psoríase, fungos na pele)?', d.derm],
    ['Tem alergias?', d.aler],
    ['Tem problemas hormonais?', d.horm],
    ['Está a decorrer a menopausa ou andropausa?', d.meno],
    ['Tem doenças autoimunes?', d.auto],
    ['Tem grande concentração de varizes ou derrames?', d.vari],
    ['Tem acne activo?', d.acne],
    ['Tem cicatrizes?', d.cica],
    ['Tem epilepsia?', d.epil],
    ['Tem diabetes?', d.diab],
    ['Tem vitiligo?', d.viti],
  ];
  const ynRows2 = [
    ['Fez peeling mecânico nos últimos 15 dias?', d.peel],
    ['Fez medicação oral ou tópica que torne a pele sensível?', d.med],
    ['Esteve exposto ao sol nas últimas 48h?', d.sol],
    ['Utilizou creme depilatório nas últimas 72h?', d.crem],
    ['Utilizou autobronzeador nos últimos 5 dias?', d.auto2],
    ['Fez recentemente solário?', d.sola],
    ['Alguma vez fez tratamentos de depilação a laser?', d.prev],
  ];

  const fotoBoxes = ['I','II','III','IV','V','VI'].map(f =>
    `<span class="pd-fototipo-box${d.foto === f ? ' sel' : ''}">${f}</span>`
  ).join('');

  // sessions rows — filled + empty up to 10
  const sessRows = (d.sessions || []);
  const emptyCount = Math.max(0, 10 - sessRows.length);
  const sessionHTML = sessRows.map(r =>
    `<tr>${r.slice(0,10).map(v => `<td>${v}</td>`).join('')}</tr>`
  ).join('') + Array(emptyCount).fill(`<tr>${Array(10).fill('<td>&nbsp;</td>').join('')}</tr>`).join('');

  const p1 = `<div class="pd-page">
    ${printHeader('FICHA DE ANAMNESE – DEPILAÇÃO A LASER DE DIODO')}
    ${makeFields([
      [['Nome:', d.nome, 2], ['Data de Nascimento:', formatDate(d.nasc)]],
      [['Idade:', d.idade], ['Sexo:', d.sexo], ['Telefone:', d.tel]],
      [['Morada:', d.morada, 2], ['E-mail:', d.email, 1.5]],
      [['Documento de Identificação (NIF / BI / Passaporte):', d.doc]],
    ])}
    <div class="pd-section-title">AVALIAÇÃO</div>
    ${makeYnTable(ynRows1)}
    <div class="pd-section-title">AVALIAÇÃO PRÉ-TRATAMENTO</div>
    ${makeYnTable(ynRows2)}
    ${makeFields([
      [['Se SIM, em quais zonas?', d.zonasPrev, 2], ['Última vez que fez?', d.ultima]],
    ])}
    <div style="margin:4mm 0 2mm;font-weight:700;font-size:9pt;color:#e0185e;">FOTOTIPO:</div>
    <div style="display:flex;gap:6px;margin-bottom:4mm;">${fotoBoxes}</div>
    <div style="font-weight:700;font-size:9pt;margin-bottom:2px;">Observações:</div>
    <div style="border:1.5px solid #e0185e;border-radius:3px;min-height:12mm;padding:5px 8px;font-size:9pt;">${d.obs||''}</div>
    <div style="margin:6mm 0 3mm;font-size:8.5pt;line-height:1.55;color:#333;">Tomei conhecimento de todas as precauções a tomar e contra-indicações do tratamento que vou efectuar, tendo obtido informação completa e esclarecido todas as dúvidas. Assumo como meu compromisso comunicar em qualquer sessão qualquer alteração da minha situação.</div>
    ${sigRow([['Assinatura da Cliente',''], ['Assinatura da Técnica',''], ['Data do Procedimento', dataFmt]])}
  </div>`;

  const p2 = `<div class="pd-page">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:5mm;">
      ${logoSVG()}
      <div>
        <div style="font-style:italic;font-size:8pt;color:#888;">Data do início:</div>
        <div style="font-weight:700;font-size:10pt;">${dataFmt}</div>
      </div>
    </div>
    <table class="pd-sessions-table">
      <thead><tr>
        <th>Sessão</th><th>Data</th><th>Zona</th><th>FotoTipo</th>
        <th>Pulso</th><th>Frequência</th><th>Energia</th><th>Duração</th>
        <th>Passagens na Zona</th><th>Resultados Sessão Anterior</th>
      </tr></thead>
      <tbody>${sessionHTML}</tbody>
    </table>
  </div>`;

  return p1 + p2;
}

/* ══════════════════════════════════════════════════════════════════════════
   IMPRESSÃO
   ══════════════════════════════════════════════════════════════════════════ */
function printForms() {
  const data = collectForm();
  if (!data) return;
  printFromData(currentProc, data);
}

function printFromData(proc, data) {
  let html = '';
  if (proc === 'pestanas')  html = buildPestanasHTML(data);
  if (proc === 'depilacao') html = buildDepilacaoHTML(data);
  if (proc === 'laser')     html = buildLaserHTML(data);

  // Open in new window — avoids the "triplicar" bug entirely
  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(`<!DOCTYPE html><html lang="pt"><head>
    <meta charset="UTF-8">
    <title>Beleza Rara – Impressão</title>
    <style>${getPrintCSS()}</style>
  </head><body class="print-body">${html}</body></html>`);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
}

function clearForm() {
  if (!confirm('Limpar todos os dados preenchidos?')) return;
  clearFormFields();
}

/* ══════════════════════════════════════════════════════════════════════════
   CSS DE IMPRESSÃO (injectado na janela nova)
   ══════════════════════════════════════════════════════════════════════════ */
function getPrintCSS() {
  return `
    * { box-sizing:border-box; margin:0; padding:0; }
    body.print-body { background:white; font-family:Arial,Helvetica,sans-serif; }

    .pd-page {
      width:210mm; min-height:297mm; background:white;
      padding:16mm 18mm 14mm; margin:0 auto;
      page-break-after:always; font-size:9.5pt; color:#222;
    }
    .pd-page:last-child { page-break-after:auto; }

    /* Header */
    .pd-header { margin-bottom:8mm; }
    .pd-logo-row { display:flex; align-items:center; gap:12px; justify-content:center; margin-bottom:5px; }
    .pd-brand-name { font-family:Georgia,serif; font-size:22pt; color:#e0185e; font-style:italic; line-height:1; }
    .pd-brand-sub  { font-size:8pt; color:#999; letter-spacing:.05em; }
    .pd-title-bar  { background:#e0185e; color:white; text-align:center; padding:6px 0;
                     font-size:10pt; font-weight:bold; letter-spacing:.12em; border-radius:3px; }

    /* Fields */
    .print-label { font-size:8pt; color:#555; white-space:nowrap; }
    .print-value { font-size:9.5pt; font-weight:bold; flex:1; min-width:0; }

    /* Section title */
    .pd-section-title { background:#e0185e; color:white; text-align:center; padding:4px 0;
      font-size:9.5pt; font-weight:bold; letter-spacing:.1em; margin:6mm 0 3mm; border-radius:3px; }

    /* Yes/No table */
    .pd-yn-table { width:100%; border-collapse:collapse; font-size:9pt; margin-bottom:1mm; }
    .pd-yn-table tr { border-bottom:1px solid #eee; }
    .pd-yn-table td { padding:4px 4px; vertical-align:middle; }
    .pd-yn-q { width:70%; font-weight:600; }
    .pd-yn-a { width:30%; text-align:right; white-space:nowrap; }

    /* Checkboxes */
    .print-box {
      display:inline-block; width:12px; height:12px;
      border:1.5px solid #e0185e; border-radius:2px;
      vertical-align:middle; margin-right:2px;
    }
    .print-box.checked { background:#e0185e; }
    .print-box-label { font-size:8.5pt; color:#333; margin-right:6px; vertical-align:middle; }

    /* Signature row */
    .pd-sign-row { display:flex; justify-content:space-between; gap:16mm; margin-top:14mm; }
    .pd-sign-block { flex:1; text-align:center; }
    .pd-sign-line  { border-top:1px solid #888; min-height:18px; padding-top:3px;
                     font-size:9pt; font-weight:bold; margin-bottom:3px; }
    .pd-sign-desc  { font-size:8pt; color:#666; }

    /* Consent text */
    .pd-consent-text p { font-size:8.5pt; line-height:1.55; margin-bottom:3mm; text-align:justify; }

    /* Fototipo */
    .pd-fototipo-box { border:1.5px solid #e0185e; padding:3px 8px; border-radius:3px;
                       font-size:8.5pt; font-weight:bold; display:inline-block; }
    .pd-fototipo-box.sel { background:#e0185e; color:white; }

    /* Sessions table */
    .pd-sessions-table { width:100%; border-collapse:collapse; font-size:7.5pt; }
    .pd-sessions-table th { background:#e0185e; color:white; padding:5px 4px;
                             text-align:center; font-size:7pt; }
    .pd-sessions-table td { border:1px solid #ddd; padding:5px 4px;
                             text-align:center; min-height:14px; }
    .pd-sessions-table tr:nth-child(even) td { background:#fff5f9; }

    @media print {
      @page { size:A4 portrait; margin:0; }
      body { margin:0; }
      .pd-page { margin:0; width:100%; min-height:100vh; }
    }
  `;
}

/* ══════════════════════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  openDB().catch(console.error);
});
