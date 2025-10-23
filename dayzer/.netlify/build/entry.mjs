import { renderers } from './renderers.mjs';
import { s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CvSoi7hX.mjs';
import { manifest } from './manifest_BcH2g7kC.mjs';
import { createExports } from '@astrojs/netlify/ssr-function.js';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/available-scenario-dates.astro.mjs');
const _page2 = () => import('./pages/api/available-scenarios.astro.mjs');
const _page3 = () => import('./pages/api/bottom-hours-frequency.astro.mjs');
const _page4 = () => import('./pages/api/combined-data-example.astro.mjs');
const _page5 = () => import('./pages/api/combined-load-forecast.astro.mjs');
const _page6 = () => import('./pages/api/congestion-plot.astro.mjs');
const _page7 = () => import('./pages/api/debug-lmp.astro.mjs');
const _page8 = () => import('./pages/api/debug-zone-data.astro.mjs');
const _page9 = () => import('./pages/api/generationmw-by-day.astro.mjs');
const _page10 = () => import('./pages/api/likeday-analysis.astro.mjs');
const _page11 = () => import('./pages/api/likeday-debug.astro.mjs');
const _page12 = () => import('./pages/api/likeday-secondary.astro.mjs');
const _page13 = () => import('./pages/api/lmp-components.astro.mjs');
const _page14 = () => import('./pages/api/lmp-forecast.astro.mjs');
const _page15 = () => import('./pages/api/lmp-last-week-forecast.astro.mjs');
const _page16 = () => import('./pages/api/load-forecast-accuracy.astro.mjs');
const _page17 = () => import('./pages/api/load-last-week-forecast.astro.mjs');
const _page18 = () => import('./pages/api/load-net-load-forecast.astro.mjs');
const _page19 = () => import('./pages/api/logout.astro.mjs');
const _page20 = () => import('./pages/api/mec-overview.astro.mjs');
const _page21 = () => import('./pages/api/net-load.astro.mjs');
const _page22 = () => import('./pages/api/net-load-with-caiso.astro.mjs');
const _page23 = () => import('./pages/api/peak-hours-frequency.astro.mjs');
const _page24 = () => import('./pages/api/renewable-forecast-accuracy.astro.mjs');
const _page25 = () => import('./pages/api/renewables-forecast.astro.mjs');
const _page26 = () => import('./pages/api/renewables-last-week-forecast.astro.mjs');
const _page27 = () => import('./pages/api/supply-stack.astro.mjs');
const _page28 = () => import('./pages/api/tb26-calculation.astro.mjs');
const _page29 = () => import('./pages/api/tb26-lmp-comparison.astro.mjs');
const _page30 = () => import('./pages/api/test-all-binding-constraints.astro.mjs');
const _page31 = () => import('./pages/api/test-congestion-data.astro.mjs');
const _page32 = () => import('./pages/api/test-secondary-db.astro.mjs');
const _page33 = () => import('./pages/api/test-unit-66038.astro.mjs');
const _page34 = () => import('./pages/api/weather-forecast.astro.mjs');
const _page35 = () => import('./pages/api/weather-last-week-forecast.astro.mjs');
const _page36 = () => import('./pages/api/week-overview.astro.mjs');
const _page37 = () => import('./pages/api/weekly-congestion.astro.mjs');
const _page38 = () => import('./pages/api/weekly-lmp-comparison.astro.mjs');
const _page39 = () => import('./pages/api/weekly-load-comparison.astro.mjs');
const _page40 = () => import('./pages/api/yes-energy-test.astro.mjs');
const _page41 = () => import('./pages/api/zone-demand.astro.mjs');
const _page42 = () => import('./pages/api/zone-lmp.astro.mjs');
const _page43 = () => import('./pages/dayzer.astro.mjs');
const _page44 = () => import('./pages/login.astro.mjs');
const _page45 = () => import('./pages/short-term-outlook/caiso-system.astro.mjs');
const _page46 = () => import('./pages/short-term-outlook/goleta.astro.mjs');
const _page47 = () => import('./pages/short-term-outlook/likeday.astro.mjs');
const _page48 = () => import('./pages/short-term-outlook/weekly-insight.astro.mjs');
const _page49 = () => import('./pages/short-term-outlook.astro.mjs');
const _page50 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/api/available-scenario-dates.ts", _page1],
    ["src/pages/api/available-scenarios.ts", _page2],
    ["src/pages/api/bottom-hours-frequency.ts", _page3],
    ["src/pages/api/combined-data-example.ts", _page4],
    ["src/pages/api/combined-load-forecast.ts", _page5],
    ["src/pages/api/congestion-plot.ts", _page6],
    ["src/pages/api/debug-lmp.ts", _page7],
    ["src/pages/api/debug-zone-data.ts", _page8],
    ["src/pages/api/generationmw-by-day.ts", _page9],
    ["src/pages/api/likeday-analysis.ts", _page10],
    ["src/pages/api/likeday-debug.ts", _page11],
    ["src/pages/api/likeday-secondary.ts", _page12],
    ["src/pages/api/lmp-components.ts", _page13],
    ["src/pages/api/lmp-forecast.ts", _page14],
    ["src/pages/api/lmp-last-week-forecast.ts", _page15],
    ["src/pages/api/load-forecast-accuracy.ts", _page16],
    ["src/pages/api/load-last-week-forecast.ts", _page17],
    ["src/pages/api/load-net-load-forecast.ts", _page18],
    ["src/pages/api/logout.ts", _page19],
    ["src/pages/api/mec-overview.ts", _page20],
    ["src/pages/api/net-load.ts", _page21],
    ["src/pages/api/net-load-with-caiso.ts", _page22],
    ["src/pages/api/peak-hours-frequency.ts", _page23],
    ["src/pages/api/renewable-forecast-accuracy.ts", _page24],
    ["src/pages/api/renewables-forecast.ts", _page25],
    ["src/pages/api/renewables-last-week-forecast.ts", _page26],
    ["src/pages/api/supply-stack.ts", _page27],
    ["src/pages/api/tb26-calculation.ts", _page28],
    ["src/pages/api/tb26-lmp-comparison.ts", _page29],
    ["src/pages/api/test-all-binding-constraints.ts", _page30],
    ["src/pages/api/test-congestion-data.ts", _page31],
    ["src/pages/api/test-secondary-db.ts", _page32],
    ["src/pages/api/test-unit-66038.ts", _page33],
    ["src/pages/api/weather-forecast.ts", _page34],
    ["src/pages/api/weather-last-week-forecast.ts", _page35],
    ["src/pages/api/week-overview.ts", _page36],
    ["src/pages/api/weekly-congestion.ts", _page37],
    ["src/pages/api/weekly-lmp-comparison.ts", _page38],
    ["src/pages/api/weekly-load-comparison.ts", _page39],
    ["src/pages/api/yes-energy-test.ts", _page40],
    ["src/pages/api/zone-demand.ts", _page41],
    ["src/pages/api/zone-lmp.ts", _page42],
    ["src/pages/dayzer/index.astro", _page43],
    ["src/pages/login.astro", _page44],
    ["src/pages/short-term-outlook/caiso-system/index.astro", _page45],
    ["src/pages/short-term-outlook/goleta.astro", _page46],
    ["src/pages/short-term-outlook/likeday.astro", _page47],
    ["src/pages/short-term-outlook/weekly-insight.astro", _page48],
    ["src/pages/short-term-outlook/index.astro", _page49],
    ["src/pages/index.astro", _page50]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./_noop-actions.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "99746129-5ee9-46bd-8300-0ff47dcccde1"
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (_start in serverEntrypointModule) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
