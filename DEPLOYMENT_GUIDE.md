# 🚀 自動部署使用指南

## 快速開始

### 第一次部署

執行以下指令：

```bash
# 1. 提交所有變更
git add .
git commit -m "Add GitHub Pages deployment configuration"

# 2. 推送到 GitHub
git push origin main
```

### 在 GitHub 啟用 Pages

1. 開啟瀏覽器前往：https://github.com/elvishuang1983/Taskflow/settings/pages

2. 在 **Source** 選擇：**GitHub Actions**

3. 點擊 **Save**

4. 前往 Actions 查看部署進度：https://github.com/elvishuang1983/Taskflow/actions

5. 等待 2-3 分鐘後訪問：https://elvishuang1983.github.io/Taskflow

---

## 之後的更新

每次修改程式碼後，只需要：

```bash
git add .
git commit -m "描述您的變更"
git push origin main
```

GitHub 會自動：
- ✅ 建置您的專案
- ✅ 部署到 GitHub Pages
- ✅ 更新網站

---

## 查看部署狀態

訪問：https://github.com/elvishuang1983/Taskflow/actions

您可以看到：
- 🟢 綠色勾勾 = 部署成功
- 🟡 黃色圓圈 = 正在部署
- 🔴 紅色叉叉 = 部署失敗（點擊查看錯誤）

---

## 常見問題

**Q: 推送後多久會更新？**
A: 約 2-3 分鐘

**Q: 如何確認部署成功？**
A: 前往 Actions 頁面，看到綠色勾勾即成功

**Q: 網站沒有更新怎麼辦？**
A: 
1. 檢查 Actions 是否執行成功
2. 清除瀏覽器快取（Ctrl + F5）
3. 等待幾分鐘再試

**Q: 可以手動觸發部署嗎？**
A: 可以！在 Actions 頁面點擊 "Deploy to GitHub Pages" > "Run workflow"

---

## 部署網址

**您的網站：** https://elvishuang1983.github.io/Taskflow

**Repository：** https://github.com/elvishuang1983/Taskflow

**Actions：** https://github.com/elvishuang1983/Taskflow/actions
