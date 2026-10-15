import os
import urllib.request
import zipfile
import shutil

NODE_VERSION = "v20.18.0"
URL = f"https://nodejs.org/dist/{NODE_VERSION}/node-{NODE_VERSION}-win-x64.zip"
TARGET_DIR = r"d:\projects_demo\e-commers\.tools"
ZIP_PATH = os.path.join(TARGET_DIR, "node.zip")
NODE_DIR = os.path.join(TARGET_DIR, "node")

os.makedirs(TARGET_DIR, exist_ok=True)

if not os.path.exists(os.path.join(NODE_DIR, "node.exe")):
    print(f"Downloading Node.js {NODE_VERSION} portable zip from {URL}...")
    urllib.request.urlretrieve(URL, ZIP_PATH)
    print("Download complete. Extracting...")
    with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
        zip_ref.extractall(TARGET_DIR)
    
    extracted_folder = os.path.join(TARGET_DIR, f"node-{NODE_VERSION}-win-x64")
    if os.path.exists(NODE_DIR):
        shutil.rmtree(NODE_DIR)
    os.rename(extracted_folder, NODE_DIR)
    os.remove(ZIP_PATH)
    print(f"Extracted Node.js successfully to {NODE_DIR}!")
else:
    print(f"Node.js already present at {NODE_DIR}")

node_exe = os.path.join(NODE_DIR, "node.exe")
npm_cmd = os.path.join(NODE_DIR, "npm.cmd")
print(f"Node executable: {node_exe} (exists: {os.path.exists(node_exe)})")
print(f"Npm executable: {npm_cmd} (exists: {os.path.exists(npm_cmd)})")
