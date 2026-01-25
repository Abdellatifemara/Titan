import sys

def fix_agent_login():
    paid_email = "abdellatif505050@gmail.com"
    
    print("\n" + "!"*60)
    print("   FIXING GEMINI AGENT LOGIN (THE RIGHT ANGLE)")
    print("!"*60)
    print("\nYou are correct: Git config is separate from the Gemini Agent.")
    print("Changing Git email does NOT log you into the Agent.")
    print("\nTo use your paid subscription, follow these manual steps in VS Code:")
    
    print("\n1. LOCATE THE AGENT STATUS")
    print("   Look at the bottom status bar for 'Gemini', 'Cloud Code', or a profile icon.")
    
    print("\n2. SWITCH ACCOUNTS")
    print("   - Click the icon.")
    print("   - Select 'Sign Out' if currently logged in.")
    print(f"   - Click 'Sign In' and use: {paid_email}")
    
    print("\n3. VERIFY")
    print("   - Once logged in, the Agent should recognize your subscription.")
    print("\n" + "="*60)

if __name__ == "__main__":
    fix_agent_login()