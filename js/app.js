/* Persistência simples via localStorage */
const LS_KEYS = {
  PRODUTOS: 'inv_produtos',
  CATEGORIAS: 'inv_categorias'
};

const $$ = (sel, ctx=document) => ctx.querySelector(sel);
const $$$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

function toast(msg, type='info', timeout=3000) {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  $$('#toaster').appendChild(t);
  setTimeout(() => t.remove(), timeout);
}

function currency(n) { return Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function saveJSON(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

/* Dados iniciais */
const seedCategorias = ['Geral', 'Acessórios', 'Eletrônicos', 'Papelaria'];
const seedProdutos = [
  { id: crypto.randomUUID(), sku: 'SKU-1001', nome: 'Caderno capa dura', categoria: 'Papelaria', preco: 18.9, quantidade: 25, status: 'ativo', descricao: '' },
  { id: crypto.randomUUID(), sku: 'SKU-1002', nome: 'Mouse óptico', categoria: 'Eletrônicos', preco: 59.9, quantidade: 8, status: 'ativo', descricao: 'USB, 1200dpi' },
  { id: crypto.randomUUID(), sku: 'SKU-1003', nome: 'Fone de ouvido', categoria: 'Acessórios', preco: 89.0, quantidade: 3, status: 'ativo', descricao: 'Intra-auricular' },
  { id: crypto.randomUUID(), sku: 'SKU-1004', nome: 'Cabo HDMI 2m', categoria: 'Eletrônicos', preco: 29.5, quantidade: 0, status: 'inativo', descricao: '' },
];

let state = {
  produtos: loadJSON(LS_KEYS.PRODUTOS, null) ?? seedProdutos,
  categorias: loadJSON(LS_KEYS.CATEGORIAS, null) ?? seedCategorias,
  page: 1,
  perPage: 8,
  search: '',
  filtroCategoria: '',
  filtroStatus: ''
};

function persist() {
  saveJSON(LS_KEYS.PRODUTOS, state.produtos);
  saveJSON(LS_KEYS.CATEGORIAS, state.categorias);
}

/* UI — navegação lateral */
$$$('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    $$$('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const view = btn.dataset.view;
    $$$('[id^=view-]').forEach(sec => sec.classList.add('hidden'));
    $$('#view-' + view).classList.remove('hidden');
    if (view === 'relatorios') updateRelatorios();
  });
});

/* Tema */
$('#toggleTheme')?.addEventListener?.('click', () => {
  document.body.classList.toggle('theme-light');
});

/* Filtros e busca */
$('#searchInput').addEventListener('input', (e) => { state.search = e.target.value.trim(); state.page = 1; render(); });
$('#filterCategoria').addEventListener('change', (e) => { state.filtroCategoria = e.target.value; state.page = 1; render(); });
$('#filterStatus').addEventListener('change', (e) => { state.filtroStatus = e.target.value; state.page = 1; render(); });

/* Paginação */
$('#prevPage').addEventListener('click', () => { if (state.page > 1) { state.page--; render(); } });
$('#nextPage').addEventListener('click', () => {
  const total = filteredProdutos().length;
  const last = Math.max(1, Math.ceil(total / state.perPage));
  if (state.page < last) { state.page++; render(); }
});

/* Modal de produto */
const modal = $('#produtoModal');
$('#btnNovo').addEventListener('click', () => openModal());
$('#fecharModal').addEventListener('click', () => modal.close());
$('#cancelarModal').addEventListener('click', () => modal.close());

$('#formProduto').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = getFormData();
  const editingId = $('#formProduto').dataset.editingId;
  if (editingId) {
    const idx = state.produtos.findIndex(p => p.id === editingId);
    state.produtos[idx] = { ...state.produtos[idx], ...data };
    toast('Produto atualizado com sucesso', 'success');
  } else {
    state.produtos.unshift({ id: crypto.randomUUID(), ...data });
    toast('Produto criado com sucesso', 'success');
  }
  persist();
  modal.close();
  render();
});

function openModal(produto=null) {
  $$('#modalTitulo').textContent = produto ? 'Editar produto' : 'Novo produto';
  $('#formProduto').dataset.editingId = produto?.id || '';
  // preencher categorias
  preencherSelectCategorias();
  // preencher campos
  $('#sku').value = produto?.sku ?? '';
  $('#nome').value = produto?.nome ?? '';
  $('#categoria').value = produto?.categoria ?? (state.categorias[0] || '');
  $('#preco').value = produto?.preco ?? '';
  $('#quantidade').value = produto?.quantidade ?? 0;
  $('#status').value = produto?.status ?? 'ativo';
  $('#descricao').value = produto?.descricao ?? '';
  modal.showModal();
}

function getFormData() {
  return {
    sku: $('#sku').value.trim(),
    nome: $('#nome').value.trim(),
    categoria: $('#categoria').value,
    preco: Number($('#preco').value),
    quantidade: Number($('#quantidade').value),
    status: $('#status').value,
    descricao: $('#descricao').value.trim(),
  };
}

/* Renderização da tabela */
function filteredProdutos() {
  const q = state.search.toLowerCase();
  return state.produtos.filter(p => {
    const matchSearch = !q || [p.nome, p.categoria, p.sku].some(s => (s||'').toLowerCase().includes(q));
    const matchCat = !state.filtroCategoria || p.categoria === state.filtroCategoria;
    const matchStatus = !state.filtroStatus || p.status === state.filtroStatus;
    return matchSearch && matchCat && matchStatus;
  });
}

function renderTabela() {
  const tbody = $('#tabelaProdutos tbody');
  tbody.innerHTML = '';
  const items = filteredProdutos();
  const total = items.length;
  const last = Math.max(1, Math.ceil(total / state.perPage));
  state.page = Math.min(state.page, last);
  const start = (state.page - 1) * state.perPage;
  const pageItems = items.slice(start, start + state.perPage);

  pageItems.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><code>${p.sku}</code></td>
      <td>
        <div style="display:flex;flex-direction:column;gap:2px">
          <strong>${p.nome}</strong>
          <small style="color:var(--text-muted)">${p.descricao || ''}</small>
        </div>
      </td>
      <td>${p.categoria}</td>
      <td>${currency(p.preco)}</td>
      <td>${p.quantidade}</td>
      <td>${estoqueBadge(p.quantidade)}</td>
      <td>${statusBadge(p.status)}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost" data-action="edit">Editar</button>
          <button class="btn btn-outline" data-action="del">Excluir</button>
        </div>
      </td>`;
    tr.querySelector('[data-action="edit"]').addEventListener('click', () => openModal(p));
    tr.querySelector('[data-action="del"]').addEventListener('click', () => excluir(p.id));
    tbody.appendChild(tr);
  });

  $('#count').textContent = `${total} ${total === 1 ? 'item' : 'itens'}`;
  $('#pageInfo').textContent = `${state.page} / ${last}`;

  $('#emptyState').classList.toggle('hidden', total !== 0);
}

function estoqueBadge(q) {
  const badge = document.createElement('span');
  badge.className = 'badge';
  if (q === 0) { badge.classList.add('danger'); badge.textContent = 'Esgotado'; }
  else if (q <= 5) { badge.classList.add('warn'); badge.textContent = 'Baixo'; }
  else { badge.classList.add('success'); badge.textContent = 'OK'; }
  return badge.outerHTML;
}

function statusBadge(s) {
  const span = document.createElement('span');
  span.className = 'badge';
  span.textContent = s === 'ativo' ? 'Ativo' : 'Inativo';
  if (s === 'ativo') span.classList.add('success');
  else span.classList.add('danger');
  return span.outerHTML;
}

function excluir(id) {
  if (!confirm('Tem certeza que deseja excluir?')) return;
  state.produtos = state.produtos.filter(p => p.id !== id);
  persist();
  render();
  toast('Produto excluído', 'warn');
}

/* Categorias */
function preencherSelectCategorias() {
  const select = $('#categoria');
  select.innerHTML = '';
  state.categorias.forEach(c => {
    const o = document.createElement('option');
    o.value = c; o.textContent = c;
    select.appendChild(o);
  });
}
function renderCategorias() {
  const ul = $('#listaCategorias');
  ul.innerHTML = '';
  state.categorias.forEach(cat => {
    const li = document.createElement('li');
    li.className = 'tag';
    li.innerHTML = `<span>${cat}</span><button title="Remover">×</button>`;
    li.querySelector('button').addEventListener('click', () => {
      // impedir remoção se houver produto usando
      const emUso = state.produtos.some(p => p.categoria === cat);
      if (emUso) return toast('Há produtos nesta categoria', 'danger');
      state.categorias = state.categorias.filter(c => c !== cat);
      persist(); renderCategorias(); preencherSelectCategorias(); render();
    });
    ul.appendChild(li);
  });
  // filtros
  const filter = $('#filterCategoria');
  filter.innerHTML = '<option value="">Todas categorias</option>';
  state.categorias.forEach(c => {
    const o = document.createElement('option');
    o.value = c; o.textContent = c;
    filter.appendChild(o);
  });
}
$('#formCategoria').addEventListener('submit', (e) => {
  e.preventDefault();
  const nome = $('#categoriaNome').value.trim();
  if (!nome) return;
  if (state.categorias.includes(nome)) return toast('Categoria já existe', 'warn');
  state.categorias.push(nome);
  $('#categoriaNome').value = '';
  persist(); renderCategorias(); preencherSelectCategorias(); toast('Categoria adicionada', 'success');
});

/* Relatórios (simplificado) */
function updateRelatorios() {
  const ativos = state.produtos.filter(p => p.status === 'ativo').length;
  const falta = state.produtos.filter(p => p.quantidade <= 5).length;
  const valor = state.produtos.reduce((acc, p) => acc + (p.preco * p.quantidade), 0);
  $('#statAtivos').textContent = String(ativos);
  $('#statFalta').textContent = String(falta);
  $('#statValor').textContent = currency(valor);
}

/* Exportar CSV */
$('#exportCsv').addEventListener('click', (e) => {
  const headers = ['id','sku','nome','categoria','preco','quantidade','status','descricao'];
  const rows = [headers.join(',')].concat(
    state.produtos.map(p => headers.map(h => JSON.stringify(p[h] ?? '')).join(','))
  );
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  e.target.href = url;
});

/* Helpers */
function $(sel) { return document.querySelector(sel); }

/* Primeira renderização */
function render() {
  renderTabela();
  renderCategorias();
  preencherSelectCategorias();
  updateRelatorios();
}
render();
