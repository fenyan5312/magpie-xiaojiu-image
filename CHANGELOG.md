# 更新日志

## 1.0.0（2026-11-24）

首个正式版本。插件身份、图标、发布信息与打包内容全部统一到「筱玖生图」名下。

### 新增

- **自定义插件图标**：注册 `magpie.icon`（base64 内联 SVG），Magpie Discover 与插件页顶部都会显示，
  不再是空白或首字母方块。配色为本项目蓝色系（`#5B9BFF → #2F76E8 → #1A4FB8`），
  构型为外环 + 中心星芒 + 三个节点。
- **`icon.svg` 源文件**：仓内保留，改配色不用反解 base64。
- **`LICENSE`**（MIT）：明确本仓库的授权条款。
- **发布信息**：`repository` / `homepage` / `bugs` 指向本仓库，`keywords` 补 `magpie-plugin`。

### 改进

- **侧栏品牌图标与「关于我们」logo 换成同一个 SVG**。原来两处都是纯文字「玖」，
  现在和 Magpie 面板里显示的插件图标是同一个视觉。
- **CSS 兼容 SVG 图标**：`.brand-icon` / `.about-logo` 加 `overflow: hidden` 与 `:has(svg)` 分支，
  SVG 自己画底色圆角，不再叠一层渐变背景和阴影。没换成 SVG 时外观与改动前完全一致。
- **打包白名单收紧**：`files` 补 `LICENSE` / `icon.svg`，并把 `python/` 里的测试脚本与
  `__pycache__` / `*.pyc` 排除。打包体积与文件数明显下降。

### 验证

| 项 | 结果 |
|---|---|
| `npm run check`（19 个 JS 语法检查） | 0 错 |
| `npm test` | **115 个用例全过** |
| GUI 真实启动 `/ui` | 200，HTML 含内联 SVG |
| `/assets/style.css` | 200，含 `:has(svg)` 与 `.brand-icon svg` |
| 图标 base64 解码 | 1383 字节，`</svg>` 结尾合法 |

> 注：`npm run test:python` 在 Python 3.8 下有一个已知失败
> （`test_web_text_worker.py` 用了 `dict[str, str]` 语法，需要 3.9+），与本版本改动无关。
