import pandas as pd
from pathlib import Path

p = Path('delete')
for name in ['fee_structures.csv','fee_invoices.csv','fee_payments.csv']:
    path = p / name
    if path.exists():
        df = pd.read_csv(path, dtype=str)
        print(f"{name}: {len(df)} rows")
    else:
        print(f"{name}: missing")
