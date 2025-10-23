import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';

function CalendarPicker({
  availableDates,
  selectedDate,
  onDateSelect,
  onClose
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const dateToShow = selectedDate || availableDates[0];
    return dateToShow ? new Date(dateToShow) : /* @__PURE__ */ new Date();
  });
  const formatDateForComparison = (date) => {
    const day = String(date.getDate());
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };
  const isDateAvailable = (date) => {
    const formattedDate = formatDateForComparison(date);
    return availableDates.includes(formattedDate);
  };
  const isDateSelected = (date) => {
    if (!selectedDate) return false;
    const formattedDate = formatDateForComparison(date);
    return selectedDate === formattedDate;
  };
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days2 = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days2.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days2.push(new Date(year, month, day));
    }
    return days2;
  };
  const handleDateClick = (date) => {
    if (isDateAvailable(date)) {
      const formattedDate = formatDateForComparison(date);
      onDateSelect(formattedDate);
      onClose();
    }
  };
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return /* @__PURE__ */ jsxs("div", { className: "bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: goToPreviousMonth,
          className: "p-1 hover:bg-gray-100 rounded",
          children: /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 19l-7-7 7-7" }) })
        }
      ),
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-gray-900", children: monthName }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: goToNextMonth,
          className: "p-1 hover:bg-gray-100 rounded",
          children: /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) })
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 gap-1 mb-2", children: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500 text-center py-2 font-medium", children: day }, day)) }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 gap-1 mb-4", children: days.map((date, index) => {
      if (!date) {
        return /* @__PURE__ */ jsx("div", { className: "p-2" }, index);
      }
      const available = isDateAvailable(date);
      const selected = isDateSelected(date);
      return /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => handleDateClick(date),
          disabled: !available,
          className: `
                p-2 text-sm rounded text-center transition-colors min-h-[32px]
                ${available ? selected ? "bg-blue-600 text-white font-medium shadow-md" : "bg-blue-50 border-2 border-blue-400 text-blue-800 hover:bg-blue-100 cursor-pointer font-bold" : "text-gray-300 cursor-not-allowed bg-gray-50"}
              `,
          children: date.getDate()
        },
        index
      );
    }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center pt-3 border-t border-gray-200", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-500", children: [
        availableDates.length,
        " available dates"
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onClose,
          className: "px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200",
          children: "Close"
        }
      )
    ] })
  ] });
}

export { CalendarPicker as C };
