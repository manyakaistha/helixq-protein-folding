/**
 * Scientific constants, color schemes, and reference benchmark data for ProteinFold AI.
 * Harmonized with an editorial, biomolecular palette inspired by scientific workbenches.
 */

export interface SSClassMeta {
  code: string;
  name: string;
  category: 'helix' | 'strand' | 'coil';
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
}

export const Q8_METADATA: Record<string, SSClassMeta> = {
  H: {
    code: 'H',
    name: 'Alpha Helix',
    category: 'helix',
    color: '#1e785e', // Vibrant emerald
    bgColor: 'rgba(30, 120, 94, 0.12)',
    borderColor: '#1e785e',
    textColor: '#155643',
    description: 'Classic 4-turn alpha-helix with standard i -> i+4 H-bonds.'
  },
  G: {
    code: 'G',
    name: '3-10 Helix',
    category: 'helix',
    color: '#2fa886', // Jade mint
    bgColor: 'rgba(47, 168, 134, 0.12)',
    borderColor: '#2fa886',
    textColor: '#1a644f',
    description: 'Tighter 3-turn helix with i -> i+3 hydrogen bonds.'
  },
  I: {
    code: 'I',
    name: 'Pi Helix',
    category: 'helix',
    color: '#135442', // Deep pine
    bgColor: 'rgba(19, 84, 66, 0.12)',
    borderColor: '#135442',
    textColor: '#0c382c',
    description: 'Wider 5-turn helix with i -> i+5 hydrogen bonds (rare).'
  },
  E: {
    code: 'E',
    name: 'Beta Strand',
    category: 'strand',
    color: '#d97706', // Warm amber
    bgColor: 'rgba(217, 119, 6, 0.12)',
    borderColor: '#d97706',
    textColor: '#92400e',
    description: 'Extended beta-strand forming parallel or antiparallel sheets.'
  },
  B: {
    code: 'B',
    name: 'Beta Bridge',
    category: 'strand',
    color: '#b45309', // Terracotta bronze
    bgColor: 'rgba(180, 83, 9, 0.12)',
    borderColor: '#b45309',
    textColor: '#78350f',
    description: 'Isolated beta-bridge residue not in a continuous beta sheet.'
  },
  T: {
    code: 'T',
    name: 'Turn',
    category: 'coil',
    color: '#7c3aed', // Amethyst violet
    bgColor: 'rgba(124, 58, 237, 0.12)',
    borderColor: '#7c3aed',
    textColor: '#5b21b6',
    description: 'Hydrogen-bonded turn reversing the polypeptide backbone.'
  },
  S: {
    code: 'S',
    name: 'Bend',
    category: 'coil',
    color: '#0284c7', // Cerulean azure
    bgColor: 'rgba(2, 132, 199, 0.12)',
    borderColor: '#0284c7',
    textColor: '#0369a1',
    description: 'Region of high backbone curvature without specific H-bonding.'
  },
  C: {
    code: 'C',
    name: 'Coil / Loop',
    category: 'coil',
    color: '#64748b', // Heather slate
    bgColor: 'rgba(100, 116, 139, 0.12)',
    borderColor: '#64748b',
    textColor: '#334155',
    description: 'Irregular loop, unstructured terminus, or random coil.'
  }
};

export const Q3_METADATA: Record<string, SSClassMeta> = {
  H: {
    code: 'H',
    name: 'Helix',
    category: 'helix',
    color: '#1e785e',
    bgColor: 'rgba(30, 120, 94, 0.12)',
    borderColor: '#1e785e',
    textColor: '#155643',
    description: 'Combined helical category (Alpha, 3-10, or Pi helix).'
  },
  E: {
    code: 'E',
    name: 'Strand',
    category: 'strand',
    color: '#d97706',
    bgColor: 'rgba(217, 119, 6, 0.12)',
    borderColor: '#d97706',
    textColor: '#92400e',
    description: 'Combined extended strand category (Beta sheets and bridges).'
  },
  C: {
    code: 'C',
    name: 'Coil',
    category: 'coil',
    color: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.12)',
    borderColor: '#64748b',
    textColor: '#334155',
    description: 'Combined coil category (Turns, bends, and flexible loops).'
  }
};

export const AMINO_ACIDS: Record<string, { name: string; code3: string; category: string; color: string }> = {
  A: { name: 'Alanine', code3: 'ALA', category: 'Hydrophobic', color: '#38594e' },
  C: { name: 'Cysteine', code3: 'CYS', category: 'Special / Disulfide', color: '#c59b50' },
  D: { name: 'Aspartate', code3: 'ASP', category: 'Acidic (-)', color: '#d88568' },
  E: { name: 'Glutamate', code3: 'GLU', category: 'Acidic (-)', color: '#d88568' },
  F: { name: 'Phenylalanine', code3: 'PHE', category: 'Aromatic', color: '#2c5d4f' },
  G: { name: 'Glycine', code3: 'GLY', category: 'Flexible', color: '#78877c' },
  H: { name: 'Histidine', code3: 'HIS', category: 'Basic (+)', color: '#6366f1' },
  I: { name: 'Isoleucine', code3: 'ILE', category: 'Hydrophobic', color: '#38594e' },
  K: { name: 'Lysine', code3: 'LYS', category: 'Basic (+)', color: '#4f46e5' },
  L: { name: 'Leucine', code3: 'LEU', category: 'Hydrophobic', color: '#38594e' },
  M: { name: 'Methionine', code3: 'MET', category: 'Hydrophobic', color: '#38594e' },
  N: { name: 'Asparagine', code3: 'ASN', category: 'Polar Neutral', color: '#0284c7' },
  P: { name: 'Proline', code3: 'PRO', category: 'Rigid / Helix Break', color: '#c59b50' },
  Q: { name: 'Glutamine', code3: 'GLN', category: 'Polar Neutral', color: '#0284c7' },
  R: { name: 'Arginine', code3: 'ARG', category: 'Basic (+)', color: '#4f46e5' },
  S: { name: 'Serine', code3: 'SER', category: 'Polar Neutral', color: '#0284c7' },
  T: { name: 'Threonine', code3: 'THR', category: 'Polar Neutral', color: '#0284c7' },
  V: { name: 'Valine', code3: 'VAL', category: 'Hydrophobic', color: '#38594e' },
  W: { name: 'Tryptophan', code3: 'TRP', category: 'Aromatic', color: '#2c5d4f' },
  Y: { name: 'Tyrosine', code3: 'TYR', category: 'Aromatic / Polar', color: '#2c5d4f' },
  '*': { name: 'Stop / Separator', code3: 'STP', category: 'Terminal', color: '#9da89e' },
  '<UNK>': { name: 'Unknown / Ambiguous', code3: 'UNK', category: 'Unspecified', color: '#9da89e' }
};

export interface ExampleProtein {
  name: string;
  organism: string;
  uniprotId: string;
  pdbId?: string;
  description: string;
  sequence: string;
  knownPdbCoords?: [number, number, number][]; // Optional real Ca coords
}

export const EXAMPLE_PROTEINS: ExampleProtein[] = [
  {
    name: 'Human Hemoglobin Alpha',
    organism: 'Homo sapiens',
    uniprotId: 'P69905',
    pdbId: '1HHO',
    description: 'Classic globin all-alpha fold with 7 packed alpha-helices transporting oxygen.',
    sequence: 'MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR'
  },
  {
    name: 'Human Ubiquitin',
    organism: 'Homo sapiens',
    uniprotId: 'P0CG48',
    pdbId: '1UBQ',
    description: 'Prototypical alpha+beta roll fold: prominent 3.5-turn alpha-helix nestled against a 5-stranded pleated sheet.',
    sequence: 'MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG'
  },
  {
    name: 'Hen Egg Lysozyme',
    organism: 'Gallus gallus',
    uniprotId: 'P00698',
    pdbId: '1LYZ',
    description: 'Bacteriolytic enzyme with two distinct structural domains: an alpha-helical lobe and a beta-sheet lobe.',
    sequence: 'KVFGRCELAAAMKRHGLDNYRGYSLGNWVCAAKFESNFNTQATNRNTDGSTDYGILQINSRWWCNDGRTPGSRNLCNIPCSALLSSDITASVNCAKKIVSDGNGMNAWVAWRNRCKGTDVQAWIRGCRL'
  },
  {
    name: 'Green Fluorescent Protein (GFP)',
    organism: 'Aequorea victoria',
    uniprotId: 'P42212',
    pdbId: '1GFL',
    description: 'Remarkable 11-stranded antiparallel beta-barrel cylinder enclosing a central catalytic alpha-helix.',
    sequence: 'MSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLKFICTTGKLPVPWPTLVTTFSYGVQCFSRYPDHMKQHDFFKSAMPEGYVQERTIFFKDDGNYKTRAEVKFEGDTLVNRIELKGIDFKEDGNILGHKLEYNYNSHNVYIMADKQKNGIKVNFKIRHNIEDGSVQLADHYQQNTPIGDGPVLLPDNHYLSTQSALSKDPNEKRDHMVLLEFVTAAGITHGMDELYK'
  },
  {
    name: 'Crambin Seed Protein',
    organism: 'Crambe hispanica',
    uniprotId: 'P01542',
    pdbId: '1CRN',
    description: 'Compact plant seed storage protein with 2 amphipathic alpha-helices and a short 2-stranded beta-sheet.',
    sequence: 'TTCCPSIVARSNFNVCRLPGTPEAICATYTGCIIIPGATCPGDYAN'
  },
  {
    name: 'Human Insulin Chain B',
    organism: 'Homo sapiens',
    uniprotId: 'P01308',
    pdbId: '1TRZ',
    description: 'Essential peptide hormone featuring a central alpha-helix stabilized by inter-chain disulfides.',
    sequence: 'FVNQHLCGSHLVEALYLVCGERGFFYTPKT'
  }
];

export const BENCHMARK_HISTORY = [
  { version: 'v1', name: 'Vanilla Bi-RNN', score: 0.4600, notes: 'Baseline bidirectional recurrent network with fixed embeddings' },
  { version: 'v4', name: 'Stacked Bi-LSTM', score: 0.4570, notes: '3-layer Bi-LSTM with dropout regularizer' },
  { version: 'v8', name: 'Bi-GRU + Residuals', score: 0.4850, notes: 'Lightweight GRU with residual skip connections' },
  { version: 'v10', name: 'Champion: MultiScale CNN + BiGRU + Attention', score: 0.4910, notes: 'Optimized receptive field with AMP and checkpointing (Production Champion)' },
  { version: 'v11', name: 'Bi-GRU + CRF Decoder', score: 0.4120, notes: 'CRF transition regularizer proved unstable during training' },
  { version: 'v14', name: 'Dilated ResNet + BiGRU', score: 0.4820, notes: 'Deeper residual network; slight overfitting compared to v10' }
];
