// Cookie consent for servexgroup.com (Google Consent Mode v2).
// Loaded in <head> BEFORE the Google Analytics snippet so the defaults apply first.
// EEA, UK and Switzerland: everything off until the visitor chooses.
// Everywhere else: on by default; the visitor can decline in the banner.
(function () {
  'use strict';
  var KEY = 'servex-consent';
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  var STRICT = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'GB', 'CH'];
  function all(v) { return { ad_storage: v, ad_user_data: v, ad_personalization: v, analytics_storage: v }; }

  var strict = all('denied'); strict.region = STRICT; strict.wait_for_update = 500;
  gtag('consent', 'default', strict);
  gtag('consent', 'default', all('granted'));

  var choice = null;
  try { choice = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }
  if (choice === 'granted' || choice === 'denied') gtag('consent', 'update', all(choice));

  function save(v) {
    try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ }
    gtag('consent', 'update', all(v));
  }

  function banner() {
    var old = document.getElementById('consent-banner');
    if (old) { old.hidden = false; old.querySelector('button').focus(); return; }
    var el = document.createElement('div');
    el.id = 'consent-banner';
    el.className = 'consent';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Cookie consent');
    el.innerHTML = '<p>We use analytics cookies to understand how our site is used and improve it. ' +
      'See our <a href="/privacy">Privacy Policy</a>.</p>' +
      '<div class="consent-actions"><button type="button" class="btn consent-decline" data-consent="denied">Decline</button>' +
      '<button type="button" class="btn btn-primary" data-consent="granted">Accept</button></div>';
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-consent]');
      if (!b) return;
      save(b.getAttribute('data-consent'));
      el.hidden = true;
    });
    document.body.appendChild(el);
  }

  function ready() {
    if (choice !== 'granted' && choice !== 'denied') banner();
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-cookie-settings]')) { e.preventDefault(); banner(); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
