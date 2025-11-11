#!/usr/bin/env bash

set -e

echo "== WebDAV 安装脚本 =="

# --------------------------
# 1. 用户输入
# --------------------------
read -p "请输入 WebDAV 用户名: " WD_USER
read -p "请输入 WebDAV 密码: " WD_PASS
read -p "请输入共享目录绝对路径: " WD_DIR

if [ ! -d "$WD_DIR" ]; then
    echo "目录不存在，是否创建？(y/n)"
    read yn
    if [ "$yn" = "y" ]; then
        mkdir -p "$WD_DIR"
    else
        echo "退出。"
        exit 1
    fi
fi

# --------------------------
# 2. 判断架构
# --------------------------
ARCH=$(uname -m)
case "$ARCH" in
    x86_64)
        FILE="webdav-linux-amd64.tar.gz"
        ;;
    aarch64|arm64)
        FILE="webdav-linux-arm64.tar.gz"
        ;;
    armv7l)
        FILE="webdav-linux-arm.tar.gz"
        ;;
    *)
        echo "不支持的架构: $ARCH"
        exit 1
        ;;
esac

echo "系统架构: $ARCH"
echo "下载文件: $FILE"

# --------------------------
# 3. 下载 WebDAV
# --------------------------
URL="https://github.com/hacdias/webdav/releases/latest/download/$FILE"

cd /tmp
echo "下载: $URL"
curl -L -o webdav.tar.gz "$URL"

# --------------------------
# 4. 解压并安装
# --------------------------
tar -xf webdav.tar.gz
chmod +x webdav
cp webdav /usr/bin/
echo "WebDAV 已安装到 /usr/bin/webdav"

# --------------------------
# 5. 创建 systemd service
# --------------------------
echo "创建 service 文件..."

cat >/etc/systemd/system/webdav.service <<EOF
[Unit]
Description=WebDAV server
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/webdav --config /etc/webdav/config.yaml
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# --------------------------
# 6. 创建配置目录与 config.yaml
# --------------------------
mkdir -p /etc/webdav/

cat >/etc/webdav/config.yaml <<EOF
address: 0.0.0.0
port: 21234
auth: true
tls: false
cert: cert.pem
key: key.pem

scope: .
modify: true
rules: []
users:
  - username: $WD_USER
    password: $WD_PASS
    scope: $WD_DIR
EOF

echo "配置文件已生成: /etc/webdav/config.yaml"

# --------------------------
# 7. 启动服务
# --------------------------
systemctl daemon-reload
systemctl enable webdav
systemctl restart webdav

echo "WebDAV 已启动。"
echo "使用以下命令查看状态："
echo "systemctl status webdav"
