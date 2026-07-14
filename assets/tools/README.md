# MCP tool demo clips

Drop a short demo clip here named exactly after the tool, e.g.
`gripper_translate.mp4`. Supported extensions (first match wins):
`.mp4`, `.webm`, `.gif`.

`build_tools.py` scans this folder and wires each clip into `tools.json`.
Tools without a clip show a "Demo video coming soon" placeholder, so missing
files are fine. Rerun `python website/build_tools.py` after adding clips.
