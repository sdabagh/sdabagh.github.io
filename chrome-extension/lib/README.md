# Required Libraries for Batch Grading

## JSZip

The batch grading feature requires JSZip to extract student submissions from zip files.

### Download Instructions:

1. **Option 1: Download from CDN**
   - Visit: https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
   - Save the file as `jszip.min.js` in this directory

2. **Option 2: Download from GitHub**
   - Visit: https://github.com/Stuk/jszip/releases
   - Download the latest release
   - Extract `dist/jszip.min.js` to this directory

3. **Option 3: Use npm (if you have Node.js)**
   ```bash
   npm install jszip
   cp node_modules/jszip/dist/jszip.min.js chrome-extension/lib/
   ```

### Verify Installation:

After downloading, you should have:
```
chrome-extension/lib/jszip.min.js
```

The file should be approximately 100KB in size.

---

**Note**: The batch grading feature will not work without this library!
