import os
import base64
import shutil

print(f"当前脚本支持递归处理子目录中的文件，处理后文件统一放置在 接下来输入文件夹的./rname目录下")
def decode_base64_and_move():
    # 获取用户输入的目标文件夹路径
    folder_path = input("请输入文件夹路径: ").strip()

    # 检查文件夹路径是否存在
    if not os.path.exists(folder_path):
        print(f"错误: 路径 {folder_path} 不存在！")
        return
    
    # 确保 rname 文件夹存在
    target_folder = os.path.join(folder_path, "rname")
    os.makedirs(target_folder, exist_ok=True)

    # 使用 os.walk 遍历目录中的所有文件，包括子目录
    for root, dirs, files in os.walk(folder_path):
        for filename in files:
            file_path = os.path.join(root, filename)

            # 跳过 rname 文件夹本身
            if os.path.isdir(file_path) and filename == "rname":
                continue

            try:
                # 检查文件名是否是有效的 Base64 编码字符串
                # 这里尝试解码并检查是否能正确转换为字符串
                decoded_name = base64.urlsafe_b64decode(filename).decode('utf-8')
                
                # 添加 .mp3 后缀
                decoded_name_with_extension = f"{decoded_name}.mp3"
                
                # 生成新的文件路径
                new_file_path = os.path.join(target_folder, decoded_name_with_extension)
                
                # 移动并重命名文件
                shutil.move(file_path, new_file_path)
                print(f"文件 {filename} 已重命名为 {decoded_name_with_extension} 并移动到 {new_file_path}")
            except (base64.binascii.Error, UnicodeDecodeError) as e:
                # 如果解码失败，跳过该文件
                print(f"文件 {filename} 不是有效的 Base64 编码，跳过处理。")

# 调用函数
decode_base64_and_move()
