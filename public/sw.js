// Service Worker สำหรับแจ้งเตือนแถบ Notification บนมือถือและคอมพิวเตอร์ (Web Push + Local Schedule)
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// รับข้อมูลจาก Web Push Server (เวลา 17:00 น. หรือเมื่อไม่มีภารกิจเกิน 5 วัน)
self.addEventListener("push", (event) => {
  let payload = {
    title: "🔔 แจ้งเตือนระบบ CCOC & UAV Mobile",
    body: "ถ้าออกปฏิบัติภารกิจวันนี้ อย่าลืมลงบันทึกภารกิจในระบบนะครับ",
    icon: "/stc_vehicle_front.png",
    badge: "/stc_vehicle_front.png",
    tag: "ccoc-mission-reminder",
    url: "/",
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch (e) {
      payload.body = event.data.text() || payload.body;
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || "/stc_vehicle_front.png",
    badge: payload.badge || "/stc_vehicle_front.png",
    tag: payload.tag || "ccoc-mission-reminder",
    renotify: true,
    requireInteraction: Boolean(payload.requireInteraction),
    vibrate: [200, 100, 200],
    data: {
      url: payload.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// รับคำสั่งแสดง Notification จากหน้าเว็บโดยตรง (สำหรับตัวตั้งเวลา 17:00 น. และเช็ค 5 วันฝั่ง Client)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SHOW_LOCAL_NOTIFICATION") {
    const payload = event.data.payload || {};
    const title = payload.title || "🔔 แจ้งเตือนระบบ CCOC & UAV Mobile";
    const options = {
      body: payload.body || "ถ้าออกปฏิบัติภารกิจวันนี้ อย่าลืมลงบันทึกภารกิจในระบบนะครับ",
      icon: payload.icon || "/stc_vehicle_front.png",
      badge: payload.badge || "/stc_vehicle_front.png",
      tag: payload.tag || "ccoc-local-reminder",
      renotify: true,
      requireInteraction: Boolean(payload.requireInteraction),
      vibrate: [200, 100, 200],
      data: {
        url: payload.url || "/",
      },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// เมื่อผู้ใช้คลิกที่แถบแจ้งเตือน ให้เปิดหน้าเว็บขึ้นมาทันที
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

