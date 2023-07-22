#!/bin/bash

# 指定下载目录和目标目录
target_dir="/home/nastools/media/downloads/sync/aria2"

# 获取文件名
echo "[$(date "+%Y-%m-%d %H:%M:%S")] $3" >> /opt/aria2/config/filepath_down.txt

filepath=$3

# 移动文件到目标目录
 mv "$filepath" "$target_dir/"
