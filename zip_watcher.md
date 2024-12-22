1.  **修改 `UNZIP_DIR` 和 `PROCESSED_DIR` 的定义：** 将它们定义为 `WATCH_DIR` 的子目录。
2.  **修改 `create_unzip_path` 函数：** 使其基于 ZIP 文件名创建解压目录。
3.  **修改 `create_processed_path` 函数：** 使其基于 ZIP 文件名创建移动后的目录。

以下是修改后的代码：

```python
import os
import time
import zipfile
import shutil
import logging
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# 需要监控的目录
WATCH_DIR = "."
# 解压到的目录
UNZIP_DIR = os.path.join(WATCH_DIR, "解压后文件")
# 已处理 ZIP 文件的目录
PROCESSED_DIR = os.path.join(WATCH_DIR, "原有zip文件")
# 尝试解压的密码列表
PASSWORDS = ["aaaa", "bbbb"]

# 确保解压目录和已处理目录存在
os.makedirs(UNZIP_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)


def extract_zip(zip_path, passwords):
    """尝试使用多个密码解压 ZIP 文件"""
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            for password in passwords:
                try:
                    zip_ref.extractall(path=create_unzip_path(zip_path), pwd=password.encode('utf-8'))
                    logging.info(f"Successfully extracted {zip_path} using password: {password}")
                    return True  # 解压成功，返回 True
                except Exception as e:
                    logging.debug(f"Failed to extract {zip_path} with password {password}: {e}")
            logging.warning(f"Failed to extract {zip_path} with all provided passwords.")
            return False  # 所有密码都失败，返回 False
    except Exception as e:
        logging.error(f"Error opening or processing {zip_path}: {e}")
        return False


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
    processed_path = os.path.join(PROCESSED_DIR, file_name, os.path.basename(zip_path))
    os.makedirs(os.path.dirname(processed_path), exist_ok=True)
    return processed_path

def process_existing_files():
    """处理启动时已存在的ZIP文件"""
    logging.info("Processing existing ZIP files...")
    for root, _, files in os.walk(WATCH_DIR):
        # 排除已处理目录
        if root.startswith(PROCESSED_DIR):
            continue
        for file in files:
            if file.lower().endswith(".zip"):
                file_path = os.path.join(root, file)
                logging.info(f"Found existing ZIP file: {file_path}")
                success = extract_zip(file_path, PASSWORDS)
                if success:
                    # 移动到已处理目录
                    processed_path = create_processed_path(file_path)
                    try:
                        shutil.move(file_path, processed_path)
                        logging.info(f"Successfully moved {file_path} to {processed_path}")
                    except Exception as e:
                        logging.error(f"Failed to move {file_path} to {processed_path}: {e}")
                else:
                    logging.warning(f"Failed to extract {file_path}")
    logging.info("Finished processing existing ZIP files.")


class NewFileHandler(FileSystemEventHandler):
    """监听新文件事件"""

    def on_created(self, event):
        if event.is_directory:
            return
        file_path = event.src_path
        # 排除已处理目录
        if file_path.startswith(PROCESSED_DIR):
            return
        if file_path.lower().endswith(".zip"):
            logging.info(f"New ZIP file detected: {file_path}")
            
            # 尝试解压
            success = extract_zip(file_path, PASSWORDS)
            
            if success:
                # 移动到已处理目录
                processed_path = create_processed_path(file_path)
                try:
                    shutil.move(file_path, processed_path)
                    logging.info(f"Successfully moved {file_path} to {processed_path}")
                except Exception as e:
                    logging.error(f"Failed to move {file_path} to {processed_path}: {e}")
            else:
                logging.warning(f"Failed to extract {file_path}")


if __name__ == "__main__":
    # 处理已存在的ZIP文件
    process_existing_files()

    event_handler = NewFileHandler()
    observer = Observer()
    observer.schedule(event_handler, WATCH_DIR, recursive=True)
    observer.start()
    logging.info(f"Watching for new ZIP files in: {WATCH_DIR}")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
```

**使用方法：**

1.  **保存代码:** 将代码保存为 `.py` 文件，例如 `zip_watcher.py`。
2.  **安装依赖:**  你需要安装 `watchdog` 库：
    ```bash
    pip install watchdog
    ```
3.  **运行脚本:** 在终端中运行脚本：
    ```bash
    python zip_watcher.py
    ```
4.  **放置 ZIP 文件:** 将加密的 ZIP 文件放入脚本所在的目录（或者你指定的 `WATCH_DIR` 目录）。
5.  **查看结果:**
    *   解压后的文件会出现在 `./unzip/zip文件名` 目录下。
    *   处理后的 ZIP 文件会被移动到 `./processed/zip文件名/zip文件名.zip` 目录下。
6.  **首次运行:** 脚本首次运行时会处理所有已存在的 `.zip` 文件（排除 `./processed` 目录），并将它们移动到 `./processed` 目录，后续会监控新创建的 `.zip` 文件（排除 `./processed` 目录）并进行移动。

**说明：**

*   `UNZIP_DIR` 和 `PROCESSED_DIR` 现在是 `WATCH_DIR` 的子目录，结构更清晰。
*   解压后的文件会放在以 ZIP 文件名命名的目录中，方便管理。
*   移动后的 ZIP 文件也会放在以 ZIP 文件名命名的目录中，并保留原始文件名。
