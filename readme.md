# webgl-heightfield-water

Ausbreitung und Berechnung Wellen und Rendering einer Wasseroberfläche mit begrenzter Domain. Inspririert von Even Wallace\`s WebGL Water http://madebyevan.com/webgl-water/ was dann doch was besser klappt und besser aussieht 😥

## Live Demo
https://iar5.github.io/webgl-heightfield-water/

## Lokales Starten der Anwendung

Das Starten der Anwendung erfordert einen lokalen Webserver. Mit npm kann der http-server verwendet werden:

```
npm install http-server -g
http-server
```

## Wechsel zwischen CPU/GPU Berechnung der Simulation

In src/objects/Water.js müssen folgende Zeile ent- und die anderen entsprechend auskommentiert werden:

- für CPU: Zeile 54 und 55
- für GPU: Zeile 57 und 58

## Fehler bei der GPU Implementierung

- Berechnungen sind fehlerhaft
- Wechselwirkung mit skymap.render() in src/main.js. Wird dieses Statement auskommentiert, Verhält sich die Simulation anders (weniger verbuggt)
- Wird der depthtest aktiviert, wird die initiale GPGPU Textur annuliert

## Nächste Schritte

- Erneut mit einem einfachen, besser nachvollziehbare Code im GPGPU Programm testen
- Bestehendes GPGPU Beispiele aus Internet raussuchen und in in dieses Projekt intergrieren und schauen, was diese anders machen.
