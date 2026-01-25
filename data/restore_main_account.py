import subprocess
import os

def restore_main():
    # 1. Revert to the main email (Safe)
    email = "abdellatifemarah@gmail.com"
    name = "Abdellatif Emarah"
    
    print(f"--- Restoring Git to Main Account: {email} ---")
    subprocess.run(["git", "config", "--global", "user.email", email])
    subprocess.run(["git", "config", "--global", "user.name", name])
    print("✅ Git identity restored. Your commits will show as 'Abdellatif Emarah'.")

    # 2. Check if we can talk to GitHub
    print("\n--- Testing GitHub Connection ---")
    try:
        print("Running connection test... (If asked 'Are you sure?', type 'yes')\n")
        # We run without capture_output so you can interact with the yes/no prompt if it appears
        subprocess.run(["ssh", "-T", "git@github.com"])
        
        print("\n" + "="*50)
        print("CHECK THE OUTPUT ABOVE:")
        print("✅ If it said 'successfully authenticated', you are good to go!")
        print("❌ If it said 'Permission denied', check your key below:")
        print("-" * 20)
        try:
            with open(os.path.expanduser("~/.ssh/id_ed25519.pub"), "r") as f:
                print(f.read().strip())
        except:
            print("(Could not find key file)")
        print("-" * 20)
        print(f"Ensure this key is in the GitHub account for {email}")
            
    except Exception as e:
        print(f"Error testing connection: {e}")

if __name__ == "__main__":
    restore_main()