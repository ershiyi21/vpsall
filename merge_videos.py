import os
import re
import subprocess

## 该脚本主要用于短剧多集拼接，需要安装ffmpeg

def get_files_by_season(folder):
    """按照剧集（SXXEXX）分类并排序文件。"""
    season_files = {}
    pattern = re.compile(r"S(\d{2})E(\d{2})")

    for file in os.listdir(folder):
        if os.path.isfile(os.path.join(folder, file)) and file.endswith(('.mp4', '.mkv', '.avi')):
            match = pattern.search(file)
            if match:
                season = match.group(1)
                episode = match.group(2)
                if season not in season_files:
                    season_files[season] = []
                season_files[season].append((int(episode), os.path.join(folder, file)))

    # 确保每一季的文件按剧集顺序排序
    for season in season_files:
        season_files[season].sort(key=lambda x: x[0])
        season_files[season] = [file[1] for file in season_files[season]]

    return season_files

def create_concat_file(file_list, concat_file):
    """生成 ffmpeg 拼接所需的文件列表。"""
    with open(concat_file, 'w') as f:
        for file in file_list:
            f.write(f"file '{file}'\n")

def merge_videos(folder, output_folder):
    """按照剧集拼接视频。"""
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    season_files = get_files_by_season(folder)

    for season, files in season_files.items():
        concat_file = os.path.join(folder, f"concat_s{season}.txt")
        output_file = os.path.join(output_folder, f"Season_{season}.mp4")

        create_concat_file(files, concat_file)

        # 使用 ffmpeg 拼接视频
        print(f"正在拼接 Season {season} 视频...")
        for i, file in enumerate(files, start=1):
            print(f"    处理文件 {i}/{len(files)}: {file}")
        command = [
            "ffmpeg", 
            "-y", 
            "-hide_banner", 
            "-vsync", "0", 
            "-safe", "0", 
            "-f", "concat", 
            "-i", "fileList.txt", 
            "-c", "copy", 
            output_file
        ]

        subprocess.run(command, check=True)

        # 删除临时 concat 文件
        os.remove(concat_file)

    print("所有剧集视频拼接完成！")

if __name__ == "__main__":
    input_folder = input("请输入视频所在文件夹路径：").strip()
    output_folder = input("请输入拼接后视频的保存文件夹路径：").strip()

    merge_videos(input_folder, output_folder)
