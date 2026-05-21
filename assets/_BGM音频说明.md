# 视频 BGM 音频文件说明

视频已配置**三层智能回退**，按优先级顺序自动加载：

```
优先级 A：assets/a_beautiful_life.mp3   ← 你需要自己放进来
优先级 B：assets/bgm_fallback.mp3        ← 已就位（Pixabay CC0 备份）
优先级 C：Web Audio 合成 BGM             ← 内置兜底，永远可用
```

视频在用户点击播放后会**自动检测并使用最高可用层级**，无需手动切换。

---

## 如何放置 Summer Kennedy - A Beautiful Life

### 方式一：网易云音乐 VIP（最快）

1. 在网易云搜「A Beautiful Life - Summer Kennedy」
2. 点击下载（需要 VIP）
3. 网易云缓存目录通常为：
   - **macOS**：`~/Library/Containers/com.netease.163music/Data/Caches/online_play_cache/`
   - 或 `~/Music/网易云音乐/`
4. 找到对应文件，**重命名为** `a_beautiful_life.mp3`
5. 放入：`/Users/alexguo/CodeBuddy/20260519230749/68haili_demo/assets/a_beautiful_life.mp3`

> ⚠️ 网易云缓存可能为加密格式（`.uc!` 或 `.ncm`），需要用「ncmdump」之类的工具解密成 mp3。

### 方式二：Apple Music + 音频转换

1. Apple Music 订阅用户可在客户端"添加到资料库"后离线下载
2. 在「音乐」App → 右键歌曲 → 创建 MP3 版本（或用 m4a → mp3 转换器）
3. 重命名为 `a_beautiful_life.mp3` 放入 assets/

### 方式三：合规方案 — 直接联系艺术家

Summer Kennedy 是独立音乐人（Spotify/Bandcamp 上有官方主页）：
- Instagram: `@summerkennedymusic`
- 给她发私信说明：复旦大学硕士生答辩用途、单次现场播放、非商业、会署名
- 很多独立音乐人对学生项目会**免费授权**

### 方式四：从 Bandcamp 购买高品质 mp3

如果她的歌在 Bandcamp 上架（约 ¥7—15 一首），购买后获得完整授权 mp3，最稳妥。

---

## 已就位的备份曲（B 档）

`bgm_fallback.mp3` 已在 assets/ 目录就位：

- 来源：**Pixabay Music**（CC0 完全免版权可商用）
- 格式：256 kbps · 44.1 kHz · Stereo
- 时长：约 2:27（够覆盖 32 秒视频）
- 风格：原声/温暖/轻盈

如果你最终没拿到 Summer Kennedy 的歌，**直接用这首也完全 OK**——版权安全、风格契合，比赛绝对不会出事。

---

## 视频底部水印

视频右上角会自动显示当前正在使用的曲名：

| 实际加载 | 显示内容 |
|---|---|
| A. a_beautiful_life.mp3 | `♪ A Beautiful Life · Summer Kennedy` |
| B. bgm_fallback.mp3      | `♪ Pixabay Acoustic · CC0 (Backup)`   |
| C. 合成兜底              | `SYNTHESIZED BGM`                     |

---

## 答辩现场建议

- **比赛前 24 小时务必预演 1 次**——确认 BGM 实际加载的是哪一档
- 浏览器**首次播放需要点击事件**（已在视频开场页处理：你点黄色播放按钮即可）
- 如果会场是大功率扬声器，**可在浏览器音量条单独压到 60—70%**（视频内已经做了 0.55 的音量天花板）
- 备一根 3.5mm 转 USB 的音频线，防止笔记本系统音频接驳问题
