# Zeitwerk – Arbeitszeit-Rechner (Angular PWA)

Eine eigenständige, lokal hostbare Arbeitszeitberechnung mit bis zu zwei Pausen. Die App benötigt keinen Backend-Dienst und berechnet vollständig im Browser.

## Voraussetzungen

- Node.js 20.19+ oder 22.12+
- npm

## Lokal starten (Entwicklungsmodus)

```bash
npm install
npm start
```

Dann `http://localhost:4200` öffnen.

## Produktionsversion bauen

```bash
npm install
npm run build:prod
```

Der fertige Build liegt in `dist/arbeitszeit-pwa/browser/`.

## Lokal im Heimnetz / auf NAS hosten

Den Inhalt von `dist/arbeitszeit-pwa/browser/` mit einem statischen Webserver ausliefern, z. B. nginx, Caddy oder Apache. Es wird kein Node-Prozess zur Laufzeit benötigt.

Für Service Worker und PWA-Installation muss die Seite über **HTTPS** oder `localhost` ausgeliefert werden. Für den Zugriff über eine LAN-IP (z. B. `http://192.168.x.x`) ist HTTPS erforderlich, damit Browser die PWA-Funktionen freischalten.

Beispiel mit einem temporären lokalen Static-Server:

```bash
npx http-server dist/arbeitszeit-pwa/browser -p 8080
```

## Funktionen

- Beginn und Ende als Uhrzeit
- Automatische Erkennung von Schichten über Mitternacht
- Zwei separat aktivierbare Pausen
- Pausen-Einheit Minuten oder Stunden (inkl. Dezimalstunden)
- Brutto-, Pausen- und Nettozeit
- Dezimaldarstellung mit deutschem Zahlenformat
- Responsive Darstellung für Smartphone und Desktop
- Angular Service Worker mit App-Shell-Caching für Offline-Nutzung

## Hinweise

- Die App verwendet keine API und sendet keine Eingaben an einen Server.
- Die Arbeitszeit wird als ein zusammenhängender Zeitraum interpretiert. Pausen werden als Dauer abgezogen; Pausen-Uhrzeiten werden nicht separat erfasst.
- Eine Schicht mit identischer Start- und Endzeit wird als 0 Stunden behandelt, nicht als 24-Stunden-Schicht.
- Die Google-Fonts-Zeile in `src/styles.css` ist optional. Für vollständig netzunabhängige Optik kann sie entfernt werden; dann greifen die lokalen Fallback-Schriften.
