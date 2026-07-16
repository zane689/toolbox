# Debug: pdf-download-fail

## Session Info
- **Session ID**: `pdf-download-fail`
- **Status**: [FIXED — pending user confirmation]
- **Started**: 2026-07-16
- **Target**: `/Users/mikey/CnTrae/toolbox/src/components/tools/BookmarkConverter.tsx`
- **Fix tool**: hidden iframe + `iframe.contentWindow.print()` (browser-native print-to-PDF)

## Symptoms
- 点击「下载为 PDF」按钮后**实际是有反馈的**：UI 上显示了 `PDF 生成失败: _this.font.createSubset is not a function`（minified 后的错误，用户没注意就以为"无反应"）。
- 字体资源 200 OK（4.9MB TTC），fetch 成功。
- 解析书签、上传文件都正常，问题只发生在 PDF 生成的 `pdfDoc.embedFont(fontBytes, { subset: true })` 阶段。

## Root Cause (Confirmed by Runtime Evidence)

使用 puppeteer-core + 本地 Chrome 150 实际复现，`/tool/bookmark-converter` 页面在点击「下载为 PDF」后抛出：

```
TypeError: _this.font.createSubset is not a function
```

链路：
1. `loadFont()` 成功 fetch `/fonts/NotoSansSC-Regular.ttf`（5177387 bytes，200 OK）。
2. `isTtcFont()` 把 magic `0x74746366` 识别为 TTC。
3. `pdfDoc.embedFont(fontBytes, { subset: true })` 走 fontkit 解析 TTC。但 `pdf-lib@1.17.1` + `@pdf-lib/fontkit@1.1.1` 在解析该 WenQuanYi Micro Hei TTC 时，fontkit 返回的字体对象上**没有 `createSubset` 方法**（subset 接口签名不匹配或 TTC 第一个 face 解析失败时落到降级路径，丢了这个方法）。
4. `subset: true` 路径内部 `this.font.createSubset(...)` 直接抛 TypeError。
5. catch 块 `console.error` + `setError`，但因为错误消息被 pdf-lib 内部闭包/压缩层包装成 `_this.font.createSubset is not a function` 这种 minified 形式，看上去像是"没反应"。

## Hypotheses Status
| # | Hypothesis | Status |
|---|---|---|
| H1 | Vite 拦截字体 / 字体 fetch 失败 | **REJECTED**（curl + puppeteer 都看到 200 OK） |
| H2 | pdf-lib 解析 TTC 失败 | **CONFIRMED**（`_this.font.createSubset is not a function`） |
| H3 | 4.9MB 字体 fetch+parse 太慢导致 UI 假死 | **REJECTED**（错误在 1s 内就抛出） |
| H4 | saveAs / 浏览器下载策略阻止 | **REJECTED**（错误在 PDF 阶段就抛了，到不了 saveAs） |
| H5 | 按钮 onClick 没绑定 | **REJECTED**（点击后立即进入 downloadAsPdf） |

## Fix Applied

**核心改动**：放弃 `pdf-lib + @pdf-lib/fontkit` 嵌入 TTC 字体的方案，改用浏览器原生 print-to-PDF。

修改文件：`/Users/mikey/CnTrae/toolbox/src/components/tools/BookmarkConverter.tsx`

具体变更：
1. 删除 `import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'`、`import fontkit from '@pdf-lib/fontkit'`。
2. 删除 `FONT_FILE`、`fontBytesCache`、`loadFont`、`isTtcFont` 辅助函数。
3. 删除 `PdfRow` 接口、`buildPdfRows` 函数。
4. 新增 `buildPrintRows` + `escapeHtml` 两个小工具。
5. **重写 `downloadAsPdf`**：
   - 把书签树渲染成 A4 排版 HTML（带中文系统字体栈：PingFang SC / Microsoft YaHei / WenQuanYi Micro Hei / Noto Sans CJK SC 等）。
   - 创建隐藏 iframe（`position: fixed; 0×0; aria-hidden`），`srcdoc` 注入 HTML。
   - iframe `load` 后用 `requestAnimationFrame` 等一帧布局/字体稳定，调用 `iframe.contentWindow.print()`。
   - 监听 `afterprint` 清理 iframe；同时设置 60s 兜底 timeout 防止 `afterprint` 不触发。
6. 失败处理保留原样：catch 块 `console.error` + `setError`，UI 行为不变。

不再依赖 `pdf-lib`、`@pdf-lib/fontkit` 嵌入字体；不再 fetch 4.9MB 字体文件；零字体依赖，中文由浏览器/系统字体处理。

## Verification (Post-Fix)

通过 puppeteer-core + 本地 Chrome 重新跑：

| 检查项 | 结果 |
|---|---|
| 页面 JS 错误 | `pageErrors: []` |
| UI 错误提示 | `errorText: null` |
| iframe `print()` 被调用 | `printCalled: 1` |
| 按钮恢复 `下载为 PDF`（非 `生成中...`） | ✅ |
| iframe 清理 | `iframeStillInDom: false` |
| 端到端：用 Chrome 真实渲染 → 写出 PDF | 123635 bytes，`%PDF-1.4` |
| `pdftotext` 提取 PDF 文本 | 中文、英文、缩进、嵌套文件夹全部正确（见下方） |

`pdftotext -layout` 输出（节选）：
```
Bookmarks Export
来源: test-bookmarks.html | 共 4 个链接 / 2 个文件夹
▸ 书签栏
  • 百度一下，你就知道
     https://www.baidu.com
  • GitHub: Let’s build from here
    https://github.com
  ▸ 子文件夹 - 中文测试
    • MDN Web Docs 中文
      https://developer.mozilla.org/zh-CN/
    • 知乎 - 有问题，就会有答案
      https://www.zhihu.com
```

## Notes
- 用户在前端看到 print 系统对话框（macOS 是「打印」对话框），选择「PDF → 存储为 PDF」即可。这是浏览器原生行为，符合用户预期。
- `pdf-lib` / `@pdf-lib/fontkit` 已在 `package.json` 中保留（用户没有要求卸载它们），如果后续要清理可以单独 `npm uninstall`。
- `@fontsource/noto-sans-sc` 仍然安装但未在 `BookmarkConverter.tsx` 中被引用；保留或卸载均可，与本修复无关。
