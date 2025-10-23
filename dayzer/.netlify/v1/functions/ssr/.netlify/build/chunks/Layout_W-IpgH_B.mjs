import { e as createAstro, f as createComponent, h as addAttribute, o as renderHead, n as renderComponent, p as renderSlot, r as renderTemplate } from './astro/server_DbXtrAO0.mjs';
import 'kleur/colors';
import { jsx, jsxs } from 'react/jsx-runtime';
import React from 'react';

function NavigationBar({
  currentPath = "/",
  onSettingsClick,
  pageTitle,
  subNavLinks
}) {
  const [openDropdown, setOpenDropdown] = React.useState(null);
  const [closeTimeout, setCloseTimeout] = React.useState(null);
  const handleMouseEnter = (label) => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setOpenDropdown(label);
  };
  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setOpenDropdown(null);
    }, 200);
    setCloseTimeout(timeout);
  };
  const isHomePage = !pageTitle && !subNavLinks;
  const mainNavLinks = [
    { label: "Short Term Outlook", href: "/short-term-outlook" },
    { label: "Weekly Insight", href: "/short-term-outlook/weekly-insight" }
  ];
  const navigationLinks = subNavLinks || mainNavLinks;
  const getLinkClass = (href) => {
    const isActive = currentPath === href || currentPath.startsWith(href + "/");
    return `text-white hover:text-gray-300 transition-colors font-medium ${isActive ? "text-gray-300" : ""}`;
  };
  const isDropdownActive = (dropdown) => {
    return dropdown.some((item) => item.href && (currentPath === item.href || currentPath.startsWith(item.href + "/")));
  };
  const displayTitle = pageTitle || "GridStor Short Term Outlook";
  return /* @__PURE__ */ jsx("header", { className: "bg-gs-near-black text-white shadow-sm", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center py-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-8", children: [
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/",
          className: "flex items-center gap-3 text-xl font-bold hover:text-gray-300 transition-colors",
          "aria-label": "GridStor Short Term Outlook Home",
          children: [
            /* @__PURE__ */ jsx(
              "svg",
              {
                width: "32",
                height: "32",
                viewBox: "0 0 100 100",
                fill: "none",
                xmlns: "http://www.w3.org/2000/svg",
                className: "w-8 h-8",
                role: "presentation",
                children: /* @__PURE__ */ jsx(
                  "path",
                  {
                    d: "M55 10L30 55H50L45 90L70 45H50L55 10Z",
                    fill: "#06B6D4",
                    stroke: "#06B6D4",
                    strokeWidth: "2",
                    strokeLinejoin: "round"
                  }
                )
              }
            ),
            /* @__PURE__ */ jsx("span", { children: displayTitle })
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        "nav",
        {
          className: "hidden lg:flex items-center gap-8",
          role: "navigation",
          "aria-label": isHomePage ? "Primary" : "Secondary",
          children: navigationLinks.map((link, index) => {
            if (link.dropdown) {
              const hasActiveItem = isDropdownActive(link.dropdown);
              return /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "relative",
                  onMouseEnter: () => handleMouseEnter(link.label),
                  onMouseLeave: handleMouseLeave,
                  children: [
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        className: `text-white hover:text-gray-300 transition-colors font-medium flex items-center gap-1 ${hasActiveItem ? "text-gray-300" : ""}`,
                        children: [
                          link.label,
                          /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) })
                        ]
                      }
                    ),
                    openDropdown === link.label && /* @__PURE__ */ jsx(
                      "div",
                      {
                        className: "absolute top-full left-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200",
                        onMouseEnter: () => handleMouseEnter(link.label),
                        onMouseLeave: handleMouseLeave,
                        children: link.dropdown.map((dropdownItem) => {
                          const isActive2 = dropdownItem.href && (currentPath === dropdownItem.href || currentPath.startsWith(dropdownItem.href + "/"));
                          return /* @__PURE__ */ jsxs(
                            "a",
                            {
                              href: dropdownItem.href,
                              className: `block px-4 py-3 hover:bg-indigo-50 transition-colors group ${isActive2 ? "bg-indigo-50" : ""}`,
                              children: [
                                /* @__PURE__ */ jsx("div", { className: `text-sm font-medium group-hover:text-indigo-600 transition-colors ${isActive2 ? "text-indigo-600" : "text-gray-900"}`, children: dropdownItem.label }),
                                dropdownItem.description && /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500 mt-0.5", children: dropdownItem.description })
                              ]
                            },
                            dropdownItem.href
                          );
                        })
                      }
                    )
                  ]
                },
                link.label
              );
            }
            const isActive = link.href && (currentPath === link.href || currentPath.startsWith(link.href + "/"));
            return /* @__PURE__ */ jsx(
              "a",
              {
                href: link.href,
                className: getLinkClass(link.href),
                "aria-current": isActive ? "page" : void 0,
                children: link.label
              },
              link.href
            );
          })
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 ml-4", children: /* @__PURE__ */ jsx(
      "button",
      {
        className: "p-2 hover:bg-gs-gray-700 rounded-md transition-colors",
        "aria-label": "Settings",
        title: "Settings",
        onClick: onSettingsClick,
        children: /* @__PURE__ */ jsxs(
          "svg",
          {
            className: "w-5 h-5",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            xmlns: "http://www.w3.org/2000/svg",
            children: [
              /* @__PURE__ */ jsx(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: "2",
                  d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                }
              ),
              /* @__PURE__ */ jsx(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: "2",
                  d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                }
              )
            ]
          }
        )
      }
    ) })
  ] }) }) });
}

const $$Astro = createAstro("https://gridstordayzer.netlify.app");
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title, pageTitle, subNavLinks } = Astro2.props;
  const currentPath = Astro2.url.pathname;
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="icon" type="image/png" href="/new_favicon.png"><link rel="shortcut icon" href="/new_favicon.png"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>${title}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">${renderHead()}</head> <body class="bg-gs-off-white text-gs-gray-900 font-sans min-h-screen"> ${renderComponent($$result, "NavigationBar", NavigationBar, { "client:load": true, "currentPath": currentPath, "pageTitle": pageTitle, "subNavLinks": subNavLinks, "client:component-hydration": "load", "client:component-path": "C:/Users/Administrator/new_website/dayzer/src/components/ui/NavigationBar", "client:component-export": "NavigationBar" })} <main> ${renderSlot($$result, $$slots["default"])} </main> </body></html>`;
}, "C:/Users/Administrator/new_website/dayzer/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
