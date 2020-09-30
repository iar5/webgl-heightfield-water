# webgl-heightfield-water

## Anwendung starten

## Wechsel zwischen CPU/GPU Berechnung der Simulation
- (um fehler zu vermeiden) in src/main.js skybox.render() ausmachen 
- in src/objects/Water.js togglen
- es wird rnder/watergpu.js verwendet für bessere fehlererkennungn

## Fehler

### Bei der GPU Implementierung

- simulation calculations not working
- sehr buggy in combination with skymap.render() (comment this statement in main.js when using gpgpu)
- mit depthtest+depth bit clear wird initial gsetzte textur nach 1. sim step annuliert



Nächste Schritte
- Nochmal mit einfach nachvollziehbare Simulations testen
- Bestehendes GPGPU Example aus Internet raussuchen und hier intergrieren zum Testen