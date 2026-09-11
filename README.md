# PDF to Text Converter (Texter)

A high-performance Visual Studio Code extension designed to convert PDF documents into structured plain text (.txt) and Markdown (.md) with an OCR-first hybrid extraction engine. Specially engineered to handle mixed-content documents including academic papers, lecture notes, mathematical formulas, physics notations, diagrams, and tabular data.

Author: ankitkumar25-rk  
Repository: https://github.com/ankitkumar25-rk/Texter

---

## Architecture Overview

Texter combines native PDF document stream parsing with in-browser optical character recognition and multi-tab interactive conversion:

```
+-------------------------------------------------------------------------+
|                           Input PDF Documents                           |
+-------------------------------------------------------------------------+
                                     |
           +-------------------------+-------------------------+
           |                                                   |
           v                                                   v
 [Stage 1: Text Layer Engine]                        [Stage 2: OCR Pass]
 pdfjs-dist stream extraction                        Tesseract.js Engine
 - Exact line & column layout                        - Greek & math symbols
 - Selectable text retention                         - Non-selectable glyphs
 - Natural paragraph spacing                         - Diagram formula capture
           |                                                   |
           +-------------------------+-------------------------+
                                     |
                                     v
                       [Stage 3: Hybrid Merger]
                       - Aligns text layers with OCR output
                       - Detects missing equation zones
                       - Wraps low-confidence blocks
                                     |
                                     v
                    [Stage 4: Formatter & Output]
                    - Delimits pages with '--- Page X ---'
                    - Supports .txt and .md outputs
                    - Interactive Visual Converter tabs
```

---

## Key Features

- **Multi-File Selection**: Select multiple PDF files in the Explorer (`Ctrl+Click` / `Shift+Click`) and convert or open all of them simultaneously.
- **Interactive Visual Converter (Side-by-Side Live Converter)**:
  - Open any PDF in a visual Chromium-powered Webview tab.
  - View high-DPI page rendering on the left, and live editable extracted text on the right.
  - Multi-tab support: Open multiple PDFs in separate tabs.
  - Live toggles for OCR, Confidence Threshold, and Page Markers.
- **1-Click Folder & Workspace Conversion**:
  - Right-click any folder -> **Convert PDFs in Folder to Text**.
  - Command Palette (`Ctrl+Shift+P` -> `PDF to Text: Convert`) -> batch-converts all PDFs across the workspace.
- **Hybrid OCR-First Mathematical Extraction**:
  - Automatically captures integrals ($\int$), summations ($\sum$), Greek characters ($\alpha, \beta, \Psi$), derivatives ($d/dx$), and physics notations ($\hbar$).
  - Low-confidence OCR guesses are wrapped in `[OCR-LOW-CONFIDENCE] ... [/OCR-LOW-CONFIDENCE]` markers.
- **Collision & Version Handling**: Interactive prompts to Overwrite, Skip, Create Versioned Copy (`notes_1.txt`), or apply Overwrite All / Skip All.
- **Dedicated Output Channel**: Detailed real-time logging inside the **PDF to Text** Output channel.

---

## Installation

### From Source
1. Clone the repository:
   ```bash
   git clone https://github.com/ankitkumar25-rk/Texter.git
   cd Texter
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the extension:
   ```bash
   npm run compile
   npm run bundle
   ```
4. Press `F5` in VS Code to launch the Extension Development Host.

### Packaging as Standalone VSIX
```bash
npx @vscode/vsce package
```
In VS Code, open Extensions (`Ctrl+Shift+X`), click the `...` menu, select **Install from VSIX...**, and choose `texter-1.0.0.vsix`.

---

## Usage

### 1. Interactive Visual Converter
1. In the VS Code Explorer, right-click any `.pdf` file.
2. Select **Open in Visual PDF Converter**.
3. Navigate pages, adjust confidence thresholds, click **Convert All Pages**, and click **Save to .txt**.

### 2. Single or Multi-File Conversion
1. In the Explorer, select one or multiple `.pdf` files (hold `Ctrl` or `Shift`).
2. Right-click and choose **Convert PDF to Text**.
3. The converted files are created directly next to the source PDFs.

### 3. Folder Batch Conversion (1 Click)
1. Right-click any directory containing `.pdf` files.
2. Choose **Convert PDFs in Folder to Text**.

### 4. Workspace Conversion
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS).
2. Type `PDF to Text: Convert` and hit Enter.

---

## Extension Settings

Configure the extension via VS Code Settings (`Ctrl+,` -> search `pdfToText`):

| Setting | Type | Default | Description |
|---|---|---|---|
| `pdfToText.outputFormat` | string (`txt` / `md`) | `"txt"` | Output file format: `txt` for exact high-fidelity text, or `md` for markdown. |
| `pdfToText.ocrAllPages` | boolean | `true` | When true, runs OCR across every page to capture embedded symbols and diagrams. |
| `pdfToText.ocrConfidenceThreshold` | number | `60` | Threshold score (0-100) below which OCR text is tagged with low-confidence markers. |
| `pdfToText.outputSuffix` | string | `""` | Optional suffix added to output filename before the extension (e.g. `_converted`). |
| `pdfToText.preservePageMarkers` | boolean | `true` | Insert visual page delimiter markers (`--- Page X ---`) between PDF pages. |

---

## Sample Output

```text
--- Page 1 ---

Lecture Notes on Probability–II

1. Random Variables
Let (Ω , F , P ) be a probability space.

Definition 1.1 (Random variable). A real-valued random variable is a measurable
function X : Ω → R; that is,
{ ω : X ( ω ) ≤ x } ∈ F for every x ∈ R.

Under low optical confidence:
[OCR-LOW-CONFIDENCE] ∫ f(x) dx ≈ 1 [/OCR-LOW-CONFIDENCE]


--- Page 2 ---

2. PMF, PDF, and CDF
The cumulative distribution function (CDF) is:
F_X(x) = P(X ≤ x)
```

---

## OCR Considerations for Math & Physics Content

1. **2D Equations**: Complex multi-level fractions and nested matrices are converted into linear text representations.
2. **Ambiguous Symbols**: Similar glyphs ($O$ vs $0$, $l$ vs $1$ vs $|$) are tagged with low-confidence markers when confidence is below the set threshold.
3. **Preserved Page Boundaries**: Cross-reference formulas against original PDF pages using the `--- Page X ---` delimiters.

---

## License

MIT License. Created by ankitkumar25-rk.
