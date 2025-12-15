#!/usr/bin/env python3
"""Simple version8 updater - just modify config values"""

import json

# Load version8
with open('/Volumes/1700 APFS/PERSONAL_PROGRAMMING_PROJECTS/intro_dl_nppe/nppe2/version8_bi_gru_improved.ipynb', 'r') as f:
    nb = json.load(f)

changes = 0

for cell in nb['cells']:
    if 'source' not in cell:
        continue
    
    source_str = ''.join(cell['source'])
    
    # Update config values
    for i, line in enumerate(cell['source']):
        # Dropout 0.3 → 0.4
        if 'dropout = 0.3' in line and 'Config' in source_str[:source_str.find(line)]:
            cell['source'][i] = '    dropout = 0.4  # Increased from 0.3\n'
            changes += 1
        
        # Weight decay
        if 'weight_decay = 1e-5' in line:
            cell['source'][i] = '    weight_decay = 5e-5  # Increased from 1e-5\n'
            changes += 1
        
        # Epochs
        if 'epochs = 30' in line and 'Config' in source_str[:source_str.find(line)]:
            cell['source'][i] = '    epochs = 40  # Increased for more training time\n'
            changes += 1
        
        # Paths
        if 'best_model_bigru.pth' in line:
            cell['source'][i] = line.replace('bigru.pth', 'bigru_v8.pth')
            changes += 1
        
        if 'submission_bigru.csv' in line:
            cell['source'][i] = line.replace('bigru.csv', 'bigru_v8.csv')
            changes += 1
        
        if 'trackio_group = "bi_gru"' in line:
            cell['source'][i] = '    trackio_group = "bi_gru_v8"\n'
            changes += 1
        
        if 'training_curves_bigru.png' in line:
            cell['source'][i] = line.replace('bigru.png', 'bigru_v8.png')
            changes += 1

# Save
with open('/Volumes/1700 APFS/PERSONAL_PROGRAMMING_PROJECTS/intro_dl_nppe/nppe2/version8_bi_gru_improved.ipynb', 'w') as f:
    json.dump(nb, f, indent=1)

print(f"✓ Updated version8 with {changes} changes")
print("  - Dropout: 0.3 → 0.4")
print("  - Weight decay: 1e-5 → 5e-5")
print("  - Epochs: 30 → 40")
print("  - Updated file paths")
