
import os
import pandas as pd
df = pd.DataFrame({'a': [1]})
path = 'c:/ECOLAB-ETS/RnD/nucleIQ/delete/test.xlsx'
print(f"Writing to {path}")
df.to_excel(path)
print("Done")
