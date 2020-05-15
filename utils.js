import * as Vec3 from './lib/twgl/v3.js'
import * as Mat4 from './lib/twgl/m4.js'

/**
 * Erstellt ein Grid der Breite 1x1
 * vertices order:   
 *  4 5 6      
 *  1 2 3
 * TODO so umschreiben, dass gl_FrontFacing detected werden kann (zeigt momentan in die falsche richtung) oder zeichne ich dreiecke einfach wieder falschrum?
 * @param {Number} verticesX 
 * @param {Number} verticesZ 

 */
export function makeUniformGrid(verticesX, verticesZ) {
    const result = []
    const widthX = 1
    const widthZ = 1
    const scaleX = widthX/(verticesX-1)
    const scaleZ = widthZ/(verticesZ-1)
    const offsetX = (verticesX-1)/2
    const offsetZ = (verticesZ-1)/2
    for (let z = 0; z<verticesZ; z++) {
        for (let x = 0; x<verticesX; x++) {
            result.push(
                (x-offsetX) * scaleX, 
                0, 
                (z-offsetZ) * scaleZ
            )
        }
    }
    return result
}

/**
 * for regular arranged grid
 * strip explanation http://www.corehtml5.com/trianglestripfundamentals.php
 * @param {*} width 
 * @param {*} depth 
 */
export function makeTriangleStripIndices(width, depth){
    let result = []
    for (let z = 0; z<depth - 1; z++) {
        if (z != 0) 
            result.push((z * width))
        for (let x = 0; x < width; x++) {
            result.push(z * width + x)
            result.push((z + 1) * width + x)
        }
        if (z != (width-2)) 
            result.push((z+1) * width + (width-1))
    }
    return result
}



/**
 * 
 * @param {Number} degrees 
 * @returns {Number} radians
 */
export function degToRad(degrees) {
    return degrees * Math.PI / 180;
}


/**
 * Ganz einfache Maus Kamerarotation
 * TODO um x bzw z rotieren, dass y achse sich nicht verschiebt
 * Was nicht klappt: - Wenn eigene Rotationsmatrix dann wirkt dass wie 3. person, das Achsenproblem bleibt aber bestehen
 *
 * by http://learningwebgl.com/blog/?p=1253
 * working tutorial: http://www.webglacademy.com/courses.php?courses=0_1_20_2_3_4_23_5_6_7_10#4
 */
export function setupMouseControl(camera){
    var mouseDown
    var lastMouseX
    var lastMouseY
    canvas.onmousedown = function(e) {
        mouseDown = true
        lastMouseX = e.clientX
        lastMouseY = e.clientY
    }
    document.onmouseup = function(e) { mouseDown = false }
    document.onmousemove = function(e) {
        if (!mouseDown) return
        let newX = e.clientX
        let newY = e.clientY
        let deltaX = newX - lastMouseX
        let deltaY = newY - lastMouseY
        lastMouseX = newX
        lastMouseY = newY
        let newRotationMatrix = Mat4.identity()
        Mat4.rotateX(newRotationMatrix, -degToRad(deltaY / 5), newRotationMatrix)
        Mat4.rotateY(newRotationMatrix, -degToRad(deltaX / 5), newRotationMatrix)
        Mat4.multiply(newRotationMatrix, camera, camera)
    }
}

export function loadImage(src, callback){
    image = new Image();
    image.onload = function() {callback(image)}
    image.src = src
}