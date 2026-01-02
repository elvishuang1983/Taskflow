# EmailJS 郵件亂碼修復指南

## 問題說明

![郵件亂碼問題](C:/Users/elvis/.gemini/antigravity/brain/86acfda5-4547-4623-8a37-1dd875702ffe/uploaded_image_1767337106272.png)

郵件中的中文顯示為亂碼，這是因為 EmailJS 模板缺少正確的 UTF-8 編碼宣告。

---

## 🔧 修復步驟

### 步驟 1：登入 EmailJS 後台

1. 前往：https://dashboard.emailjs.com/
2. 使用您的帳號登入

### 步驟 2：找到您的 Email Template

1. 點擊左側選單的 **Email Templates**
2. 找到您在 TaskFlow Pro 中設定的 Template ID
3. 點擊該模板進入編輯頁面

### 步驟 3：使用提供的模板

我已經為您準備了一個完整的 HTML 模板，包含：
- ✅ 正確的 UTF-8 編碼宣告
- ✅ 中文字體支援
- ✅ 現代化的郵件設計
- ✅ 響應式佈局

**模板檔案位置：**
`emailjs-template.html`

### 步驟 4：複製模板內容

1. 開啟 `emailjs-template.html` 檔案
2. 複製全部內容（Ctrl + A, Ctrl + C）
3. 在 EmailJS 後台的模板編輯器中：
   - 切換到 **HTML** 模式（不是 Visual Editor）
   - 刪除現有內容
   - 貼上新的模板（Ctrl + V）

### 步驟 5：確認模板變數

確保模板中包含以下變數（已在提供的模板中）：

```
{{to_name}}      - 收件人姓名
{{to_email}}     - 收件人信箱
{{message}}      - 郵件訊息內容
{{task_link}}    - 任務連結
```

### 步驟 6：儲存並測試

1. 點擊 **Save** 儲存模板
2. 回到 TaskFlow Pro 系統設定
3. 點擊「發送測試」重新測試

---

## 📧 模板預覽

使用新模板後，郵件將顯示為：

```
┌─────────────────────────────────────┐
│     📋 TaskFlow Pro                 │
│     任務管理與追蹤系統               │
├─────────────────────────────────────┤
│                                     │
│  親愛的 測試人員，                  │
│                                     │
│  ┌─────────────────────────────┐  │
│  │ 這是一封來自 TaskFlow Pro    │  │
│  │ 的測試郵件。如果您收到此信， │  │
│  │ 代表您的 Gmail 設定已成功！  │  │
│  └─────────────────────────────┘  │
│                                     │
│  任務連結：                         │
│  https://your-site.com/...          │
│                                     │
│  ┌─────────────────────────────┐  │
│  │   查看任務詳情 →            │  │
│  └─────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│  此郵件由 TaskFlow Pro 系統自動發送 │
│  收件人：admin@test.com             │
└─────────────────────────────────────┘
```

---

## ✅ 驗證清單

完成以下步驟確認修復成功：

- [ ] 已登入 EmailJS 後台
- [ ] 已找到並開啟 Email Template
- [ ] 已複製 `emailjs-template.html` 的內容
- [ ] 已在 EmailJS 切換到 HTML 模式
- [ ] 已貼上新模板並儲存
- [ ] 已在 TaskFlow Pro 測試發送
- [ ] 收到的郵件中文顯示正常

---

## 🎨 模板特色

新模板包含以下特色：

### 1. UTF-8 編碼支援
```html
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
```

### 2. 中文字體優化
```css
font-family: 'Microsoft JhengHei', 'PingFang TC', 'Noto Sans TC', 
             'Helvetica Neue', Arial, sans-serif;
```

### 3. 現代化設計
- 漂亮的藍色漸層標題
- 清晰的訊息區塊
- 大型 CTA 按鈕
- 響應式佈局

### 4. 完整的郵件結構
- 標題區（Header）
- 內容區（Content）
- 頁尾區（Footer）

---

## 🔍 常見問題

### Q1: 更新模板後還是亂碼？

**解決方案：**
1. 清除瀏覽器快取
2. 確認 EmailJS 模板已儲存
3. 等待 1-2 分鐘讓 EmailJS 更新
4. 重新測試

### Q2: 可以自訂模板樣式嗎？

**可以！** 您可以修改 `emailjs-template.html` 中的：
- 顏色（搜尋 `#2563eb` 替換為您喜歡的顏色）
- 字體大小
- 按鈕樣式
- 佈局結構

### Q3: 如何在模板中加入公司 Logo？

在 `<div class="header">` 中加入：
```html
<img src="YOUR_LOGO_URL" alt="Logo" style="max-width: 150px; margin-bottom: 10px;">
```

### Q4: 可以加入更多變數嗎？

可以！在 TaskFlow Pro 的 `SystemSettings.tsx` 中修改 `templateParams`：

```typescript
const templateParams = {
    to_name: '測試人員',
    to_email: testEmail,
    message: '您的訊息',
    task_link: window.location.href,
    // 新增更多變數
    task_title: '任務標題',
    due_date: '2026-01-10',
    // ...
};
```

然後在模板中使用 `{{task_title}}` 和 `{{due_date}}`。

---

## 📝 技術說明

### 為什麼會出現亂碼？

1. **缺少編碼宣告**
   - 沒有 `<meta charset="UTF-8">`
   - EmailJS 預設可能使用其他編碼

2. **字體不支援中文**
   - 使用的字體沒有中文字符
   - 瀏覽器無法正確渲染

3. **Content-Type 未設定**
   - HTTP Header 沒有指定 UTF-8

### 新模板如何解決？

1. **明確宣告 UTF-8**
   ```html
   <meta charset="UTF-8">
   <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
   ```

2. **使用中文字體**
   ```css
   font-family: 'Microsoft JhengHei', 'PingFang TC', 'Noto Sans TC'
   ```

3. **完整的 HTML 結構**
   - 包含 `<!DOCTYPE html>`
   - 正確的 `<head>` 和 `<body>` 標籤

---

## 🚀 下一步

完成修復後：

1. **測試不同郵件客戶端**
   - Gmail
   - Outlook
   - Apple Mail
   - 手機郵件 App

2. **自訂模板樣式**
   - 修改顏色符合品牌
   - 加入公司 Logo
   - 調整字體大小

3. **建立多個模板**
   - 任務指派通知
   - 任務完成通知
   - 逾期提醒
   - 每日摘要

---

## 📞 需要協助？

如果修復後仍有問題：

1. 檢查 EmailJS 後台的 **Test Email** 功能
2. 確認模板已正確儲存
3. 查看瀏覽器 Console 是否有錯誤
4. 確認 Service ID 和 Template ID 正確

---

**修復指南建立時間：** 2026-01-02  
**適用版本：** TaskFlow Pro 1.0.0  
**EmailJS 版本：** 4.4.1
