import * as twgl from '../../lib/twgl/twgl.js'
import * as Vec3 from '../../lib/twgl/v3.js'
import * as Mat4 from '../../lib/twgl/m4.js'
import { makeUniformGrid, makeTriangleStripIndices, makeUniformGridUVs } from '../../lib/utils.js'
import { water_vs, water_fs } from '../rendering/water.js'
import { water_gpgpu_vs, water_gpgpu_fs } from '../rendering/watergpgpu.js'
import JsSimulator from '../simulators/js/JsSimulator.js'
import GpuSimulator from './../simulators/gpgpu/GpuSimulator.js'


/**
 * This water object is able to use the JsSimulator and the GpuSimulator aswell.
 * Since there are only minor differences in the usage of both simulators, this class combines their usage.
 * If you want to switch the simulator, just (un)comment the corresponding simulator and programInfo.
 * There are some attributes and uniforms only used in one simulator but its no problem, if it's registered for the other one aswell.
 */
export default class Water{

    constructor(gl){

        const cubeMapTiles = twgl.createTexture(gl, {
            target: gl.TEXTURE_CUBE_MAP,
            //mag: gl.LINEAR,
            //min: gl.LINEAR,
            src: [
                "assets/tiles.jpg",
                "assets/tiles.jpg",
                "assets/tiles.jpg", // y transparent machen?
                "assets/tiles.jpg",
                "assets/tiles.jpg",
                "assets/tiles.jpg"
              ],
        })
        const cubeMapEnv = twgl.createTexture(gl, {
            target: gl.TEXTURE_CUBE_MAP,
            mag: gl.LINEAR,
            min: gl.LINEAR,
            src: [
                'assets/skybox/xpos.jpg',
                'assets/skybox/xneg.jpg',
                'assets/skybox/ypos.jpg',
                'assets/skybox/yneg.jpg', 
                'assets/skybox/zpos.jpg',
                'assets/skybox/zneg.jpg',
              ],
        })
    
        this.countX = 128
        this.countZ = 128
        this.vertices = makeUniformGrid(this.countX, this.countZ)
        this.indices = makeTriangleStripIndices(this.countX, this.countZ)
        this.uv = makeUniformGridUVs(this.countX, this.countZ)

        this.simulator = new JsSimulator(this.countX, this.countZ, this.vertices, this.indices)
        this.programInfo = twgl.createProgramInfo(gl, [water_vs, water_fs])

        //this.simulator = new GpuSimulator(this.countX, this.countZ, gl)
        //this.programInfo = twgl.createProgramInfo(gl, [water_gpgpu_vs, water_gpgpu_fs]) 

        this.modelMat = Mat4.identity() 
        Mat4.translate(this.modelMat, [0, 8/24, 0], this.modelMat) // water level 
        Mat4.scale(this.modelMat, [2, 1, 2], this.modelMat)

        let slider = document.getElementById("waterSlider")
        slider.oninput = () => {
            Mat4.setTranslation(this.modelMat, [0, slider.value, 0], this.modelMat)
        }

        let etaInput = document.getElementById("etaNumber")
        etaInput.oninput = () => {
            this.uniforms.u_etaWater = etaInput.value
        }

        gl.getExtension('OES_element_index_uint') // to use bigger indice arrays, already enabled in chrome but for older versions
        this.bufferInfo = twgl.createBufferInfoFromArrays(gl, {
            indices: { numComponents: 3, data: Uint32Array.from(this.indices) }, // use gl.drawElements() with 32 Bit (bufferInfo.elementType is set to gl.UNSIGNED_INT)
            a_position: { numComponents: 3, data: this.vertices },
            a_normal: { numComponents: 3, data: this.simulator.normals },
            a_texcoord: { numComponents: 2, data: this.uv },
        })

        
        this.uniforms = { 
            u_model: this.modelMat,
            u_cubeEnvMap: cubeMapEnv,
            u_poolCubeMap: cubeMapTiles,
            // TODO link Pool Modemat
            u_poolPosition: Vec3.create(0, 0, 0),
            u_poolHeight: 12/24, // +y distance to c
            u_poolDepth: 12/24, // -y distance to c
            u_poolHalfWidthX: 1,
            u_poolHalfWidthZ: 1 ,
            u_etaWater: 1.3 
        }
    }

    update(gl){
        this.simulator.update(gl)
    }

    render(gl, globalUniforms, lightUniforms){
        gl.useProgram(this.programInfo.program) 
        twgl.setUniforms(this.programInfo, globalUniforms)
        twgl.setUniforms(this.programInfo, lightUniforms)
        twgl.setUniforms(this.programInfo, this.uniforms)
        if(this.simulator.texture) twgl.setUniforms(this.programInfo, { u_texture: this.simulator.texture })
        if(this.simulator.normals) twgl.setAttribInfoBufferFromArray(gl, this.bufferInfo.attribs.a_normal, this.simulator.normals)
        twgl.setAttribInfoBufferFromArray(gl, this.bufferInfo.attribs.a_position, this.vertices)
        twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo)
        twgl.bindFramebufferInfo(gl, null)
        twgl.drawBufferInfo(gl, this.bufferInfo, gl.TRIANGLE_STRIP)
    }

    /**
     * 
     * @param {Number} u x texcoord
     * @param {Number} v y texcoord
     * @param {Number} i intensity
     */
    drop(u, v, i){
        if(this.simulator instanceof JsSimulator){
            let x = Math.round(this.countX*u)
            let y = Math.round(this.countZ*v)
            this.simulator.simulation.drop(x, y, i)
        }
    }
}