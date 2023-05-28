#!/bin/bash

apt-get update -y
apt-get install wget -y

#定位到web-ui目录，docker版本目录为/app/emby/dashboard-ui
cd /app/emby/dashboard-ui
[[ ! -f index.html.cp ]] && cp index.html index.html.cp
[[ -f index.html.cp ]] && rm -rf index.html && cp index.html.cp index.html

# 创建emby-crx目录并下载所需文件
echo "开始安装crx-emby首页大屏海报展示..."
rm -rf emby-crx
mkdir -p emby-crx
wget https://raw.githubusercontent.com/Nolovenodie/emby-crx/master/static/css/style.css -P emby-crx/
wget https://raw.githubusercontent.com/Nolovenodie/emby-crx/master/static/js/common-utils.js -P emby-crx/
wget https://raw.githubusercontent.com/Nolovenodie/emby-crx/master/static/js/jquery-3.6.0.min.js -P emby-crx/
wget https://raw.githubusercontent.com/Nolovenodie/emby-crx/master/static/js/md5.min.js -P emby-crx/
wget https://raw.githubusercontent.com/Nolovenodie/emby-crx/master/content/main.js -P emby-crx/

# 读取index.html文件内容
content=$(cat index.html)

# 检查index.html是否包含emby-crx
if [[ "$content" == *"emby-crx"* ]]; then
    echo "Index.html already contains emby-crx, skipping insertion."
else
    # 定义要插入的代码
    code='<link rel="stylesheet" id="theme-css" href="emby-crx/style.css" type="text/css" media="all" />\n<script src="emby-crx/common-utils.js"></script>\n<script src="emby-crx/jquery-3.6.0.min.js"></script>\n<script src="emby-crx/md5.min.js"></script>\n<script src="emby-crx/main.js"></script>'

    # 在</head>之前插入代码
    new_content=$(echo -e "${content/<\/head>/$code<\/head>}")

    # 将新内容写入index.html文件
    echo -e "$new_content" > index.html
    
    echo "crx-emby安装完成！"
fi

#安装网页版本调用第三方播放器插件
rm -rf embyLaunchPotplayer.js
wget https://raw.githubusercontent.com/bpking1/embyExternalUrl/master/embyWebAddExternalUrl/embyLaunchPotplayer.js
sed -i '/<\/body>/i\<script type="text/javascript" src="./embyLaunchPotplayer.js"></script>' index.html
echo "第三方播放器插件安装完成！"

#安装高级搜索功能补丁,注意docker版本目录为/app/emby
# cd /app/emby
# [[ ! -f Emby.Server.Implementations.dll.cp ]] && cp Emby.Server.Implementations.dll Emby.Server.Implementations.dll.cp
# rm -rf Emby.Server.Implementations.dll
# 关闭服务器
# chmod +rwx /app/emby
# wget -P /path/to/directory -O Emby.Server.Implementations.dll url
# 重启服务器
