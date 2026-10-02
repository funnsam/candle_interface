let ip = window.location.hash.substring(1), socket, ping_interval;

function showError(msg) {
    error_span.innerText = msg;
    error_dialog.showModal();
}

function startSocket() {
    if (typeof socket === WebSocket) {
        socket.close();
    }

    socket = new WebSocket(`wss://${ip}/status`);
    socket.onopen = () => {
        ping_interval = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send("ping");
            }
        }, 1000);
    };

    socket.onmessage = ev => {
        updateInfo(JSON.parse(ev.data));
    };
    socket.onerror = ev => {
        showError("error");
        socket.close();
    };
    socket.onclose = ev => {
        showError(`${event.code} ${event.reason}`);
        clearInterval(ping_interval);
    };
}

function formatDuration(d) {
    const days = Math.floor(d / (24 * 3600));
    const hours = Math.floor((d % (24 * 3600)) / 3600);
    const minutes = Math.floor((d % 3600) / 60);
    const seconds = Math.floor(d % 60);

    const parts = [];

    if (days > 0) parts.push(`${days} 日`);
    if (hours > 0) parts.push(`${hours} 小時`);
    if (minutes > 0) parts.push(`${minutes} 分鐘`);
    if (seconds > 0 || parts.length === 0) {
        parts.push(`${seconds} 秒`);
    }

    return parts.join(" ");
}

var last_refresh;
function updateInfo(s) {
    uptime_span.innerText = formatDuration(s.uptime);

    const time = new Date(s.time.year,
        s.time.month,
        s.time.month_day_index + 1,
        s.time.hour,
        s.time.minute,
        s.time.seconds,
    );
    system_time_span.innerText = dayjs(time).format("YYYY-MM-DD HH:mm:ss");

    last_update_span.innerText = formatDuration(s.uptime - s.refresh.last);
    next_update_span.innerText = formatDuration(s.refresh.next - s.uptime);
    interval_span.innerText = formatDuration(s.refresh.interval);

    if (last_refresh !== s.refresh.last) {
        refresh_btn.disabled = false;
        last_refresh = s.refresh.last;
    }

    error_dialog.close();
    restart_btn.disabled = false;
}

startSocket();
error_reconnect.onclick = () => startSocket();

refresh_btn.onclick = e => {
    fetch(`http://${ip}/refresh`, { method: "POST" })
        .then(() => {})
        .catch(() => {});
    e.currentTarget.disabled = true;
};
restart_btn.onclick = e => {
    fetch(`http://${ip}/restart`, { method: "POST" })
        .then(() => {})
        .catch(() => {});
    e.currentTarget.disabled = true;
};
