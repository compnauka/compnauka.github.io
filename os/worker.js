/* Віконце на os.itnauka.org — окремий Cloudflare Worker (див. ../wrangler.os.toml, OS-DEPLOYMENT.md).
   Віконце лежить у папці /os/, але на піддомені має відкриватися з кореня: os.itnauka.org/.
   Програми сайту (Друкарик, тренажери, ігри) Віконце відкриває у вікнах за адресами /tools/…,
   /services/…, /games/…, /kids/… — їх пропускаємо як є, щоб вони були на тому самому домені
   (X-Frame-Options: SAMEORIGIN дозволяє iframe лише зі свого домену). Усе інше — файли з /os/. */

const SITE_PREFIXES = [
  '/tools/', '/games/', '/kids/', '/_shell/', '/images/', '/fonts/',
  '/services/digital_literacy/', '/services/ai/pryvitshi/',
  '/services/security_and_safety/cybersecurity_for_kids/',
  '/services/security_and_safety/cryptography_for_kids/',
  '/services/security_and_safety/critical_thinking_for_kids/',
  '/services/security_and_safety/search_engine/',
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (SITE_PREFIXES.some((p) => path.startsWith(p))) return env.ASSETS.fetch(request);

    // Старі або випадкові адреси з /os/ ведемо на корінь піддомену, щоб не було двох копій
    if (path === '/os' || path.startsWith('/os/')) {
      url.pathname = path.slice(3) || '/';
      return Response.redirect(url.toString(), 301);
    }
    if (path === '/index.html') {
      url.pathname = '/';
      return Response.redirect(url.toString(), 301);
    }

    const target = new URL(url);
    target.pathname = '/os' + path;
    const res = await env.ASSETS.fetch(new Request(target.toString(), request));

    // Перенаправлення від сховища файлів (напр. /os/css → /os/css/) перекладаємо назад без /os
    const loc = res.headers.get('Location');
    if (res.status >= 300 && res.status < 400 && loc) {
      const to = new URL(loc, target);
      if (to.pathname.startsWith('/os/') || to.pathname === '/os') {
        to.pathname = to.pathname.slice(3) || '/';
        return Response.redirect(new URL(to.pathname + to.search, url).toString(), res.status === 308 ? 308 : 307);
      }
    }
    return res;
  },
};
