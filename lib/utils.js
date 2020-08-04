import * as Vec3 from './twgl/v3.js'
import * as Mat4 from './twgl/m4.js'

/**
 * @author Tom Wendland
 * @description
 * Erstellt ein Grid der Breite 1x1
 * Certices order:   
 *  4 5 6      
 *  1 2 3
 * TODO so umschreiben, dass gl_FrontFacing detected werden kann (zeigt momentan in die falsche richtung) oder zeichne ich dreiecke einfach wieder falschrum?
 * @param {Number} verticesX 
 * @param {Number} verticesZ 
 * @returns {Array}
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
 * @author Tom Wendland
 * @description 
 * create uv`s in range [0;1] for a uniform grid 
 * in opengl (0;0) is bottom left  https://webglfundamentals.org/webgl/lessons/resources/texture-coordinates-diagram.svg
 * would be nice if my grid would follow the convention aswell, but this would lead in rewriting triangle, indices etc
 * @param {Number} verticesX 
 * @param {Number} verticesZ 
 * @returns {Array} 
 */
export function makeUniformGridUVs(verticesX, verticesZ) {
    let result = []
    for (let z = 0; z<verticesZ; z++) {
        for (let x = 0; x<verticesX; x++) {
            //result.push(x/verticesX, z/verticesZ)
            result.push(x/verticesX, (verticesZ-z)/verticesZ) // quick fix
        }
    }
    return result
}



/** 
 * @author Tom Wendland
 * @description !! not tested if working correctly
 * @param {Number} verticesX 
 * @param {Number} verticesZ 
 * @returns {Array}
 */      
export function makeTriangleIndices(verticesX, verticesZ){
    let result = [];
    for (let z = 0; z<verticesZ-1; z++) {
        for (let x = 0; x<verticesX-1; x++) {
            result.push(x, x+1, z*verticesX)
            result.push(x+1, (z+1)*verticesX, z*verticesX)
        }
    }  
    return result
}

/**
 * @author Tom Wendland
 * @description creates triangle strip indices for regular arranged grid, strip explanation http://www.corehtml5.com/trianglestripfundamentals.php
 * @param {Number} width 
 * @param {Number} depth 
 * @returns {Array}
 */
export function makeTriangleStripIndices(width, depth){
    let result = []
    for (let z=0; z<depth-1; z++) {
        if (z != 0) 
            result.push((z * width))
        for (let x=0; x<width; x++) {
            result.push(z * width + x)
            result.push((z + 1) * width + x)
        }
        if (z != (width-2)) 
            result.push((z+1) * width + (width-1))
    }
    return result
}



/**
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
 * @author Tom Wendland
 * @description Simple orbit/arc camera rotating around y-axis on a circle at xz-plane
 * @param {HTMLElement} canvas 
 * @param {Vec3} pos 
 * @param {Number} rx initial x rotation in rad
 * @param {Number} ry initial y rotation in rad
 * @returns {Object}
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
