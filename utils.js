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
 * 
 * @param {String} src 
 * @param {Function} callback 
 */
export function loadImage(src, callback){
    image = new Image();
    image.onload = function() {callback(image)}
    image.src = src
}


/**
 * Simple orbit/arc camera rotating around y-axis on a circle at xz-plane
 * @param {*} canvas 
 * @param {*} camera 
 * @param {*} distance 
 */
export function createOrbitCamera(canvas, pos, rx, ry){
    const camera = Mat4.identity()
    var mouseDown
    var lastMouseU
    var lastMouseV
    var usum = ry
    var vsum = rx
    calc()
    canvas.onmousedown = function(e) {
        mouseDown = true
        lastMouseU = e.clientX
        lastMouseV = e.clientY
    }
    document.onmouseup = function(e) { mouseDown = false }
    document.onmousemove = function(e) {
        if (!mouseDown) return
        let deltaU = e.clientX - lastMouseU
        let deltaV =  e.clientY - lastMouseV
        lastMouseU = e.clientX
        lastMouseV =  e.clientY
        usum += deltaU
        vsum += deltaV
        calc()
    }
    function calc(){
        Mat4.identity(camera)
        Mat4.rotateY(camera, -degToRad(usum / 5), camera)
        Mat4.rotateX(camera, -degToRad(vsum / 5), camera)
        Mat4.translate(camera, pos, camera)
    }
    return camera
}
