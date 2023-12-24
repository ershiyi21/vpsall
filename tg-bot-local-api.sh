#!/bin/bash

COMPOSE_FILE="/home/tg-local-api/docker-compose.yml"
DATA_DIR="/home/tg-local-api/data"
NGINX_CONF="/home/tg-local-api/nginx.conf"

# 检测容器是否已安装
check_containers_installed() {
  local containers_installed=0
  
  if docker-compose -f "$COMPOSE_FILE" ps -q | grep -q -w "telegram-bot-api"; then
    containers_installed=$((containers_installed+1))
  fi
  
  if docker-compose -f "$COMPOSE_FILE" ps -q | grep -q -w "nginx"; then
    containers_installed=$((containers_installed+1))
  fi
  
  echo $containers_installed
}

# 安装 Docker
install_docker() {
  if ! command -v docker &> /dev/null; then
    echo "正在安装 Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    sudo systemctl enable docker
    sudo systemctl start docker
    echo "Docker 安装完成"
  else
    echo "Docker 已安装"
  fi
}

# 安装 Docker Compose
install_docker_compose() {
  if ! command -v docker-compose &> /dev/null; then
    echo "正在安装 Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose 安装完成"
  else
    echo "Docker Compose 已安装"
  fi
}

# 检查 Docker 和 Docker Compose 是否已安装
check_docker_and_docker_compose() {
  install_docker
  install_docker_compose
}

# 检查是否已安装容器
check_if_containers_installed() {
  if [[ ! -f "$COMPOSE_FILE" ]]; then
    echo "未找到 $COMPOSE_FILE 文件，开始安装容器..."
    return 0
  fi
  
  local containers_installed=$(check_containers_installed)
  
  if [[ $containers_installed -eq 2 ]]; then
    echo "容器已安装"
    return 1
  else
    echo "未找到完整的容器配置，开始安装容器..."
    return 0
  fi
}

# 创建目录
create_directory() {
  if [[ ! -d "$1" ]]; then
    mkdir -p "$1"
  fi
}

# 创建 telegram-bot-api-data 卷
create_telegram_bot_api_data_volume() {
  docker volume create telegram-bot-api-data
}

# 提示用户输入参数
prompt_user_input() {
  read -p "请输入 Telegram API ID: " telegram_api_id
  read -p "请输入 Telegram API Hash: " telegram_api_hash
  
  read -p "请输入 Telegram Bot API 外部访问端口 (默认为 28081): " telegram_bot_api_port1
  telegram_bot_api_port1=${telegram_bot_api_port1:-28081}
  
  read -p "是否映射 Telegram Bot API 外部统计端口 (默认为否)? [Y/n]: " map_telegram_bot_api_port2
  map_telegram_bot_api_port2=${map_telegram_bot_api_port2:-n}
  
  if [[ $map_telegram_bot_api_port2 =~ ^[Yy]$ ]]; then
    read -p "请输入 Telegram Bot API 外部统计端口 (默认为 28082): " telegram_bot_api_port2
    telegram_bot_api_port2=${telegram_bot_api_port2:-28082}
  fi
  
  read -p "请输入 Nginx 外部访问端口 (默认为 28080): " nginx_port
  nginx_port=${nginx_port:-28080}

  read -p "请输入 Nginx 外部监听地址 (默认为 0.0.0.0): " nginx_address
  nginx_address=${nginx_address:-0.0.0.0}
}

# 检查输入的有效性
validate_input() {
  if [[ -z $telegram_api_id || -z $telegram_api_hash ]]; then
    echo "Telegram API ID 和 Telegram API Hash 不能为空"
    return 1
  fi
  
  if ! [[ $telegram_bot_api_port1 =~ ^[0-9]+$ ]]; then
    echo "Telegram Bot API 外部访问端口必须是一个有效的整数"
    return 1
  fi

  if [[ $map_telegram_bot_api_port2 =~ ^[Yy]$ ]]; then
    if ! [[ $telegram_bot_api_port2 =~ ^[0-9]+$ ]]; then
      echo "Telegram Bot API 外部统计端口必须是一个有效的整数"
      return 1
    fi
  fi
  
  if ! [[ $nginx_port =~ ^[0-9]+$ ]]; then
    echo "Nginx 外部端口必须是一个有效的整数"
    return 1
  fi
}

# 创建并启动容器
create_and_start_containers() {
  cat << EOF > "$COMPOSE_FILE"
version: '3.8'

services:
  telegram-bot-api:
    image: aiogram/telegram-bot-api:latest
    environment:
      TELEGRAM_API_ID: "$telegram_api_id"
      TELEGRAM_API_HASH: "$telegram_api_hash"
      TELEGRAM_LOCAL: Yes
      TELEGRAM_STAT: Yes
    volumes:
      - /home/tg-local-api/data:/var/lib/telegram-bot-api
    ports:
      - "$telegram_bot_api_port1:8081"
EOF

  if [[ $map_telegram_bot_api_port2 =~ ^[Yy]$ ]]; then
    echo "    - \"$telegram_bot_api_port2:8082\"" >> "$COMPOSE_FILE"
  fi

  cat << EOF >> "$COMPOSE_FILE"
    restart: unless-stopped

  nginx:
    image: nginx:latest
    volumes:
      - /home/tg-local-api/data:/telegram-bot-api-data
      - $NGINX_CONF:/etc/nginx/conf.d/default.conf
    ports:
      - "$nginx_port:8080"
    restart: unless-stopped

volumes:
  telegram-bot-api-data:
    external: true
EOF

  docker-compose -f "$COMPOSE_FILE" up -d
}

# 创建 nginx 配置文件
create_nginx_config() {
  cat > "$NGINX_CONF" << EOF
server {
    listen 8080;

    server_name $nginx_address;

EOF

  cat >> "$NGINX_CONF" << "EOF"
    location / {
        rewrite ^.*telegram-bot-api(.*)$ /$1 last;
        root /telegram-bot-api-data/;  
        index index.html;
        try_files $uri $uri/ =404;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }

    # More configuration if necessary...
}
EOF
}

# 安装容器
install_containers() {
  if check_if_containers_installed; then
    check_docker_and_docker_compose
    [[ ! -d /home/tg-local-api ]] && mkdir -p /home/tg-local-api
    create_directory "$DATA_DIR"
    create_telegram_bot_api_data_volume
    prompt_user_input
    
    while ! validate_input; do
      prompt_user_input
    done

    create_nginx_config
    create_and_start_containers
  fi
}

# 重启容器
restart_containers() {
  if [[ -f "$COMPOSE_FILE" ]]; then
    docker-compose -f "$COMPOSE_FILE" restart
  else
    echo "容器未安装"
  fi
}

# 删除容器与数据
uninstall_containers() {
  if [[ -f "$COMPOSE_FILE" ]]; then
    docker-compose -f "$COMPOSE_FILE" down --volumes
    docker volume rm telegram-bot-api-data
    rm "$COMPOSE_FILE"
    rm "$NGINX_CONF"
    rm -rf "$DATA_DIR"
  else
    echo "容器未安装"
  fi
}

# 脚本管理菜单
show_menu() {
  echo "脚本管理菜单"
  echo "1. 安装容器"
  echo "2. 重启容器"
  echo "3. 删除容器与引导卷"
  echo "4. 退出"
}

# 处理用户输入
handle_input() {
  read -p "请输入选项：" option
  case $option in
    1) install_containers ;;
    2) restart_containers ;;
    3) uninstall_containers ;;
    4) exit ;;
    *) echo "无效的选项" ;;
  esac
}

# 主函数
main() {
  if [[ ! -f "$HOME/tg-bot-local-api.sh" ]];then
    wget -O "$HOME/tg-bot-local-api.sh" https://raw.githubusercontent.com/ershiyi21/vpsall/main/tg-bot-local-api.sh 
    sudo chmod +x "$HOME/tg-bot-local-api.sh"
  fi
  
  while true; do
    show_menu
    handle_input
    echo
  done
}

# 执行主函数
main
