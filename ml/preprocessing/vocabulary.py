"""Token vocabulary and sequence preprocessing utilities for ProteinFold AI."""

import re
from typing import List, Tuple, Dict, Any

PAD_TOKEN = 0

# 23-token input vocabulary recovered from champion architecture
AA_CHARS: List[str] = [
    '<PAD>', '<UNK>', '*',
    'A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'Y'
]
AA_TO_ID: Dict[str, int] = {c: i for i, c in enumerate(AA_CHARS)}
ID_TO_AA: Dict[int, str] = {i: c for i, c in enumerate(AA_CHARS)}

# 9-class Q8 vocabulary (Index 0 is <PAD>, Indices 1-8 are biological classes)
Q8_CHARS: List[str] = ['<PAD>'] + sorted(['B', 'C', 'E', 'G', 'H', 'I', 'S', 'T'])
Q8_TO_ID: Dict[str, int] = {c: i for i, c in enumerate(Q8_CHARS)}
ID_TO_Q8: Dict[int, str] = {i: c for i, c in enumerate(Q8_CHARS)}

# 4-class Q3 vocabulary (Index 0 is <PAD>, Indices 1-3 are biological classes)
Q3_CHARS: List[str] = ['<PAD>'] + sorted(['C', 'E', 'H'])
Q3_TO_ID: Dict[str, int] = {c: i for i, c in enumerate(Q3_CHARS)}
ID_TO_Q3: Dict[int, str] = {i: c for i, c in enumerate(Q3_CHARS)}

# Biological descriptions for Q8 states
Q8_DESCRIPTIONS: Dict[str, str] = {
    'H': 'Alpha helix (4-turn)',
    'G': '3-10 helix (3-turn)',
    'I': 'Pi helix (5-turn)',
    'E': 'Extended beta strand (in parallel/antiparallel beta sheet)',
    'B': 'Isolated beta-bridge residue',
    'T': 'Hydrogen-bonded turn',
    'S': 'Bend / high curvature region',
    'C': 'Coil / irregular loop'
}

# Biological descriptions for Q3 states
Q3_DESCRIPTIONS: Dict[str, str] = {
    'H': 'Helix (Alpha, 3-10, or Pi)',
    'E': 'Strand (Extended beta-strand or bridge)',
    'C': 'Coil (Turn, bend, or irregular loop)'
}

# Standard DSSP reduction mapping from Q8 to Q3
Q8_TO_Q3_MAPPING: Dict[str, str] = {
    'H': 'H',
    'G': 'H',
    'I': 'H',
    'E': 'E',
    'B': 'E',
    'T': 'C',
    'S': 'C',
    'C': 'C',
}


def clean_sequence(raw_seq: str) -> str:
    """Normalize raw input sequence by stripping whitespace, newlines, and converting to uppercase.
    
    Preserves exact residue positions and characters.
    """
    if not raw_seq:
        return ""
    # Strip whitespace, tabs, carriage returns, newlines
    cleaned = re.sub(r'\s+', '', raw_seq).strip().upper()
    return cleaned


def validate_sequence(sequence: str) -> Tuple[bool, List[str]]:
    """Validate amino acid sequence and report unknown or invalid characters."""
    cleaned = clean_sequence(sequence)
    if not cleaned:
        return False, ["Sequence is empty."]
    
    warnings = []
    standard_aa = set("ACDEFGHIKLMNPQRSTVWY")
    non_standard = [c for c in cleaned if c not in standard_aa and c != '*']
    if non_standard:
        unique_non_std = sorted(list(set(non_standard)))
        warnings.append(
            f"Sequence contains non-standard residue characters: {', '.join(unique_non_std)}. "
            f"These will be tokenized using the unknown token (<UNK>)."
        )
    return True, warnings


def tokenize_sequence(sequence: str) -> List[int]:
    """Map cleaned sequence to list of integer token IDs using AA_TO_ID.
    
    Any unrecognized character is safely mapped to AA_TO_ID['<UNK>'] (index 1).
    Position alignment is strictly 1:1.
    """
    cleaned = clean_sequence(sequence)
    unk_id = AA_TO_ID['<UNK>']
    return [AA_TO_ID.get(c, unk_id) for c in cleaned]


def decode_q8(indices: List[int]) -> str:
    """Decode integer indices to Q8 string."""
    return ''.join([ID_TO_Q8.get(int(i), 'C') for i in indices])


def decode_q3(indices: List[int]) -> str:
    """Decode integer indices to Q3 string."""
    return ''.join([ID_TO_Q3.get(int(i), 'C') for i in indices])


def parse_fasta(content: str) -> List[Dict[str, str]]:
    """Parse single or multi-sequence FASTA formatted text into a list of dictionaries.
    
    Each entry contains 'id', 'header', and 'sequence'.
    """
    entries = []
    current_header = ""
    current_seq_lines = []

    lines = content.strip().splitlines()
    for line in lines:
        line_str = line.strip()
        if not line_str:
            continue
        if line_str.startswith(">"):
            if current_header or current_seq_lines:
                seq = ''.join(current_seq_lines)
                seq_id = current_header.split()[0] if current_header else f"seq_{len(entries) + 1}"
                entries.append({
                    "id": seq_id,
                    "header": current_header,
                    "sequence": clean_sequence(seq)
                })
                current_seq_lines = []
            current_header = line_str[1:].strip()
        else:
            current_seq_lines.append(line_str)

    if current_header or current_seq_lines:
        seq = ''.join(current_seq_lines)
        seq_id = current_header.split()[0] if current_header else f"seq_{len(entries) + 1}"
        entries.append({
            "id": seq_id,
            "header": current_header,
            "sequence": clean_sequence(seq)
        })

    return entries
