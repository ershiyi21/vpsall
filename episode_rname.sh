#!/bin/bash
# 初始化变量
season=""
episode_adjust=0
location=""
temp_dir="./temp_file"  # 创建临时目录
 
# 创建临时目录
echo "创建临时目录：./temp_file"
mkdir -p "$temp_dir"
 
# 判断临时目录是否为空
if ! [ -z "$(ls -A "$temp_dir")" ]; then
    echo "临时目录 $temp_dir 非空，请清空该目录后再运行脚本"
    exit 1
fi
 
# 清理临时目录的函数
cleanup() {
  if [ -z "$(ls -A "$temp_dir")" ]; then
    echo "临时目录 $temp_dir 为空，删除该目录"
    rm -rf "$temp_dir"
  else
    echo "临时目录 $temp_dir 非空，保留该目录，请注意查看该目录下文件"
  fi
}
 
# 捕获退出信号，确保临时目录被清理
 trap cleanup EXIT 
 
# 解析命令行参数
while [[ $# -gt 0 ]]; do
  case "$1" in
    -help)
      echo "------------------------------------------------------------"
      echo "处理文件：当前目录下集数和季度在范围内的所有文件（不含子目录）。"
      echo "季数改变：季数改变时，文件将被移动到新的文件夹。"
      echo "集数调整：根据 -change 参数调整集数。"
      echo ""
      echo "-season：指定新的季度数（如 02 表示第二季）"
      echo "-change：指定增减集数的数值（如 +3 或 -2）"
      echo "-location：从 S01E11-E55 中提取开始和结束集数。"
      echo "------------------------------------------------------------"
      exit 1
      ;;
    -season)
      season="$2"
      shift 2
      ;;
    -change)
      episode_adjust="$2"
      shift 2
      ;;
    -location)
      location="$2"
      shift 2
      ;;
    *)
      echo "未知选项: $1"
      exit 1
      ;;
  esac
done
 
# 检查是否指定了季度数
if [ -z "$season" ]; then
  echo "请使用 -season 指定季度数。"
  exit 1
fi
 
# 检查季数的格式
if ! [[ "$season" =~ ^[0-9]{2}$ ]]; then
  echo "季度数必须为两位数字（例如02表示第二季）。"
  exit 1
fi
 
# 检查 -change 参数是否为有效整数
if ! [[ "$episode_adjust" =~ ^[-+][0-9]+$ ]]; then
  echo "-change 参数必须为增减集数的数值（如 +3 或 -2）。"
  exit 1
fi
 
# 检查是否指定了location范围
if [ -z "$location" ]; then
  echo "请使用 -location 指定处理的范围，如 'S01E11-E55'。"
  exit 1
fi
 
# 解析 location 参数，提取开始和结束集数
if [[ "$location" =~ ^(S[0-9]{2}E)([0-9]{2,3})-E([0-9]{2,3})$ ]]; then
  location_season="${BASH_REMATCH[1]}"
  start_episode="${BASH_REMATCH[2]}"
  end_episode="${BASH_REMATCH[3]}"
else
  echo "location 参数格式不正确。应为 'S01E11-E55'。"
  exit 1
fi
 
# 处理当前目录下的文件
for file in ./*; do
  # 匹配文件名格式 aaaa.SXXEXX 或 aaaa.SXXEXXX
  if [[ "$file" =~ ^(.*)(S[0-9]{2}E)([0-9]{2,3})(.*)$ ]]; then
    original_season="${BASH_REMATCH[2]}"   # 原始季数
    episode_number="${BASH_REMATCH[3]}"    # 原始集数
 
    # 只处理指定范围内的集数
    if ((10#$episode_number >= 10#$start_episode && 10#$episode_number <= 10#$end_episode)); then
      if [[ "$location_season" != "$original_season" ]]; then
        echo "跳过无效集数: $(basename "$file")"
        continue
      fi
      # 调整集数
      new_episode_number=$((10#$episode_number + episode_adjust))
 
      # 检查调整后的集数是否有效
      if (( new_episode_number <= 0 )); then
        echo "跳过无效集数: $(basename "$file")"
        continue
      fi
 
      # 生成新的文件名
      new_file="${BASH_REMATCH[1]}S${season}E$(printf "%02d" $new_episode_number)${BASH_REMATCH[4]}"
 
      # 如果季数改变，将文件移动到临时目录中的新文件夹
      if [[ "$original_season" != "S${season}E" ]]; then
        new_folder="$temp_dir/Season_${season}"
        mkdir -p "$new_folder"
        mv "$file" "$new_folder/$new_file"
        echo "重命名并移动到临时目录: $(basename "$file") -> $new_folder/$new_file"
      else
        # 如果季数没有改变，只将文件移动到临时目录
        mv "$file" "$temp_dir/$new_file"
        echo "重命名并移动到临时目录: $(basename "$file") -> $temp_dir/$new_file"
      fi
    else
      echo "跳过不在范围内的文件: $(basename "$file")"
    fi
  fi
done
 
# 将临时目录中的文件移动到最终目标位置
for folder in "$temp_dir"/*; do
  if [ -d "$folder" ]; then
    destination="./$(basename "$folder")"
    mkdir -p "$destination"
    mv "$folder"/* "$destination"
    echo "文件已移动到: $destination"
    if [ -z "$(ls -A "$folder")" ]; then
      rm -rf "$folder"
    fi
  else
    mv "$folder" .
    echo "文件已移动到当前目录: $(basename "$folder")"
  fi
done
 
