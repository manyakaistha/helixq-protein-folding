# Secondary Structure Principles & DSSP Taxonomy

## 1. Physical Basis of Protein Secondary Structure

Protein secondary structure refers to local segments of polypeptide chains that form regular geometric patterns stabilized primarily by hydrogen bonds between the backbone peptide amide ($N-H$) and carbonyl ($C=O$) groups.

Unlike full 3D tertiary structure (which involves long-range hydrophobic packing, disulfide bridges, and domain folding), secondary structure is inherently one-dimensional along the sequence coordinate, parameterized by backbone dihedral angles $(\phi, \psi)$.

---

## 2. Kabsch & Sander DSSP 8-State Taxonomy

The standard definition in computational biology is derived from the **DSSP** (Define Secondary Structure of Proteins) algorithm:

| Code | Biological Name | Q3 Reduction | Backbone Hydrogen-Bond Pattern | Physical Description |
|---|---|---|---|---|
| **H** | $\alpha$-Helix | **H** (Helix) | $i \to i+4$ | Standard right-handed helix, 3.6 residues/turn, 1.5 Å rise. |
| **G** | $3_{10}$-Helix | **H** (Helix) | $i \to i+3$ | Tight right-handed helix, 3.0 residues/turn, common at helix ends. |
| **I** | $\pi$-Helix | **H** (Helix) | $i \to i+5$ | Wide, bulky helix, 4.4 residues/turn, extremely rare (~0.1%). |
| **E** | $\beta$-Sheet Strand | **E** (Strand) | Inter-strand H-bonds | Extended conformation ($\phi \approx -120^\circ, \psi \approx +120^\circ$) forming sheets. |
| **B** | $\beta$-Bridge | **E** (Strand) | Single inter-strand H-bond | Isolated single residue pair $\beta$-sheet hydrogen bond. |
| **T** | Hydrogen-bonded Turn | **C** (Coil) | Tight $i \to i+3, 4, 5$ bend | Reverses chain direction, 3 to 5 residues. |
| **S** | High Curvature Bend | **C** (Coil) | Geometrical bend ($>70^\circ$) | No backbone H-bond, but sharp direction reversal. |
| **C** | Random Coil / Loop | **C** (Coil) | Irregular | Flexible connecting loops, disordered linkers, irregular structure. |

---

## 3. Q8 to Q3 Standard Reduction Scheme

To evaluate coarse structural features, Q8 annotations are universally reduced into 3 classes:
- **Helix (H)**: $\{ \text{H}, \text{G}, \text{I} \}$
- **Strand (E)**: $\{ \text{E}, \text{B} \}$
- **Coil (C)**: $\{ \text{C}, \text{T}, \text{S} \}$

### Dual-Head Prediction Discrepancy Policy
In ProteinFold AI:
1. The champion model employs independent classification heads for Q8 and Q3.
2. The independent Q3 head frequently achieves higher standalone accuracy (~70.7% F1) than projecting Q8 argmax to Q3.
3. The platform **never silently overrides** model outputs. Both the direct Q3 head prediction and the projected Q8 state are exposed, and any discrepancies are highlighted in the Structural Analysis dashboard.

---

## 4. Biological Boundary Statement

> [!WARNING]
> Secondary structure prediction is **not** equivalent to three-dimensional protein folding:
> - It does not provide Cartesian $(x, y, z)$ atomic coordinates.
> - It does not model inter-domain packing, ligand binding sites, or quaternary complex assembly.
> - It is **not** a replacement for full folding engines such as AlphaFold, ESMFold, or RosettaFold.
