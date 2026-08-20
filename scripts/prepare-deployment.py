import os
import shutil
import subprocess
import zipfile
import sys

def build_frontend(frontend_dir):
    print("\n[Step 1/3] Building frontend assets...")
    try:
        # Run npm run build in frontend folder
        result = subprocess.run("npm run build", shell=True, cwd=frontend_dir, check=True)
        print("[OK] Frontend compiled successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error building frontend: {e}")
        sys.exit(1)

def zip_directory(src_dir, dest_zip_path, exclude_items=None):
    if exclude_items is None:
        exclude_items = []
        
    print(f"Zipping {src_dir} to {dest_zip_path}...")
    
    # Ensure destination directory exists
    os.makedirs(os.path.dirname(dest_zip_path), exist_ok=True)
    
    with zipfile.ZipFile(dest_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(src_dir):
            # Exclude folders
            dirs[:] = [d for d in dirs if d not in exclude_items]
            
            for file in files:
                if file in exclude_items:
                    continue
                file_path = os.path.join(root, file)
                # Calculate relative path to preserve directory structure
                arcname = os.path.relpath(file_path, src_dir)
                try:
                    zipf.write(file_path, arcname)
                except Exception as e:
                    print(f"Warning: Could not archive file {file_path}: {e}")

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(script_dir)
    frontend_dir = os.path.join(root_dir, "frontend")
    backend_dir = os.path.join(root_dir, "backend")
    output_dir = os.path.join(root_dir, "deployment-packages")
    
    print("=========================================================")
    print("      Industrial Times - Packaging Deployment Zips       ")
    print("=========================================================")
    
    # 1. Build Frontend
    build_frontend(frontend_dir)
    
    # Clean output directory
    if os.path.exists(output_dir):
        print("Cleaning old packages directory...")
        shutil.rmtree(output_dir)
    os.makedirs(output_dir, exist_ok=True)
    
    # 2. Package Frontend Build Files
    print("\n[Step 2/3] Zipping compiled frontend...")
    frontend_dist = os.path.join(frontend_dir, "dist")
    frontend_zip = os.path.join(output_dir, "frontend-deploy.zip")
    zip_directory(frontend_dist, frontend_zip)
    print(f"[OK] Created frontend-deploy.zip (Size: {os.path.getsize(frontend_zip) / 1024 / 1024:.2f} MB)")
    
    # 3. Package Backend Files
    print("\n[Step 3/3] Zipping backend server...")
    backend_zip = os.path.join(output_dir, "backend-deploy.zip")
    exclude_backend = ["node_modules", "database.sqlite", "data", "uploads", ".git", ".env"]
    zip_directory(backend_dir, backend_zip, exclude_items=exclude_backend)
    print(f"[OK] Created backend-deploy.zip (Size: {os.path.getsize(backend_zip) / 1024 / 1024:.2f} MB)")
    
    print("=========================================================")
    print("SUCCESS! Deployment packages are ready.")
    print(f"Location: {output_dir}")
    print("  - File 1: frontend-deploy.zip  --> Upload to site root")
    print("  - File 2: backend-deploy.zip   --> Upload to backend folder")
    print("=========================================================")

if __name__ == "__main__":
    main()
