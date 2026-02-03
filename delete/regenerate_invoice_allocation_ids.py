"""
Regenerate invoice allocation IDs to match fee_allocations.csv.

This script:
- Reads `fee_allocations.csv` and assigns stable allocation IDs (1-based index).
- Maps `admission_number` -> `fee_allocation_id`.
- Reads `fee_invoices.csv` and adds `fee_allocation_id` column by lookup.
- Writes `fee_invoices.with_allocations.csv` and prints summary.

Run:
    python regenerate_invoice_allocation_ids.py
"""
import os
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IN_DIR = BASE_DIR
ALLOC_CSV = os.path.join(IN_DIR, 'fee_allocations.csv')
INVOICES_CSV = os.path.join(IN_DIR, 'fee_invoices.csv')
OUT_CSV = os.path.join(IN_DIR, 'fee_invoices.with_allocations.csv')


def load_allocations(path):
    df = pd.read_csv(path, dtype=str)
    # Assign stable numeric ids based on file order starting at 1
    df = df.fillna('')
    df['fee_allocation_id'] = range(1, len(df) + 1)
    # Expect admission_number column to exist
    if 'admission_number' not in df.columns:
        raise SystemExit('fee_allocations.csv missing admission_number column')
    mapping = df.set_index('admission_number')['fee_allocation_id'].to_dict()
    return mapping, df


def attach_allocations(invoices_path, mapping):
    df = pd.read_csv(invoices_path, dtype=str)
    df = df.fillna('')
    if 'admission_number' not in df.columns:
        raise SystemExit('fee_invoices.csv missing admission_number column')
    # Lookup allocation id by admission_number; if not found, set to empty
    df['fee_allocation_id'] = df['admission_number'].map(lambda adm: mapping.get(adm, ''))
    return df


def main():
    if not os.path.exists(ALLOC_CSV):
        print('Missing', ALLOC_CSV)
        return
    if not os.path.exists(INVOICES_CSV):
        print('Missing', INVOICES_CSV)
        return

    mapping, alloc_df = load_allocations(ALLOC_CSV)
    inv_df = attach_allocations(INVOICES_CSV, mapping)

    inv_df.to_csv(OUT_CSV, index=False)
    print('Wrote:', OUT_CSV)
    # summary
    total = len(inv_df)
    matched = inv_df['fee_allocation_id'].astype(bool).sum()
    unmatched = total - matched
    print(f'Total invoices: {total}, matched allocations: {matched}, unmatched: {unmatched}')


if __name__ == '__main__':
    main()
