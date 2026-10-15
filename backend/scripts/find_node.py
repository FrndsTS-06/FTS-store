import os
found = []
search_roots = [
    r"C:\Program Files",
    r"C:\Program Files (x86)",
    r"C:\Users\Lenovo\AppData\Local",
    r"C:\Users\Lenovo\AppData\Roaming",
    r"C:\tools",
    r"D:\tools",
    r"D:\Program Files"
]
for root_dir in search_roots:
    if not os.path.exists(root_dir):
        continue
    for r, d, files in os.walk(root_dir):
        if "node.exe" in files:
            p = os.path.join(r, "node.exe")
            found.append(p)
            print("FOUND NODE:", p)
        if r.count(os.sep) - root_dir.count(os.sep) >= 4:
            d.clear()
print("Search complete. Total:", len(found))
