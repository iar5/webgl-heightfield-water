import * as dat from '../lib/dat.gui.module.js';
import * as twgl from '../lib/twgl/twgl.js'
import * as Vec3 from '../lib/twgl/v3.js'
import * as Mat4 from '../lib/twgl/m4.js'
import Stats from '../lib/stats.module.js'
import { degToRad } from '../lib/utils.js'
import OrbitCamera from './objects/OrbitCamera.js'
import Pool from './objects/Pool.js'
import Water from './objects/Water.js'
import Skybox from './objects/Skybox.js'
import Sphere from './objects/Sphere.js'




//////////////////
//     SETUP    //
//////////////////

const canvas = document.getElementById("canvas")
const gl = canvas.getContext("experimental-webgl", { antialias: true })
twgl.resizeCanvasToDisplaySize(gl.canvas)
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

const stats = new Stats()
document.body.appendChild(stats.dom)

const skybox = new Skybox(gl)
const pool = new Pool(gl)
const water = new Water(gl)
const spehre = new Sphere(gl, Vec3.create(1, 0 ,0))

//////////////////
// CAMERA, etc..//
//////////////////
const fov = degToRad(45)
const projection = Mat4.perspective(fov,  canvas.width/canvas.height, 0.01, 100)

const camera = new OrbitCamera(canvas, Vec3.create(0, -0.1, 4), 25, 0)

const globalUniforms = {
    u_projection: projection,
    u_view: Mat4.identity(),
    u_cameraPosition: Vec3.create()
} 

const lightUniforms = {
    ambient: [0.3, 0.3, 0.3],
    sunColor: [0.8, 0.8, 0.8],
    sunPosition: [0, 3, 0],
}



var paused = false
var raining = false
document.getElementById("rainBtn").onclick = () => raining = !raining

//////////////////
//   MAIN LOOP  //
//////////////////
requestAnimationFrame(update)

function update(){
    requestAnimationFrame(update)
    stats.begin()

    twgl.resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

    Mat4.inverse(camera.mat, globalUniforms.u_view)
    Mat4.getTranslation(camera.mat, globalUniforms.u_cameraPosition)

    if(!paused) {
        water.update(gl)
        if(raining && Math.random() > 0.99) water.drop(Math.random(), Math.random(), Math.random()*0.3)
    }

    // beware the order of drawing since depthtest is not enabled
    skybox.render(gl, globalUniforms, lightUniforms) 
    pool.render(gl, globalUniforms, lightUniforms)
    water.render(gl, globalUniforms, lightUniforms)

    stats.end()
}




//////////////////
//    EVENTS    //
//////////////////
window.addEventListener('keydown', e => {
    if(e.keyCode == 32)
        paused = !paused
})
window.addEventListener("resize", e => {
    gl.viewport(0, 0, canvas.width, canvas.width)
    twgl.resizeCanvasToDisplaySize(canvas)
    Mat4.perspective(fov,  canvas.width/canvas.height, 0.01, 100, projection)
})