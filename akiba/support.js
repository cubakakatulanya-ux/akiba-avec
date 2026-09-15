/* Akiba AVEC — assistance Ubora (entreprise sociale) : appel, WhatsApp, e-mail */
'use strict';

const UBORA = {
  name: 'Ubora', tagline: 'Entreprise sociale',
  tel: '+243998275144', telShow: '0998 275 144', wa: '243998275144', email: 'contact@uborahub.com'
};
const UBORA_LOGO = '<img class="ubora-logo" src="ubora-logo.png" width="256" height="256" alt="Logo Ubora, entreprise sociale" decoding="async">';
const waLink = () => `https://wa.me/${UBORA.wa}?text=${encodeURIComponent('Bonjour Ubora, j\'ai besoin d\'aide avec Akiba AVEC.')}`;

function supportCard() {
  return `<section class="card stack support no-tr">
    <div class="row" style="gap:14px">${UBORA_LOGO}<div><span class="label">Assistance</span><b style="display:block;font-family:var(--f-display);font-size:1.15rem">Ubora</b><span class="small muted">Une question, un problème ? Appelez ou écrivez-nous.</span></div></div>
    <div class="support-actions">
      <a class="btn brand" href="tel:${UBORA.tel}">${ic('hand')} Appeler</a>
      <a class="btn wa" href="${waLink()}" target="_blank" rel="noopener">${ic('chat')} WhatsApp</a>
      <a class="btn ghost" href="mailto:${UBORA.email}?subject=${encodeURIComponent('Assistance Akiba AVEC')}">${ic('mail')} E-mail</a>
    </div>
    <p class="small muted" style="text-align:center"><b class="num">${UBORA.telShow}</b> · ${UBORA.email}</p>
  </section>`;
}
function uboraFooter() {
  return `<footer class="ubora-foot no-tr">${UBORA_LOGO}<span><span class="small muted">Assistance Ubora</span><br><a href="tel:${UBORA.tel}"><b class="num">${UBORA.telShow}</b></a> · <a href="${waLink()}" target="_blank" rel="noopener">WhatsApp</a> · <a href="mailto:${UBORA.email}">${UBORA.email}</a></span></footer>`;
}
ICONS.chat = '<path d="M20 12a8 8 0 0 1-11.8 7L4 20l1.1-4A8 8 0 1 1 20 12z"/><path d="M9 10h6M9 13h4"/>';
ICONS.mail = '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>';
