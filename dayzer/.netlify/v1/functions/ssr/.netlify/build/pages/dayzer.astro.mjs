/* empty css                                 */
import { e as createAstro, f as createComponent, n as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_DbXtrAO0.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_W-IpgH_B.mjs';
import { M as MECOverviewChart } from '../chunks/MECOverviewChart_Ck8gcaeK.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://gridstordayzer.netlify.app");
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const getBaseUrl = () => {
    if (Astro2.url.hostname === "gridstoranalytics.com") {
      return "https://gridstordayzer.netlify.app";
    }
    return Astro2.url.origin;
  };
  const baseUrl = getBaseUrl();
  let tb26Data;
  try {
    const response = await fetch(`${baseUrl}/api/tb26-calculation`);
    if (response.ok) {
      tb26Data = await response.json();
      console.log("TB2.6 data received:", tb26Data);
      console.log("Charging restrictions:", tb26Data?.chargingRestrictions);
      console.log("Current month:", tb26Data?.currentMonth);
    } else {
      console.error("Failed to fetch TB2.6 data:", response.status);
      tb26Data = null;
    }
  } catch (error) {
    console.error("Error fetching TB2.6 data:", error);
    tb26Data = null;
  }
  let weeklyCongestionData;
  try {
    const response = await fetch(`${baseUrl}/api/weekly-congestion`);
    if (response.ok) {
      weeklyCongestionData = await response.json();
    } else {
      console.error("Failed to fetch weekly congestion data:", response.status);
      weeklyCongestionData = null;
    }
  } catch (error) {
    console.error("Error fetching weekly congestion data:", error);
    weeklyCongestionData = null;
  }
  const formatTB26Value = (value) => value?.toFixed(2) || "X.XX";
  const formatCongestionValue = (value) => value?.toFixed(2) || "0.00";
  const getCongestionColorClass = (value) => {
    if (value >= 0) {
      if (value >= 50) return "bg-red-700 text-white";
      if (value >= 30) return "bg-red-600 text-white";
      if (value >= 15) return "bg-red-500 text-white";
      if (value >= 5) return "bg-red-400 text-white";
      if (value >= 1) return "bg-red-300 text-white";
      return "bg-red-100 text-gray-800";
    } else {
      const absValue = Math.abs(value);
      if (absValue >= 50) return "bg-blue-700 text-white";
      if (absValue >= 30) return "bg-blue-600 text-white";
      if (absValue >= 15) return "bg-blue-500 text-white";
      if (absValue >= 5) return "bg-blue-400 text-white";
      if (absValue >= 1) return "bg-blue-300 text-white";
      return "bg-blue-100 text-gray-800";
    }
  };
  const formatDateDisplay = (dateString) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Gridstor Market Ops" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="text-center space-y-8">  <h1 class="text-4xl font-bold text-gray-900 mb-8">Gridstor Market Ops</h1>  <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-6xl mx-auto"> <div class="text-center mb-8"> <h2 class="text-2xl font-semibold text-gray-800 mb-2">TB2.6 Performance Overview</h2> </div> <div class="grid grid-cols-1 md:grid-cols-3 gap-6">  <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center"> <h3 class="text-lg font-medium text-gray-700 mb-4">Last Year</h3> <div class="mb-4"> <div class="text-3xl font-bold text-gray-900">$${formatTB26Value(tb26Data?.lastYear?.totalTB26)}</div> <div class="text-sm text-gray-500">/kW-month</div> </div> <div class="space-y-2 text-sm"> <div class="flex justify-between"> <span class="text-gray-600">Energy:</span> <span class="font-medium text-gray-900">$${formatTB26Value(tb26Data?.lastYear?.energyTB26)}</span> </div> <div class="flex justify-between"> <span class="text-gray-600">Congestion:</span> <span class="font-medium text-gray-900">$${formatTB26Value(tb26Data?.lastYear?.congestionTB26)}</span> </div> </div> </div>  <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center"> <h3 class="text-lg font-medium text-gray-700 mb-4">Last Week</h3> <div class="mb-4"> <div class="text-3xl font-bold text-gray-900">$${formatTB26Value(tb26Data?.lastWeek?.totalTB26)}</div> <div class="text-sm text-gray-500">/kW-month</div> </div> <div class="space-y-2 text-sm"> <div class="flex justify-between"> <span class="text-gray-600">Energy:</span> <span class="font-medium text-gray-900">$${formatTB26Value(tb26Data?.lastWeek?.energyTB26)}</span> </div> <div class="flex justify-between"> <span class="text-gray-600">Congestion:</span> <span class="font-medium text-gray-900">$${formatTB26Value(tb26Data?.lastWeek?.congestionTB26)}</span> </div> </div> </div>  <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center"> <h3 class="text-lg font-medium text-gray-700 mb-4">This Week</h3> <div class="mb-4"> <div class="text-3xl font-bold text-gray-900">$${formatTB26Value(tb26Data?.thisWeek?.totalTB26)}</div> <div class="text-sm text-gray-500">/kW-month</div> </div> <div class="space-y-2 text-sm"> <div class="flex justify-between"> <span class="text-gray-600">Energy:</span> <span class="font-medium text-gray-900">$${formatTB26Value(tb26Data?.thisWeek?.energyTB26)}</span> </div> <div class="flex justify-between"> <span class="text-gray-600">Congestion:</span> <span class="font-medium text-red-600">${tb26Data?.thisWeek?.congestionTB26 >= 0 ? "$" : "-$"}${formatTB26Value(Math.abs(tb26Data?.thisWeek?.congestionTB26 || 0))}</span> </div> </div> </div> </div>  <div class="mt-6 text-center text-xs text-gray-500"> <p>Based on 60MW/160MWh battery with 86% round-trip efficiency, Day-Ahead values</p> </div> </div>  <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-6xl mx-auto"> <div class="text-center mb-6"> <h2 class="text-2xl font-semibold text-gray-800 mb-2">Charging Restrictions</h2> <p class="text-sm text-gray-600">${tb26Data?.currentMonth || (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p> </div> <div class="bg-gray-50 rounded-lg p-4 border border-gray-200"> <p class="text-sm text-gray-700 font-mono leading-relaxed text-center"> ${(tb26Data?.chargingRestrictions || [11, 41.3, 41.3, 41.3, 41.3, 41.3, 41.3, 11, 11, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 11, 11, 11, 11]).map((limit) => limit.toFixed(1)).join(", ")} </p> </div> <div class="mt-4 text-center text-xs text-gray-600"> <p>24 hourly values (Hour Beginning 0-23) representing maximum charging capacity (MW) for each hour</p> </div> </div>  <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-6xl mx-auto"> <div class="text-center mb-8"> <h2 class="text-2xl font-semibold text-gray-800 mb-2">Weekly Congestion</h2> </div> ${weeklyCongestionData ? renderTemplate`<div class="grid grid-cols-1 md:grid-cols-2 gap-8">  <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-6"> <h3 class="text-lg font-medium text-gray-700 text-center">
Last Week
</h3>  <div class="space-y-3"> <div class="flex justify-between text-sm text-gray-600"> <span class="font-medium">Top 2 Hours</span> </div> <div class="relative"> <div class="flex h-12 rounded-lg overflow-hidden shadow-sm border border-gray-200">  <div class="flex-1 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
Coming Soon
</div> </div> </div> </div>  <div class="space-y-3"> <div class="flex justify-between text-sm text-gray-600"> <span class="font-medium">Bottom 2 Hours</span> </div> <div class="relative"> <div class="flex h-12 rounded-lg overflow-hidden shadow-sm border border-gray-200">  <div class="flex-1 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
Coming Soon
</div> </div> </div> </div> </div>  <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-6"> <h3 class="text-lg font-medium text-gray-700 text-center">
This Week
</h3>  <div class="space-y-3"> <div class="flex justify-between text-sm text-gray-600"> <span class="font-medium">Top 2 Hours</span> </div> <div class="relative"> <div class="flex h-12 rounded-lg overflow-hidden shadow-sm border border-gray-200"> ${weeklyCongestionData.thisWeek.map((day) => renderTemplate`<div${addAttribute(`flex-1 text-xs flex items-center justify-center border-r border-white ${getCongestionColorClass(day.topHours.avgCongestion)}`, "class")} style="width: 14.3%;"${addAttribute(`${formatDateDisplay(day.date)}: $${formatCongestionValue(day.topHours.avgCongestion)}/MWh - ${day.topHours.constraintName}`, "title")}> ${formatDateDisplay(day.date)}<br>$${formatCongestionValue(day.topHours.avgCongestion)} </div>`)} </div> </div> </div>  <div class="space-y-3"> <div class="flex justify-between text-sm text-gray-600"> <span class="font-medium">Bottom 2 Hours</span> </div> <div class="relative"> <div class="flex h-12 rounded-lg overflow-hidden shadow-sm border border-gray-200"> ${weeklyCongestionData.thisWeek.map((day) => renderTemplate`<div${addAttribute(`flex-1 text-xs flex items-center justify-center border-r border-white ${getCongestionColorClass(day.bottomHours.avgCongestion)}`, "class")} style="width: 14.3%;"${addAttribute(`${formatDateDisplay(day.date)}: $${formatCongestionValue(day.bottomHours.avgCongestion)}/MWh - ${day.bottomHours.constraintName}`, "title")}> ${formatDateDisplay(day.date)}<br>$${formatCongestionValue(day.bottomHours.avgCongestion)} </div>`)} </div> </div> </div> </div> </div>` : renderTemplate`<div class="grid grid-cols-1 md:grid-cols-2 gap-8">  <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-6"> <h3 class="text-lg font-medium text-gray-700 text-center">Last Week</h3> <div class="flex items-center justify-center h-24 text-gray-500"> <p>Loading congestion data...</p> </div> </div> <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-6"> <h3 class="text-lg font-medium text-gray-700 text-center">This Week</h3> <div class="flex items-center justify-center h-24 text-gray-500"> <p>Loading congestion data...</p> </div> </div> </div>`}  <div class="mt-8 space-y-4"> <div class="flex flex-wrap justify-center gap-6 text-sm"> <div class="flex items-center gap-2"> <div class="w-4 h-4 bg-red-500 rounded"></div> <span class="text-gray-600">Positive Congestion</span> </div> <div class="flex items-center gap-2"> <div class="w-4 h-4 bg-blue-400 rounded"></div> <span class="text-gray-600">Negative Congestion</span> </div> </div> </div> </div>  <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-6xl mx-auto"> <div class="text-center mb-8"> <h2 class="text-2xl font-semibold text-gray-800 mb-2">MCE Overview</h2> </div> <div class="space-y-6">  ${renderComponent($$result2, "MECOverviewChart", MECOverviewChart, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/Administrator/new_website/dayzer/src/components/common/MECOverviewChart", "client:component-export": "default" })} </div> </div> </div> ` })}`;
}, "C:/Users/Administrator/new_website/dayzer/src/pages/dayzer/index.astro", void 0);

const $$file = "C:/Users/Administrator/new_website/dayzer/src/pages/dayzer/index.astro";
const $$url = "/dayzer";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
