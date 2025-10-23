/* empty css                                 */
import { e as createAstro, f as createComponent } from '../chunks/astro/server_DbXtrAO0.mjs';
import 'kleur/colors';
import 'clsx';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://gridstordayzer.netlify.app");
const prerender = false;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  return Astro2.redirect("/short-term-outlook");
}, "C:/Users/Administrator/new_website/dayzer/src/pages/index.astro", void 0);

const $$file = "C:/Users/Administrator/new_website/dayzer/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Index,
	file: $$file,
	prerender,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
