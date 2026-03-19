/* ===== NAVIGATION ===== */
let currentProc = '';

function openForm(proc) {
  currentProc = proc;
  document.getElementById('screen-select').classList.remove('active');
  document.getElementById('screen-form').style.display = 'flex';

  // Hide all form sections
  document.querySelectorAll('.form-section').forEach(s => s.style.display = 'none');
  // Show the right one
  document.getElementById('form-' + proc).style.display = 'block';

  const titles = {
    pestanas: 'Extensão de Pestanas',
    depilacao: 'Depilação',
    laser: 'Depilação Laser de Diodo'
  };
  document.getElementById('form-title-bar').textContent = 'Ficha de Anamnese – ' + titles[proc];
  window.scrollTo(0, 0);
}

function goBack() {
  document.getElementById('screen-form').style.display = 'none';
  document.getElementById('screen-select').classList.add('active');
  document.getElementById('print-area').style.display = 'none';
  document.getElementById('print-area').innerHTML = '';
}

function clearForm() {
  if (!confirm('Limpar todos os dados preenchidos?')) return;
  document.getElementById('form-' + currentProc).querySelectorAll('input, select, textarea').forEach(el => {
    if (el.type === 'radio' || el.type === 'checkbox') el.checked = false;
    else el.value = '';
  });
}

/* ===== SESSION TABLE ===== */
function addSessionRow() {
  const tbody = document.getElementById('sessions-tbody');
  const rowCount = tbody.rows.length + 1;
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input type="text" placeholder="${rowCount}" style="width:35px"></td>
    <td><input type="date" style="width:130px"></td>
    <td><input type="text" placeholder="Zona" style="width:80px"></td>
    <td><input type="text" placeholder="III" style="width:50px"></td>
    <td><input type="text" placeholder="ms" style="width:55px"></td>
    <td><input type="text" placeholder="Hz" style="width:55px"></td>
    <td><input type="text" placeholder="J/cm²" style="width:60px"></td>
    <td><input type="text" placeholder="min" style="width:55px"></td>
    <td><input type="text" placeholder="nº" style="width:45px"></td>
    <td><input type="text" placeholder="Resultado" style="width:100px"></td>
    <td><button class="btn-rm-row" onclick="removeRow(this)">✕</button></td>
  `;
  tbody.appendChild(row);
}

function removeRow(btn) {
  btn.closest('tr').remove();
}

/* ===== HELPER: get radio value ===== */
function getRadio(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : '';
}

/* ===== LOGO SVG for print ===== */
function logoSVG() {
  return `<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" class="print-logo-svg">
    <g transform="translate(60,38)">
      <line x1="0" y1="-32" x2="0" y2="-22" stroke="#e0185e" stroke-width="2" stroke-linecap="round"/>
      <line x1="8" y1="-31" x2="5.5" y2="-21.5" stroke="#e0185e" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="-8" y1="-31" x2="-5.5" y2="-21.5" stroke="#e0185e" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="15" y1="-27" x2="10.5" y2="-19" stroke="#e0185e" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="-15" y1="-27" x2="-10.5" y2="-19" stroke="#e0185e" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="21" y1="-21" x2="15" y2="-15" stroke="#e0185e" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="-21" y1="-21" x2="-15" y2="-15" stroke="#e0185e" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M-28,0 Q0,-18 28,0 Q0,18 -28,0Z" fill="none" stroke="#e0185e" stroke-width="2.2"/>
      <circle cx="0" cy="0" r="10" fill="none" stroke="#e0185e" stroke-width="2"/>
      <path d="M0,3 C0,3 -6,-3 -6,-6 C-6,-9 -3,-10 0,-7 C3,-10 6,-9 6,-6 C6,-3 0,3 0,3Z" fill="#e0185e"/>
    </g>
  </svg>`;
}

function printHeader(title) {
  return `
    <div class="print-header">
      <div class="print-logo-row">
        ${logoSVG()}
        <div>
          <div class="print-brand-name">Beleza Rara</div>
          <span class="print-brand-sub">Valquiria Almeida</span>
        </div>
      </div>
    </div>
    <div class="print-title-bar">${title}</div>
  `;
}

function ynBox(value, target) {
  const checked = value === target;
  return `<span class="print-box${checked ? ' checked' : ''}"></span> <span class="print-box-label">${target}</span>`;
}

function fieldLine(label, value, flex = 1) {
  return `<div style="display:flex;align-items:baseline;gap:4px;flex:${flex};border-bottom:1px solid #ccc;padding:4px 0;">
    <span class="print-label">${label}</span>
    <span class="print-value">${value || ''}</span>
  </div>`;
}

function formatDate(d) {
  if (!d) return '';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
}

/* ===== GENERATE PESTANAS PRINT ===== */
function generatePestanasPrint() {
  const nome = document.getElementById('p-nome').value;
  const nasc = formatDate(document.getElementById('p-nasc').value);
  const idade = document.getElementById('p-idade').value;
  const sexo = document.getElementById('p-sexo').value;
  const tel = document.getElementById('p-tel').value;
  const morada = document.getElementById('p-morada').value;
  const email = document.getElementById('p-email').value;
  const doc = document.getElementById('p-doc').value;
  const estilo = document.getElementById('p-estilo').value;
  const curv = document.getElementById('p-curvatura').value;
  const esp = document.getElementById('p-espessura').value;
  const modelo = document.getElementById('p-modelo').value;
  const data = formatDate(document.getElementById('p-data').value);

  const gest = getRadio('p-gestante');
  const proc = getRadio('p-proced');
  const aler = getRadio('p-alergia');
  const glau = getRadio('p-glaucoma');
  const onco = getRadio('p-onco');
  const rimel = getRadio('p-rimel');

  const gestObs = document.querySelector('[name="p-gestante"]')?.closest('.yn-row')?.querySelector('.yn-obs')?.value || '';
  const allerObs = document.querySelector('[name="p-alergia"]')?.closest('.yn-row')?.querySelector('.yn-obs')?.value || '';

  const cAler = getRadio('c-alergia');
  const cOcul = getRadio('c-ocular');
  const cCiru = getRadio('c-cirurgia');
  const cLent = getRadio('c-lentes');
  const cIrri = getRadio('c-irritacao');
  const imgAuth = getRadio('p-imagem');

  // Page 1: Ficha de Anamnese
  let page1 = `<div class="print-doc">
    ${printHeader('FICHA DE ANAMNESE – EXTENSÃO DE PESTANAS')}
    <div style="margin-top:8mm;">
      <div style="display:flex;gap:8px;margin-bottom:4px;">
        ${fieldLine('Nome:', nome, 2)}
        ${fieldLine('Data de Nascimento:', nasc)}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:4px;">
        ${fieldLine('Idade:', idade)}
        ${fieldLine('Sexo:', sexo)}
        ${fieldLine('Telefone:', tel)}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:4px;">
        ${fieldLine('Morada:', morada, 2)}
        ${fieldLine('E-mail:', email, 1.5)}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:4px;">
        ${fieldLine('Documento de Identificação (NIF / BI / Passaporte):', doc, 1)}
      </div>
    </div>

    <div class="print-section-title">AVALIAÇÃO</div>
    <table class="print-yn-table">
      <tr><td>É gestante ou lactante, há quanto tempo?</td><td class="yn-cell">${ynBox(gest,'SIM')} ${ynBox(gest,'NÃO')} <span style="font-size:8pt;margin-left:4px;">${gestObs}</span></td></tr>
      <tr><td>Já fez procedimento nos olhos?</td><td class="yn-cell">${ynBox(proc,'SIM')} ${ynBox(proc,'NÃO')}</td></tr>
      <tr><td>Possui alergia a esmalte ou cosméticos? ${allerObs ? '(' + allerObs + ')' : ''}</td><td class="yn-cell">${ynBox(aler,'SIM')} ${ynBox(aler,'NÃO')}</td></tr>
      <tr><td>Possui glaucoma ou problema ocular?</td><td class="yn-cell">${ynBox(glau,'SIM')} ${ynBox(glau,'NÃO')}</td></tr>
      <tr><td>Faz tratamento oncológico?</td><td class="yn-cell">${ynBox(onco,'SIM')} ${ynBox(onco,'NÃO')}</td></tr>
      <tr><td>Está de rímel?</td><td class="yn-cell">${ynBox(rimel,'SIM')} ${ynBox(rimel,'NÃO')}</td></tr>
    </table>

    <div class="print-section-title">PROCEDIMENTO</div>
    <div class="print-proc-row">${fieldLine('Estilo:', estilo)}</div>
    <div class="print-proc-row">
      ${fieldLine('Curvatura:', curv)}
      ${fieldLine('Espessura:', esp)}
      ${fieldLine('Modelo dos fios:', modelo)}
    </div>

    <div class="print-sign-row">
      <div class="print-sign-block">
        <div class="print-sign-line"></div>
        <div class="print-sign-desc">Assinatura da Cliente</div>
      </div>
      <div class="print-sign-block">
        <div class="print-sign-line">${data}</div>
        <div class="print-sign-desc">Data do Procedimento</div>
      </div>
    </div>
  </div>`;

  // Page 2: Termo de Consentimento
  let page2 = `<div class="print-doc">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:6mm;">
      ${logoSVG()}
      <div class="print-title-bar" style="flex:1;margin:0;">TERMO DE CONSENTIMENTO E RESPONSABILIDADE: EXTENSÃO DE PESTANAS</div>
    </div>
    <div style="margin-bottom:5mm;">${fieldLine('Nome:', nome)}</div>
    <div class="print-consent-text">
      <p><b>1. Natureza do Procedimento</b></p>
      <p>Declaro que fui devidamente esclarecida sobre a técnica de extensão de pestanas, que consiste na aplicação de fios sintéticos individuais ou em leque sobre as minhas pestanas naturais, utilizando uma cola (adesivo) específica para uso ocular.</p>
      <br>
      <p><b>2. Sintomas Adversos e Riscos Possíveis</b></p>
      <p>Tenho conhecimento de que, embora o procedimento seja estético e não invasivo, podem ocorrer os seguintes efeitos secundários: <b>Irritação Ocular</b> – vermelhidão ligeira, lacrimejo ou sensação de "corpo estranho" nas primeiras 24 horas. <b>Reações Alérgicas</b> – inchaço das pálpebras, prurido intenso ou dermatite de contacto. <b>Sensibilidade aos Vapores</b> – ligeira ardência momentânea durante ou após a aplicação. <b>Queda Prematura</b> – perda de extensões caso não sejam cumpridos os cuidados de manutenção.</p>
      <br>
      <p><b>3. Questionário de Saúde e Segurança</b></p>
    </div>
    <table class="print-yn-table">
      <tr><td>Sofre de alguma alergia conhecida (látex, esmalte, colas)?</td><td class="yn-cell">${ynBox(cAler,'Sim')} ${ynBox(cAler,'Não')}</td></tr>
      <tr><td>Tem antecedentes de problemas oculares (terçolhos, conjuntivites, blefarite)?</td><td class="yn-cell">${ynBox(cOcul,'Sim')} ${ynBox(cOcul,'Não')}</td></tr>
      <tr><td>Realizou alguma cirurgia ocular nos últimos 6 meses?</td><td class="yn-cell">${ynBox(cCiru,'Sim')} ${ynBox(cCiru,'Não')}</td></tr>
      <tr><td>Utiliza lentes de contacto?</td><td class="yn-cell">${ynBox(cLent,'Sim')} ${ynBox(cLent,'Não')}</td></tr>
      <tr><td>Está com alguma irritação ou sensibilidade ocular hoje?</td><td class="yn-cell">${ynBox(cIrri,'Sim')} ${ynBox(cIrri,'Não')}</td></tr>
    </table>
    <br>
    <div class="print-consent-text">
      <p><b>4. Dever de Cuidado e Pós-Tratamento</b></p>
      <p>Comprometo-me a seguir as recomendações da técnica: 1. Não molhar as pestanas nas primeiras 24 horas. 2. Evitar vapores quentes nas primeiras 48 horas. 3. Não utilizar produtos oleosos ou bifásicos na zona ocular. 4. Higienizar diariamente com lash shampoo. 5. Não puxar ou esfregar as extensões. A remoção deve ser feita por um profissional.</p>
      <br>
      <p><b>5. Declaração de Consentimento</b></p>
      <p>Autorizo a realização do procedimento de alongamento de pestanas, e assumo a responsabilidade pelos cuidados posteriores, comprometendo-me a seguir todas as orientações da profissional.</p>
      <br>
      <p style="font-size:7.5pt;color:#777;"><i>Tratamento de Dados Pessoais (RGPD): Os dados recolhidos neste formulário destinam-se exclusivamente à gestão da ficha de cliente e segurança do procedimento.</i></p>
    </div>
    <div class="print-sign-row" style="margin-top:10mm;">
      <div class="print-sign-block">
        <div class="print-sign-line"></div>
        <div class="print-sign-desc">Assinatura da Cliente</div>
      </div>
      <div class="print-sign-block">
        <div class="print-sign-line"></div>
        <div class="print-sign-desc">Assinatura da Técnica</div>
      </div>
      <div class="print-sign-block">
        <div class="print-sign-line">${data}</div>
        <div class="print-sign-desc">Data do Procedimento</div>
      </div>
    </div>
  </div>`;

  // Page 3: Autorização de Imagem
  const imgAuthDisplay = imgAuth || '( )';
  let page3 = `<div class="print-doc">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:6mm;">
      ${logoSVG()}
      <div class="print-title-bar" style="flex:1;margin:0;">TERMO DE AUTORIZAÇÃO DE IMAGEM E VÍDEO</div>
    </div>
    <div style="margin-bottom:5mm;font-weight:bold;">${fieldLine('Nome:', nome)}</div>
    <div class="print-consent-text">
      <p>Pelo presente documento, eu autorizo livremente que a técnica <b>Valquiria Almeida dos Santos</b>, proceda à captação de fotografias e/ou vídeos do meu rosto e zona ocular, antes, durante e após o procedimento de extensão de pestanas.</p>
      <br>
      <p><b>1. Finalidade:</b> As imagens destinam-se exclusivamente à divulgação do trabalho profissional em redes sociais (Instagram, Facebook, TikTok), portefólio digital e website oficial.</p>
      <p><b>2. Gratuidade:</b> Esta autorização é concedida a título gratuito, não havendo lugar a qualquer compensação financeira.</p>
      <p><b>3. Duração:</b> A presente autorização é válida por tempo indeterminado, podendo ser revogada por mim a qualquer momento, mediante solicitação escrita.</p>
      <p><b>4. Reserva:</b> A técnica compromete-se a utilizar as imagens de forma ética, respeitando a imagem da cliente.</p>
    </div>
    <div style="margin-top:8mm;">
      <div class="print-image-check-row">
        <span class="print-box${imgAuth === 'Autorizo' ? ' checked' : ''}"></span>
        <span style="font-size:10pt;"> Autorizo o uso da minha imagem.</span>
      </div>
      <div class="print-image-check-row">
        <span class="print-box${imgAuth === 'Não autorizo' ? ' checked' : ''}"></span>
        <span style="font-size:10pt;"> Não autorizo o uso da minha imagem.</span>
      </div>
    </div>
    <div class="print-sign-row" style="margin-top:14mm;">
      <div class="print-sign-block">
        <div class="print-sign-line"></div>
        <div class="print-sign-desc">Assinatura da Cliente</div>
      </div>
      <div class="print-sign-block">
        <div class="print-sign-line">${data}</div>
        <div class="print-sign-desc">Data do Procedimento</div>
      </div>
    </div>
  </div>`;

  return page1 + page2 + page3;
}

/* ===== GENERATE DEPILAÇÃO PRINT ===== */
function generateDepilacaoPrint() {
  const nome = document.getElementById('d-nome').value;
  const nasc = formatDate(document.getElementById('d-nasc').value);
  const tel = document.getElementById('d-tel').value;
  const morada1 = document.getElementById('d-morada1').value;
  const morada2 = document.getElementById('d-morada2').value;
  const nif = document.getElementById('d-nif').value;

  const questions = [
    { label: 'Já fez depilação antes? Se sim, qual método (cera, lâmina, laser, etc.)?', val: document.getElementById('d-h1').value },
    { label: 'Tem alguma alergia a produtos de depilação ou sensibilidade na pele?', val: document.getElementById('d-h2').value },
    { label: 'Qual é a área que deseja depilar hoje?', val: document.getElementById('d-h3').value },
    { label: 'Está a tomar algum medicamento ou usando produtos tópicos que possam afetar a depilação?', val: document.getElementById('d-h4').value },
    { label: 'Teve alguma reação adversa à depilação no passado (irritação, pelos encravados, queimaduras)?', val: document.getElementById('d-h5').value },
    { label: 'Com que frequência faz depilação?', val: document.getElementById('d-h6').value },
    { label: 'Qual é o seu objetivo com a depilação (remoção temporária, redução permanente)?', val: document.getElementById('d-h7').value },
    { label: 'Está grávida ou a amamentar?', val: document.getElementById('d-h8').value },
  ];
  const obs = document.getElementById('d-obs').value;

  let histRows = questions.map(q => `
    <tr>
      <td style="padding:5px 4px;border-bottom:1px solid #eee;vertical-align:top;">
        <div style="display:flex;gap:8px;align-items:flex-start;">
          <span style="color:#e0185e;font-size:14pt;line-height:1;">●</span>
          <div>
            <div style="font-weight:600;font-size:9pt;">${q.label}</div>
            <div style="border-bottom:1px solid #bbb;min-height:16px;margin-top:3px;font-size:9pt;color:#333;">${q.val || ''}</div>
          </div>
        </div>
      </td>
    </tr>
  `).join('');

  return `<div class="print-doc">
    ${printHeader('FICHA DE ANAMNESE – DEPILAÇÃO')}
    <div style="margin-top:7mm;">
      <div style="display:flex;gap:8px;margin-bottom:4px;">
        ${fieldLine('Nome:', nome, 2)}
        ${fieldLine('Nasc:', nasc)}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:4px;">
        ${fieldLine('Morada:', morada1, 2)}
        ${fieldLine('Telefone:', tel)}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:4px;">
        ${fieldLine('Morada:', morada2, 2)}
        ${fieldLine('NIF:', nif)}
      </div>
    </div>

    <div class="print-section-title">HISTÓRICO</div>
    <table style="width:100%;border-collapse:collapse;">${histRows}</table>

    <div class="print-obs-label">ALGUMA OUTRA OBSERVAÇÃO RELEVANTE:</div>
    <div class="print-obs-box">${obs || ''}</div>
  </div>`;
}

/* ===== GENERATE LASER PRINT ===== */
function generateLaserPrint() {
  const nome = document.getElementById('l-nome').value;
  const nasc = formatDate(document.getElementById('l-nasc').value);
  const idade = document.getElementById('l-idade').value;
  const sexo = document.getElementById('l-sexo').value;
  const tel = document.getElementById('l-tel').value;
  const morada = document.getElementById('l-morada').value;
  const email = document.getElementById('l-email').value;
  const doc = document.getElementById('l-doc').value;
  const zonaPrev = document.getElementById('l-zonas-prev').value;
  const ultima = document.getElementById('l-ultima').value;
  const obs = document.getElementById('l-obs').value;
  const dataInicio = formatDate(document.getElementById('l-data-inicio').value);
  const foto = getRadio('l-foto');

  const yn = (name) => getRadio(name);

  // Session rows
  const tbody = document.getElementById('sessions-tbody');
  let sessionRows = '';
  let hasSession = false;
  tbody.querySelectorAll('tr').forEach(tr => {
    const inputs = tr.querySelectorAll('input');
    const vals = Array.from(inputs).map(i => i.value || '');
    if (vals.some(v => v)) {
      hasSession = true;
      sessionRows += `<tr>${vals.slice(0,10).map(v => `<td>${v}</td>`).join('')}</tr>`;
    }
  });

  const ynRows1 = [
    ['Algum problema grave de saúde ou doença?', yn('l-saude')],
    ['Sensibilidade da Pele?', yn('l-pele')],
    ['Gravidez?', yn('l-grav')],
    ['Amamentação?', yn('l-ama')],
    ['Tem prótese metálica, bypass, desfibrilhador ou cardioversor?', yn('l-prot')],
    ['Alterações de coagulação?', yn('l-coag')],
    ['Doenças neuromusculares?', yn('l-neuro')],
    ['Antecedentes oncológicos?', yn('l-onco')],
    ['Implantes recentes de colagénio na zona a tratar?', yn('l-cola')],
    ['Está a fazer tratamento estético na zona a tratar?', yn('l-trat')],
    ['Tem tatuagens na zona a tratar?', yn('l-tatu')],
    ['Tem dermatites (eczema, psoríase, fungos na pele)?', yn('l-derm')],
    ['Tem alergias?', yn('l-aler')],
    ['Tem problemas hormonais?', yn('l-horm')],
    ['Está a decorrer a menopausa ou andropausa?', yn('l-meno')],
    ['Tem doenças autoimunes?', yn('l-auto')],
    ['Tem grande concentração de varizes ou derrames?', yn('l-vari')],
    ['Tem acne activo?', yn('l-acne')],
    ['Tem cicatrizes?', yn('l-cica')],
    ['Tem epilepsia?', yn('l-epil')],
    ['Tem diabetes?', yn('l-diab')],
    ['Tem vitiligo?', yn('l-viti')],
  ];

  const ynRows2 = [
    ['Fez peeling mecânico nos últimos 15 dias?', yn('l-peel')],
    ['Fez medicação oral ou tópica que torne a pele sensível?', yn('l-med')],
    ['Esteve exposto ao sol nas últimas 48h?', yn('l-sol')],
    ['Utilizou creme depilatório nas últimas 72h?', yn('l-crem')],
    ['Utilizou autobronzeador nos últimos 5 dias?', yn('l-auto2')],
    ['Fez recentemente solário?', yn('l-sola')],
    ['Alguma vez fez tratamentos de depilação a laser?', yn('l-prev')],
  ];

  const makeYnRows = (rows) => rows.map(([label, val]) =>
    `<tr><td style="font-weight:600;">${label}</td><td class="yn-cell">${ynBox(val,'SIM')} ${ynBox(val,'NÃO')}</td></tr>`
  ).join('');

  const fotoBoxes = ['I','II','III','IV','V','VI'].map(f =>
    `<span class="print-fototipo-box${foto === f ? ' selected' : ''}">${f}</span>`
  ).join(' ');

  let sessionTable = '';
  if (hasSession) {
    sessionTable = `
      <div class="print-section-title" style="margin-top:4mm;">REGISTO DE SESSÕES</div>
      <table class="print-sessions-table">
        <thead><tr>
          <th>Sessão</th><th>Data</th><th>Zona</th><th>FotoTipo</th>
          <th>Pulso</th><th>Frequência</th><th>Energia</th><th>Duração</th>
          <th>Passagens</th><th>Resultados</th>
        </tr></thead>
        <tbody>${sessionRows || '<tr><td colspan="10">&nbsp;</td></tr>'}</tbody>
      </table>`;
  }

  // Add extra empty session rows for printing
  let emptyRows = '';
  const filledCount = tbody.querySelectorAll('tr').length;
  for (let i = filledCount; i < 10; i++) {
    emptyRows += `<tr>${Array(10).fill('<td>&nbsp;</td>').join('')}</tr>`;
  }

  return `<div class="print-doc">
    ${printHeader('FICHA DE ANAMNESE – DEPILAÇÃO A LASER DE DIODO')}
    <div style="margin-top:7mm;">
      <div style="display:flex;gap:8px;margin-bottom:4px;">
        ${fieldLine('Nome:', nome, 2)}
        ${fieldLine('Data de Nascimento:', nasc)}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:4px;">
        ${fieldLine('Idade:', idade)}
        ${fieldLine('Sexo:', sexo)}
        ${fieldLine('Telefone:', tel)}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:4px;">
        ${fieldLine('Morada:', morada, 2)}
        ${fieldLine('E-mail:', email, 1.5)}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:4px;">
        ${fieldLine('Documento de Identificação (NIF / BI / Passaporte):', doc)}
      </div>
    </div>

    <div class="print-section-title">AVALIAÇÃO</div>
    <table class="print-yn-table">${makeYnRows(ynRows1)}</table>

    <div class="print-section-title" style="margin-top:6mm;">AVALIAÇÃO PRÉ-TRATAMENTO</div>
    <table class="print-yn-table">${makeYnRows(ynRows2)}</table>

    <div style="margin-top:5mm;">
      <div style="display:flex;gap:8px;margin-bottom:4px;">
        ${fieldLine('Se SIM, em quais zonas?', zonaPrev, 2)}
        ${fieldLine('Última vez que fez?', ultima)}
      </div>
    </div>

    <div style="margin:5mm 0 3mm;font-weight:bold;font-size:9pt;color:#e0185e;">FOTOTIPO:</div>
    <div class="print-fototipo-row">${fotoBoxes}</div>

    <div style="margin-top:4mm;font-weight:bold;font-size:9pt;">Observações:</div>
    <div class="print-obs-box" style="min-height:15mm;">${obs || ''}</div>

    <div style="margin:8mm 0 4mm;font-size:9pt;color:#333;line-height:1.55;">
      Tomei conhecimento de todas as precauções a tomar e contra-indicações do tratamento que vou efectuar, tendo obtido informação completa e esclarecido todas as dúvidas relativamente ao mesmo. Assumo como meu compromisso comunicar em qualquer sessão, qualquer alteração da minha situação acima descrita.
    </div>

    <div class="print-sign-row">
      <div class="print-sign-block">
        <div class="print-sign-line"></div>
        <div class="print-sign-desc">Assinatura da Cliente</div>
      </div>
      <div class="print-sign-block">
        <div class="print-sign-line"></div>
        <div class="print-sign-desc">Assinatura da Técnica</div>
      </div>
      <div class="print-sign-block">
        <div class="print-sign-line">${dataInicio}</div>
        <div class="print-sign-desc">Data do Procedimento</div>
      </div>
    </div>
  </div>

  <div class="print-doc">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:4mm;">
      ${logoSVG()}
    </div>
    <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4mm;">
      <span style="font-style:italic;font-size:8pt;color:#888;">Data do ínicio:</span>
      <span style="font-weight:bold;">${dataInicio}</span>
    </div>
    <table class="print-sessions-table">
      <thead><tr>
        <th>Sessão</th><th>Data</th><th>Zona</th><th>FotoTipo</th>
        <th>Pulso</th><th>Frequência</th><th>Energia</th><th>Duração</th>
        <th>Passagens na Zona</th><th>Resultados Sessão Anterior</th>
      </tr></thead>
      <tbody>
        ${sessionRows || ''}
        ${emptyRows}
      </tbody>
    </table>
  </div>`;
}

/* ===== MAIN PRINT FUNCTION ===== */
function printForms() {
  let html = '';

  if (currentProc === 'pestanas') {
    html = generatePestanasPrint();
  } else if (currentProc === 'depilacao') {
    html = generateDepilacaoPrint();
  } else if (currentProc === 'laser') {
    html = generateLaserPrint();
  }

  const printArea = document.getElementById('print-area');
  printArea.innerHTML = html;
  printArea.style.display = 'block';

  setTimeout(() => {
    window.print();
    printArea.style.display = 'none';
  }, 300);
}
