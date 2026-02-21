# 🎨 Extension Icons

The Chrome extension requires three icon sizes. You can create these or use placeholders.

## Required Icon Files

Create these files in the `icons/` folder:

```
chrome-extension/
└── icons/
    ├── icon16.png   (16x16 pixels)
    ├── icon48.png   (48x48 pixels)
    └── icon128.png  (128x128 pixels)
```

## Quick Solution: Create Simple Icons

### Option 1: Use Favicon Generator

1. Go to [favicon.io](https://favicon.io/favicon-generator/)
2. Enter text: "📊" or "MAT"
3. Choose colors:
   - Background: `#2C5F7C` (MAT300 blue)
   - Text: `#FFFFFF` (white)
4. Download the favicon package
5. Rename files:
   - `favicon-16x16.png` → `icon16.png`
   - `android-chrome-48x48.png` → `icon48.png` (or resize 192px to 48px)
   - `android-chrome-192x192.png` → resize to `icon128.png`

### Option 2: Use Online Image Converter

If you have one image:

1. Go to [resizeimage.net](https://resizeimage.net/)
2. Upload your image
3. Resize to 16x16, 48x48, and 128x128
4. Save each as `icon16.png`, `icon48.png`, `icon128.png`

### Option 3: Use Emoji Screenshot

1. Open a blank page in your browser
2. Paste this in console:
   ```javascript
   document.body.innerHTML = '<div style="font-size:128px">📊</div>';
   ```
3. Screenshot the emoji
4. Resize to different sizes using online tool

## Design Suggestions

**Theme**: Statistics & AI
- Color: `#2C5F7C` (MAT300 blue)
- Accent: `#D97D54` (terracotta)
- Icons: 📊 📈 🤖 🎓 ✓

**Simple Ideas**:
- Bar chart icon
- Checkmark + chart
- "MAT" text with chart background
- Robot + statistics symbol

## Temporary Solution

If you want to test without icons:

1. Create 3 blank PNG files (any size)
2. Name them `icon16.png`, `icon48.png`, `icon128.png`
3. Place in `icons/` folder

Chrome will show a default puzzle piece icon until you add proper graphics.

## Tools for Creating Icons

**Free Design Tools**:
- [Canva](https://www.canva.com) - Easy drag-and-drop
- [Figma](https://www.figma.com) - Professional design
- [Photopea](https://www.photopea.com) - Free Photoshop alternative

**AI Icon Generators**:
- [DALL-E](https://openai.com/dall-e) - Generate with prompt "statistics grading icon"
- [Midjourney](https://www.midjourney.com) - High-quality icons

**Icon Libraries**:
- [Flaticon](https://www.flaticon.com) - Free icons (attribution)
- [Material Icons](https://fonts.google.com/icons) - Google's icon set

---

**Pro Tip**: Keep it simple! A clean bar chart or checkmark is more recognizable than complex designs at small sizes.
