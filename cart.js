// Servex pricing page: renders packages from /catalog.json, keeps a cart in
// localStorage, and starts Stripe Checkout through /api/checkout.
(function () {
  'use strict';
  var KEY = 'servex-cart-v1';
  var root = document.getElementById('pricing-root');
  if (!root) return;

  var fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  var items = {};      // id -> item (with company + accent)
  var cart = load();   // [{id, qty}]
  var drawer = document.getElementById('cart');
  var fab = document.getElementById('cart-fab');
  var lastFocus = null;
  var agree = document.getElementById('cart-agree');

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* private mode */ }
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function price(item) {
    return fmt.format(item.price) + (item.interval ? '<span class="per">/month</span>' : '<span class="per">one-time</span>');
  }
  function inCart(id) {
    for (var i = 0; i < cart.length; i++) if (cart[i].id === id) return cart[i];
    return null;
  }
  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }

  fetch('/catalog.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(render)
    .catch(function () {
      root.innerHTML = '<p class="pricing-error">Prices could not be loaded. Please refresh, or email <a href="mailto:info@servexgroup.com">info@servexgroup.com</a>.</p>';
    });

  function render(catalog) {
    var html = '';
    catalog.groups.forEach(function (g) {
      html += '<section class="price-group" id="' + esc(g.id) + '" aria-labelledby="h-' + esc(g.id) + '">' +
        '<div class="price-group-head"><p class="post-tag t-' + esc(g.accent) + '">' + esc(g.company) + '</p>' +
        '<h2 id="h-' + esc(g.id) + '">' + esc(g.label) + '</h2></div><div class="price-grid">';
      g.items.forEach(function (it) {
        it.company = g.company; it.accent = g.accent; items[it.id] = it;
        html += '<article class="price-card a-' + esc(g.accent) + (it.featured ? ' featured' : '') + '">' +
          (it.featured ? '<span class="badge">Most popular</span>' : '') +
          '<h3>' + esc(it.name) + '</h3>' +
          '<p class="price">' + price(it) + '</p>' +
          '<p class="summary">' + esc(it.summary) + '</p>' +
          '<ul class="features">' + it.features.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' +
          '<button type="button" class="btn add" data-id="' + esc(it.id) + '">Add to cart</button>' +
          '</article>';
      });
      html += '</div></section>';
    });
    root.innerHTML = html;
    // Drop cart entries for items that no longer exist.
    cart = cart.filter(function (l) { return items[l.id]; });
    save();
    update();
    if (/checkout=canceled/.test(location.search)) open();
  }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('button.add');
    if (!b) return;
    var id = b.getAttribute('data-id');
    if (!inCart(id)) {
      cart.push({ id: id, qty: 1 });
      save();
      track('add_to_cart', { currency: 'USD', value: items[id].price, items: [{ item_id: id, item_name: items[id].name, price: items[id].price, quantity: 1 }] });
    }
    update();
    open();
  });

  drawer.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (!t) return;
    var act = t.getAttribute('data-act');
    if (act === 'close') return close();
    if (act === 'checkout') return checkout(t);
    var id = t.getAttribute('data-id');
    var line = inCart(id);
    if (!line) return;
    var max = items[id].interval ? 1 : items[id].maxQty || 1;
    if (act === 'inc') line.qty = Math.min(max, line.qty + 1);
    if (act === 'dec') line.qty = line.qty - 1;
    if (act === 'remove' || line.qty < 1) cart = cart.filter(function (l) { return l.id !== id; });
    save();
    update();
  });

  fab.addEventListener('click', open);
  agree.addEventListener('change', function () {
    drawer.querySelector('[data-act="checkout"]').disabled = cart.length === 0 || !agree.checked;
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer.classList.contains('open')) close(); });

  function totals() {
    var once = 0, monthly = 0;
    cart.forEach(function (l) {
      var it = items[l.id];
      if (it.interval) monthly += it.price * l.qty; else once += it.price * l.qty;
    });
    return { once: once, monthly: monthly };
  }

  function update() {
    var count = cart.reduce(function (n, l) { return n + l.qty; }, 0);
    fab.hidden = count === 0;
    fab.querySelector('.count').textContent = count;
    root.querySelectorAll('button.add').forEach(function (b) {
      var on = !!inCart(b.getAttribute('data-id'));
      b.classList.toggle('added', on);
      b.textContent = on ? 'In cart ✓' : 'Add to cart';
    });
    var list = drawer.querySelector('.cart-lines');
    if (!cart.length) {
      list.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    } else {
      list.innerHTML = cart.map(function (l) {
        var it = items[l.id];
        var max = it.interval ? 1 : it.maxQty || 1;
        return '<div class="cart-line"><div><p class="cart-name">' + esc(it.name) + '</p>' +
          '<p class="cart-meta">' + esc(it.company) + ' · ' + price(it) + '</p></div>' +
          '<div class="cart-qty">' +
          (max > 1 ? '<button type="button" data-act="dec" data-id="' + esc(it.id) + '" aria-label="Decrease quantity">−</button><span>' + l.qty + '</span><button type="button" data-act="inc" data-id="' + esc(it.id) + '" aria-label="Increase quantity"' + (l.qty >= max ? ' disabled' : '') + '>+</button>' : '') +
          '<button type="button" class="remove" data-act="remove" data-id="' + esc(it.id) + '">Remove</button></div></div>';
      }).join('');
    }
    var t = totals();
    drawer.querySelector('.sum-once').textContent = fmt.format(t.once + t.monthly);
    drawer.querySelector('.sum-monthly-row').hidden = t.monthly === 0;
    drawer.querySelector('.sum-monthly').textContent = fmt.format(t.monthly) + '/month';
    drawer.querySelector('[data-act="checkout"]').disabled = cart.length === 0 || !agree.checked;
    drawer.querySelector('.cart-error').textContent = '';
  }

  function open() {
    lastFocus = document.activeElement;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cart-open');
    drawer.querySelector('.cart-close').focus();
  }
  function close() {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cart-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function checkout(btn) {
    var err = drawer.querySelector('.cart-error');
    err.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Opening secure checkout…';
    var t = totals();
    track('begin_checkout', { currency: 'USD', value: t.once + t.monthly, items: cart.map(function (l) { return { item_id: l.id, item_name: items[l.id].name, price: items[l.id].price, quantity: l.qty }; }) });
    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart, agreed: agree.checked })
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (res.ok && res.d.url) { location.href = res.d.url; return; }
        throw new Error(res.d.error || 'Checkout failed.');
      })
      .catch(function (e) {
        err.textContent = e.message && e.message.length < 200 ? e.message : 'Something went wrong. Please try again.';
        btn.disabled = false;
        btn.textContent = 'Checkout';
      });
  }
})();
