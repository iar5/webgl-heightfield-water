import * as Vec3 from './lib/twgl/v3.js'
import * as Mat4 from './lib/twgl/m4.js'
import { noise } from './noise.js'

const h = 0.1 // column width
const t = 0.1 // timestep <h/c
const c = 1 // wave travel speed <h/t

var widthX
var widthZ

var u
var unew
var v

function initialize(_widthX, _widthZ){
    widthX = _widthX
    widthZ = _widthZ
    u = [...Array(widthX)].map(e => Array(widthZ).fill(0));
    unew = [...Array(widthX)].map(e => Array(widthZ).fill(0));
    v = [...Array(widthX)].map(e => Array(widthZ).fill(0))


    for(let i=0; i<widthX; i++){
        for(let j=0; j<widthZ; j++){
            let x = i-widthX/2
            let z = j-widthZ/2
            if(x*x+z*z < 4) u[i][j] = 0.5
        }    
    }
}

function update(){
    for(let i=1; i<widthX-1; i++){
        for(let j=1; j<widthZ-1; j++){
            let f = c*c * (u[i+1][j] + u[i-1][j] + u[i][j+1] + u[i][j-1] - 4*u[i][j]) / h*h            
            v[i][j] = v[i][j] + f*t
            unew[i][j] = u[i][j] + v[i][j]*t 
        }    
    }

    for(let i=0; i<widthX; i++){
        for(let j=0; j<widthZ; j++){        
            u[i][j] = unew[i][j] * 0.9999
        }
    }         
    return u
}

export const simulation = (function(){
    return{
        initialize,
        update 
    }
})()