import os
import subprocess
from pathlib import Path

def setup_secondary():
    email = "abdellatif505050@gmail.com"
    key_name = "id_ed25519_personal"
    
    home_dir = Path.home()
    ssh_dir = home_dir / ".ssh"
    ssh_dir.mkdir(exist_ok=True)
    
    key_file = ssh_dir / key_name
    pub_key_file = ssh_dir / f"{key_name}.pub"
    config_file = ssh_dir / "config"
    
    # Main key (we assume it exists from previous steps)
    main_key_file = ssh_dir / "id_ed25519"

    print(f"--- Setting up Personal GitHub Account: {email} ---")

    # 1. Generate new key if not exists
    if not key_file.exists():
        print(f"Generating new SSH key: {key_name}...")
        # -N "" means no password
        subprocess.run(["ssh-keygen", "-t", "ed25519", "-C", email, "-f", str(key_file), "-N", ""], check=True)
    else:
        print("SSH key already exists.")

    # 2. Configure SSH Config
    # We use .as_posix() to ensure forward slashes, which SSH prefers even on Windows
    ssh_config_content = f"""
# Main Account (Default - abdellatifemarah)
Host github.com
  HostName github.com
  User git
  IdentityFile "{main_key_file.as_posix()}"

# Personal Account (Secondary - abdellatif505050)
Host personal.github.com
  HostName github.com
  User git
  IdentityFile "{key_file.as_posix()}"
  IdentitiesOnly yes
"""
    
    current_config = ""
    if config_file.exists():
        with open(config_file, "r") as f:
            current_config = f.read()
    
    if "personal.github.com" not in current_config:
        print("Updating SSH config file...")
        with open(config_file, "a") as f:
            # Add a newline just in case the file doesn't end with one
            f.write("\n" + ssh_config_content)
    else:
        print("SSH config already has personal settings.")

    # 3. Instructions
    print("\n" + "="*60)
    print("STEP 1: ADD KEY TO GITHUB")
    print("="*60)
    print(f"1. Log out of your main GitHub account.")
    print(f"2. Log in to GitHub as {email}")
    print("3. Go to: https://github.com/settings/ssh/new")
    print("4. Title: Personal Laptop")
    print("5. Key: (Copy the text below)")
    print("-" * 20)
    try:
        with open(pub_key_file, "r") as f:
            print(f.read().strip())
    except:
        print("Error reading key file.")
    print("-" * 20)
    
    print("\n" + "="*60)
    print("STEP 2: HOW TO USE IT (IMPORTANT)")
    print("="*60)
    print("For your PERSONAL projects, you must clone them differently:")
    print("INSTEAD OF: git clone git@github.com:User/Repo.git")
    print("USE THIS:   git clone git@personal.github.com:User/Repo.git")
    print("\n(Note the 'personal.' added before github.com)")

if __name__ == "__main__":
    setup_secondary()