# 村里界線資料

## 來源

內政部國土測繪中心「國土測繪圖資e商城」開放資料專區：
https://whgis-nlsc.moi.gov.tw/Opendata/Files.aspx

資料名稱：「村(里)界(TWD97經緯度)」，2026-08-26 上架（檔名帶的 `1150817` 是上一次更新日期 115/08/17，跟上架日期不是同一天，資料本身變動很少，這是正常的）。

**注意**：這份資料原本也有在 https://data.gov.tw/dataset/7438 上架，但截至 2026-09-04，data.gov.tw 那邊的下載連結是壞的（內政部國土測繪中心自己在該頁面回應說 TGOS 平台轉發功能異常，2025-11-28 之後就沒法從 data.gov.tw 正常下載），要改到上面「國土測繪圖資e商城」這個網址下載，不是走 data.gov.tw。

## 下載方式（之後要更新照做）

1. 到 https://whgis-nlsc.moi.gov.tw/Opendata/Files.aspx ，找列表裡「村(里)界(TWD97經緯度)」那一筆（注意跟旁邊「村(里)界(TWD97_121分帶)」不是同一個，_121分帶是另一種座標系統，不是我們要的經緯度格式），點下載圖示
2. 下載下來是 SHP 格式（Shapefile：`.shp`/`.shx`/`.dbf`/`.prj` 一組檔案），全國資料，20MB左右
3. 用 `npm install shapefile`（純 JS 套件，不需要另外裝 GDAL/ogr2ogr）讀取並過濾出 `COUNTYNAME === "臺南市"` 的部分，轉成 GeoJSON——腳本沒有留在專案裡，邏輯很簡單，需要時可以照這個描述重寫，或問我

## 資料結構

`village.geojson`：GeoJSON FeatureCollection，650 個台南市村里的多邊形邊界，欄位：
- `COUNTYNAME`（縣市，這裡永遠是「臺南市」）
- `TOWNNAME`（區，例如「善化區」）
- `VILLNAME`（里，例如「嘉南里」——注意帶「里」字，這點跟 `src/data/school-zones` 的國小資料格式一致，國中資料不帶「里」字，`school-zones.ts` 裡有處理這個差異）

座標是 TWD97 經緯度（等同 WGS84，跟 Google Maps／Leaflet 直接相容，不需要額外轉換）。

## 查詢方式

`src/lib/geo-lookup.ts` 的 `lookupVillage(lat, lng)`，point-in-polygon 邏輯跟 `listing-form-tool`、台南市重劃區地圖用的是同一套 ray-casting 演算法（各自獨立一份，不是共用套件）。地址要先用 `src/lib/geocode.ts` 轉成座標，這個網站用 Nominatim（免費，不需要申請金鑰）——因為這是公開給不特定大眾用的查詢工具，跟 listing-form-tool 用 Google Geocoding API（她自己內部用、金鑰她自己的）的情境不同，等她的 TGOS 核准後要換成官方版本。
