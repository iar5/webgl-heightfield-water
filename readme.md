# webgl-heightfield-water

## Starten der Anwendung

Das Starten der Anwendung erfordert einen lokalen Webserver. Mit npm kann der http-server verwendet werden:

```
npm install http-server -g
http-server
```

## Wechsel zwischen CPU/GPU Berechnung der Simulation

In src/objects/Water.js müssen folgende Zeile entkommentiert werden und die anderen entsprechend auskommentiert werden:

- für CPU: Zeile 54 und 55
- für GPU: Zeile 57 und 58

## Fehler bei der GPU Implementierung

- Berechnungen sind fehlerhaft
- Wechselwirkung mit skymap.render() in src/main.js. Wird dieses Statement auskommentiert, Verhält sich die Simulation anders (weniger verbuggt)
- Wird der depthtest aktiviert, wird die initiale GPGPU Textur annuliert

## Nächste Schritte

- Erneut mit einem einfachen, besser nachvollziehbare Code im GPGPU Programm testen
- Bestehendes GPGPU Beispiele aus Internet raussuchen und in in dieses Projekt intergrieren und schauen, was diese anders machen.