import * as twgl from '../../../lib/twgl/twgl.js'
import * as Vec3 from '../../../lib/twgl/v3.js'
import * as Mat4 from '../../../lib/twgl/m4.js'
import { init_vs, init_fs } from './initialisation.js'
import { simulation_vs, simulation_fs } from './simulation.js'


export default class GpuSimulator{

    constructor(vertCountX, vertCountZ, gl){
        this.gl = gl
        this.vertCountX = vertCountX
        this.vertCountZ = vertCountZ

        this.simulationProgram = twgl.createProgramInfo(gl, [simulation_vs, simulation_fs])
        
        this.fbBufferInfo = twgl.createBufferInfoFromArrays(gl, { 
            a_position: { numComponents: 2, data: [-1, 1, -1, -1, 1, 1, 1, -1] } // cover clip space
        })
        
        gl.getExtension('OES_texture_float') // adds type: gl.FLOAT to texture 
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
        // problem 1: simulation program not working correctly
        // 
        // problem 2: bug in combination with mit skybox.render()!
        // to see the simulation program output properly prevent the skybox.render() statement
        // initialisation is working 
        // when checking spector.js debugging panel u_skybox cubemaps have size 1?? 
        gl.useProgram(this.simulationProgram.program) 
        twgl.setBuffersAndAttributes(gl, this.simulationProgram, this.fbBufferInfo)
        twgl.setUniforms(this.simulationProgram, {
            u_stepsize: [1/this.vertCountX, 1/this.vertCountZ],
            u_texture: this.fb1.attachments[0],
        })
        twgl.bindFramebufferInfo(gl, this.fb2) // (sets viewport)
        twgl.drawBufferInfo(gl, this.fbBufferInfo, gl.TRIANGLE_STRIP)

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