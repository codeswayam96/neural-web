// CodeSwayam Push Notification Service Worker
// Copy this file to /public/sw.js in any app that needs push notifications.

self.addEventListener("push", (event) => {
    if (!event.data) return;

    let data = {};
    try {
        data = event.data.json();
    } catch {
        data = { title: "CodeSwayam", body: event.data.text() };
    }

    const title = data.title || "CodeSwayam";
    const options = {
        body: data.body || "",
        icon: data.icon || "/icon-192.png",
        badge: "/badge-72.png",
        data: { url: data.url || "/" },
        vibrate: [100, 50, 100],
        requireInteraction: false,
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = event.notification.data?.url || "/";
    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                // Focus existing tab if already open
                for (const client of clientList) {
                    if (client.url === url && "focus" in client) {
                        return client.focus();
                    }
                }
                // Otherwise open a new tab
                if (clients.openWindow) return clients.openWindow(url);
            })
    );
});
