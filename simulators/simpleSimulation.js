import * as Vec3 from '../lib/twgl/v3.js'
import * as Mat4 from '../lib/twgl/m4.js'

const h = 0.1 // column width
const c = 0.15 // wave travel speed <h/t
const t = 0.1 // timestep <h/c
const slowdown = 0.99

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
            let r = 50
            if(x*x+z*z < r) {
                u[i][j] = (r-x*x+z*z) * 1/(4*r)  
            }
        }    
    }
}


function update(){

    // collision 
    for(let i=0; i<widthX; i++){
        for(let j=0; j<widthZ; j++){
            let x = i-widthX/2 - 25
            let z = j-widthZ/2 
            if(x*x+z*z < 100) u[i][j] = 0
        }    
    }

    // unew bzw u_t+1 berechnen 
    for(let i=1; i<widthX-1; i++){
        for(let j=1; j<widthZ-1; j++){
            let f =  c*c * (u[i+1][j] + u[i-1][j] + u[i][j+1] + u[i][j-1] - 4*u[i][j] ) / (h*h)           
            v[i][j] += t * f
            v[i][j] *= slowdown
            unew[i][j] = u[i][j] + t * v[i][j] 
        }    
    }

    // u mit unew überschreiben
    for(let i=0; i<widthX; i++){
        for(let j=0; j<widthZ; j++){        
            u[i][j] = unew[i][j] 
        }
    }         
    return u
}



/**
 * PUBLIC FUNCTIONS
 */
export const simulation = (function(){
    return{
        initialize,
        update,
    }
})()