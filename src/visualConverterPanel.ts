import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { FileResolver } from './fileResolver';
import { OutputLogger } from './outputChannel';

export class VisualConverterPanel {
  public static panels: Map<string, VisualConverterPanel> = new Map();
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private disposables: vscode.Disposable[] = [];
  private logger = OutputLogger.getInstance();
  private currentPdfPath: string | null = null;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, initialPdfPath?: string) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.currentPdfPath = initialPdfPath || null;

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.html = this.getHtmlForWebview();

    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'saveText': {
            await this.handleSaveText(message.text, message.filePath);
            break;
          }
          case 'requestFileBytes': {
            await this.handleSendPdfBytes(message.filePath);
            break;
          }
          case 'log': {
            this.logger.info(`[Webview] ${message.message}`, 'VisualConverterPanel');
            break;
          }
          case 'notify': {
            if (message.type === 'error') {
              vscode.window.showErrorMessage(message.message);
            } else {
              vscode.window.showInformationMessage(message.message);
            }
            break;
          }
        }
      },
      null,
      this.disposables
    );

    if (initialPdfPath) {
      setTimeout(() => {
        this.handleSendPdfBytes(initialPdfPath);
      }, 500);
    }
  }

  public static createOrShow(extensionUri: vscode.Uri, pdfPath?: string): VisualConverterPanel {
    const key = pdfPath || 'default';
    const existing = VisualConverterPanel.panels.get(key);

    if (existing) {
      existing.panel.reveal();
      return existing;
    }

    const title = pdfPath ? `Convert: ${path.basename(pdfPath)}` : 'PDF Visual Converter';
    const panel = vscode.window.createWebviewPanel(
      'pdfToTextVisualConverter',
      title,
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dist'), vscode.Uri.joinPath(extensionUri, 'assets')],
      }
    );

    const instance = new VisualConverterPanel(panel, extensionUri, pdfPath);
    VisualConverterPanel.panels.set(key, instance);
    return instance;
  }

  public static render(extensionUri: vscode.Uri, pdfPath?: string): VisualConverterPanel {
    return this.createOrShow(extensionUri, pdfPath);
  }

  private async handleSendPdfBytes(filePath?: string): Promise<void> {
    const target = filePath || this.currentPdfPath;
    if (!target || !fs.existsSync(target)) {
      return;
    }

    this.currentPdfPath = target;
    try {
      const buffer = await fs.promises.readFile(target);
      const base64Data = buffer.toString('base64');
      const fileName = path.basename(target);

      this.panel.webview.postMessage({
        command: 'loadPdfData',
        base64: base64Data,
        fileName: fileName,
        filePath: target,
      });
    } catch (err) {
      this.logger.error(`Failed reading PDF file for visual converter: ${target}`, err, 'VisualConverterPanel');
      vscode.window.showErrorMessage(`Failed to open PDF: ${err}`);
    }
  }

  private async handleSaveText(text: string, customPath?: string): Promise<void> {
    const sourcePath = customPath || this.currentPdfPath;
    if (!sourcePath) {
      vscode.window.showErrorMessage('No PDF path associated with this text.');
      return;
    }

    const defaultTarget = FileResolver.getTargetFilePath(sourcePath, '', 'txt');
    try {
      await fs.promises.writeFile(defaultTarget, text, 'utf8');
      vscode.window.showInformationMessage(`Successfully saved: ${path.basename(defaultTarget)}`);
      this.logger.info(`Saved visual converter text to: ${defaultTarget}`, 'VisualConverterPanel');
    } catch (err) {
      this.logger.error(`Error saving converted text to ${defaultTarget}`, err, 'VisualConverterPanel');
      vscode.window.showErrorMessage(`Failed saving file: ${err}`);
    }
  }

  public dispose(): void {
    if (this.currentPdfPath) {
      VisualConverterPanel.panels.delete(this.currentPdfPath);
    } else {
      VisualConverterPanel.panels.delete('default');
    }
    this.panel.dispose();
    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private getHtmlForWebview(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PDF to Text Visual Converter</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>
  <style>
    :root {
      --bg: var(--vscode-editor-background, #1e1e1e);
      --fg: var(--vscode-editor-foreground, #d4d4d4);
      --card-bg: var(--vscode-sideBar-background, #252526);
      --border: var(--vscode-widget-border, #3c3c3c);
      --primary: var(--vscode-button-background, #0e639c);
      --primary-hover: var(--vscode-button-hoverBackground, #1177bb);
      --input-bg: var(--vscode-input-background, #3c3c3c);
      --input-fg: var(--vscode-input-foreground, #cccccc);
      --badge-bg: var(--vscode-badge-background, #4d4d4d);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--fg); height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
    
    header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 16px; background: var(--card-bg); border-bottom: 1px solid var(--border);
    }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .header-title { font-weight: 600; font-size: 14px; }
    .file-badge { background: var(--badge-bg); padding: 4px 8px; border-radius: 4px; font-size: 12px; font-family: monospace; }
    
    .toolbar-actions { display: flex; gap: 8px; align-items: center; }
    button {
      background: var(--primary); color: white; border: none; padding: 6px 14px;
      border-radius: 4px; font-size: 12px; font-weight: 500; cursor: pointer;
    }
    button:hover { background: var(--primary-hover); }
    button.secondary { background: var(--input-bg); color: var(--fg); border: 1px solid var(--border); }
    button.secondary:hover { background: #4a4a4a; }
    
    .main-container { display: flex; flex: 1; height: calc(100vh - 54px); overflow: hidden; }
    
    /* Left: PDF Preview */
    .preview-pane {
      flex: 1; border-right: 1px solid var(--border); display: flex; flex-direction: column;
      background: #181818; overflow: hidden;
    }
    .preview-nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 12px; background: var(--card-bg); border-bottom: 1px solid var(--border); font-size: 12px;
    }
    .canvas-container {
      flex: 1; overflow: auto; display: flex; justify-content: center; align-items: flex-start;
      padding: 20px; position: relative;
    }
    canvas {
      box-shadow: 0 4px 14px rgba(0,0,0,0.5); background: white; max-width: 100%; border-radius: 2px;
    }
    
    /* Right: Converted Text & Controls */
    .editor-pane { flex: 1; display: flex; flex-direction: column; background: var(--bg); }
    .editor-toolbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 12px; background: var(--card-bg); border-bottom: 1px solid var(--border); font-size: 12px;
    }
    .options-group { display: flex; gap: 14px; align-items: center; }
    label { display: flex; align-items: center; gap: 4px; cursor: pointer; user-select: none; }
    
    textarea {
      flex: 1; width: 100%; background: var(--bg); color: var(--fg); border: none;
      padding: 16px; font-family: "Cascadia Code", Consolas, "Courier New", monospace;
      font-size: 13px; line-height: 1.5; resize: none; outline: none; white-space: pre-wrap;
    }
    
    .status-bar {
      padding: 6px 12px; background: var(--card-bg); border-top: 1px solid var(--border);
      font-size: 11px; display: flex; justify-content: space-between; color: #888;
    }
    .stat-tags { display: flex; gap: 12px; }
    .stat-tag { background: #333; padding: 2px 6px; border-radius: 3px; color: #ccc; }
    
    /* Loading overlay */
    .loading-overlay {
      position: absolute; inset: 0; background: rgba(0,0,0,0.7);
      display: none; flex-direction: column; justify-content: center; align-items: center;
      gap: 12px; font-size: 13px; z-index: 100;
    }
    .spinner {
      width: 32px; height: 32px; border: 3px solid rgba(255,255,255,0.2);
      border-top-color: #0e639c; border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <header>
    <div class="header-left">
      <span class="header-title">PDF to Text Visual Converter</span>
      <span id="fileBadge" class="file-badge">Loading...</span>
    </div>
    <div class="toolbar-actions">
      <button class="secondary" id="btnExtractAll">Convert All Pages</button>
      <button class="secondary" id="btnExtractCurrent">Convert Current Page</button>
      <button id="btnSave">Save to .txt</button>
    </div>
  </header>

  <div class="main-container">
    <div class="preview-pane">
      <div class="preview-nav">
        <div style="display: flex; gap: 6px; align-items: center;">
          <button class="secondary" id="btnPrevPage">Previous</button>
          <span id="pageIndicator">Page 1 / 1</span>
          <button class="secondary" id="btnNextPage">Next</button>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button class="secondary" id="btnZoomOut">-</button>
          <span id="zoomLevel">100%</span>
          <button class="secondary" id="btnZoomIn">+</button>
        </div>
      </div>
      <div class="canvas-container">
        <canvas id="pdfCanvas"></canvas>
      </div>
    </div>

    <div class="editor-pane">
      <div class="editor-toolbar">
        <div class="options-group">
          <label><input type="checkbox" id="chkOcr" checked> Run OCR (Math & Diagrams)</label>
          <label><input type="checkbox" id="chkMarkers" checked> Page Markers</label>
        </div>
        <div>
          <label>Confidence Threshold: <input type="number" id="numThreshold" value="60" min="0" max="100" style="width: 45px; background: var(--input-bg); color: var(--input-fg); border: 1px solid var(--border); padding: 2px 4px; border-radius: 3px;"></label>
        </div>
      </div>
      <textarea id="textOutput" placeholder="Extracted text with formulas and OCR alignment will appear here..."></textarea>
      <div class="status-bar">
        <div class="stat-tags">
          <span class="stat-tag" id="statFormulas">Math Formulas: 0</span>
          <span class="stat-tag" id="statOcr">OCR Fallbacks: 0</span>
          <span class="stat-tag" id="statLowConf">Low Confidence: 0</span>
        </div>
        <span id="processStatus">Ready</span>
      </div>
    </div>
  </div>

  <div id="loadingOverlay" class="loading-overlay">
    <div class="spinner"></div>
    <span id="loadingMessage">Processing PDF and running OCR...</span>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    let pdfDoc = null;
    let currentPage = 1;
    let totalPages = 1;
    let zoomScale = 1.3;
    let currentFilePath = null;
    let pageResults = new Map();

    const canvas = document.getElementById('pdfCanvas');
    const ctx = canvas.getContext('2d');
    const textOutput = document.getElementById('textOutput');
    const fileBadge = document.getElementById('fileBadge');
    const pageIndicator = document.getElementById('pageIndicator');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingMessage = document.getElementById('loadingMessage');
    const processStatus = document.getElementById('processStatus');

    window.addEventListener('message', async (event) => {
      const msg = event.data;
      if (msg.command === 'loadPdfData') {
        currentFilePath = msg.filePath;
        fileBadge.textContent = msg.fileName;
        await loadPdfBase64(msg.base64);
      }
    });

    async function loadPdfBase64(base64) {
      showLoading('Loading PDF document...');
      try {
        const raw = atob(base64);
        const uint8Array = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) {
          uint8Array[i] = raw.charCodeAt(i);
        }

        const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
        pdfDoc = await loadingTask.promise;
        totalPages = pdfDoc.numPages;
        currentPage = 1;
        pageResults.clear();
        await renderCurrentPage();
        hideLoading();
      } catch (err) {
        hideLoading();
        vscode.postMessage({ command: 'notify', type: 'error', message: 'Failed loading PDF: ' + err });
      }
    }

    async function renderCurrentPage() {
      if (!pdfDoc) return;
      pageIndicator.textContent = \`Page \${currentPage} / \${totalPages}\`;
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale: zoomScale });
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    }

    function detectMathSymbols(text) {
      const mathOps = ['∫', '∑', '∏', '√', '∂', '∇', '≈', '≠', '≤', '≥', '±', '∞', '∈', '∀', '∃', 'α', 'β', 'γ', 'δ', 'θ', 'λ', 'μ', 'π', 'σ', 'ω', 'Ψ', 'ħ'];
      let count = 0;
      for (const op of mathOps) {
        if (text.includes(op)) count++;
      }
      return count;
    }

    async function processPage(pageNum) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      let textLayerLines = [];
      let currentLine = '';
      let lastY = null;
      
      for (const item of textContent.items) {
        const currentY = item.transform[5];
        if (lastY !== null && Math.abs(currentY - lastY) > 5) {
          if (currentLine.trim()) textLayerLines.push(currentLine.trim());
          currentLine = item.str;
        } else {
          currentLine += (currentLine ? ' ' : '') + item.str;
        }
        lastY = currentY;
      }
      if (currentLine.trim()) textLayerLines.push(currentLine.trim());
      
      let pageText = textLayerLines.join('\\n');
      let usedOcr = false;
      let lowConfCount = 0;
      let mathCount = detectMathSymbols(pageText);

      const runOcr = document.getElementById('chkOcr').checked;
      const threshold = parseInt(document.getElementById('numThreshold').value, 10) || 60;

      if (runOcr || pageText.trim().length === 0) {
        try {
          const viewport = page.getViewport({ scale: 2.0 });
          const ocrCanvas = document.createElement('canvas');
          ocrCanvas.width = viewport.width;
          ocrCanvas.height = viewport.height;
          const ocrCtx = ocrCanvas.getContext('2d');
          await page.render({ canvasContext: ocrCtx, viewport }).promise;

          processStatus.textContent = \`Running OCR on Page \${pageNum}...\`;
          const worker = await Tesseract.createWorker('eng');
          const ret = await worker.recognize(ocrCanvas);
          await worker.terminate();

          const ocrText = ret.data.text.trim();
          const ocrConfidence = ret.data.confidence || 0;

          if (pageText.trim().length === 0) {
            usedOcr = true;
            if (ocrConfidence < threshold) {
              pageText = \`[OCR-LOW-CONFIDENCE] \${ocrText} [/OCR-LOW-CONFIDENCE]\`;
              lowConfCount++;
            } else {
              pageText = ocrText;
            }
          } else {
            const extraMath = detectMathSymbols(ocrText);
            if (extraMath > 0 && !pageText.includes(ocrText.slice(0, 20))) {
              usedOcr = true;
              pageText += '\\n\\n' + (ocrConfidence < threshold ? \`[OCR-LOW-CONFIDENCE] \${ocrText} [/OCR-LOW-CONFIDENCE]\` : ocrText);
            }
          }
        } catch (e) {
          console.warn('OCR error on page ' + pageNum, e);
        }
      }

      return {
        pageNum,
        text: pageText,
        usedOcr,
        lowConfCount,
        mathCount,
      };
    }

    async function extractAllPages() {
      if (!pdfDoc) return;
      showLoading('Converting all pages with hybrid OCR...');
      let fullDoc = [];
      let totalMath = 0;
      let totalOcr = 0;
      let totalLow = 0;
      const preserveMarkers = document.getElementById('chkMarkers').checked;

      for (let p = 1; p <= totalPages; p++) {
        loadingMessage.textContent = \`Processing Page \${p} of \${totalPages}...\`;
        const res = await processPage(p);
        pageResults.set(p, res);

        totalMath += res.mathCount;
        if (res.usedOcr) totalOcr++;
        totalLow += res.lowConfCount;

        const section = preserveMarkers ? \`--- Page \${p} ---\\n\\n\${res.text}\` : res.text;
        fullDoc.push(section);
      }

      textOutput.value = fullDoc.join('\\n\\n\\n');
      document.getElementById('statFormulas').textContent = \`Math Formulas: \${totalMath}\`;
      document.getElementById('statOcr').textContent = \`OCR Fallbacks: \${totalOcr}\`;
      document.getElementById('statLowConf').textContent = \`Low Confidence: \${totalLow}\`;
      processStatus.textContent = 'Conversion complete.';
      hideLoading();
    }

    async function extractCurrentPageOnly() {
      if (!pdfDoc) return;
      showLoading(\`Converting Page \${currentPage}...\`);
      const res = await processPage(currentPage);
      pageResults.set(currentPage, res);
      
      const preserveMarkers = document.getElementById('chkMarkers').checked;
      textOutput.value = preserveMarkers ? \`--- Page \${currentPage} ---\\n\\n\${res.text}\` : res.text;
      hideLoading();
    }

    document.getElementById('btnPrevPage').addEventListener('click', async () => {
      if (currentPage > 1) {
        currentPage--;
        await renderCurrentPage();
      }
    });

    document.getElementById('btnNextPage').addEventListener('click', async () => {
      if (currentPage < totalPages) {
        currentPage++;
        await renderCurrentPage();
      }
    });

    document.getElementById('btnZoomIn').addEventListener('click', async () => {
      zoomScale = Math.min(3.0, zoomScale + 0.2);
      document.getElementById('zoomLevel').textContent = Math.round((zoomScale / 1.3) * 100) + '%';
      await renderCurrentPage();
    });

    document.getElementById('btnZoomOut').addEventListener('click', async () => {
      zoomScale = Math.max(0.6, zoomScale - 0.2);
      document.getElementById('zoomLevel').textContent = Math.round((zoomScale / 1.3) * 100) + '%';
      await renderCurrentPage();
    });

    document.getElementById('btnExtractAll').addEventListener('click', extractAllPages);
    document.getElementById('btnExtractCurrent').addEventListener('click', extractCurrentPageOnly);

    document.getElementById('btnSave').addEventListener('click', () => {
      const text = textOutput.value;
      if (!text.trim()) {
        vscode.postMessage({ command: 'notify', type: 'error', message: 'No converted text to save.' });
        return;
      }
      vscode.postMessage({ command: 'saveText', text, filePath: currentFilePath });
    });

    function showLoading(msg) {
      loadingMessage.textContent = msg || 'Processing...';
      loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
      loadingOverlay.style.display = 'none';
    }
  </script>
</body>
</html>`;
  }
}
