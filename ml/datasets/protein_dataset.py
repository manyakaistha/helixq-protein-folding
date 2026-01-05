"""PyTorch Dataset, collator, and length-aware batching for protein sequences."""

from typing import List, Dict, Any, Optional, Union
import torch
from torch.utils.data import Dataset, Sampler
from torch.nn.utils.rnn import pad_sequence
import pandas as pd
import numpy as np

from ml.preprocessing.vocabulary import (
    PAD_TOKEN, AA_TO_ID, Q8_TO_ID, Q3_TO_ID, clean_sequence
)


class ProteinDataset(Dataset):
    """Dataset wrapper for protein sequences with optional Q8 and Q3 targets."""

    def __init__(self, data: Union[pd.DataFrame, List[Dict[str, Any]]], mode: str = "train"):
        if isinstance(data, pd.DataFrame):
            self.data = data.to_dict("records")
        else:
            self.data = data
        self.mode = mode

    def __len__(self) -> int:
        return len(self.data)

    def __getitem__(self, idx: int) -> Dict[str, Any]:
        row = self.data[idx]
        raw_seq = clean_sequence(row["seq"])
        seq_ids = [AA_TO_ID.get(c, AA_TO_ID["<UNK>"]) for c in raw_seq]
        item = {
            "id": str(row.get("id", idx)),
            "raw_seq": raw_seq,
            "seq": torch.tensor(seq_ids, dtype=torch.long),
            "length": len(seq_ids)
        }

        if self.mode == "train" or ("sst8" in row and "sst3" in row):
            sst8_str = row["sst8"]
            sst3_str = row["sst3"]
            item["q8"] = torch.tensor([Q8_TO_ID[c] for c in sst8_str], dtype=torch.long)
            item["q3"] = torch.tensor([Q3_TO_ID[c] for c in sst3_str], dtype=torch.long)

        return item


def protein_collate_fn(batch: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Dynamically pad sequence batches to the maximum sequence length in the batch."""
    seqs = pad_sequence([item["seq"] for item in batch], batch_first=True, padding_value=PAD_TOKEN)
    lengths = torch.tensor([item["length"] for item in batch], dtype=torch.long)
    ids = [item["id"] for item in batch]
    raw_seqs = [item["raw_seq"] for item in batch]

    out = {
        "seq": seqs,
        "lengths": lengths,
        "ids": ids,
        "raw_seqs": raw_seqs
    }

    if "q8" in batch[0]:
        out["q8"] = pad_sequence([item["q8"] for item in batch], batch_first=True, padding_value=PAD_TOKEN)
        out["q3"] = pad_sequence([item["q3"] for item in batch], batch_first=True, padding_value=PAD_TOKEN)

    return out


class LengthGroupedBatchSampler(Sampler):
    """Bucket sequences of similar length together to minimize padding waste during training."""

    def __init__(self, dataset: ProteinDataset, batch_size: int, shuffle: bool = True, seed: int = 42):
        self.dataset = dataset
        self.batch_size = batch_size
        self.shuffle = shuffle
        self.seed = seed
        self.lengths = [len(item["seq"]) for item in dataset]

    def __iter__(self):
        rng = np.random.default_rng(self.seed)
        indices = np.arange(len(self.dataset))
        
        # Sort by length + slight noise for stochastic variation
        if self.shuffle:
            noise = rng.uniform(-0.1, 0.1, size=len(indices))
            sort_keys = np.array(self.lengths) * (1.0 + noise)
            indices = indices[np.argsort(sort_keys)]
        else:
            indices = indices[np.argsort(self.lengths)]

        # Chunk into batches
        batches = [indices[i:i + self.batch_size].tolist() for i in range(0, len(indices), self.batch_size)]
        
        if self.shuffle:
            rng.shuffle(batches)

        for batch in batches:
            yield batch

    def __len__(self) -> int:
        return (len(self.dataset) + self.batch_size - 1) // self.batch_size
