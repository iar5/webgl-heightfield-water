import * as twgl from './../../../lib/twgl/twgl.js'
import * as Vec3 from './../../../lib/twgl/v3.js'
import * as Mat4 from './../../../lib/twgl/m4.js'
import { makeUniformGrid, makeTriangleStripIndices, makeUniformGridUVs } from './../../../lib/utils.js'
import { init_vs, init_fs } from './initialisation.js'
import { simulation_vs, simulation_fs } from './simulation.js'

export default class ShaderSimulator{

    constructor(vertCountX, vertCountZ, gl){
        this.gl = gl
        this.vertCountX = vertCountX
        this.vertCountZ = vertCountZ

        this.i = 0

        this.simulationProgram = twgl.createProgramInfo(gl, [simulation_vs, simulation_fs])
        
        this.fbBufferInfo = twgl.createBufferInfoFromArrays(gl, { 
            a_position: { numComponents: 2, data: [-1, 1, -1, -1, 1, 1, 1, -1] } // cover clip space
        })
        
        gl.getExtension('OES_texture_float') // adds type: gl.FLOAT to texture in webgl-experimental
        gl.getExtension('OES_texture_float_linear') // adds min/mag: gl.LINEAR to type: gl.FLOAT txtures
        const attachments = [
            { format: gl.RGBA, internalFormat: gl.RGBA, type: gl.FLOAT,  min: gl.LINEAR, mag: gl.LINEAR, wrap: gl.CLAMP_TO_EDGE },
            { format: gl.DEPTH_STENCIL },
        ];
        this.fb1 = twgl.createFramebufferInfo(gl, attachments, this.vertCountX, this.vertCountZ);
        this.fb2 = twgl.createFramebufferInfo(gl, attachments, this.vertCountX, this.vertCountZ);
        checkFramebufferStatus(gl)
        
        let initProgram = twgl.createProgramInfo(gl, [init_vs, init_fs])
        gl.useProgram(initProgram.program);
        twgl.setBuffersAndAttributes(gl, initProgram, this.fbBufferInfo);
        twgl.bindFramebufferInfo(gl, this.fb1); 
        twgl.drawBufferInfo(gl, this.fbBufferInfo, gl.TRIANGLE_STRIP);
    }

    update(gl){
        gl.disable(gl.DEPTH_TEST)
        gl.useProgram(this.simulationProgram.program) 
        twgl.setBuffersAndAttributes(gl, this.simulationProgram, this.fbBufferInfo)
        twgl.setUniforms(this.simulationProgram, {
            u_stepsize: [1/this.vertCountX, 1/this.vertCountZ],
            u_frame: this.i, 
            u_texture: this.fb1.attachments[0],
        })
        twgl.bindFramebufferInfo(gl, this.fb2) // sets viewport
        twgl.drawBufferInfo(gl, this.fbBufferInfo, gl.TRIANGLE_STRIP)
        gl.enable(gl.DEPTH_TEST)

        this.i++
        let temp = this.fb1;
        this.fb1 = this.fb2;
        this.fb2 = temp;
        this.texture = this.fb2.attachments[0] // to access texture from outsite easily
    }
}

function checkFramebufferStatus(gl){
    let message
    switch (gl.checkFramebufferStatus(gl.FRAMEBUFFER)){
        case gl.FRAMEBUFFER_COMPLETE:
            break;
        case gl.FRAMEBUFFER_UNSUPPORTED:
            message = "Framebuffer is unsupported";
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
            message = "Framebuffer incomplete attachment";
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
            message = "Framebuffer incomplete (missmatched) dimensions";
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
            message = "Framebuffer incomplete missing attachment";
            break;
        default:
            message = "Unexpected framebuffer status";
    }
    if (message) {
        console.log(message)
        return false
    }
    else return true
};