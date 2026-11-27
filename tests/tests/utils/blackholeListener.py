"""A loopback port that silently drops every new TCP SYN, for `tcpForward.test.ts`.

It listens with a zero backlog and never accepts, then fills the accept queue with its own connections. Once the
queue is full, the kernel (Linux and the BSDs alike) drops further SYNs without answering them, so a dial to the
port neither connects nor is refused: it waits until the dialler gives up. That is the dropped-SYN shape the relay's
dial deadline exists for, produced on loopback, independently of the host's routing or egress firewall.

It prints `READY <port>` only after a probe dial has been seen to hang, and runs until it is killed.
"""

import socket
import sys
import time

PROBE_WAIT_S = 0.3
MAX_FILLERS = 64

listener = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
listener.bind(("127.0.0.1", 0))
listener.listen(0)
port = listener.getsockname()[1]

fillers = []
for _ in range(MAX_FILLERS):
    probe = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    probe.setblocking(False)
    fillers.append(probe)
    probe.connect_ex(("127.0.0.1", port))
    deadline = time.monotonic() + PROBE_WAIT_S
    connected = False
    while time.monotonic() < deadline:
        if probe.getsockopt(socket.SOL_SOCKET, socket.SO_ERROR) == 0:
            try:
                probe.getpeername()
                connected = True
                break
            except OSError:
                pass
        time.sleep(0.01)
    if not connected:
        print(f"READY {port}", flush=True)
        break
else:
    print(f"accept queue of port {port} never filled after {MAX_FILLERS} connections", file=sys.stderr, flush=True)
    sys.exit(1)

while True:
    time.sleep(3600)
