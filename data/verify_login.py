import subprocess
import shutil

def verify_and_fix():
    print("--- STEP 1: VERIFYING GIT (YOUR CODE) ---")
    # This ensures your commits go to your main account
    target_email = "abdellatifemarah@gmail.com"
    target_name = "Abdellatif Emarah"
    
    # Check if git is available
    if not shutil.which("git"):
        print("❌ Git is not installed or not in PATH.")
        return

    try:
        current = subprocess.check_output(["git", "config", "--global", "user.email"], text=True).strip()
    except subprocess.CalledProcessError:
        current = "None"
    except Exception as e:
        print(f"Error checking git config: {e}")
        current = "Error"

    if current != target_email:
        print(f"Current Git email was: {current}")
        print(f"Setting it back to: {target_email}")
        subprocess.run(["git", "config", "--global", "user.email", target_email])
        subprocess.run(["git", "config", "--global", "user.name", target_name])
        print("✅ Git is now SAFE. It uses your main account.")
    else:
        print(f"✅ Git is already correct ({target_email}).")

    print("\n" + "="*60)
    print("--- STEP 2: VERIFYING GEMINI ULTRA CONNECTION ---")
    print("="*60)
    print("The AI (Gemini) connection is separate from Git.")
    print("I cannot programmatically check your VS Code login status from this script.")
    print("\nPLEASE VERIFY MANUALLY:")
    print("1. Look at the bottom status bar in VS Code.")
    print("2. Locate 'Gemini' or 'Cloud Code'.")
    print("3. Ensure it shows the paid account:")
    print(f"   👉 abdellatif505050@gmail.com")
    print("\nIf you see 'Sign In' or the wrong email, click it to switch.")
    print("="*60)

if __name__ == "__main__":
    verify_and_fix()