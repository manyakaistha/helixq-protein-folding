/**
 * Scientific constants, color schemes, and reference benchmark data for ProteinFold AI.
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
    color: '#8B5CF6',
    bgColor: 'bg-purple-100 dark:bg-purple-950/60',
    borderColor: 'border-purple-400 dark:border-purple-600',
    textColor: 'text-purple-700 dark:text-purple-300',
    description: 'Classic 4-turn alpha-helix with standard i -> i+4 H-bonds.'
  },
  G: {
    code: 'G',
    name: '3-10 Helix',
    category: 'helix',
    color: '#A78BFA',
    bgColor: 'bg-indigo-100 dark:bg-indigo-950/60',
    borderColor: 'border-indigo-400 dark:border-indigo-600',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    description: 'Tighter 3-turn helix with i -> i+3 hydrogen bonds.'
  },
  I: {
    code: 'I',
    name: 'Pi Helix',
    category: 'helix',
    color: '#C4B5FD',
    bgColor: 'bg-violet-100 dark:bg-violet-950/60',
    borderColor: 'border-violet-400 dark:border-violet-600',
    textColor: 'text-violet-700 dark:text-violet-300',
    description: 'Wider 5-turn helix with i -> i+5 hydrogen bonds (rare).'
  },
  E: {
    code: 'E',
    name: 'Beta Strand',
    category: 'strand',
    color: '#0284C7',
    bgColor: 'bg-sky-100 dark:bg-sky-950/60',
    borderColor: 'border-sky-400 dark:border-sky-600',
    textColor: 'text-sky-700 dark:text-sky-300',
    description: 'Extended beta-strand forming parallel or antiparallel sheets.'
  },
  B: {
    code: 'B',
    name: 'Beta Bridge',
    category: 'strand',
    color: '#38BDF8',
    bgColor: 'bg-cyan-100 dark:bg-cyan-950/60',
    borderColor: 'border-cyan-400 dark:border-cyan-600',
    textColor: 'text-cyan-700 dark:text-cyan-300',
    description: 'Isolated beta-bridge residue not in a continuous beta sheet.'
  },
  T: {
    code: 'T',
    name: 'Turn',
    category: 'coil',
    color: '#F59E0B',
    bgColor: 'bg-amber-100 dark:bg-amber-950/60',
    borderColor: 'border-amber-400 dark:border-amber-600',
    textColor: 'text-amber-700 dark:text-amber-300',
    description: 'Hydrogen-bonded turn reversing the polypeptide backbone.'
  },
  S: {
    code: 'S',
    name: 'Bend',
    category: 'coil',
    color: '#FBBF24',
    bgColor: 'bg-yellow-100 dark:bg-yellow-950/60',
    borderColor: 'border-yellow-400 dark:border-yellow-600',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    description: 'Region of high backbone curvature without specific H-bonding.'
  },
  C: {
    code: 'C',
    name: 'Coil / Loop',
    category: 'coil',
    color: '#64748B',
    bgColor: 'bg-slate-100 dark:bg-slate-800/60',
    borderColor: 'border-slate-400 dark:border-slate-600',
    textColor: 'text-slate-700 dark:text-slate-300',
    description: 'Irregular loop, unstructured terminus, or random coil.'
  }
};

export const Q3_METADATA: Record<string, SSClassMeta> = {
  H: {
    code: 'H',
    name: 'Helix',
    category: 'helix',
    color: '#8B5CF6',
    bgColor: 'bg-purple-100 dark:bg-purple-950/60',
    borderColor: 'border-purple-400 dark:border-purple-600',
    textColor: 'text-purple-700 dark:text-purple-300',
    description: 'Combined helical category (Alpha, 3-10, or Pi helix).'
  },
  E: {
    code: 'E',
    name: 'Strand',
    category: 'strand',
    color: '#0284C7',
    bgColor: 'bg-sky-100 dark:bg-sky-950/60',
    borderColor: 'border-sky-400 dark:border-sky-600',
    textColor: 'text-sky-700 dark:text-sky-300',
    description: 'Combined extended strand category (Beta sheets and bridges).'
  },
  C: {
    code: 'C',
    name: 'Coil',
    category: 'coil',
    color: '#64748B',
    bgColor: 'bg-slate-100 dark:bg-slate-800/60',
    borderColor: 'border-slate-400 dark:border-slate-600',
    textColor: 'text-slate-700 dark:text-slate-300',
    description: 'Combined coil category (Turns, bends, and flexible loops).'
  }
};

export const AMINO_ACIDS: Record<string, string> = {
  A: 'Alanine (Ala)',
  C: 'Cysteine (Cys)',
  D: 'Aspartate (Asp)',
  E: 'Glutamate (Glu)',
  F: 'Phenylalanine (Phe)',
  G: 'Glycine (Gly)',
  H: 'Histidine (His)',
  I: 'Isoleucine (Ile)',
  K: 'Lysine (Lys)',
  L: 'Leucine (Leu)',
  M: 'Methionine (Met)',
  N: 'Asparagine (Asn)',
  P: 'Proline (Pro)',
  Q: 'Glutamine (Gln)',
  R: 'Arginine (Arg)',
  S: 'Serine (Ser)',
  T: 'Threonine (Thr)',
  V: 'Valine (Val)',
  W: 'Tryptophan (Trp)',
  Y: 'Tyrosine (Tyr)',
  '*': 'Stop / Separator',
  '<UNK>': 'Unknown / Ambiguous'
};

export interface ExampleProtein {
  name: string;
  organism: string;
  uniprotId: string;
  description: string;
  sequence: string;
}

export const EXAMPLE_PROTEINS: ExampleProtein[] = [
  {
    name: 'Human Hemoglobin Alpha',
    organism: 'Homo sapiens',
    uniprotId: 'P69905',
    description: 'Predominantly alpha-helical oxygen-transport protein (7 alpha helices).',
    sequence: 'MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR'
  },
  {
    name: 'Human Ubiquitin',
    organism: 'Homo sapiens',
    uniprotId: 'P0CG48',
    description: 'Classic mixed alpha/beta fold with 1 alpha-helix and a 5-strand antiparallel beta-sheet.',
    sequence: 'MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG'
  },
  {
    name: 'Hen Egg Lysozyme',
    organism: 'Gallus gallus',
    uniprotId: 'P00698',
    description: 'Enzyme with two structural domains: one largely alpha-helical, one containing beta-sheets and turns.',
    sequence: 'KVFGRCELAAAMKRHGLDNYRGYSLGNWVCAAKFESNFNTQATNRNTDGSTDYGILQINSRWWCNDGRTPGSRNLCNIPCSALLSSDITASVNCAKKIVSDGNGMNAWVAWRNRCKGTDVQAWIRGCRL'
  },
  {
    name: 'Green Fluorescent Protein (GFP)',
    organism: 'Aequorea victoria',
    uniprotId: 'P42212',
    description: 'Prototypical 11-stranded beta-barrel containing an internal alpha-helix carrying the fluorophore.',
    sequence: 'MSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLKFICTTGKLPVPWPTLVTTFSYGVQCFSRYPDHMKQHDFFKSAMPEGYVQERTIFFKDDGNYKTRAEVKFEGDTLVNRIELKGIDFKEDGNILGHKLEYNYNSHNVYIMADKQKNGIKVNFKIRHNIEDGSVQLADHYQQNTPIGDGPVLLPDNHYLSTQSALSKDPNEKRDHMVLLEFVTAAGITHGMDELYK'
  },
  {
    name: 'Human Insulin Chain B',
    organism: 'Homo sapiens',
    uniprotId: 'P01308',
    description: 'Essential hormonal peptide with a central alpha-helix and terminal loop regions.',
    sequence: 'FVNQHLCGSHLVEALYLVCGERGFFYTPKT'
  }
];

export const BENCHMARK_HISTORY = [
  { version: 'v1', name: 'Vanilla Bi-RNN', score: 0.4600, notes: 'Baseline baseline bidirectional recurrent network' },
  { version: 'v4', name: 'Stacked Bi-LSTM', score: 0.4570, notes: '3-layer Bi-LSTM with dropout' },
  { version: 'v8', name: 'Bi-GRU + Residuals', score: 0.4850, notes: 'Lightweight GRU with residual skip connections' },
  { version: 'v10', name: 'Champion: MultiScale CNN + BiGRU + Attention', score: 0.4910, notes: 'Optimized receptive field with AMP and checkpointing (Current Champion)' },
  { version: 'v11', name: 'Bi-GRU + CRF Decoder', score: 0.4120, notes: 'CRF transition regularizer proved unstable during training' },
  { version: 'v14', name: 'Dilated ResNet + BiGRU', score: 0.4820, notes: 'Deeper residual network; slight overfitting compared to v10' }
];
