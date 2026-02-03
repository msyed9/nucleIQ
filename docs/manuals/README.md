# NucleiQ User Manuals

This folder contains per-module user manuals for each audience. Manuals are written in formal English, click-by-click, with screenshot placeholders.

## Structure

- `modules.json` — canonical module list and audience list
- `templates/` — base templates used for manual generation
- `manuals/` — output manuals (to be generated)
- `screenshots/` — screenshot placeholders and future captures

## Output Paths (Planned)

```
docs/manuals/manuals/<module>/<audience>.md
docs/manuals/manuals/<module>/<audience>.pdf
```

## Screenshot Placeholders

Each manual references placeholders under:

```
docs/manuals/screenshots/<module>/<audience>/
```

## Next Step

Confirm permission to auto-generate the full manual set (modules × audiences) using the templates and module list in `modules.json`.
