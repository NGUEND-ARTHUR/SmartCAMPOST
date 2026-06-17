def callback(commit):
    msg = commit.message.decode('utf-8', errors='ignore')

    lines = []
    for line in msg.splitlines():
        if 'Claude Sonnet' in line:
            continue
        if 'anthropic.com' in line:
            continue
        lines.append(line)

    commit.message = ('\n'.join(lines) + '\n').encode('utf-8')
