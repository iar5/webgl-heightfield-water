import * as Vec3 from './lib/twgl/v3.js'
import * as Mat4 from './lib/twgl/m4.js'

/**
 * 
 * @param {Number} degrees 
 * @returns {Number} radians
 */
export function degToRad(degrees) {
    return degrees * Math.PI / 180;
}


/**
 * Mouse controls
 * by http://learningwebgl.com/blog/?p=1253
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
        Mat4.rotateY(newRotationMatrix, -degToRad(deltaX / 5), newRotationMatrix)
        //Mat4.rotateX(newRotationMatrix, -degToRad(deltaY / 5), newRotationMatrix)
        Mat4.multiply(newRotationMatrix, camera, camera)
    }
}