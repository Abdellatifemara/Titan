import os
import subprocess
from pathlib import Path

def setup_git_ssh():
    # Configuration
    email = "abdellatifemarah@gmail.com"
    name = "Abdellatif Emarah" 

    print(f"--- Configuring Git for {email} ---")
    
    # 1. Configure Git Global Settings
    try:
        subprocess.run(["git", "config", "--global", "user.email", email], check=True)
        subprocess.run(["git", "config", "--global", "user.name", name], check=True)
        print("[OK] Git user and email set.")
    except FileNotFoundError:
        print("[Error] Git is not installed or not in PATH.")
        return
    except subprocess.CalledProcessError:
        print("[Error] Failed to configure git.")

    # 2. Generate SSH Key
    home_dir = Path.home()
    ssh_dir = home_dir / ".ssh"
    ssh_dir.mkdir(exist_ok=True)
    
    key_file = ssh_dir / "id_ed25519"
    pub_key_file = ssh_dir / "id_ed25519.pub"

    if not key_file.exists():
        print(f"Generating new SSH key at {key_file}...")
        # -N "" means no password (for automation)
        cmd = ["ssh-keygen", "-t", "ed25519", "-C", email, "-f", str(key_file), "-N", ""]
        try:
            subprocess.run(cmd, check=True)
            print("[OK] SSH Key generated.")
        except subprocess.CalledProcessError:
            print("[Error] Failed to generate SSH key. Make sure OpenSSH is installed.")
            return
    else:
        print("[Info] SSH key already exists. Skipping generation.")

    # 3. Display Public Key
    if pub_key_file.exists():
        print("\n" + "="*60)
        print("STEP 2: COPY THE KEY BELOW")
        print("="*60)
        try:
            with open(pub_key_file, "r") as f:
                key_content = f.read().strip()
                print(key_content)
        except Exception as e:
            print(f"Could not read key file: {e}")
        
        print("="*60)
        print("\nSTEP 3: ADD TO GITHUB")
        print("1. Go to this URL: https://github.com/settings/ssh/new")
        print(f"2. Log in with the account you want to use (e.g., {email} or your paid account).")
        print("3. Paste the key above into the 'Key' field.")
        print("4. Click 'Add SSH key'.")
    else:
        print("[Error] Public key file not found.")

if __name__ == "__main__":
    setup_git_ssh()