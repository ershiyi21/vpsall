import os
import time
import shutil
import logging
import subprocess

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# 需要监控的目录
WATCH_DIR = ""
# 解压到的目录
UNZIP_DIR = os.path.join(WATCH_DIR, "解压得到内容")
# 已处理 ZIP 文件的目录
PROCESSED_DIR = os.path.join(WATCH_DIR, "原有zip压缩包")
# 尝试解压的密码列表
PASSWORDS = ["aaa", "bbb", "ccc"]
# 检测间隔（秒）
SCAN_INTERVAL = 10

# 确保解压目录和已处理目录存在
os.makedirs(UNZIP_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

def change_dir_userandgroup(unzip_path):
    try:
        cmd = ['sudo', 'chown', '-R' ,'www-data:www-data' ,unzip_path]
        subprocess.run(cmd, check=True)
        logging.info(f"Successfully chmod {unzip_path} to www-data:www-data")
        return True  # 修改用户组成功，返回 True
    except subprocess.CalledProcessError as e:
        logging.debug(f"Failed to chmod {unzip_path} to www-data:www-data：{e}")

def extract_zip_with_7z(zip_path, passwords):
    """尝试使用多个密码通过 7z 解压 ZIP 文件"""
    for password in passwords:
        try:
            unzip_path = create_unzip_path(zip_path)
            cmd = ['7z', 'x', zip_path, f'-o{unzip_path}', f'-p{password}', '-aoa']
            subprocess.run(cmd, check=True)
            logging.info(f"Successfully extracted {zip_path} using password: {password}")
            return True  # 解压成功，返回 True
        except subprocess.CalledProcessError as e:
            logging.debug(f"Failed to extract {zip_path} with password {password}: {e}")
    logging.warning(f"Failed to extract {zip_path} with all provided passwords.")
    return False  # 所有密码都失败，返回 False

def get_relative_path(zip_path):
    """获取相对于监控目录的路径"""
    return os.path.relpath(zip_path, WATCH_DIR)

def create_unzip_path(zip_path):
    """创建解压后的目标路径，一级目录为zip文件名"""
    file_name = os.path.splitext(os.path.basename(zip_path))[0]
    unzip_path = os.path.join(UNZIP_DIR, file_name)
    os.makedirs(unzip_path, exist_ok=True)
    return unzip_path

def create_processed_path(zip_path):
    """创建移动后的目标路径，一级目录为zip文件名"""
    file_name = os.path.splitext(os.path.basename(zip_path))[0]
    processed_path = os.path.join(PROCESSED_DIR, os.path.basename(zip_path))
    os.makedirs(os.path.dirname(processed_path), exist_ok=True)
    return processed_path

def process_single_directory(unzip_path):
    """处理解压后只有单层目录的情况，将内容上移"""
    while True:
        items = os.listdir(unzip_path)
        if len(items) == 1 and os.path.isdir(os.path.join(unzip_path, items[0])):
            single_dir = os.path.join(unzip_path, items[0])
            # 移动 single_dir 下的所有内容到 unzip_path
            for item in os.listdir(single_dir):
                s = os.path.join(single_dir, item)
                d = os.path.join(unzip_path, item)
                try:
                    shutil.move(s, d)
                    logging.info(f"Moved {s} to {d}")
                except Exception as e:
                    logging.error(f"Failed to move {s} to {d}: {e}")

            # 删除 single_dir
            try:
                shutil.rmtree(single_dir)
                logging.info(f"Removed directory: {single_dir}")
            except Exception as e:
                logging.error(f"Failed to remove directory {single_dir}: {e}")
        else:
            break  # 不再是单层目录，退出循环

def scan_and_process_files():
    """扫描并处理ZIP文件"""
    logging.info("Scanning for ZIP files...")
    for root, _, files in os.walk(WATCH_DIR):
        # 排除已处理目录
        if root.startswith(PROCESSED_DIR):
            continue
        # 排除解压内容目录
        if root.startswith(UNZIP_DIR):
            continue
        for file in files:
            if file.lower().endswith(".zip"):
                file_path = os.path.join(root, file)
                logging.info(f"Found ZIP file: {file_path}")
                success = extract_zip_with_7z(file_path, PASSWORDS)
                if success:
                    # 移动到已处理目录
                    processed_path = create_processed_path(file_path)
                    try:
                        shutil.move(file_path, processed_path)
                        logging.info(f"Successfully moved {file_path} to {processed_path}")
                        # 解压后处理单层目录
                        unzip_path = create_unzip_path(file_path)
                        process_single_directory(unzip_path)
                        # 处理文件用户组归属问题
                        change_dir_userandgroup(WATCH_DIR)
                    except Exception as e:
                        logging.error(f"Failed to move {file_path} to {processed_path}: {e}")
                else:
                    logging.warning(f"Failed to extract {file_path}")
                
                remove_empty_directories(WATCH_DIR)
                
    logging.info("Finished scanning.")

def remove_empty_directories(path):
    """递归删除空目录"""
    for root, dirs, files in os.walk(path, topdown=False):  # 从叶子节点开始遍历
        for dir_name in dirs:
            dir_path = os.path.join(root, dir_name)
            try:
                if not os.listdir(dir_path):  # 目录为空
                    os.rmdir(dir_path)
                    logging.info(f"Removed empty directory: {dir_path}")
            except OSError as e:
                logging.warning(f"Failed to remove directory {dir_path}: {e}")


if __name__ == "__main__":
    
    # 处理已存在的解压文件也进行单层目录处理
    for dir_name in os.listdir(UNZIP_DIR):
        dir_path = os.path.join(UNZIP_DIR, dir_name)
        if os.path.isdir(dir_path):
            process_single_directory(dir_path)

    logging.info("Starting ZIP file processor...")
    try:
        while True:
            scan_and_process_files()
            time.sleep(SCAN_INTERVAL)
    except KeyboardInterrupt:
        logging.info("Stopping ZIP file processor.")
