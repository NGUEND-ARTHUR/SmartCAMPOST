import subprocess, sys, os

# This script runs each install_*.py from Claude outputs
# Adjust this path to where Claude outputs are saved on your machine
# (Check your Downloads folder or claude.ai downloads)

PICS = r'C:\Users\Nguend Arthur Johann\Desktop\SmartCAMPOST\diagrams\PICTURES'

subfolders = ['ARCHITECTURE', r'SEQUENCE\jpg', r'ACTIVITY\jpg', 'USE CASE']
for s in subfolders:
    os.makedirs(os.path.join(PICS, s), exist_ok=True)

print("Target folders created:")
for s in subfolders:
    print(" ", os.path.join(PICS, s))

print()
print("NOW: Download the 8 PNG files from Claude outputs and run:")
print("  python install_01_use_case_diagram_v2.py")
print("  python install_02_architecture_diagram.py")
print("  ... etc")
print()
print("OR: Simply download the PNG files and copy manually to:")
print()
print("  01_use_case_diagram_v2.png       ->", os.path.join(PICS, 'USE CASE'))
print("  02_architecture_diagram.png      ->", os.path.join(PICS, 'ARCHITECTURE'))
print("  03_infrastructure_deployment.png ->", os.path.join(PICS, 'ARCHITECTURE'))
print("  04_sequence_*.png                ->", os.path.join(PICS, r'SEQUENCE\jpg'))
print("  05_sequence_*.png                ->", os.path.join(PICS, r'SEQUENCE\jpg'))
print("  06_activity_risk_*.png           ->", os.path.join(PICS, r'ACTIVITY\jpg'))
print("  07_activity_finance_*.png        ->", os.path.join(PICS, r'ACTIVITY\jpg'))
print("  08_activity_admin*.png           ->", os.path.join(PICS, r'ACTIVITY\jpg'))
