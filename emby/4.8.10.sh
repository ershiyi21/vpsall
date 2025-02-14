## https://cf.mb6.top/tmp/?dir=emby/4.8.10.0 下载文件到/config/yly
rm -f /app/emby/system/Emby.Web.dll
cp /config/yly/Emby.Web.dll /app/emby/system/Emby.Web.dll


rm -f /app/emby/system/MediaBrowser.Model.dll
cp /config/yly/MediaBrowser.Model.dll /app/emby/system/MediaBrowser.Model.dll

rm -f /app/emby/system/dashboard-ui/modules/emby-apiclient/connectionmanager.js
cp /config/yly/dashboard-ui/modules/emby-apiclient/connectionmanager.js  /app/emby/system/dashboard-ui/modules/emby-apiclient/connectionmanager.js

rm -f /app/emby/system/dashboard-ui/embypremiere/embypremiere.js
cp /config/yly/dashboard-ui/embypremiere/embypremiere.js  /app/emby/system/dashboard-ui/embypremiere/embypremiere.js


rm -f /app/emby/system/Emby.Server.Implementations.dll
cp /config/yly/Emby.Server.Implementations.dll /app/emby/system/Emby.Server.Implementations.dll

rm -f /app/emby/system/dashboard-ui/modules/emby-apiclient/apiclient.js
cp /config/yly/dashboard-ui/modules/emby-apiclient/apiclient.js  /app/emby/system/dashboard-ui/modules/emby-apiclient/apiclient.js


rm -f /app/emby/system/dashboard-ui/videoosd/videoosd.js
cp /config/yly/dashboard-ui/videoosd/videoosd.js  /app/emby/system/dashboard-ui/videoosd/videoosd.js
