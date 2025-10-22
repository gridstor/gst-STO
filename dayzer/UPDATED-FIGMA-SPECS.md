# Updated Figma Design System Specifications

## Date
October 21, 2025

## Key Specification Changes

### ✨ New Design Principle Added

**"Subtle Gray Background"** - Light gray (#F9FAFB) site background with white cards for content

This is a significant change from the previous alternating section background approach.

---

## Implementation Changes Made

### 1. Background Structure ✅

**CHANGED FROM:**
```astro
<!-- Alternating section backgrounds -->
<section class="py-12 bg-white">...</section>
<section class="py-12 bg-gs-off-white">...</section>
<section class="py-12 bg-white">...</section>
```

**CHANGED TO:**
```astro
<!-- Gray page background with white card sections -->
<div class="py-12 space-y-12">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <section class="bg-white rounded-lg shadow-gs-sm p-8 mb-12">
      <!-- Section content -->
    </section>
    
    <section class="bg-white rounded-lg shadow-gs-sm p-8 mb-12">
      <!-- Section content -->
    </section>
  </div>
</div>
```

### 2. Visual Effect

**Before:** Alternating white/off-white sections extending full width

**After:** 
- Page has subtle gray background (#F9FAFB / gs-off-white)
- White sections appear as floating cards on the gray background
- Cards have rounded corners (`rounded-lg`)
- Cards have subtle shadows (`shadow-gs-sm`)
- Clear visual separation through the gray background showing between white cards

### 3. Section Structure

Each section now follows this pattern:
```astro
<section class="bg-white rounded-lg shadow-gs-sm p-8 mb-12">
  <div class="mb-8">
    <h2 class="text-2xl font-semibold text-gs-gray-900 mb-2">Section Title</h2>
    <p class="text-gs-gray-600">Section description</p>
  </div>
  
  <!-- Section content (cards, charts, etc.) -->
</section>
```

**Key attributes:**
- `bg-white` - White background for card
- `rounded-lg` - Rounded corners (8px)
- `shadow-gs-sm` - Subtle shadow
- `p-8` - Padding inside the card
- `mb-12` - Margin bottom for spacing between sections

### 4. Page Wrapper

```astro
<div class="py-12 space-y-12">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- All sections here -->
  </div>
</div>
```

- Outer div: `py-12 space-y-12` for vertical spacing
- Inner div: Container with max-width and horizontal padding
- The `space-y-12` creates consistent spacing between sections

---

## Design Benefits

### Visual Hierarchy
✅ **Clear section separation** - Gray background makes white cards stand out  
✅ **Floating card effect** - Creates depth and visual interest  
✅ **Professional appearance** - Modern, clean design pattern  

### User Experience
✅ **Better focus** - White cards draw attention to content  
✅ **Easier scanning** - Clear boundaries between sections  
✅ **Reduced eye strain** - Subtle gray is easier on the eyes than pure white  

### Technical
✅ **Consistent pattern** - All sections follow same structure  
✅ **Easy to maintain** - Clear, repeatable pattern  
✅ **Responsive friendly** - Works well on all screen sizes  

---

## Files Updated

### `/dayzer/src/pages/short-term-outlook/index.astro`
- Changed from alternating section backgrounds to white cards on gray background
- Added rounded corners and shadows to sections
- Wrapped all sections in proper container structure
- Maintained all existing functionality

### Layout (Already Correct)
- `/dayzer/src/layouts/Layout.astro` already has `bg-gs-off-white` on body
- This provides the gray background for all pages

---

## Visual Comparison

### Before (Alternating Backgrounds)
```
┌─────────────────────────────────────┐
│ White Section                       │
│                                     │
│ [Cards]                             │
│                                     │
├─────────────────────────────────────┤
│ Off-White Section                   │
│                                     │
│ [Cards]                             │
│                                     │
├─────────────────────────────────────┤
│ White Section                       │
│                                     │
│ [Cards]                             │
│                                     │
└─────────────────────────────────────┘
```

### After (Floating White Cards)
```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │ White Card Section              │ │
│ │                                 │ │
│ │ [Cards]                         │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │ Gray Background
│ ┌─────────────────────────────────┐ │
│ │ White Card Section              │ │
│ │                                 │ │
│ │ [Cards]                         │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ White Card Section              │ │
│ │                                 │ │
│ │ [Cards]                         │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Design System Alignment

This change aligns with the updated GridStor Design System principle:

> **"Subtle Gray Background - Light gray (#F9FAFB) site background with white cards for content"**

### Color Specifications
- **Page background:** `#F9FAFB` (gs-off-white)
- **Section cards:** `#FFFFFF` (white)
- **Shadow:** `0 1px 3px rgba(0,0,0,0.1)` (shadow-gs-sm)
- **Border radius:** `8px` (rounded-lg)

---

## Testing Checklist

- [x] Gray background visible between sections
- [x] White sections appear as floating cards
- [x] Rounded corners on all section cards
- [x] Subtle shadows on section cards
- [x] Proper spacing between sections (space-y-12)
- [x] Responsive on all screen sizes
- [x] All existing functionality preserved
- [x] No linter errors

---

## Next Steps

Consider applying this same pattern to other pages:
1. ✅ Homepage (Short Term Outlook) - **COMPLETED**
2. ⏳ CAISO System page
3. ⏳ Goleta page
4. ⏳ Likeday page
5. ⏳ Weekly Insight page

---

## Additional Notes

### Chart Components
The design system now includes chart components (LineChart, BarChart, AreaChart) with ChartCard wrapper. These are available but not yet implemented on the homepage.

### Consistency
All pages should follow this pattern for consistency:
- Gray page background
- White floating card sections
- Rounded corners and subtle shadows
- Consistent padding and spacing

---

## Summary

✅ **Updated homepage to match new Figma specification**  
✅ **Gray background with white floating card sections**  
✅ **Improved visual hierarchy and separation**  
✅ **Maintained all existing functionality**  
✅ **No breaking changes**

The homepage now perfectly matches the updated GridStor Design System specifications with the subtle gray background and white content cards.

