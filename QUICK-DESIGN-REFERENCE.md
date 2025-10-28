# Quick Design Reference - GST-Forecast Admin Pages

## Color Palette
```
Primary:   indigo-600 (#4F46E5) → indigo-700 (#4338CA)
Success:   green-600  → green-700
Warning:   yellow-600 → yellow-700
Danger:    red-600    → red-700/red-800
Secondary: gray-600   → gray-700/gray-800

Brand Colors (optional):
gs-blue:   #34D5ED
gs-dark:   #2A2A2A
```

## Component Classes Quick Copy

### Buttons
```jsx
// Primary Button
className="inline-flex justify-center items-center gap-2 rounded-md border border-transparent bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"

// Secondary Button
className="inline-flex justify-center items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"

// Success Button
className="inline-flex justify-center items-center gap-2 rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"

// Danger Button
className="inline-flex justify-center items-center gap-2 rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"

// Text Button
className="text-indigo-600 hover:text-indigo-800 font-medium"
```

### Cards
```jsx
// Standard White Card
className="bg-white rounded-lg shadow-md p-6"

// Card with Border
className="bg-white rounded-lg shadow-md p-6 border border-gray-200"

// Status Cards
className="bg-green-50 border border-green-200 rounded-lg shadow-md p-6"  // Success
className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-md p-6" // Warning
className="bg-red-50 border border-red-200 rounded-lg shadow-md p-6"     // Error
```

### Inputs
```jsx
// Text Input
className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"

// Select Dropdown
className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"

// Label
className="block text-sm font-medium text-gray-700 mb-1"
```

### Typography
```jsx
// Page Title (H1)
className="text-3xl font-bold text-gray-900 mb-6"

// Section Header (H2)
className="text-xl font-semibold text-gray-900 mb-4"

// Sub-section Header (H3)
className="text-lg font-medium text-gray-900 mb-4"

// Body Text
className="text-base text-gray-700"

// Muted Text
className="text-sm text-gray-500"

// Small Text
className="text-xs text-gray-400"
```

### Status Badges
```jsx
// Success Badge
className="inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold bg-green-600 text-white"

// Warning Badge
className="inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold bg-yellow-600 text-white"

// Error Badge
className="inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold bg-red-600 text-white"

// Info Badge
className="inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold bg-indigo-600 text-white"

// Alternative: Light badges for less critical info
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
```

### Modals
```jsx
// Modal Overlay
className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"

// Modal Content
className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"

// Modal Title
className="text-lg font-semibold text-gray-900 mb-4"
```

### Tables
```jsx
// Table Container
className="overflow-x-auto"

// Table
className="min-w-full divide-y divide-gray-200"

// Table Header
className="bg-gray-50"

// Table Header Cell
className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"

// Table Body
className="bg-white divide-y divide-gray-200"

// Table Cell
className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
```

### Layout
```jsx
// Page Container
className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"

// Grid Layout (2 columns)
className="grid grid-cols-1 md:grid-cols-2 gap-6"

// Grid Layout (3 columns)
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

// Flex Layout
className="flex items-center justify-between"

// Vertical Stack
className="space-y-4"

// Horizontal Stack
className="flex items-center gap-4"
```

### Section Dividers
```jsx
// Between Major Sections
<div className="border-t border-gray-200 my-8"></div>

// Within Cards
<div className="border-t border-gray-200 my-4"></div>
```

### Progress Bars
```jsx
// Container
className="w-full bg-gray-200 rounded-full h-2"

// Bar (Indigo)
className="bg-indigo-600 h-2 rounded-full transition-all duration-500"

// Bar (Green - success)
className="bg-green-600 h-2 rounded-full transition-all duration-500"
```

### Loading States
```jsx
// Spinning Loader
<svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
</svg>

// Loading Text
className="text-sm text-gray-500 animate-pulse"
```

## File Upload
```jsx
<input
  type="file"
  accept=".csv"
  className="block w-full text-sm text-gray-500
    file:mr-4 file:py-2 file:px-4
    file:rounded-md file:border-0
    file:text-sm file:font-semibold
    file:bg-indigo-50 file:text-indigo-700
    hover:file:bg-indigo-100"
/>
```

## Toast Notifications Setup

### Install
```bash
npm install react-hot-toast
```

### Add to Layout
```tsx
import { Toaster } from 'react-hot-toast';

<Toaster 
  position="top-right"
  toastOptions={{
    success: {
      duration: 3000,
      style: {
        background: '#10B981',
        color: '#fff',
      },
    },
    error: {
      duration: 4000,
      style: {
        background: '#EF4444',
        color: '#fff',
      },
    },
  }}
/>
```

### Usage
```tsx
import { toast } from 'react-hot-toast';

// Success
toast.success('Changes saved successfully!');

// Error
toast.error('Failed to save changes');

// Loading
const loadingToast = toast.loading('Saving...');
// Later...
toast.dismiss(loadingToast);
toast.success('Saved!');

// Custom
toast('Custom notification', {
  icon: '👏',
  style: {
    borderRadius: '10px',
    background: '#333',
    color: '#fff',
  },
});
```

## Common Patterns

### Status Indicator
```tsx
const statusConfig = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    badge: 'bg-green-600'
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    badge: 'bg-yellow-600'
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    badge: 'bg-red-600'
  }
};
```

### Hover Card
```tsx
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
```

### Selected State
```tsx
<div className={`p-4 rounded-md cursor-pointer transition-colors ${
  isSelected ? 'bg-indigo-50 border-2 border-indigo-500' : 'bg-white border-2 border-transparent hover:bg-gray-50'
}`}>
```

## Spacing Scale
```
p-1   = 0.25rem (4px)
p-2   = 0.5rem  (8px)
p-3   = 0.75rem (12px)
p-4   = 1rem    (16px)
p-6   = 1.5rem  (24px)
p-8   = 2rem    (32px)
p-12  = 3rem    (48px)

Same for margin (m-), gap (gap-), and space (space-x/y-)
```

## Responsive Breakpoints
```
sm:  640px  - Small devices
md:  768px  - Medium devices (tablets)
lg:  1024px - Large devices (desktops)
xl:  1280px - Extra large devices
2xl: 1536px - 2X large devices
```

## Z-Index Scale
```
z-0   = 0
z-10  = 10
z-20  = 20
z-30  = 30
z-40  = 40
z-50  = 50   (Modals, overlays)
```

## Common Emoji Icons
```
🚀 - Run/Launch
🔄 - Refresh/Reload
✓  - Success/Check
✗  - Error/Fail
⚠️  - Warning
🔍 - Search/View
📊 - Dashboard/Charts
⚙️  - Settings
📝 - Edit/Write
🗑️ - Delete
```

## Quick Test Checklist

When implementing:
- [ ] Use indigo-600 for primary actions (not blue)
- [ ] Add focus states to all interactive elements
- [ ] Use shadow-md for cards, shadow-sm for buttons
- [ ] Add proper hover states
- [ ] Use text-sm for button text
- [ ] Add gap-2 for icon + text in buttons
- [ ] Use rounded-lg for cards, rounded-md for inputs/buttons
- [ ] Add transition classes for smooth animations
- [ ] Use proper spacing (space-y-4 within sections, space-y-6 between sections)
- [ ] Add proper text colors (text-gray-900 for headings, text-gray-700 for body)

