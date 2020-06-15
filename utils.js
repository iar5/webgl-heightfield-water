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
 * @param {*} pos 
 * @param {*} rx initial x rotation in rad
 * @param {*} ry initial y rotation in rad
 */
export function createOrbitCamera(canvas, position, rx, ry){
    const mat = Mat4.identity()
    const pos = position

    var mouseDown
    var lastMouseU
    var lastMouseV
    var usum = ry
    var vsum = rx
    update()

    canvas.onmousedown = function(e) {
        mouseDown = true
        lastMouseU = e.clientX
        lastMouseV = e.clientY
    }
    document.onmouseup = function(e) { mouseDown = false }
    document.onmousemove = function(e) {
        if (!mouseDown) return
        let deltaU = (e.clientX - lastMouseU)/4
        let deltaV =  (e.clientY - lastMouseV)/4
        lastMouseU = e.clientX
        lastMouseV =  e.clientY
        usum += deltaU
        vsum += deltaV
        if(vsum>90) vsum=90
        if(vsum<-90) vsum=-90
        update()
    }
    function update(){
        Mat4.identity(mat)
        Mat4.rotateY(mat, -degToRad(usum), mat)
        Mat4.rotateX(mat, -degToRad(vsum), mat)
        Mat4.translate(mat, pos, mat)
    }
    
    return {
        mat,
        getPosition(){
            return [pos.x, pos.y, pos.z]
        },
        setPosition(x, y, z){
            Vec3.set(pos, x, y, z)
            update()
        }
    }
}
