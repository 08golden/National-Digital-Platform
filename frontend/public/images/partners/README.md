# Partner logos

The About page looks for these files and shows them automatically.
Until a file exists, a labelled placeholder is shown instead.

| File                  | Shown as             |
| --------------------- | -------------------- |
| `unesco-chair.png`    | UNESCO Chair         |
| `partner-1.png`       | Partner institution  |
| `partner-2.png`       | Partner institution  |

Use a transparent PNG (or change the extension in `AboutPage.tsx`), roughly
400x200px or larger. Logos belong to their organisations — please use the
versions they supply. To add more slots, edit the `PARTNERS` list at the top
of `frontend/src/components/AboutPage.tsx`.
