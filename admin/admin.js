/* Panel demonstracyjny JAKA Sp. z o.o.
   Działa wyłącznie w przeglądarce: dane zapisują się w localStorage tej przeglądarki i nie trafiają na serwer.
   Strona demonstracyjna (../index.html) odczytuje te same klucze, więc zmiany są na niej widoczne. */
(function () {
  'use strict';
  var K = { h: 'jakaDemo.houses', p: 'jakaDemo.photos', m: 'jakaDemo.messages', a: 'jakaDemo.auth' };
  var TYPES = ['Szeregowiec', 'Bliźniak', 'Wolnostojący'];
  var STATUS = { free: 'Wolny', res: 'Rezerwacja', sold: 'Sprzedany' };
  var MAX_UPLOADS = 6;

  var DEF_H = [
    ['A1', 'Wolnostojący', 117.83, 520, 4, 'free'], ['A2', 'Wolnostojący', 117.83, 540, 4, 'res'], ['A3', 'Wolnostojący', 117.83, 505, 4, 'free'], ['B1', 'Wolnostojący', 117.83, 560, 4, 'free'], ['B2', 'Wolnostojący', 117.83, 530, 4, 'sold'], ['B3', 'Wolnostojący', 117.83, 610, 4, 'free'], ['C1', 'Wolnostojący', 117.83, 495, 4, 'free'], ['C2', 'Wolnostojący', 117.83, 580, 4, 'res'], ['C3', 'Wolnostojący', 117.83, 700, 4, 'sold']
  ].map(function (r) { return { id: r[0], type: r[1], area: r[2], plot: r[3], rooms: r[4], price: null, status: r[5], published: true }; });

  var DEF_P = [
    ['img/dom-1.webp', 'Parterowy dom z grafitowym dachem kopertowym i garażem o zachodzie słońca'],
    ['img/dom-2.webp', 'Dom parterowy z grafitowym dachem kopertowym, białą elewacją i garażem, widok od strony podjazdu'],
    ['img/dom-3.webp', 'Dom parterowy z garażem w bryle i wejściem w niszy z szarą okładziną'],
    ['img/dom-4.webp', 'Dom parterowy z otwartym garażem, podjazdem z kostki i ogrodem'],
    ['img/dom-5.webp', 'Dom parterowy z dachem kopertowym wśród zieleni i brzóz']
  ].map(function (r) { return { src: r[0], alt: r[1], published: true }; });

  var app = document.getElementById('app');
  var state = { editId: null, flash: null };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function load(k, def) {
    try { var v = localStorage.getItem(k); if (v) return JSON.parse(v); } catch (e) {}
    return clone(def);
  }
  function save(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { flash('Pamięć przeglądarki jest pełna. Usuń kilka zdjęć i spróbuj ponownie.', 'err'); return false; }
  }
  function flash(msg, type) { state.flash = [msg, type || 'ok']; }
  function authed() { try { return sessionStorage.getItem(K.a) === '1'; } catch (e) { return false; } }
  function route() { return (location.hash.replace(/^#\/?/, '') || 'pulpit'); }
  function nf(n) { return new Intl.NumberFormat('pl-PL').format(n); }
  function imgSrc(s) { return /^data:/.test(s) ? s : '../' + s; }
  function nowStr() {
    var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  /* ---------- widoki ---------- */
  function shell(title, body) {
    var r = route();
    var msgs = load(K.m, []);
    var unread = msgs.filter(function (m) { return !m.read; }).length;
    var nav = [['pulpit', 'Pulpit'], ['domy', 'Domy'], ['zdjecia', 'Zdjęcia'], ['wiadomosci', 'Wiadomości' + (unread ? ' (' + unread + ')' : '')]];
    var f = state.flash; state.flash = null;
    document.title = title + ' | Panel demonstracyjny';
    return '<div class="demo-bar">Panel demonstracyjny: zmiany zapisują się tylko w tej przeglądarce i nie są widoczne dla innych osób. ' +
      '<button type="button" data-act="reset">Przywróć dane demo</button></div>' +
      '<header class="top"><strong>JAKA Sp. z o.o. <span>panel</span></strong><nav>' +
      nav.map(function (n) { return '<a href="#/' + n[0] + '"' + (r === n[0] ? ' class="on"' : '') + '>' + esc(n[1]) + '</a>'; }).join('') +
      '<a href="../index.html">Strona</a></nav><button class="link" data-act="logout">Wyloguj</button></header><main>' +
      (f ? '<div class="flash ' + esc(f[1]) + '">' + esc(f[0]) + '</div>' : '') + body + '</main>';
  }

  function viewLogin(err) {
    return '<div class="demo-bar">Panel demonstracyjny: dane są tylko przykładowe i zapisują się w Twojej przeglądarce.</div>' +
      '<div class="narrow card"><h1>Panel JAKA Sp. z o.o.</h1>' +
      '<div class="hint">To wersja pokazowa. Zaloguj się danymi: login <code>demo</code>, hasło <code>demo</code>.</div>' +
      (err ? '<div class="flash err">' + esc(err) + '</div>' : '') +
      '<form class="f" style="grid-template-columns:1fr" data-form="login">' +
      '<div><label>Login</label><input name="user" required autocomplete="username" autofocus></div>' +
      '<div><label>Hasło</label><input type="password" name="pass" required autocomplete="current-password"></div>' +
      '<button class="btn">Zaloguj</button></form>' +
      '<p class="muted" style="margin-top:16px"><a href="../index.html">Wróć na stronę</a></p></div>';
  }

  function viewDash() {
    var H = load(K.h, DEF_H), P = load(K.p, DEF_P), M = load(K.m, []);
    var c = function (s) { return H.filter(function (h) { return h.status === s && h.published !== false; }).length; };
    var rows = M.slice(0, 5).map(function (m) {
      return '<tr class="' + (m.read ? '' : 'unread') + '"><td>' + esc(m.date) + '</td><td>' + esc(m.name) + '</td><td>' + esc(m.house) + '</td><td>' +
        esc(m.message.length > 90 ? m.message.slice(0, 90) + '...' : m.message) + '</td></tr>';
    }).join('') || '<tr><td colspan="4" class="muted">Brak wiadomości. Wyślij zapytanie z formularza na stronie, a pojawi się tutaj.</td></tr>';
    return shell('Pulpit',
      '<h1>Pulpit</h1><div class="grid">' +
      '<div class="stat"><b>' + c('free') + '</b>wolnych domów</div><div class="stat"><b>' + c('res') + '</b>w rezerwacji</div>' +
      '<div class="stat"><b>' + c('sold') + '</b>sprzedanych</div>' +
      '<div class="stat"><b>' + P.filter(function (p) { return p.published !== false; }).length + '</b>zdjęć w galerii</div>' +
      '<div class="stat"><b>' + M.filter(function (m) { return !m.read; }).length + '</b>nowych wiadomości</div></div>' +
      '<h2>Ostatnie wiadomości</h2><table><tr><th>Data</th><th>Od</th><th>Dom</th><th>Treść</th></tr>' + rows + '</table>' +
      '<p class="muted" style="margin-top:20px">Spróbuj: zmień status domu w zakładce Domy, a potem otwórz <a href="../index.html#domy">stronę</a> i zobacz efekt.</p>');
  }

  function viewHouses() {
    var H = load(K.h, DEF_H), e = null;
    if (state.editId !== null) e = H[state.editId] || null;
    var v = function (k, d) { return e && e[k] != null ? e[k] : (d == null ? '' : d); };
    var rows = H.map(function (h, i) {
      return '<tr><td><b>' + esc(h.id) + '</b></td><td>' + esc(h.type) + '</td><td>' + esc(nf(h.area)) + '</td><td>' + esc(h.plot) + '</td><td>' + esc(h.rooms) + '</td>' +
        '<td>' + (h.price ? nf(h.price) + ' zł' : 'na zapytanie') + '</td><td><select data-act="status" data-i="' + i + '" style="width:auto">' +
        Object.keys(STATUS).map(function (k) { return '<option value="' + k + '"' + (h.status === k ? ' selected' : '') + '>' + STATUS[k] + '</option>'; }).join('') +
        '</select></td><td>' + (h.published !== false ? 'tak' : 'nie') + '</td><td class="row-actions">' +
        '<button class="btn ghost sm" data-act="edit" data-i="' + i + '">Edytuj</button> <button class="btn danger sm" data-act="del-house" data-i="' + i + '">Usuń</button></td></tr>';
    }).join('') || '<tr><td colspan="9" class="empty-row">Brak domów. Dodaj pierwszy poniżej.</td></tr>';
    var form = '<h2>' + (e ? 'Edycja domu ' + esc(e.id) : 'Dodaj dom') + '</h2><div class="card"><form class="f" data-form="house">' +
      '<div><label>Numer</label><input name="id" required maxlength="20" value="' + esc(v('id')) + '"></div>' +
      '<div><label>Typ</label><select name="type">' + TYPES.map(function (t) { return '<option' + (v('type') === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div>' +
      '<div><label>Powierzchnia (m²)</label><input type="number" name="area" required min="20" step="0.01" value="' + esc(v('area')) + '"></div>' +
      '<div><label>Działka (m²)</label><input type="number" name="plot" required min="0" value="' + esc(v('plot', 0)) + '"></div>' +
      '<div><label>Pokoje</label><input type="number" name="rooms" required min="1" value="' + esc(v('rooms')) + '"></div>' +
      '<div><label>Cena brutto (zł, puste = na zapytanie)</label><input type="number" name="price" min="0" value="' + esc(v('price')) + '"></div>' +
      '<div><label>Status</label><select name="status">' + Object.keys(STATUS).map(function (k) { return '<option value="' + k + '"' + (v('status', 'free') === k ? ' selected' : '') + '>' + STATUS[k] + '</option>'; }).join('') + '</select></div>' +
      '<div style="align-self:end"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="published" style="width:auto"' + (e ? (e.published !== false ? ' checked' : '') : ' checked') + '> Widoczny na stronie</label></div>' +
      '<div style="align-self:end"><button class="btn">Zapisz</button> ' + (e ? '<button type="button" class="btn ghost" data-act="cancel">Anuluj</button>' : '') + '</div></form></div>';
    return shell('Domy', '<h1>Domy</h1><div style="overflow-x:auto"><table><tr><th>Nr</th><th>Typ</th><th>m²</th><th>Działka</th><th>Pok.</th><th>Cena</th><th>Status</th><th>Widoczny</th><th></th></tr>' + rows + '</table></div>' + form);
  }

  function viewPhotos() {
    var P = load(K.p, DEF_P);
    var uploads = P.filter(function (p) { return /^data:/.test(p.src); }).length;
    var rows = P.map(function (p, i) {
      return '<tr><td><img class="thumb" src="' + esc(imgSrc(p.src)) + '" alt=""></td><td><input data-alt="' + i + '" value="' + esc(p.alt) + '" maxlength="255"></td>' +
        '<td class="ph-row"><button class="btn ghost sm" data-act="up" data-i="' + i + '" title="Wyżej">&uarr;</button><button class="btn ghost sm" data-act="down" data-i="' + i + '" title="Niżej">&darr;</button></td>' +
        '<td><label style="display:flex;gap:6px;align-items:center;margin:0"><input type="checkbox" data-pub="' + i + '" style="width:auto"' + (p.published !== false ? ' checked' : '') + '> tak</label></td>' +
        '<td class="row-actions"><button class="btn sm" data-act="save-photo" data-i="' + i + '">Zapisz opis</button> <button class="btn danger sm" data-act="del-photo" data-i="' + i + '">Usuń</button></td></tr>';
    }).join('') || '<tr><td colspan="5" class="empty-row">Brak zdjęć.</td></tr>';
    return shell('Zdjęcia',
      '<h1>Zdjęcia w galerii</h1><div class="card"><form class="f" data-form="photo">' +
      '<div><label>Plik (JPG, PNG, WebP). Zdjęcie zostanie zmniejszone do 1200 px.</label><input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required></div>' +
      '<div class="span2"><label>Opis zdjęcia (podpis i tekst alternatywny)</label><input name="alt" maxlength="255" placeholder="np. Dom A1, elewacja frontowa"></div>' +
      '<div style="align-self:end"><button class="btn">Dodaj zdjęcie</button></div></form>' +
      '<p class="muted" style="margin-top:10px">Dodane tu zdjęcia zostają tylko w tej przeglądarce (limit ' + MAX_UPLOADS + ', wgrano: ' + uploads + ').</p></div>' +
      '<div style="overflow-x:auto"><table><tr><th>Podgląd</th><th>Opis</th><th>Kolejność</th><th>Widoczne</th><th></th></tr>' + rows + '</table></div>');
  }

  function viewMessages() {
    var M = load(K.m, []);
    var rows = M.map(function (m, i) {
      return '<tr class="' + (m.read ? '' : 'unread') + '"><td>' + esc(m.date) + '</td><td>' + esc(m.name) + '<br>' + esc(m.email) + (m.phone ? '<br>' + esc(m.phone) : '') + '</td>' +
        '<td>' + esc(m.house) + '</td><td>' + esc(m.message).replace(/\n/g, '<br>') + '</td><td class="row-actions">' +
        '<button class="btn ghost sm" data-act="toggle-read" data-i="' + i + '">' + (m.read ? 'Nieprzeczytana' : 'Przeczytana') + '</button> ' +
        '<button class="btn danger sm" data-act="del-msg" data-i="' + i + '">Usuń</button></td></tr>';
    }).join('') || '<tr><td colspan="5" class="empty-row">Brak wiadomości. Wyślij zapytanie z formularza na <a href="../index.html#kontakt">stronie</a>, a pojawi się tutaj.</td></tr>';
    return shell('Wiadomości', '<h1>Wiadomości z formularza</h1><div style="overflow-x:auto"><table><tr><th>Data</th><th>Od</th><th>Dom</th><th>Wiadomość</th><th></th></tr>' + rows + '</table></div>');
  }

  function render() {
    if (!authed()) { app.innerHTML = viewLogin(); return; }
    var r = route();
    app.innerHTML = r === 'domy' ? viewHouses() : r === 'zdjecia' ? viewPhotos() : r === 'wiadomosci' ? viewMessages() : viewDash();
  }

  /* ---------- obsługa zdarzeń ---------- */
  function resize(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onerror = function () { reject(new Error('Nie udało się odczytać pliku.')); };
      fr.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('To nie jest poprawny obraz.')); };
        img.onload = function () {
          var w = Math.min(1200, img.width), h = Math.round(img.height * w / img.width);
          var c = document.createElement('canvas'); c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL('image/jpeg', 0.78));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  app.addEventListener('submit', function (ev) {
    var f = ev.target, kind = f.getAttribute('data-form');
    if (!kind) return;
    ev.preventDefault();
    var d = new FormData(f);
    if (kind === 'login') {
      if (String(d.get('user')).trim() === 'demo' && String(d.get('pass')) === 'demo') {
        try { sessionStorage.setItem(K.a, '1'); } catch (e) {}
        location.hash = '#/pulpit'; render();
      } else { app.innerHTML = viewLogin('Nieprawidłowy login lub hasło. W wersji pokazowej: demo / demo.'); }
      return;
    }
    if (kind === 'house') {
      var H = load(K.h, DEF_H);
      var code = String(d.get('id')).trim(), type = String(d.get('type')), area = Math.round(parseFloat(String(d.get('area')).replace(',', '.')) * 100) / 100, plot = parseInt(d.get('plot'), 10),
        rooms = parseInt(d.get('rooms'), 10), priceRaw = String(d.get('price')).trim(), status = String(d.get('status'));
      var price = priceRaw === '' ? null : parseInt(priceRaw, 10), err = null;
      if (!/^[A-Za-z0-9-]{1,20}$/.test(code)) err = 'Numer domu: 1 do 20 znaków (litery, cyfry, myślnik).';
      else if (TYPES.indexOf(type) < 0) err = 'Wybierz typ zabudowy.';
      else if (!(area >= 20 && area <= 1000) || !(plot >= 0 && plot <= 100000) || !(rooms >= 1 && rooms <= 20)) err = 'Sprawdź metraż, działkę i liczbę pokoi.';
      else if (!STATUS[status]) err = 'Nieprawidłowy status.';
      else if (price !== null && !(price >= 0 && price <= 100000000)) err = 'Nieprawidłowa cena.';
      if (err) { flash(err, 'err'); render(); return; }
      var rec = { id: code, type: type, area: area, plot: plot, rooms: rooms, price: price, status: status, published: d.get('published') !== null };
      if (state.editId !== null && H[state.editId]) { H[state.editId] = rec; flash('Zapisano zmiany.'); } else { H.push(rec); flash('Dom dodany.'); }
      if (save(K.h, H)) state.editId = null;
      render(); return;
    }
    if (kind === 'photo') {
      var P = load(K.p, DEF_P), file = d.get('photo');
      if (P.filter(function (p) { return /^data:/.test(p.src); }).length >= MAX_UPLOADS) { flash('Limit ' + MAX_UPLOADS + ' wgranych zdjęć w wersji pokazowej. Usuń któreś, aby dodać nowe.', 'err'); render(); return; }
      if (!file || !file.size) { flash('Wybierz plik ze zdjęciem.', 'err'); render(); return; }
      if (file.size > 12 * 1024 * 1024) { flash('Plik jest większy niż 12 MB.', 'err'); render(); return; }
      resize(file).then(function (url) {
        P.push({ src: url, alt: String(d.get('alt')).trim().slice(0, 255) || 'Zdjęcie inwestycji', published: true });
        if (save(K.p, P)) flash('Zdjęcie dodane. Zobaczysz je w galerii na stronie.');
        render();
      }).catch(function (e) { flash(e.message, 'err'); render(); });
    }
  });

  app.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t.getAttribute('data-act') === 'status') {
      var H = load(K.h, DEF_H), i = +t.getAttribute('data-i');
      if (H[i] && STATUS[t.value]) { H[i].status = t.value; if (save(K.h, H)) flash('Status zmieniony.'); render(); }
    }
  });

  app.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-act]');
    if (!b || b.tagName === 'SELECT') return;
    var act = b.getAttribute('data-act'), i = +b.getAttribute('data-i');
    var H, P, M;
    if (act === 'logout') { try { sessionStorage.removeItem(K.a); } catch (e) {} render(); return; }
    if (act === 'reset') {
      if (!confirm('Przywrócić dane demonstracyjne? Twoje zmiany, wgrane zdjęcia i wiadomości zostaną usunięte z tej przeglądarki.')) return;
      try { localStorage.removeItem(K.h); localStorage.removeItem(K.p); localStorage.removeItem(K.m); } catch (e) {}
      state.editId = null; flash('Przywrócono dane demonstracyjne.'); render(); return;
    }
    if (act === 'edit') { state.editId = i; render(); window.scrollTo(0, document.body.scrollHeight); return; }
    if (act === 'cancel') { state.editId = null; render(); return; }
    if (act === 'del-house') {
      H = load(K.h, DEF_H);
      if (H[i] && confirm('Usunąć dom ' + H[i].id + '?')) { H.splice(i, 1); if (save(K.h, H)) flash('Dom usunięty.'); state.editId = null; render(); }
      return;
    }
    if (act === 'up' || act === 'down') {
      P = load(K.p, DEF_P); var j = act === 'up' ? i - 1 : i + 1;
      if (P[i] && P[j]) { var tmp = P[i]; P[i] = P[j]; P[j] = tmp; save(K.p, P); render(); }
      return;
    }
    if (act === 'save-photo') {
      P = load(K.p, DEF_P);
      var altEl = app.querySelector('[data-alt="' + i + '"]'), pubEl = app.querySelector('[data-pub="' + i + '"]');
      if (P[i]) { P[i].alt = altEl.value.trim().slice(0, 255) || 'Zdjęcie inwestycji'; P[i].published = pubEl.checked; if (save(K.p, P)) flash('Zapisano.'); render(); }
      return;
    }
    if (act === 'del-photo') {
      P = load(K.p, DEF_P);
      if (P[i] && confirm('Usunąć zdjęcie z galerii?')) { P.splice(i, 1); if (save(K.p, P)) flash('Zdjęcie usunięte.'); render(); }
      return;
    }
    if (act === 'toggle-read') { M = load(K.m, []); if (M[i]) { M[i].read = !M[i].read; save(K.m, M); render(); } return; }
    if (act === 'del-msg') { M = load(K.m, []); if (M[i] && confirm('Usunąć wiadomość?')) { M.splice(i, 1); if (save(K.m, M)) flash('Wiadomość usunięta.'); render(); } }
  });

  window.addEventListener('hashchange', function () { state.editId = null; render(); });
  render();
})();
