# 這個資料夾放本機資料：
# - listings.json  已建立過的物件紀錄（第一次儲存時自動產生）
# 不會進版控。
#
# geo/ 放的是靜態地理查詢資料（會進版控，這些不是機密也不是使用者資料）：
# - zoning.geojson       台南都市計畫土地使用分區（來自使用者自製在地地圖專案）
# - reclamation.geojson  台南市重劃區官方圖資（同上）
# 用 src/lib/geo-lookup.ts 做經緯度 point-in-polygon 查詢。
