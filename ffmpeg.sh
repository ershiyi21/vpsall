#!/bin/bash

# 原始文件夹路径
source_folder="/path/to/source/folder"

# 目标文件夹路径
destination_folder="/path/to/destination/folder"

# 遍历原始文件夹中的所有m4a文件
for file in "$source_folder"/*.m4a; do
    
    # 获取文件名和扩展名
    filename=$(basename "$file")
    extension="${filename##*.}"
    
    # 剪切处理m4a文件
    ffmpeg -i "$file" -ss 00:00:18 -to $(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$file" | awk '{print $1 - 20}') -c copy "${destination_folder}/${filename}"
done
