import * as Vec3 from '/lib/twgl/v3.js'
import * as Mat4 from '/lib/twgl/m4.js'
import { degToRad } from '/lib/utils.js'

/**
 * @author Tom Wendland
 * @description Simple orbit/arc camera rotating around y-axis on a circle at xz-plane
 * @param {HTMLElement} canvas 
 * @param {Vec3} pos 
 * @param {Number} rx initial x rotation in rad
 * @param {Number} ry initial y rotation in rad
 * @returns {Object}
 */
export default function OrbitCamera(canvas, position, rx, ry){
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
