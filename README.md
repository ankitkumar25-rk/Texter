# PDF to Text Converter (Texter)

A high-performance Visual Studio Code extension designed to convert PDF documents into structured plain text files (.txt) with an OCR-first hybrid extraction engine. Specially built to handle mixed-content documents including academic papers, lecture notes, mathematical formulas, physics notations, diagrams, and tabular data.

Author: ankitkumar25-rk  
Repository: https://github.com/ankitkumar25-rk/Texter

---

## Features

- Explorer Context Menu Integration: Right-click any PDF file or folder in the VS Code Explorer and convert immediately.
- Workspace Batch Conversion: Run `PDF to Text: Convert Workspace` via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) to recursively discover and convert all PDF documents.
- Hybrid Extraction Engine:
  - First Pass: Extract high-fidelity selectable text layers using PDF parsing to preserve natural paragraph, line, and word structures.
  - Second Pass (OCR): Render page images and execute Optical Character Recognition (OCR) with Tesseract to capture embedded equations, diagrams, handwritten notes, and non-standard symbol fonts.
  - Intelligent Alignment & Merge: Align text layers with OCR output to detect missing blocks, equation zones, Greek symbols, and integral signs.
- Low Confidence Flagging: When OCR confidence falls below the configurable threshold, content is safely wrapped in markers such as `[OCR-LOW-CONFIDENCE] ... [/OCR-LOW-CONFIDENCE]` to alert the user without silently dropping data.
- Collision and Version Handling: Interactive prompts to overwrite, skip, or generate numbered copies (e.g. `document_1.txt`) when target files already exist.
- Progress & Cancellation: Real-time VS Code progress notifications with cancel support and per-page / per-file tracking.
- Dedicated Output Channel: Detailed logging and error tracing inside the dedicated "PDF to Text" VS Code Output Channel.

---

## Installation

### From VSIX Package
1. Download the packaged `.vsix` file from the repository releases.
2. Open VS Code.
3. Open the Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`).
4. Click the Views and More Actions menu (`...`) at the top right of the Extensions view.
5. Select "Install from VSIX..." and choose the downloaded file.

### From Source
1. Clone the repository:
   ```bash
   git clone https://github.com/ankitkumar25-rk/Texter.git
   cd Texter
   ```
2. Install project dependencies:
   ```bash
   npm install
   ```
3. Compile the extension:
   ```bash
   npm run compile
   ```
4. Press `F5` in VS Code to launch the Extension Development Host.

---

## Usage

### Converting Single Files or Folders
1. In the VS Code File Explorer, right-click any `.pdf` file or a directory containing `.pdf` files.
2. Select **Convert PDF to Text** from the context menu.
3. If an existing `.txt` file is found with the same name, choose whether to **Overwrite**, **Skip**, or **Create Versioned Copy**.
4. The generated `.txt` file will be created in the same folder as the source PDF.

### Converting Entire Workspace
1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS) to open the Command Palette.
2. Type and run `PDF to Text: Convert Workspace`.
3. Track conversion progress in the bottom-right notification popup.

---

## Extension Settings

This extension contributes the following configuration settings under `pdfToText`:

| Setting | Type | Default | Description |
|---|---|---|---|
| `pdfToText.ocrAllPages` | boolean | `true` | When enabled, runs OCR across every page to capture embedded symbols and diagrams. |
| `pdfToText.ocrConfidenceThreshold` | number | `60` | Threshold percentage below which OCR text is tagged with low-confidence markers. |
| `pdfToText.outputSuffix` | string | `""` | Optional suffix appended to output filename before the extension (e.g. `_converted`). |
| `pdfToText.preservePageMarkers` | boolean | `true` | Insert visual page delimiter markers such as `--- Page X ---` between PDF pages. |

---

## OCR Limitations for Mathematical and Physics Content

While the hybrid OCR engine attempts to capture mathematical and physics notations, please note the following technical considerations:

1. 2D Layout Notations: Complex multi-line fractions, nested square roots, tensors, and multi-dimensional matrices may be flattened into linear text representations.
2. Symbol Ambiguity: Similar characters (such as uppercase letter `O` versus digit `0`, lowercase letter `l` versus digit `1` versus pipe `|`, and Latin `v` versus Greek `\nu`) may occasionally require manual verification.
3. Low-Confidence Markers: Low-confidence formulas will appear between `[OCR-LOW-CONFIDENCE]` and `[/OCR-LOW-CONFIDENCE]` tags. Users are advised to cross-reference with the original document using the preserved `--- Page X ---` delimiters.
4. Handwritten Notes: Highly cursive or irregular handwriting may yield degraded OCR accuracy compared to clean typeset documents.

---

## License

MIT License. Created by ankitkumar25-rk.
