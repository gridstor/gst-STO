# GST-Forecast Repository Design System Analysis

## Overview
This document analyzes the design patterns, layout structure, and styling conventions used in the main `gst-forecast` repository, specifically focusing on admin pages and components.

---

## 1. Layout Structure

### Main Layout Component (`src/layouts/Layout.astro`)
- **Container Width**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Background Color**: `#f9fafb` (light gray background)
- **Font Family**: Inter (from Google Fonts)
- **Header**: White background with bottom border, height 16 (h-16)
- **Navigation**: Horizontal nav with hover states and active indicators

### Page Structure Pattern
```astro
<Layout title="Page Title">
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">Page Title</h1>
    
    <!-- Sections with dividers -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <!-- Content -->
    </div>
    
    <div class="border-t border-gray-200 my-8"></div>
    
    <!-- More sections -->
  </div>
</Layout>
```

---

## 2. Color System

### Brand Colors (from `tailwind.config.js`)
```js
colors: {
  'gs-dark': '#2A2A2A',
  'gs-blue': '#34D5ED',
  'gs-light': '#FFFFFF',
}
```

### Functional Colors (Tailwind defaults used)
- **Primary**: `indigo-500` (#4F46E5), `indigo-600`
- **Success**: `green-600`, `green-700`
- **Error/Danger**: `red-600`, `red-700`, `red-800`
- **Warning**: `yellow-500`, `yellow-600`
- **Neutral**: Gray scale (`gray-50` to `gray-900`)

### Usage Patterns
- **Backgrounds**: White cards on gray background
- **Borders**: `border-gray-200`, `border-gray-300`
- **Text**: `text-gray-700` for body, `text-gray-500` for muted, `text-gray-900` for headings

---

## 3. Typography

### Font Family
```css
font-family: 'Inter', system-ui, sans-serif;
```

### Heading Hierarchy
- **H1**: `text-3xl font-bold` (Page titles)
- **H2**: `text-xl font-semibold` (Section headers)
- **H3**: `text-lg font-medium` (Sub-section headers)
- **Body**: Default text size with `text-sm` or `text-base`

### Text Colors
- **Primary Text**: `text-gray-900` or `text-gray-700`
- **Secondary/Muted**: `text-gray-500` or `text-gray-400`
- **Labels**: `text-sm font-medium text-gray-700`

---

## 4. Card Components

### Standard Card Pattern
```jsx
<div className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-xl font-semibold mb-4">Card Title</h2>
  <div className="space-y-4">
    {/* Content */}
  </div>
</div>
```

### Variants
- **Basic Card**: `bg-white rounded-lg shadow-md p-6`
- **With Border**: `border border-gray-200 rounded-md p-4`
- **Hover State**: `hover:bg-gray-50 cursor-pointer`
- **Selected State**: `bg-indigo-50`

---

## 5. Form Elements

### Input Fields
```jsx
<input
  type="text"
  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
/>
```

### Select Dropdowns
```jsx
<select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
  <option>Option 1</option>
</select>
```

### Labels
```jsx
<label className="block text-sm font-medium text-gray-700">
  Field Label
</label>
```

### Form Layout
```jsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div>
    <label>Label</label>
    <input />
  </div>
  {/* More fields */}
</div>
```

---

## 6. Buttons

### Button Variants

**Primary Button**
```jsx
<button className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
  Primary Action
</button>
```

**Success Button**
```jsx
<button className="bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:ring-2 focus:ring-green-500 rounded-md">
  Success Action
</button>
```

**Danger Button**
```jsx
<button className="bg-red-600 text-white rounded hover:bg-red-700 px-4 py-2">
  Delete
</button>
```

**Text Button**
```jsx
<button className="text-blue-600 hover:text-blue-800">
  Edit
</button>
```

---

## 7. Tables

### Standard Table Pattern
```jsx
<table className="min-w-full">
  <thead>
    <tr>
      <th className="text-left py-2">Column 1</th>
      <th className="text-left py-2">Column 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td className="py-2">Value 1</td>
      <td className="py-2">Value 2</td>
    </tr>
  </tbody>
</table>
```

### Table Container
```jsx
<div className="max-h-96 overflow-y-auto">
  <table>{/* ... */}</table>
</div>
```

---

## 8. Modals & Overlays

### Modal Pattern
```jsx
{/* Modal Overlay */}
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  {/* Modal Content */}
  <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
    <h3 className="text-lg font-semibold mb-4">Modal Title</h3>
    <div className="mb-6">
      {/* Content */}
    </div>
    <div className="flex justify-end space-x-3">
      <button>Cancel</button>
      <button>Confirm</button>
    </div>
  </div>
</div>
```

---

## 9. Notifications

### Toast Notifications
- **Library**: `react-hot-toast`
- **Usage**:
  ```jsx
  import { toast } from 'react-hot-toast';
  
  toast.success('Operation successful');
  toast.error('Operation failed');
  ```

### Fixed Notifications (Alternative)
```jsx
<div className="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white bg-green-500">
  <span>Notification message</span>
</div>
```

---

## 10. Grid & Layout Patterns

### Responsive Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grid items */}
</div>
```

### Two-Column Layout
```jsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div>{/* Left column */}</div>
  <div>{/* Right column */}</div>
</div>
```

### Flex Layout
```jsx
<div className="flex justify-between items-center">
  <div>{/* Left content */}</div>
  <div>{/* Right content */}</div>
</div>
```

---

## 11. Spacing & Rhythm

### Vertical Spacing
- **Between sections**: `mb-6`, `mb-8`
- **Within cards**: `space-y-4`
- **Component margin**: `mt-4`, `mt-6`

### Horizontal Spacing
- **Button groups**: `space-x-3`, `space-x-4`
- **Inline elements**: `gap-4`, `gap-6`

### Padding
- **Cards**: `p-4`, `p-6`
- **Buttons**: `py-2 px-4`
- **Containers**: `px-4 py-8`

---

## 12. Interactive States

### Hover States
- **Links**: `hover:text-gray-700`
- **Buttons**: `hover:bg-indigo-700`
- **Cards**: `hover:bg-gray-50`

### Focus States
- **Inputs**: `focus:border-indigo-500 focus:ring-indigo-500`
- **Buttons**: `focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`

### Active/Selected States
- **Navigation**: `border-indigo-500 text-gray-900`
- **List items**: `bg-indigo-50`

---

## 13. Border & Shadow Patterns

### Borders
- **Card borders**: `border border-gray-200`
- **Dividers**: `border-t border-gray-200`
- **Input borders**: `border-gray-300`

### Shadows
- **Cards**: `shadow-md`
- **Buttons**: `shadow-sm`
- **Modals**: `shadow-lg`

### Rounded Corners
- **Cards**: `rounded-lg`
- **Inputs/Buttons**: `rounded-md`
- **Small elements**: `rounded`

---

## 14. Loading & Empty States

### Loading State
```jsx
{loading && (
  <div className="text-center py-4">
    <span>Loading...</span>
  </div>
)}
```

### Empty State
```jsx
<div className="text-gray-500 text-center py-4">
  No data available
</div>
```

---

## 15. File Upload Component

### File Input Styling
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

---

## Key Takeaways for Dayzer Implementation

### 1. Consistency
- Use the same color palette (indigo primary, red for danger, green for success)
- Maintain consistent spacing using Tailwind's spacing scale
- Use Inter font throughout

### 2. Component Structure
- Wrap admin pages in white cards with `rounded-lg shadow-md`
- Use grid layouts for responsive design
- Implement consistent hover and focus states

### 3. Typography Hierarchy
- Large headings for page titles (`text-3xl font-bold`)
- Section headers with `text-xl font-semibold`
- Muted text for secondary information

### 4. Interactive Elements
- Consistent button styling with hover states
- Focus rings on all interactive elements
- Clear visual feedback for actions

### 5. Error Handling
- Use toast notifications for user feedback
- Modal confirmations for destructive actions
- Clear error messages in red

---

## Comparison with Current Dayzer Implementation

### Similarities ✓
- Both use Tailwind CSS
- Similar card-based layouts
- White backgrounds on gray page

### Differences to Address
1. **Color Consistency**: Dayzer should use the same indigo primary color
2. **Spacing**: Ensure consistent use of mb-6, mb-8 for sections
3. **Typography**: Standardize heading sizes and weights
4. **Buttons**: Align button styling with main repo patterns
5. **Notifications**: Implement toast notifications like main repo

### Recommended Updates
1. Update button classes to match main repo
2. Standardize card padding and shadows
3. Ensure consistent form element styling
4. Add proper focus states to all interactive elements
5. Implement confirmation modals for destructive actions


