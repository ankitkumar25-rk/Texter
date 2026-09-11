# Change Log

All notable changes to the "PDF to Text Converter" (Texter) extension will be documented in this file.

## [1.0.0] - Initial Release

### Core Capabilities
- Explorer Context Menu: Right-click single .pdf files or directories to convert to .txt.
- Workspace Batch Scan: Convert all PDF files in the active workspace via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
- Hybrid Extraction Engine:
  - High-fidelity text-layer extraction via pdfjs-dist.
  - Page rasterization and OCR processing via Tesseract.js.
  - Intelligent alignment between text layer and OCR for equations, symbols, diagrams, and tables.
- Low Confidence Flagging: Wrapped uncertain OCR text in `[OCR-LOW-CONFIDENCE] ... [/OCR-LOW-CONFIDENCE]` markers.
- Page Marker Delimiters: Configurable `--- Page X ---` delimiters to enable easy cross-referencing.
- File Collision Resolution: Interactive prompts for Overwrite, Skip, Create Versioned Copy (`notes_1.txt`), and batch overrides.
- Progress & Cancellation: VS Code progress notification with per-file / per-page tracking and cancel support.
- Dedicated Output Channel: Isolated logging for operations, warnings, and per-file error diagnosis.

### Configuration Options
- `pdfToText.ocrAllPages`: Enable OCR across all pages or image-only pages.
- `pdfToText.ocrConfidenceThreshold`: Configurable threshold score for confidence warnings (default 60).
- `pdfToText.outputSuffix`: Configurable filename suffix for generated text files.
- `pdfToText.preservePageMarkers`: Toggle insertion of page delimiter headers.
