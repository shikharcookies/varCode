# Text to Shareable Link

A tiny Python CLI that uploads text to a public paste service and returns a shareable URL.

## Usage

Run with inline text:

```bash
python3 text_to_link.py "Hello world"
```

Run with piped input:

```bash
echo "My long text" | python3 text_to_link.py
```

The script prints a public URL you can share.

## Notes

- The link is public.
- Avoid uploading secrets, passwords, tokens, or private data.
